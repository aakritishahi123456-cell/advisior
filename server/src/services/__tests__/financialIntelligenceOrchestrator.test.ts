const mockPrisma = {
  company: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  financialReport: {
    findFirst: jest.fn(),
  },
  nepsePrice: {
    findMany: jest.fn(),
  },
  dividend: {
    findMany: jest.fn(),
  },
  companyDocument: {
    findMany: jest.fn(),
  },
  researchQuery: {
    create: jest.fn(),
    update: jest.fn(),
  },
  researchAnswer: {
    create: jest.fn(),
  },
}

const mockRunLogger = {
  info: jest.fn(),
  error: jest.fn(),
}

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}))

jest.mock('../../utils/logger', () => ({
  __esModule: true,
  default: {
    child: jest.fn(() => mockRunLogger),
  },
}))

describe('FinancialIntelligenceOrchestrator edge cases', () => {
  let FinancialIntelligenceOrchestrator: any

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()

    mockPrisma.researchQuery.create.mockResolvedValue({ id: 'query-1' })
    mockPrisma.researchQuery.update.mockResolvedValue({ id: 'query-1' })
    mockPrisma.researchAnswer.create.mockResolvedValue({ id: 'answer-1' })

    ;({ FinancialIntelligenceOrchestrator } = require('../financialIntelligenceOrchestrator'))
  })

  test('falls back safely when no matching company or source data exists', async () => {
    mockPrisma.company.findMany.mockResolvedValue([])

    const result = await FinancialIntelligenceOrchestrator.runFinancialQuery({
      userId: 'user-1',
      question: 'Analyze UNKNOWN company',
    })

    expect(result.answer).toContain('Insufficient data')
    expect(result.sources).toEqual([])
    expect(result.verified).toBe(false)
    expect(mockPrisma.researchQuery.update).toHaveBeenCalledWith({
      where: { id: 'query-1' },
      data: { status: 'COMPLETED' },
    })
  })

  test('excludes invalid stock prices from the final answer', async () => {
    mockPrisma.company.findMany.mockResolvedValue([
      { id: 'company-1', symbol: 'NABIL', name: 'Nabil Bank', sector: 'Banking' },
    ])
    mockPrisma.financialReport.findFirst.mockResolvedValue({
      year: 2024,
      revenue: 1000,
      netProfit: 250,
      totalAssets: 5000,
      totalEquity: 2000,
      totalDebt: 500,
      createdAt: new Date('2024-03-01T00:00:00.000Z'),
    })
    mockPrisma.nepsePrice.findMany.mockResolvedValue([
      {
        date: new Date('2024-03-02T00:00:00.000Z'),
        open: 120,
        close: -125,
        high: 126,
        low: 119,
        volume: 1000n,
      },
    ])
    mockPrisma.dividend.findMany.mockResolvedValue([])
    mockPrisma.companyDocument.findMany.mockResolvedValue([])

    const result = await FinancialIntelligenceOrchestrator.runFinancialQuery({
      userId: 'user-1',
      question: 'Analyze NABIL',
    })

    expect(result.reasoning).toContain('excluded from analysis')
    expect(result.reasoning).toContain('Invalid stock price data was detected')
    expect(result.answer).not.toContain('latest stored close price')
    expect(result.sources.some((source: any) => source.type === 'market_price')).toBe(false)
  })

  test('prevents unsupported claims from reaching the final answer', async () => {
    mockPrisma.company.findMany.mockResolvedValue([
      { id: 'company-1', symbol: 'NABIL', name: 'Nabil Bank', sector: 'Banking' },
    ])
    mockPrisma.financialReport.findFirst.mockResolvedValue({
      year: 2024,
      revenue: 1000,
      netProfit: 250,
      totalAssets: 5000,
      totalEquity: 2000,
      totalDebt: 500,
      createdAt: new Date('2024-03-01T00:00:00.000Z'),
    })
    mockPrisma.nepsePrice.findMany.mockResolvedValue([])
    mockPrisma.dividend.findMany.mockResolvedValue([])
    mockPrisma.companyDocument.findMany.mockResolvedValue([])

    jest
      .spyOn(FinancialIntelligenceOrchestrator as any, 'runAnalysisAgent')
      .mockReturnValue({
        summary: 'Injected unsupported analysis.',
        reasoning: ['Unsupported reasoning path.'],
        metrics: [],
        claims: [
          {
            statement: 'This claim has no real source.',
            sourceLabels: ['fabricated_source'],
          },
        ],
        confidence: 0.95,
      })

    const result = await FinancialIntelligenceOrchestrator.runFinancialQuery({
      userId: 'user-1',
      question: 'Analyze NABIL',
    })

    expect(result.answer).not.toContain('This claim has no real source.')
    expect(result.agentLogs.validation.missingEvidence).toContain('This claim has no real source.')
    expect(result.verified).toBe(false)
    expect(result.sources).toEqual([])
  })
})
