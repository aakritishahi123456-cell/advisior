import prisma from '../lib/prisma'
import logger from '../utils/logger'

type DatasetName = 'nepse_prices' | 'financials' | 'dividend_history'

type AuditStatus = 'accepted' | 'rejected' | 'duplicate_skipped'

type QualityContext = {
  dataset: DatasetName
  companyId?: string | null
  symbol?: string | null
  recordKey?: string | null
  action: string
}

type ValidationResult<T> =
  | { valid: true; normalized: T }
  | { valid: false; reason: string; details: Record<string, unknown> }

type PriceCandidate = {
  stockId: string
  symbol: string
  price: number
  change: number
  volume: bigint | null
  timestamp: Date
  source: string
}

type FinancialCandidate = {
  companyId: string
  symbol: string
  asOfDate: Date
  revenue: number | null
  profit: number | null
  eps: number | null
  assets: number | null
  liabilities: number | null
  growthRate: number | null
  sourceDocument: string | null
  source: string
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

async function persistAnomaly(
  context: QualityContext,
  reason: string,
  details: Record<string, unknown>
) {
  logger.warn(
    {
      dataset: context.dataset,
      symbol: context.symbol,
      companyId: context.companyId,
      recordKey: context.recordKey,
      reason,
      details,
    },
    'Financial data rejected by quality rules'
  )

  try {
    await prisma.dataQualityAnomaly.create({
      data: {
        companyId: context.companyId ?? undefined,
        symbol: context.symbol ?? undefined,
        dataset: context.dataset,
        recordKey: context.recordKey ?? undefined,
        reason,
        details,
      },
    })
  } catch (error) {
    logger.warn(
      {
        dataset: context.dataset,
        symbol: context.symbol,
        error: error instanceof Error ? error.message : String(error),
      },
      'Failed to persist data quality anomaly'
    )
  }
}

async function persistAudit(
  context: QualityContext,
  status: AuditStatus,
  details: Record<string, unknown>
) {
  logger.info(
    {
      dataset: context.dataset,
      action: context.action,
      status,
      symbol: context.symbol,
      companyId: context.companyId,
      recordKey: context.recordKey,
      details,
    },
    'Financial data quality audit event'
  )

  try {
    await prisma.dataQualityAuditLog.create({
      data: {
        companyId: context.companyId ?? undefined,
        symbol: context.symbol ?? undefined,
        dataset: context.dataset,
        action: context.action,
        status,
        recordKey: context.recordKey ?? undefined,
        details,
      },
    })
  } catch (error) {
    logger.warn(
      {
        dataset: context.dataset,
        symbol: context.symbol,
        error: error instanceof Error ? error.message : String(error),
      },
      'Failed to persist data quality audit log'
    )
  }
}

function validatePriceRecord(candidate: PriceCandidate): ValidationResult<PriceCandidate> {
  if (!candidate.stockId || !candidate.symbol || !(candidate.timestamp instanceof Date)) {
    return {
      valid: false,
      reason: 'missing_required_fields',
      details: { stockId: candidate.stockId, symbol: candidate.symbol, timestamp: candidate.timestamp },
    }
  }

  if (!isFiniteNumber(candidate.price) || candidate.price <= 0) {
    return {
      valid: false,
      reason: 'invalid_price',
      details: { price: candidate.price },
    }
  }

  if (!isFiniteNumber(candidate.change) || Math.abs(candidate.change) > 20) {
    return {
      valid: false,
      reason: 'invalid_change',
      details: { change: candidate.change },
    }
  }

  if (candidate.volume !== null && candidate.volume < 0n) {
    return {
      valid: false,
      reason: 'invalid_volume',
      details: { volume: candidate.volume.toString() },
    }
  }

  return { valid: true, normalized: candidate }
}

function validateFinancialRecord(candidate: FinancialCandidate): ValidationResult<FinancialCandidate> {
  if (!candidate.companyId || !candidate.symbol || !(candidate.asOfDate instanceof Date)) {
    return {
      valid: false,
      reason: 'missing_required_fields',
      details: {
        companyId: candidate.companyId,
        symbol: candidate.symbol,
        asOfDate: candidate.asOfDate,
      },
    }
  }

  const requiredMetrics = {
    revenue: candidate.revenue,
    profit: candidate.profit,
    eps: candidate.eps,
    assets: candidate.assets,
  }

  const missingMetricNames = Object.entries(requiredMetrics)
    .filter(([, value]) => value === null || value === undefined)
    .map(([key]) => key)

  if (missingMetricNames.length > 0) {
    return {
      valid: false,
      reason: 'missing_required_fields',
      details: { missingFields: missingMetricNames },
    }
  }

  const invalidMetric = Object.entries({
    revenue: candidate.revenue,
    profit: candidate.profit,
    eps: candidate.eps,
    assets: candidate.assets,
    liabilities: candidate.liabilities,
    growthRate: candidate.growthRate,
  }).find(([, value]) => value !== null && value !== undefined && !isFiniteNumber(value))

  if (invalidMetric) {
    return {
      valid: false,
      reason: 'invalid_number',
      details: { field: invalidMetric[0], value: invalidMetric[1] },
    }
  }

  if (candidate.revenue !== null && candidate.revenue < 0) {
    return {
      valid: false,
      reason: 'invalid_number',
      details: { field: 'revenue', value: candidate.revenue },
    }
  }

  if (candidate.assets !== null && candidate.assets < 0) {
    return {
      valid: false,
      reason: 'invalid_number',
      details: { field: 'assets', value: candidate.assets },
    }
  }

  return { valid: true, normalized: candidate }
}

export class DataQualityService {
  static async validatePriceBeforeInsert(candidate: PriceCandidate) {
    const context: QualityContext = {
      dataset: 'nepse_prices',
      symbol: candidate.symbol,
      recordKey: `${candidate.stockId}:${candidate.timestamp.toISOString()}`,
      action: 'insert_live_price',
    }

    const validation = validatePriceRecord(candidate)
    if (!validation.valid) {
      await persistAnomaly(context, validation.reason, validation.details)
      await persistAudit(context, 'rejected', validation.details)
      return validation
    }

    const duplicate = await prisma.nepsePrice.findUnique({
      where: {
        stockId_timestamp: {
          stockId: candidate.stockId,
          timestamp: candidate.timestamp,
        },
      },
      select: { id: true },
    })

    if (duplicate) {
      const details = { duplicateId: duplicate.id }
      await persistAnomaly(context, 'duplicate_entry', details)
      await persistAudit(context, 'duplicate_skipped', details)
      return { valid: false as const, reason: 'duplicate_entry', details }
    }

    await persistAudit(context, 'accepted', {
      price: candidate.price,
      change: candidate.change,
      volume: candidate.volume?.toString() ?? null,
    })

    return validation
  }

  static async validateFinancialBeforeUpsert(candidate: FinancialCandidate) {
    const context: QualityContext = {
      dataset: 'financials',
      companyId: candidate.companyId,
      symbol: candidate.symbol,
      recordKey: `${candidate.symbol}:${candidate.asOfDate.toISOString()}`,
      action: 'upsert_financial_record',
    }

    const validation = validateFinancialRecord(candidate)
    if (!validation.valid) {
      await persistAnomaly(context, validation.reason, validation.details)
      await persistAudit(context, 'rejected', validation.details)
      return validation
    }

    const duplicate = await prisma.nepseFinancial.findUnique({
      where: {
        symbol_asOfDate: {
          symbol: candidate.symbol,
          asOfDate: candidate.asOfDate,
        },
      },
      select: {
        revenue: true,
        profit: true,
        eps: true,
        assets: true,
      },
    })

    if (
      duplicate &&
      duplicate.revenue === candidate.revenue &&
      duplicate.profit === candidate.profit &&
      duplicate.eps === candidate.eps &&
      duplicate.assets === candidate.assets
    ) {
      const details = { duplicate: true }
      await persistAnomaly(context, 'duplicate_entry', details)
      await persistAudit(context, 'duplicate_skipped', details)
      return { valid: false as const, reason: 'duplicate_entry', details }
    }

    await persistAudit(context, 'accepted', {
      revenue: candidate.revenue,
      profit: candidate.profit,
      eps: candidate.eps,
      assets: candidate.assets,
      liabilities: candidate.liabilities,
    })

    return validation
  }
}
