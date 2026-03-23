const mockPrisma = {
  company: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
  },
  financialReport: {
    findFirst: jest.fn(),
  },
}

const mockRagService = {
  queryFinancialKnowledge: jest.fn(),
}

const mockLogger = {
  info: jest.fn(),
}

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
}))

jest.mock('../../utils/logger', () => ({
  __esModule: true,
  default: {
    child: jest.fn(() => mockLogger),
  },
}))

jest.mock('../financialReportRag.service', () => ({
  FinancialReportRagService: mockRagService,
}))

describe('MultiAgentFinancialSystemService', () => {
  let MultiAgentFinancialSystemService: any

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    ;({ MultiAgentFinancialSystemService } = require('../multiAgentFinancialSystem.service'))
  })

  test('runs the four-agent flow and returns a final answer', async () => {
    mockPrisma.company.findUnique.mockResolvedValue({
      id: 'company-1',
      symbol: 'NABIL',
      name: 'Nabil Bank',
      sector: 'Banking',
    })
    mockPrisma.financialReport.findFirst.mockResolvedValue({
      year: 2024,
      revenue: 1000,
      netProfit: 200,
      totalAssets: 5000,
      totalEquity: 1000,
      totalDebt: 600,
    })
    mockRagService.queryFinancialKnowledge.mockResolvedValue({
      results: [
        {
          relevant_text: 'Net profit improved due to lower funding costs.',
          source_reference: 'NABIL | Annual Report | Page 32',
          similarity: 0.81,
        },
      ],
      metadata: {
        lowSimilarity: false,
      },
    })

    const result = await MultiAgentFinancialSystemService.run({
      company: 'NABIL',
      query: 'Analyze NABIL growth and risks',
    })

    expect(result.company.symbol).toBe('NABIL')
    expect(result.agents.retrieval.retrievedChunks).toHaveLength(1)
    expect(result.agents.financial_analyst.ratioAnalysis.length).toBeGreaterThan(0)
    expect(result.final_answer).toContain('Overall risk is')
  })

  test('raises risk when retrieval quality is weak', async () => {
    mockPrisma.company.findUnique.mockResolvedValue({
      id: 'company-1',
      symbol: 'NABIL',
      name: 'Nabil Bank',
      sector: 'Banking',
    })
    mockPrisma.financialReport.findFirst.mockResolvedValue({
      year: 2024,
      revenue: 1000,
      netProfit: 20,
      totalAssets: 5000,
      totalEquity: 100,
      totalDebt: 250,
    })
    mockRagService.queryFinancialKnowledge.mockResolvedValue({
      results: [],
      metadata: {
        lowSimilarity: true,
      },
    })

    const result = await MultiAgentFinancialSystemService.run({
      company: 'NABIL',
      query: 'What are the key risks for NABIL?',
    })

    expect(result.agents.risk.riskLevel).toBe('high')
    expect(result.agents.risk.redFlags.some((flag: string) => flag.includes('low-similarity'))).toBe(true)
  })
})

