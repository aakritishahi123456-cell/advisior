const mockPrisma = {
  company: {
    findUnique: jest.fn(),
  },
}

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}))

const PortfolioOptimizer = require('../portfolioOptimizer')

describe('PortfolioOptimizer accuracy and edge cases', () => {
  let optimizer

  beforeEach(() => {
    jest.clearAllMocks()
    optimizer = new PortfolioOptimizer()
  })

  test('calculates finite risk metrics from aligned price histories', () => {
    const stocks = [
      {
        symbol: 'AAA',
        prices: [{ close: 100 }, { close: 105 }, { close: 110 }, { close: 120 }],
      },
      {
        symbol: 'BBB',
        prices: [{ close: 200 }, { close: 198 }, { close: 202 }, { close: 208 }],
      },
    ]

    const { expectedReturns, covarianceMatrix, prices } = optimizer.calculateRiskMetrics(stocks)

    expect(Number.isFinite(expectedReturns.AAA)).toBe(true)
    expect(Number.isFinite(expectedReturns.BBB)).toBe(true)
    expect(covarianceMatrix.AAA.BBB).toBeCloseTo(covarianceMatrix.BBB.AAA, 10)
    expect(prices.AAA).toBe(120)
    expect(prices.BBB).toBe(208)
  })

  test('applies exclusion and weight constraints while keeping allocations normalized', () => {
    const constrained = optimizer.applyConstraints(
      [
        { symbol: 'AAA', weight: 0.8, risk: 0.2 },
        { symbol: 'BBB', weight: 0.15, risk: 0.3 },
        { symbol: 'CCC', weight: 0.05, risk: 1.5 },
      ],
      {
        maxWeight: 0.6,
        minWeight: 0.1,
        excludeSymbols: ['CCC'],
      }
    )

    const totalWeight = constrained.reduce((sum, item) => sum + item.weight, 0)

    expect(constrained.map((item) => item.symbol)).toEqual(['AAA', 'BBB'])
    expect(totalWeight).toBeCloseTo(1, 10)
    constrained.forEach((item) => {
      expect(item.weight).toBeGreaterThanOrEqual(0.1)
      expect(item.weight).toBeLessThanOrEqual(0.9)
    })
  })

  test('computes portfolio metrics without NaN values for a balanced allocation', () => {
    const allocation = [
      { symbol: 'AAA', weight: 0.5, risk: 0.12 },
      { symbol: 'BBB', weight: 0.5, risk: 0.18 },
    ]
    const expectedReturns = { AAA: 0.14, BBB: 0.1 }
    const covarianceMatrix = {
      AAA: { AAA: 0.0144, BBB: 0.008 },
      BBB: { AAA: 0.008, BBB: 0.0324 },
    }

    const metrics = optimizer.calculatePortfolioMetrics(allocation, expectedReturns, covarianceMatrix)

    expect(Number.isFinite(metrics.expectedReturn)).toBe(true)
    expect(Number.isFinite(metrics.volatility)).toBe(true)
    expect(Number.isFinite(metrics.sharpeRatio)).toBe(true)
    expect(metrics.volatility).toBeGreaterThan(0)
  })
})
