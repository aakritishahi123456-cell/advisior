import { NepseCompanyInput, NepseFinancialInput, NepsePriceInput } from './nepseTypes'
import { parseISODate } from './time'

function asString(value: unknown): string | null {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number') return String(value)
  return null
}

function asNumber(value: unknown): number | null {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value.replace(/,/g, '')) : NaN
  return Number.isFinite(n) ? n : null
}

function asBigInt(value: unknown): bigint | null {
  if (typeof value === 'bigint') return value
  if (typeof value === 'number' && Number.isFinite(value)) return BigInt(Math.trunc(value))
  if (typeof value === 'string') {
    const cleaned = value.replace(/,/g, '').trim()
    if (!cleaned) return null
    const n = Number(cleaned)
    if (Number.isFinite(n)) return BigInt(Math.trunc(n))
  }
  return null
}

export function normalizeCompanies(payload: any): NepseCompanyInput[] {
  const list = Array.isArray(payload) ? payload : Array.isArray(payload?.content) ? payload.content : []

  const companies: NepseCompanyInput[] = []
  for (const row of list) {
    const symbol = asString(row?.symbol ?? row?.securitySymbol ?? row?.ticker)
    const name = asString(row?.name ?? row?.securityName ?? row?.companyName)
    if (!symbol || !name) continue

    const sector = asString(row?.sector ?? row?.sectorName ?? row?.industryName) ?? 'Unknown'
    const listedDateRaw = asString(row?.listedDate ?? row?.listingDate ?? row?.listed_date)
    const listedDate = listedDateRaw ? new Date(listedDateRaw) : null

    companies.push({ symbol, name, sector, listedDate })
  }
  return companies
}

export function normalizeDailyPrices(payload: any, businessDateISO: string): NepsePriceInput[] {
  const date = parseISODate(businessDateISO)
  const list = Array.isArray(payload) ? payload : Array.isArray(payload?.content) ? payload.content : []

  const prices: NepsePriceInput[] = []
  for (const row of list) {
    const symbol = asString(row?.symbol ?? row?.securitySymbol ?? row?.ticker)
    if (!symbol) continue

    prices.push({
      symbol,
      date,
      open: asNumber(row?.openPrice ?? row?.open ?? row?.open_price),
      close: asNumber(row?.closePrice ?? row?.close ?? row?.close_price ?? row?.lastTradedPrice),
      high: asNumber(row?.highPrice ?? row?.high ?? row?.high_price),
      low: asNumber(row?.lowPrice ?? row?.low ?? row?.low_price),
      volume: asBigInt(row?.totalTradedQuantity ?? row?.volume ?? row?.totalTrades ?? row?.quantity),
    })
  }
  return prices
}

export function normalizeFinancialsFromDaily(payload: any, businessDateISO: string): NepseFinancialInput[] {
  const asOfDate = parseISODate(businessDateISO)
  const list = Array.isArray(payload) ? payload : Array.isArray(payload?.content) ? payload.content : []

  const financials: NepseFinancialInput[] = []
  for (const row of list) {
    const symbol = asString(row?.symbol ?? row?.securitySymbol ?? row?.ticker)
    if (!symbol) continue

    const eps = asNumber(row?.eps ?? row?.earningPerShare ?? row?.earning_per_share)
    const peRatio = asNumber(row?.peRatio ?? row?.pe ?? row?.priceEarningRatio)
    const marketCap = asBigInt(row?.marketCapitalization ?? row?.marketCap ?? row?.market_cap)
    const dividendYield = asNumber(row?.dividendYield ?? row?.dividend ?? row?.dividend_yield)

    if (eps === null && peRatio === null && marketCap === null && dividendYield === null) continue

    financials.push({ symbol, asOfDate, eps, peRatio, marketCap, dividendYield })
  }
  return financials
}

