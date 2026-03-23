import prisma from '../lib/prisma'

export type StockFilterInput = {
  query?: string
  sector?: string
  minGrowth?: number
  minProfit?: number
  minDividendYield?: number
  sortBy?: 'growth' | 'profit' | 'dividendYield' | 'price'
  sortOrder?: 'asc' | 'desc'
  limit?: number
}

type SortField = NonNullable<StockFilterInput['sortBy']>

type StockFilterRow = {
  symbol: string
  name: string
  sector: string
  price: number | null
  growth: number | null
  profit: number | null
  dividendYield: number | null
  latestDividendAmount: number | null
  asOfDate: string | null
}

function normalizeText(value: string) {
  return value.trim().toLowerCase()
}

function derivePreset(input: StockFilterInput): Required<Pick<StockFilterInput, 'sortBy' | 'sortOrder'>> &
  Pick<StockFilterInput, 'minGrowth' | 'minDividendYield'> {
  const normalizedQuery = normalizeText(input.query || '')

  if (normalizedQuery.includes('top growing') || normalizedQuery.includes('growth')) {
    return {
      sortBy: 'growth',
      sortOrder: 'desc',
      minGrowth: input.minGrowth ?? 0,
      minDividendYield: input.minDividendYield,
    }
  }

  if (normalizedQuery.includes('high dividend') || normalizedQuery.includes('dividend')) {
    return {
      sortBy: 'dividendYield',
      sortOrder: 'desc',
      minGrowth: input.minGrowth,
      minDividendYield: input.minDividendYield ?? 0.01,
    }
  }

  return {
    sortBy: input.sortBy || 'growth',
    sortOrder: input.sortOrder || 'desc',
    minGrowth: input.minGrowth,
    minDividendYield: input.minDividendYield,
  }
}

function getComparableValue(row: StockFilterRow, field: SortField): number {
  switch (field) {
    case 'profit':
      return row.profit ?? Number.NEGATIVE_INFINITY
    case 'dividendYield':
      return row.dividendYield ?? Number.NEGATIVE_INFINITY
    case 'price':
      return row.price ?? Number.NEGATIVE_INFINITY
    case 'growth':
    default:
      return row.growth ?? Number.NEGATIVE_INFINITY
  }
}

export class StockFilterService {
  static async filterStocks(input: StockFilterInput) {
    const preset = derivePreset(input)
    const sortBy = input.sortBy || preset.sortBy
    const sortOrder = input.sortOrder || preset.sortOrder
    const limit = Math.min(Math.max(input.limit || 20, 1), 100)

    const companies = await prisma.company.findMany({
      where: {
        ...(input.sector ? { sector: { equals: input.sector, mode: 'insensitive' } } : {}),
      },
      select: {
        symbol: true,
        name: true,
        sector: true,
        nepseFinancials: {
          orderBy: [{ asOfDate: 'desc' }, { updatedAt: 'desc' }],
          take: 1,
          select: {
            asOfDate: true,
            growthRate: true,
            profit: true,
            dividendYield: true,
          },
        },
        nepsePrices: {
          orderBy: [{ timestamp: 'desc' }, { createdAt: 'desc' }],
          take: 1,
          select: {
            price: true,
          },
        },
        dividends: {
          orderBy: [{ announcementDate: 'desc' }, { createdAt: 'desc' }],
          take: 1,
          select: {
            dividendAmount: true,
          },
        },
      },
    })

    const rows = companies.map<StockFilterRow>((company) => {
      const latestFinancial = company.nepseFinancials[0]
      const latestPrice = company.nepsePrices[0]
      const latestDividend = company.dividends[0]

      return {
        symbol: company.symbol,
        name: company.name,
        sector: company.sector,
        price: latestPrice?.price ?? null,
        growth: latestFinancial?.growthRate ?? null,
        profit: latestFinancial?.profit ?? null,
        dividendYield: latestFinancial?.dividendYield ?? null,
        latestDividendAmount: latestDividend?.dividendAmount ?? null,
        asOfDate: latestFinancial?.asOfDate?.toISOString() ?? null,
      }
    })

    const filtered = rows.filter((row) => {
      if (preset.minGrowth !== undefined && (row.growth === null || row.growth < preset.minGrowth)) {
        return false
      }

      if (input.minProfit !== undefined && (row.profit === null || row.profit < input.minProfit)) {
        return false
      }

      if (
        preset.minDividendYield !== undefined &&
        (row.dividendYield === null || row.dividendYield < preset.minDividendYield)
      ) {
        return false
      }

      return true
    })

    filtered.sort((left, right) => {
      const leftValue = getComparableValue(left, sortBy)
      const rightValue = getComparableValue(right, sortBy)

      if (sortOrder === 'asc') {
        return leftValue - rightValue
      }

      return rightValue - leftValue
    })

    return {
      filters: {
        query: input.query || null,
        sector: input.sector || null,
        minGrowth: preset.minGrowth ?? null,
        minProfit: input.minProfit ?? null,
        minDividendYield: preset.minDividendYield ?? null,
        sortBy,
        sortOrder,
        limit,
      },
      count: Math.min(filtered.length, limit),
      data: filtered.slice(0, limit),
    }
  }
}
