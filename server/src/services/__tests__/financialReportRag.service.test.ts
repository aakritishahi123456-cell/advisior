const mockPrisma = {
  company: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
  },
  filing: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  filingChunk: {
    deleteMany: jest.fn(),
    createMany: jest.fn(),
  },
  financialReport: {
    findMany: jest.fn(),
  },
  $transaction: jest.fn(),
}

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
}))

describe('FinancialReportRagService', () => {
  let FinancialReportRagService: any
  let rankFinancialReportChunks: any
  let buildRatioSummaryText: any

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    process.env.OPENAI_API_KEY = ''
    ;({
      FinancialReportRagService,
      rankFinancialReportChunks,
      buildRatioSummaryText,
    } = require('../financialReportRag.service'))
  })

  test('ranks the most relevant chunks and removes duplicate content', async () => {
    const ranked = await rankFinancialReportChunks(
      'What happened to net profit margin?',
      [
        {
          filingId: 'f1',
          filingType: 'ANNUAL_REPORT',
          uploadedAt: new Date('2025-01-01T00:00:00.000Z'),
          pageNumber: 12,
          chunkIndex: 0,
          content: 'Net profit margin improved to 18 percent due to lower funding costs.',
          embedding: {
            model: 'local-hash-v1',
            vector: [],
          },
        },
        {
          filingId: 'f2',
          filingType: 'ANNUAL_REPORT',
          uploadedAt: new Date('2025-01-02T00:00:00.000Z'),
          pageNumber: 13,
          chunkIndex: 1,
          content: 'Net profit margin improved to 18 percent due to lower funding costs.',
          embedding: {
            model: 'local-hash-v1',
            vector: [],
          },
        },
        {
          filingId: 'f3',
          filingType: 'ANNUAL_REPORT',
          uploadedAt: new Date('2025-01-03T00:00:00.000Z'),
          pageNumber: 30,
          chunkIndex: 2,
          content: 'Branch expansion continued during the year with additional service centers.',
          embedding: {
            model: 'local-hash-v1',
            vector: [],
          },
        },
      ]
    )

    expect(ranked).toHaveLength(2)
    expect(ranked[0].content).toContain('Net profit margin improved')
  })

  test('returns low similarity metadata when no chunk passes the threshold', async () => {
    mockPrisma.company.findUnique.mockResolvedValue({
      id: 'company-1',
      symbol: 'NABIL',
      name: 'Nabil Bank Limited',
    })
    mockPrisma.filing.findMany.mockResolvedValue([
      {
        id: 'filing-1',
        type: 'ANNUAL_REPORT',
        uploadedAt: new Date('2025-01-01T00:00:00.000Z'),
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        chunks: [
          {
            pageNumber: 1,
            chunkIndex: 0,
            content: 'Registered office address and board meeting notices.',
            embedding: null,
          },
        ],
      },
    ])

    const result = await FinancialReportRagService.queryFinancialKnowledge({
      company: 'NABIL',
      query: 'What is the debt to equity ratio trend?',
      minSimilarity: 0.5,
    })

    expect(result.metadata.lowSimilarity).toBe(true)
    expect(result.results).toEqual([])
  })

  test('builds ratio summary text from financial report metrics', () => {
    const summary = buildRatioSummaryText({
      companySymbol: 'NICA',
      companyName: 'NIC Asia Bank',
      year: 2024,
      revenue: 100000000,
      netProfit: 18000000,
      totalAssets: 500000000,
      totalEquity: 80000000,
      totalDebt: 120000000,
    })

    expect(summary).toContain('NIC Asia Bank (NICA) financial ratio summary for FY2024.')
    expect(summary).toContain('Net profit margin 18.00%')
    expect(summary).toContain('Return on equity 22.50%')
  })
})
