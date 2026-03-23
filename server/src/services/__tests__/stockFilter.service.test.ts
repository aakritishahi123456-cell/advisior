const mockPrisma = {
  company: {
    findMany: jest.fn(),
  },
}

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
}))

describe('StockFilterService', () => {
  let StockFilterService: any

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    ;({ StockFilterService } = require('../stockFilter.service'))
  })

  test('returns top growing companies sorted by growth descending', async () => {
    mockPrisma.company.findMany.mockResolvedValue([
      {
        symbol: 'NABIL',
        name: 'Nabil Bank Limited',
        sector: 'Banking',
        nepseFinancials: [{ asOfDate: new Date('2025-12-31T00:00:00.000Z'), growthRate: 18, profit: 220, dividendYield: 4.2 }],
        nepsePrices: [{ price: 560 }],
        dividends: [{ dividendAmount: 38 }],
      },
      {
        symbol: 'NICA',
        name: 'NIC Asia Bank Limited',
        sector: 'Banking',
        nepseFinancials: [{ asOfDate: new Date('2025-12-31T00:00:00.000Z'), growthRate: 9, profit: 300, dividendYield: 3.1 }],
        nepsePrices: [{ price: 510 }],
        dividends: [{ dividendAmount: 25 }],
      },
    ])

    const result = await StockFilterService.filterStocks({
      query: 'Top growing companies',
    })

    expect(result.filters.sortBy).toBe('growth')
    expect(result.data.map((row: any) => row.symbol)).toEqual(['NABIL', 'NICA'])
  })

  test('returns high dividend stocks sorted by dividend yield', async () => {
    mockPrisma.company.findMany.mockResolvedValue([
      {
        symbol: 'NABIL',
        name: 'Nabil Bank Limited',
        sector: 'Banking',
        nepseFinancials: [{ asOfDate: new Date('2025-12-31T00:00:00.000Z'), growthRate: 18, profit: 220, dividendYield: 4.2 }],
        nepsePrices: [{ price: 560 }],
        dividends: [{ dividendAmount: 38 }],
      },
      {
        symbol: 'CHDC',
        name: 'CEDB Hydropower Development Company',
        sector: 'Hydropower',
        nepseFinancials: [{ asOfDate: new Date('2025-12-31T00:00:00.000Z'), growthRate: 7, profit: 180, dividendYield: 6.8 }],
        nepsePrices: [{ price: 780 }],
        dividends: [{ dividendAmount: 50 }],
      },
      {
        symbol: 'NICA',
        name: 'NIC Asia Bank Limited',
        sector: 'Banking',
        nepseFinancials: [{ asOfDate: new Date('2025-12-31T00:00:00.000Z'), growthRate: 9, profit: 300, dividendYield: null }],
        nepsePrices: [{ price: 510 }],
        dividends: [{ dividendAmount: 25 }],
      },
    ])

    const result = await StockFilterService.filterStocks({
      query: 'High dividend stocks',
    })

    expect(result.filters.sortBy).toBe('dividendYield')
    expect(result.data.map((row: any) => row.symbol)).toEqual(['CHDC', 'NABIL'])
  })

  test('supports explicit profit sorting and sector filtering', async () => {
    mockPrisma.company.findMany.mockResolvedValue([
      {
        symbol: 'NABIL',
        name: 'Nabil Bank Limited',
        sector: 'Banking',
        nepseFinancials: [{ asOfDate: new Date('2025-12-31T00:00:00.000Z'), growthRate: 18, profit: 220, dividendYield: 4.2 }],
        nepsePrices: [{ price: 560 }],
        dividends: [{ dividendAmount: 38 }],
      },
      {
        symbol: 'NICA',
        name: 'NIC Asia Bank Limited',
        sector: 'Banking',
        nepseFinancials: [{ asOfDate: new Date('2025-12-31T00:00:00.000Z'), growthRate: 9, profit: 300, dividendYield: 3.1 }],
        nepsePrices: [{ price: 510 }],
        dividends: [{ dividendAmount: 25 }],
      },
    ])

    const result = await StockFilterService.filterStocks({
      sector: 'Banking',
      sortBy: 'profit',
      sortOrder: 'desc',
      minProfit: 200,
    })

    expect(result.data.map((row: any) => row.symbol)).toEqual(['NICA', 'NABIL'])
  })
})
