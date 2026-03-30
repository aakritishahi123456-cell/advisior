import { api, endpoints } from '@/lib/apiClient'

export type DashboardAllocationSlice = {
  name: string
  value: number
  color: string
}

export type DashboardPerformancePoint = {
  month: string
  value: number
}

export type DashboardStock = {
  symbol: string
  name: string
  price: number
  change: number
}

export type DashboardInsightType = 'opportunity' | 'warning' | 'info'

export type DashboardInsight = {
  type: DashboardInsightType
  title: string
  description: string
  time: string
}

export type DashboardMetricIconKey = 'wallet' | 'monthly-returns' | 'investments' | 'ytd'

export type DashboardMetricCard = {
  title: string
  value: string
  change: number
  trend: 'up' | 'down'
  iconKey: DashboardMetricIconKey
}

export type DashboardSnapshot = {
  metrics: DashboardMetricCard[]
  performanceData: DashboardPerformancePoint[]
  portfolioData: DashboardAllocationSlice[]
  topStocks: DashboardStock[]
  aiInsights: DashboardInsight[]
  lastUpdated: string
  source: 'api' | 'fallback'
}

const FALLBACK_SNAPSHOT: Omit<DashboardSnapshot, 'source'> = {
  metrics: [
    {
      title: 'Total Portfolio',
      value: 'NPR 2,450,000',
      change: 12.5,
      trend: 'up',
      iconKey: 'wallet',
    },
    {
      title: 'Monthly Returns',
      value: 'NPR 45,200',
      change: 8.2,
      trend: 'up',
      iconKey: 'monthly-returns',
    },
    {
      title: 'Total Investments',
      value: 'NPR 1,850,000',
      change: 5.3,
      trend: 'up',
      iconKey: 'investments',
    },
    {
      title: 'YTD Returns',
      value: '18.7%',
      change: 2.1,
      trend: 'up',
      iconKey: 'ytd',
    },
  ],
  performanceData: [
    { month: 'Jan', value: 1000000 },
    { month: 'Feb', value: 1050000 },
    { month: 'Mar', value: 1020000 },
    { month: 'Apr', value: 1080000 },
    { month: 'May', value: 1150000 },
    { month: 'Jun', value: 1200000 },
  ],
  portfolioData: [
    { name: 'Stocks', value: 45, color: '#635BFF' },
    { name: 'Mutual Funds', value: 25, color: '#00D4AA' },
    { name: 'Fixed Deposits', value: 20, color: '#0A2540' },
    { name: 'Cash', value: 10, color: '#94A3B8' },
  ],
  topStocks: [
    { symbol: 'NABIL', name: 'Nabil Bank', price: 490, change: 2.4 },
    { symbol: 'NICBL', name: 'NIC Asia Bank', price: 380, change: 1.8 },
    { symbol: 'PRVU', name: 'Prabhu Bank', price: 245, change: -0.5 },
    { symbol: 'HBL', name: 'HBL Bank', price: 520, change: 3.2 },
    { symbol: 'BOK', name: 'Bank of Kathmandu', price: 310, change: 1.1 },
  ],
  aiInsights: [
    {
      type: 'opportunity',
      title: 'Banking Sector Rising',
      description: 'Tier-1 banks showing strong momentum. Consider increasing allocation.',
      time: '2h ago',
    },
    {
      type: 'warning',
      title: 'High Interest Rates',
      description: 'Loan rates at peak. Consider fixing your home loan rate soon.',
      time: '5h ago',
    },
    {
      type: 'info',
      title: 'Dividend Season',
      description: 'Several banks announcing dividends next week.',
      time: '1d ago',
    },
  ],
  lastUpdated: 'Now',
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function cloneFallbackSnapshot(): DashboardSnapshot {
  return {
    source: 'fallback',
    lastUpdated: FALLBACK_SNAPSHOT.lastUpdated,
    metrics: FALLBACK_SNAPSHOT.metrics.map((metric) => ({ ...metric })),
    performanceData: FALLBACK_SNAPSHOT.performanceData.map((point) => ({ ...point })),
    portfolioData: FALLBACK_SNAPSHOT.portfolioData.map((slice) => ({ ...slice })),
    topStocks: FALLBACK_SNAPSHOT.topStocks.map((stock) => ({ ...stock })),
    aiInsights: FALLBACK_SNAPSHOT.aiInsights.map((insight) => ({ ...insight })),
  }
}

function readString(source: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'string' && value.trim()) {
      return value
    }
  }

  return undefined
}

function readNumber(source: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }

    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
      return Number(value)
    }
  }

  return undefined
}

function readObject(source: Record<string, unknown>, keys: string[]): Record<string, unknown> | undefined {
  for (const key of keys) {
    const value = source[key]
    if (isRecord(value)) {
      return value
    }
  }

  return undefined
}

