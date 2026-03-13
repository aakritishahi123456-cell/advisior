import { PrismaClient } from '@prisma/client'
import logger from '@/utils/logger'
import { NepseHttpClient } from './http'
import { normalizeCompanies, normalizeDailyPrices, normalizeFinancialsFromDaily } from './normalize'
import { NepseCollectorResult } from './nepseTypes'
import { nepseBusinessDateISO } from './time'

const DEFAULT_BASE_URL = 'https://newweb.nepalstock.com/api/nots'

export async function runNepseCollector({
  businessDateISO = nepseBusinessDateISO(),
}: {
  businessDateISO?: string
} = {}): Promise<NepseCollectorResult> {
  const prisma = new PrismaClient()

  const baseUrl = process.env.NEPSE_BASE_URL || DEFAULT_BASE_URL
  const timeoutMs = Number(process.env.NEPSE_HTTP_TIMEOUT_MS || 30_000)
  const source = 'NEPSE'

  const http = new NepseHttpClient({ baseUrl, timeoutMs })

  try {
    const marketOpen = await http.getMarketOpen()
    if (marketOpen === false) {
      logger.info({ businessDateISO }, 'NEPSE market is closed; skipping collection')
      return {
        businessDate: businessDateISO,
        companiesUpserted: 0,
        pricesInserted: 0,
        financialsUpserted: 0,
        source,
      }
    }

    logger.info({ businessDateISO, baseUrl }, 'Starting NEPSE collection')

    const companiesRaw = await http.fetchCompaniesRaw()
    const companies = normalizeCompanies(companiesRaw)

    let companiesUpserted = 0
    for (const c of companies) {
      await prisma.company.upsert({
        where: { symbol: c.symbol },
        create: {
          symbol: c.symbol,
          name: c.name,
          sector: c.sector,
          listedYear: c.listedDate ? c.listedDate.getUTCFullYear() : new Date().getUTCFullYear(),
          listedDate: c.listedDate ?? null,
        },
        update: {
          name: c.name,
          sector: c.sector,
          listedDate: c.listedDate ?? undefined,
        },
      })
      companiesUpserted++
    }

    const dailyRaw = await http.fetchDailyTradeRaw(businessDateISO)
    const prices = normalizeDailyPrices(dailyRaw, businessDateISO)
    const financials = normalizeFinancialsFromDaily(dailyRaw, businessDateISO)

    const pricesInserted = await prisma.nepsePrice.createMany({
      data: prices.map((p) => ({
        symbol: p.symbol,
        date: p.date,
        open: p.open,
        close: p.close,
        high: p.high,
        low: p.low,
        volume: p.volume,
        source,
      })),
      skipDuplicates: true,
    })

    let financialsUpserted = 0
    for (const f of financials) {
      await prisma.nepseFinancial.upsert({
        where: {
          symbol_asOfDate: { symbol: f.symbol, asOfDate: f.asOfDate },
        },
        create: {
          symbol: f.symbol,
          asOfDate: f.asOfDate,
          eps: f.eps,
          peRatio: f.peRatio,
          marketCap: f.marketCap,
          dividendYield: f.dividendYield,
          source,
        },
        update: {
          eps: f.eps,
          peRatio: f.peRatio,
          marketCap: f.marketCap,
          dividendYield: f.dividendYield,
        },
      })
      financialsUpserted++
    }

    logger.info(
      { businessDateISO, companiesUpserted, pricesInserted: pricesInserted.count, financialsUpserted },
      'NEPSE collection completed'
    )

    return {
      businessDate: businessDateISO,
      companiesUpserted,
      pricesInserted: pricesInserted.count,
      financialsUpserted,
      source,
    }
  } finally {
    await prisma.$disconnect()
  }
}

