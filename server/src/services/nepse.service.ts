import prisma from '../lib/prisma'
import logger from '../utils/logger'
import { NepseHttpClient } from '../jobs/nepse/http'
import { normalizeLivePrices } from '../jobs/nepse/normalize'
import { DataQualityService } from './dataQuality.service'

const DEFAULT_BASE_URL = 'https://newweb.nepalstock.com/api/nots'
const DEFAULT_TIMEOUT_MS = 30_000
const DEFAULT_RETRY_ATTEMPTS = 3
const DEFAULT_RETRY_DELAY_MS = 2_000

export type FetchNepseDataResult = {
  fetched: number
  inserted: number
  skipped: number
  anomalies: number
  missingStocks: string[]
  timestamp: string
}

type NepseValidationAnomalyReason =
  | 'invalid_price_zero'
  | 'invalid_change_over_20_percent'
  | 'invalid_negative_volume'

type ValidatedPrice =
  | {
      valid: true
      item: ReturnType<typeof normalizeLivePrices>[number]
    }
  | {
      valid: false
      item: ReturnType<typeof normalizeLivePrices>[number]
      reason: NepseValidationAnomalyReason
    }

function getNumberEnv(name: string, fallback: number): number {
  const value = Number(process.env[name] || fallback)
  return Number.isFinite(value) && value > 0 ? value : fallback
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function withRetries<T>(operation: () => Promise<T>, attempts: number, delayMs: number): Promise<T> {
  let lastError: unknown

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      logger.warn(
        {
          attempt,
          attempts,
          delayMs,
          error: error instanceof Error ? error.message : String(error),
        },
        'NEPSE API request failed'
      )

      if (attempt < attempts) {
        await delay(delayMs * attempt)
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('NEPSE API request failed')
}

function validateLivePrice(item: ReturnType<typeof normalizeLivePrices>[number]): ValidatedPrice {
  if (!Number.isFinite(item.price) || item.price <= 0) {
    return { valid: false, item, reason: 'invalid_price_zero' }
  }

  if (!Number.isFinite(item.change) || Math.abs(item.change) > 20) {
    return { valid: false, item, reason: 'invalid_change_over_20_percent' }
  }

  if (item.volume !== null && item.volume < 0n) {
    return { valid: false, item, reason: 'invalid_negative_volume' }
  }

  return { valid: true, item }
}

async function logAnomaly(
  item: ReturnType<typeof normalizeLivePrices>[number],
  reason: NepseValidationAnomalyReason
): Promise<void> {
  logger.warn(
    {
      symbol: item.symbol,
      price: item.price,
      change: item.change,
      volume: item.volume?.toString() ?? null,
      timestamp: item.timestamp.toISOString(),
      reason,
    },
    'Rejected invalid NEPSE live price'
  )

  try {
    await prisma.$executeRaw`
      INSERT INTO nepse_price_anomalies (
        symbol,
        incoming_price,
        previous_price,
        spike_percent,
        volume,
        "timestamp",
        reason
      )
      VALUES (
        ${item.symbol},
        ${item.price},
        ${null},
        ${Math.abs(item.change)},
        ${item.volume},
        ${item.timestamp},
        ${reason}
      )
    `
  } catch (error) {
    logger.warn(
      {
        symbol: item.symbol,
        reason,
        error: error instanceof Error ? error.message : String(error),
      },
      'Failed to persist NEPSE anomaly log'
    )
  }
}

export async function fetchNepseData(): Promise<FetchNepseDataResult> {
  const now = new Date()
  const baseUrl = process.env.NEPSE_BASE_URL || DEFAULT_BASE_URL
  const timeoutMs = getNumberEnv('NEPSE_HTTP_TIMEOUT_MS', DEFAULT_TIMEOUT_MS)
  const retryAttempts = getNumberEnv('NEPSE_API_RETRY_ATTEMPTS', DEFAULT_RETRY_ATTEMPTS)
  const retryDelayMs = getNumberEnv('NEPSE_API_RETRY_DELAY_MS', DEFAULT_RETRY_DELAY_MS)
  const http = new NepseHttpClient({ baseUrl, timeoutMs })

  const liveRaw = await withRetries(
    () => http.fetchLiveTradeRaw(),
    retryAttempts,
    retryDelayMs
  )

  const normalized = normalizeLivePrices(liveRaw, now)
  const validatedPrices = await Promise.all(
    normalized.map(async (item) => {
      const validated = validateLivePrice(item)
      if (!validated.valid) {
        await logAnomaly(item, validated.reason)
      }
      return validated
    })
  )
  const validPrices = validatedPrices
    .filter((result): result is Extract<ValidatedPrice, { valid: true }> => result.valid)
    .map((result) => result.item)
  const anomalyCount = validatedPrices.length - validPrices.length

  if (validPrices.length === 0) {
    logger.warn({ timestamp: now.toISOString() }, 'NEPSE fetch returned no valid live prices')
    return {
      fetched: normalized.length,
      inserted: 0,
      skipped: normalized.length,
      anomalies: anomalyCount,
      missingStocks: [],
      timestamp: now.toISOString(),
    }
  }

  const uniqueSymbols = Array.from(new Set(validPrices.map((item) => item.symbol)))
  const stocks = await prisma.stock.findMany({
    where: { symbol: { in: uniqueSymbols } },
    select: { id: true, symbol: true },
  })

  const stockBySymbol = new Map(stocks.map((stock) => [stock.symbol, stock.id]))
  const missingStocks = uniqueSymbols.filter((symbol) => !stockBySymbol.has(symbol))

  if (missingStocks.length > 0) {
    logger.warn(
      {
        missingStocks,
        missingCount: missingStocks.length,
      },
      'Skipping NEPSE prices for unknown stock symbols'
    )
  }

  const candidateRows = validPrices
    .map((item) => {
      const stockId = stockBySymbol.get(item.symbol)
      if (!stockId) {
        return null
      }

      return {
        stockId,
        symbol: item.symbol,
        price: item.price,
        change: item.change,
        volume: item.volume,
        timestamp: item.timestamp,
        source: 'NEPSE_LIVE',
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)

  const qualityResults = await Promise.all(
    candidateRows.map((row) => DataQualityService.validatePriceBeforeInsert(row))
  )

  const rowsToInsert = qualityResults
    .filter((result): result is Extract<typeof result, { valid: true }> => result.valid)
    .map((result) => result.normalized)

  const insertedResult =
    rowsToInsert.length > 0
      ? await prisma.nepsePrice.createMany({
          data: rowsToInsert,
          skipDuplicates: true,
        })
      : { count: 0 }

  const result: FetchNepseDataResult = {
    fetched: normalized.length,
    inserted: insertedResult.count,
    skipped: normalized.length - insertedResult.count,
    anomalies: anomalyCount,
    missingStocks,
    timestamp: now.toISOString(),
  }

  logger.info(
    {
      fetched: result.fetched,
      inserted: result.inserted,
      skipped: result.skipped,
      anomalies: result.anomalies,
      missingStocks: result.missingStocks.length,
      timestamp: result.timestamp,
    },
    'NEPSE live data fetched and stored'
  )

  return result
}