function readArray(source: Record<string, unknown>, keys: string[]): unknown[] | undefined {
  for (const key of keys) {
    const value = source[key]
    if (Array.isArray(value)) {
      return value
    }
  }

  return undefined
}

function formatCurrency(value: number): string {
  return `NPR ${Math.round(value).toLocaleString()}`
}

function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`
}

function normalizeMetricCard(
  value: unknown,
  fallback: DashboardMetricCard
): DashboardMetricCard {
  if (!isRecord(value)) {
    return { ...fallback }
  }

  const trend = value.trend === 'down' ? 'down' : 'up'
  const iconKey =
    value.iconKey === 'wallet' ||
    value.iconKey === 'monthly-returns' ||
    value.iconKey === 'investments' ||
    value.iconKey === 'ytd'
      ? value.iconKey
      : fallback.iconKey

  return {
    title: readString(value, ['title']) ?? fallback.title,
    value: readString(value, ['value']) ?? fallback.value,
    change: readNumber(value, ['change']) ?? fallback.change,
    trend,
    iconKey,
  }
}

function buildMetrics(source: Record<string, unknown>): DashboardMetricCard[] {
  const metricArray = readArray(source, ['metrics', 'metricCards'])
  if (metricArray) {
    return metricArray.map((item, index) =>
      normalizeMetricCard(item, FALLBACK_SNAPSHOT.metrics[index % FALLBACK_SNAPSHOT.metrics.length])
    )
  }

  const summary = readObject(source, ['summary', 'overview', 'totals'])
  if (summary) {
    const portfolioValue = readNumber(summary, ['portfolioValue', 'totalPortfolio', 'totalAmount'])
    const monthlyReturns = readNumber(summary, ['monthlyReturns', 'returnAmount', 'returns'])
    const totalInvestments = readNumber(summary, ['totalInvestments', 'investedAmount', 'totalInvested'])
    const ytdReturns = readNumber(summary, ['ytdReturns', 'yearToDateReturns', 'annualReturn'])

    return [
      {
        title: 'Total Portfolio',
        value: portfolioValue !== undefined ? formatCurrency(portfolioValue) : FALLBACK_SNAPSHOT.metrics[0].value,
        change: readNumber(summary, ['portfolioChange', 'totalPortfolioChange']) ?? FALLBACK_SNAPSHOT.metrics[0].change,
        trend: (readNumber(summary, ['portfolioChange', 'totalPortfolioChange']) ?? 0) >= 0 ? 'up' : 'down',
        iconKey: 'wallet',
      },
      {
        title: 'Monthly Returns',
        value: monthlyReturns !== undefined ? formatCurrency(monthlyReturns) : FALLBACK_SNAPSHOT.metrics[1].value,
        change: readNumber(summary, ['monthlyReturnChange', 'returnsChange']) ?? FALLBACK_SNAPSHOT.metrics[1].change,
        trend: (readNumber(summary, ['monthlyReturnChange', 'returnsChange']) ?? 0) >= 0 ? 'up' : 'down',
        iconKey: 'monthly-returns',
      },
      {
        title: 'Total Investments',
        value: totalInvestments !== undefined ? formatCurrency(totalInvestments) : FALLBACK_SNAPSHOT.metrics[2].value,
        change: readNumber(summary, ['investmentChange', 'totalInvestmentChange']) ?? FALLBACK_SNAPSHOT.metrics[2].change,
        trend: (readNumber(summary, ['investmentChange', 'totalInvestmentChange']) ?? 0) >= 0 ? 'up' : 'down',
        iconKey: 'investments',
      },
      {
        title: 'YTD Returns',
        value: ytdReturns !== undefined ? formatPercentage(ytdReturns) : FALLBACK_SNAPSHOT.metrics[3].value,
        change: readNumber(summary, ['ytdReturnChange', 'annualReturnChange']) ?? FALLBACK_SNAPSHOT.metrics[3].change,
        trend: (readNumber(summary, ['ytdReturnChange', 'annualReturnChange']) ?? 0) >= 0 ? 'up' : 'down',
        iconKey: 'ytd',
      },
    ]
  }

  return FALLBACK_SNAPSHOT.metrics.map((metric) => ({ ...metric }))
}

function buildPerformanceData(source: Record<string, unknown>): DashboardPerformancePoint[] {
  const performance = readArray(source, ['performanceData', 'performance', 'chartData', 'series'])
  if (!performance) {
    return FALLBACK_SNAPSHOT.performanceData.map((point) => ({ ...point }))
  }

  return performance
    .map((item, index) => {
      if (isRecord(item)) {
        const month = readString(item, ['month', 'label', 'name']) ?? `Point ${index + 1}`
        const value =
          readNumber(item, ['value', 'amount', 'total']) ??
          readNumber(item, ['portfolioValue', 'balance']) ??
          0

        return { month, value }
      }

      return null
    })
    .filter((point): point is DashboardPerformancePoint => point !== null)
}

function buildAllocationData(source: Record<string, unknown>): DashboardAllocationSlice[] {
  const allocation = readArray(source, ['portfolioData', 'allocation', 'assetAllocation'])
  if (!allocation) {
    return FALLBACK_SNAPSHOT.portfolioData.map((slice) => ({ ...slice }))
  }

  return allocation
    .map((item, index) => {
      if (isRecord(item)) {
        const name = readString(item, ['name', 'label', 'category']) ?? `Slice ${index + 1}`
        const value = readNumber(item, ['value', 'percentage', 'share']) ?? 0
        const color =
          readString(item, ['color', 'hex']) ??
          FALLBACK_SNAPSHOT.portfolioData[index % FALLBACK_SNAPSHOT.portfolioData.length].color

        return { name, value, color }
      }

      return null
    })
    .filter((slice): slice is DashboardAllocationSlice => slice !== null)
}

function buildStocks(source: Record<string, unknown>): DashboardStock[] {
  const stocks = readArray(source, ['topStocks', 'stocks', 'marketLeaders'])
  if (!stocks) {
    return FALLBACK_SNAPSHOT.topStocks.map((stock) => ({ ...stock }))
  }

  return stocks
    .map((item, index) => {
      if (isRecord(item)) {
        return {
          symbol: readString(item, ['symbol', 'ticker']) ?? `STK${index + 1}`,
          name: readString(item, ['name', 'companyName']) ?? 'Unknown Company',
          price: readNumber(item, ['price', 'currentPrice', 'lastPrice']) ?? 0,
          change: readNumber(item, ['change', 'changePercent', 'percentChange']) ?? 0,
        }
      }

      return null
    })
    .filter((stock): stock is DashboardStock => stock !== null)
}

function buildInsights(source: Record<string, unknown>): DashboardInsight[] {
  const insights = readArray(source, ['aiInsights', 'insights', 'highlights'])
  if (!insights) {
    return FALLBACK_SNAPSHOT.aiInsights.map((insight) => ({ ...insight }))
  }

  return insights
    .map((item, index) => {
      if (isRecord(item)) {
        const type = item.type === 'opportunity' || item.type === 'warning' ? item.type : 'info'

        return {
          type,
          title: readString(item, ['title', 'heading']) ?? `Insight ${index + 1}`,
          description: readString(item, ['description', 'summary', 'body']) ?? 'No insight details available.',
          time: readString(item, ['time', 'timestamp', 'createdAt']) ?? 'Now',
        }
      }

      return null
    })
    .filter((insight): insight is DashboardInsight => insight !== null)
}

function normalizeDashboardSnapshot(source: Record<string, unknown>, snapshotSource: DashboardSnapshot['source']): DashboardSnapshot {
  return {
    source: snapshotSource,
    lastUpdated: readString(source, ['lastUpdated', 'updatedAt', 'timestamp']) ?? FALLBACK_SNAPSHOT.lastUpdated,
    metrics: buildMetrics(source),
    performanceData: buildPerformanceData(source),
    portfolioData: buildAllocationData(source),
    topStocks: buildStocks(source),
    aiInsights: buildInsights(source),
  }
}

function unwrapPayload(payload: unknown): Record<string, unknown> | null {
  if (!isRecord(payload)) {
    return null
  }

  if (payload.success === false) {
    return null
  }

  const candidates = [payload.data, payload.snapshot, payload.overview, payload.dashboard]
  for (const candidate of candidates) {
    if (isRecord(candidate)) {
      return candidate
    }
  }

  return payload
}

function resolveAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage.getItem('auth_token')
}

export function createFallbackDashboardSnapshot(): DashboardSnapshot {
  return cloneFallbackSnapshot()
}

export async function fetchDashboardSnapshot(): Promise<DashboardSnapshot> {
  try {
    const response = await fetch(`${api.getBaseURL().replace(/\/+$/, '')}${endpoints.dashboard.overview}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(resolveAuthToken() ? { Authorization: `Bearer ${resolveAuthToken()}` } : {}),
      },
      cache: 'no-store',
    })

    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      return createFallbackDashboardSnapshot()
    }

    const source = unwrapPayload(payload)
    if (!source) {
      return createFallbackDashboardSnapshot()
    }

    return normalizeDashboardSnapshot(source, 'api')
  } catch {
    return createFallbackDashboardSnapshot()
  }
}
