const mockPrisma = {
  portfolio: {
    findUnique: jest.fn(),
  },
  $queryRaw: jest.fn(),
}

const mockLogger = {
  error: jest.fn(),
}

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
}))

jest.mock('../../utils/logger', () => ({
  __esModule: true,
  default: mockLogger,
}))

describe('PortfolioService accuracy', () => {
  let portfolioService: any

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    ;({ portfolioService } = require('../portfolio.service'))
  })

  test('calculates profit correctly when buy price is 100 and current price is 120', async () => {
    mockPrisma.portfolio.findUnique.mockResolvedValue({
      id: 'portfolio-1',
      items: [
        {
          id: 'item-1',
          stockId: 'stock-1',
          quantity: 10,
          buyPrice: 100,
          stock: { symbol: 'NABIL' },
        },
      ],
    })
    mockPrisma.$queryRaw.mockResolvedValue([
      {
        stockId: 'stock-1',
        price: 120,
        rowNum: 1,
        timestamp: new Date('2026-03-22T10:00:00.000Z'),
      },
      {
        stockId: 'stock-1',
        price: 115,
        rowNum: 2,
        timestamp: new Date('2026-03-21T10:00:00.000Z'),
      },
    ])

    const result = await portfolioService.getUserPortfolio('user-1')

    expect(result.totalInvestment).toBe(1000)
    expect(result.totalValue).toBe(1200)
    expect(result.totalProfitLoss).toBe(200)
    expect(result.items[0]).toMatchObject({
      symbol: 'NABIL',
      quantity: 10,
      buyPrice: 100,
      currentPrice: 120,
      currentValue: 1200,
      profitLoss: 200,
      dailyChange: 50,
    })
  })

  test('handles price drop scenario with negative profit and daily change', async () => {
    mockPrisma.portfolio.findUnique.mockResolvedValue({
      id: 'portfolio-2',
      items: [
        {
          id: 'item-2',
          stockId: 'stock-2',
          quantity: 5,
          buyPrice: 200,
          stock: { symbol: 'NICBL' },
        },
      ],
    })
    mockPrisma.$queryRaw.mockResolvedValue([
      {
        stockId: 'stock-2',
        price: 150,
        rowNum: 1,
        timestamp: new Date('2026-03-22T10:00:00.000Z'),
      },
      {
        stockId: 'stock-2',
        price: 160,
        rowNum: 2,
        timestamp: new Date('2026-03-21T10:00:00.000Z'),
      },
    ])

    const result = await portfolioService.getUserPortfolio('user-2')

    expect(result.totalInvestment).toBe(1000)
    expect(result.totalValue).toBe(750)
    expect(result.totalProfitLoss).toBe(-250)
    expect(result.dailyChange).toBe(-50)
    expect(result.items[0].profitLoss).toBe(-250)
    expect(result.items[0].dailyChange).toBe(-50)
    expect(result.items[0].dailyChangePercent).toBeCloseTo(-6.25)
  })

  test('falls back safely when historical price data is missing', async () => {
    mockPrisma.portfolio.findUnique.mockResolvedValue({
      id: 'portfolio-3',
      items: [
        {
          id: 'item-3',
          stockId: 'stock-3',
          quantity: 8,
          buyPrice: 50,
          stock: { symbol: 'PRVU' },
        },
      ],
    })
    mockPrisma.$queryRaw.mockResolvedValue([
      {
        stockId: 'stock-3',
        price: 55,
        rowNum: 1,
        timestamp: new Date('2026-03-22T10:00:00.000Z'),
      },
    ])

    const result = await portfolioService.getUserPortfolio('user-3')

    expect(result.totalValue).toBe(440)
    expect(result.totalProfitLoss).toBe(40)
    expect(result.dailyChange).toBe(0)
    expect(result.dailyChangePercent).toBe(0)
    expect(result.items[0]).toMatchObject({
      symbol: 'PRVU',
      currentPrice: 55,
      dailyChange: 0,
      dailyChangePercent: 0,
      isActive: true,
      inactiveReason: null,
    })
  })

  test('aggregates multiple stocks correctly and marks stale holdings inactive', async () => {
    mockPrisma.portfolio.findUnique.mockResolvedValue({
      id: 'portfolio-4',
      items: [
        {
          id: 'item-4a',
          stockId: 'stock-4a',
          quantity: 10,
          buyPrice: 100,
          stock: { symbol: 'NABIL' },
        },
        {
          id: 'item-4b',
          stockId: 'stock-4b',
          quantity: 20,
          buyPrice: 40,
          stock: { symbol: 'HBL' },
        },
      ],
    })
    mockPrisma.$queryRaw.mockResolvedValue([
      {
        stockId: 'stock-4a',
        price: 120,
        rowNum: 1,
        timestamp: new Date('2026-03-22T10:00:00.000Z'),
      },
      {
        stockId: 'stock-4a',
        price: 110,
        rowNum: 2,
        timestamp: new Date('2026-03-21T10:00:00.000Z'),
      },
      {
        stockId: 'stock-4b',
        price: 45,
        rowNum: 1,
        timestamp: new Date('2026-03-20T10:00:00.000Z'),
      },
      {
        stockId: 'stock-4b',
        price: 44,
        rowNum: 2,
        timestamp: new Date('2026-03-19T10:00:00.000Z'),
      },
    ])

    const result = await portfolioService.getUserPortfolio('user-4')

    expect(result.totalInvestment).toBe(1800)
    expect(result.totalValue).toBe(2100)
    expect(result.totalProfitLoss).toBe(300)
    expect(result.dailyChange).toBe(120)
    expect(result.activeItems).toBe(1)
    expect(result.inactiveItems).toBe(1)
    expect(result.items).toHaveLength(2)
    const hbl = result.items.find((item: any) => item.symbol === 'HBL')
    const nabil = result.items.find((item: any) => item.symbol === 'NABIL')

    expect(hbl).toMatchObject({
      symbol: 'HBL',
      currentValue: 900,
      profitLoss: 100,
      isActive: false,
      inactiveReason: 'suspended',
    })
    expect(nabil).toMatchObject({
      symbol: 'NABIL',
      currentValue: 1200,
      profitLoss: 200,
      isActive: true,
      inactiveReason: null,
    })
  })
})
