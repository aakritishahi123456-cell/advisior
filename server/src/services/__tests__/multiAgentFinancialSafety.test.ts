jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: {
    company: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    financialReport: {
      findFirst: jest.fn(),
    },
  },
}))

jest.mock('../../utils/logger', () => ({
  __esModule: true,
  default: {
    child: jest.fn(() => ({
      info: jest.fn(),
    })),
  },
}))

jest.mock('../financialReportRag.service', () => ({
  FinancialReportRagService: {
    queryFinancialKnowledge: jest.fn(),
  },
}))

describe('Multi-agent safety', () => {
  let prisma: any
  let FinancialReportRagService: any
  let MultiAgentFinancialSystemService: any

  beforeEach(() => {
    jest.resetModules()
    prisma = require('../../lib/prisma').default
    FinancialReportRagService = require('../financialReportRag.service').FinancialReportRagService
    ;({ MultiAgentFinancialSystemService } = require('../multiAgentFinancialSystem.service'))
    jest.clearAllMocks()
  })

  test('returns No verified data available when no report and no retrieval evidence exist', async () => {
    prisma.company.findUnique.mockResolvedValue({
      id: 'company-1',
      symbol: 'NABIL',
      name: 'Nabil Bank',
      sector: 'Banking',
    })
    prisma.financialReport.findFirst.mockResolvedValue(null)
    FinancialReportRagService.queryFinancialKnowledge.mockResolvedValue({
      results: [],
      metadata: {
        lowSimilarity: true,
      },
    })

    const result = await MultiAgentFinancialSystemService.run({
      company: 'NABIL',
      query: 'Is NABIL fundamentally strong?',
    })

    expect(result.final_answer).toBe('No verified data available')
    expect(result.sources).toEqual([])
  })
})
