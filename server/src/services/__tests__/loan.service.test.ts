const mockPrisma = {
  loanProduct: {
    findMany: jest.fn(),
  },
  loanSimulation: {
    create: jest.fn(),
  },
}

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
}))

describe('LoanService marketplace engine', () => {
  let LoanService: any

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    ;({ LoanService } = require('../loan.service'))
  })

  test('returns ranked recommendations by lowest total cost and saves authenticated simulations', async () => {
    mockPrisma.loanProduct.findMany.mockResolvedValue([
      {
        bankName: 'A Bank',
        interestRate: 9,
        processingFee: 1000,
        sourceUrl: 'https://example.com/a',
        lastUpdated: new Date('2026-03-20T00:00:00.000Z'),
      },
      {
        bankName: 'B Bank',
        interestRate: 10,
        processingFee: 0,
        sourceUrl: 'https://example.com/b',
        lastUpdated: new Date('2026-03-20T00:00:00.000Z'),
      },
    ])
    mockPrisma.loanSimulation.create.mockResolvedValue({ id: 'sim-1' })

    const result = await LoanService.simulateMarketplaceLoan(
      { loanAmount: 1_000_000, tenure: 12, loanType: 'home', ranking: 'lowest_total_cost', limit: 2 },
      'user-1'
    )

    expect(result.bestLoanSuggestions).toHaveLength(2)
    expect(result.bestLoanSuggestions[0].bankName).toBe('A Bank')
    expect(result.summary.bestByEMI?.bankName).toBe('A Bank')
    expect(result.savedSimulationId).toBe('sim-1')
    expect(mockPrisma.loanSimulation.create).toHaveBeenCalledTimes(1)
  })

  test('calculates EMI accurately for standard reducing-balance loans', async () => {
    const result = await LoanService.simulateLoan({
      principal: 1_000_000,
      interestRate: 12,
      tenure: 12,
    })

    expect(result.emi).toBe(88848.79)
    expect(result.totalPayment).toBe(1066185.46)
    expect(result.totalInterest).toBe(66185.46)
    expect(result.schedule).toHaveLength(12)
  })

  test('supports zero-interest products and ranks by lowest emi', async () => {
    mockPrisma.loanProduct.findMany.mockResolvedValue([
      {
        bankName: 'Zero Bank',
        interestRate: 0,
        processingFee: 5000,
        sourceUrl: null,
        lastUpdated: new Date('2026-03-20T00:00:00.000Z'),
      },
      {
        bankName: 'Regular Bank',
        interestRate: 8,
        processingFee: 0,
        sourceUrl: null,
        lastUpdated: new Date('2026-03-20T00:00:00.000Z'),
      },
    ])

    const result = await LoanService.getLoanRecommendations({
      loanAmount: 120_000,
      tenure: 12,
      loanType: 'personal',
      ranking: 'lowest_emi',
      limit: 2,
    })

    expect(result[0].bankName).toBe('Zero Bank')
    expect(result[0].totalInterest).toBe(0)
    expect(result[0].emi).toBe(10000)
  })

  test('handles zero interest and maximum supported tenure edge values', async () => {
    const zeroInterest = await LoanService.simulateLoan({
      principal: 120_000,
      interestRate: 0,
      tenure: 12,
    })

    const maxTenure = await LoanService.simulateLoan({
      principal: 500_000,
      interestRate: 8,
      tenure: 360,
    })

    expect(zeroInterest.emi).toBe(10000)
    expect(zeroInterest.totalInterest).toBe(0)
    expect(maxTenure.schedule).toHaveLength(360)
    expect(maxTenure.emi).toBeGreaterThan(0)
  })

  test('sorts loan comparisons by lowest total payment', async () => {
    const results = await LoanService.compareLoans([
      {
        principal: 1_000_000,
        interestRate: 15,
        tenure: 12,
      },
      {
        principal: 1_000_000,
        interestRate: 10,
        tenure: 12,
      },
      {
        principal: 1_000_000,
        interestRate: 0,
        tenure: 12,
      },
    ])

    expect(results).toHaveLength(3)
    expect(results.map((item: any) => item.interestRate)).toEqual([0, 10, 15])
    expect(results[0].totalPayment).toBeLessThan(results[1].totalPayment)
    expect(results[1].totalPayment).toBeLessThan(results[2].totalPayment)
  })

  test('rejects very high tenure values', async () => {
    await expect(
      LoanService.simulateMarketplaceLoan({
        loanAmount: 1_000_000,
        tenure: 601,
        loanType: 'home',
      })
    ).rejects.toMatchObject({
      message: 'Tenure is too long',
      statusCode: 400,
    })
  })
})
