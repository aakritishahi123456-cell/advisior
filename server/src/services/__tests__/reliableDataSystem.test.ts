describe('Reliable data system QA coverage', () => {
  afterEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  test('financial data retrieval returns accurate structured values from stored records', async () => {
    const mockPrisma = {
      company: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      nepseFinancial: {
        findFirst: jest.fn(),
      },
      nepsePrice: {
        findFirst: jest.fn(),
      },
    }

    jest.doMock('../../lib/prisma', () => ({
      __esModule: true,
      default: mockPrisma,
    }))

    const { FinancialDataRetrievalService } = require('../financialDataRetrieval.service')

    mockPrisma.company.findUnique.mockResolvedValue({
      id: 'company-1',
      symbol: 'NABIL',
      name: 'Nabil Bank Limited',
    })
    mockPrisma.nepseFinancial.findFirst.mockResolvedValue({
      revenue: 1550,
      profit: 310,
      growthRate: 14.2,
      peRatio: 16.8,
    })
    mockPrisma.nepsePrice.findFirst.mockResolvedValue({
      price: 605,
    })

    const result = await FinancialDataRetrievalService.fetchRelevantFinancialData({
      query: 'NABIL growth',
      symbol: 'NABIL',
    })

    expect(result).toEqual({
      company: 'NABIL',
      data: {
        revenue: 1550,
        profit: 310,
        growth: 14.2,
        latest_price: 605,
        PE_ratio: 16.8,
      },
      sources: ['financials_latest', 'nepse_price_data'],
    })
  })

  test('duplicate detection rejects unchanged financial records and writes anomaly plus audit logs', async () => {
    const mockPrisma = {
      nepsePrice: {
        findUnique: jest.fn(),
      },
      nepseFinancial: {
        findUnique: jest.fn(),
      },
      dataQualityAnomaly: {
        create: jest.fn(),
      },
      dataQualityAuditLog: {
        create: jest.fn(),
      },
    }

    jest.doMock('../../lib/prisma', () => ({
      __esModule: true,
      default: mockPrisma,
    }))

    const { DataQualityService } = require('../dataQuality.service')

    mockPrisma.nepseFinancial.findUnique.mockResolvedValue({
      revenue: 1000,
      profit: 220,
      eps: 18.4,
      assets: 9500,
    })

    const result = await DataQualityService.validateFinancialBeforeUpsert({
      companyId: 'company-1',
      symbol: 'NABIL',
      asOfDate: new Date('2025-12-31T00:00:00.000Z'),
      revenue: 1000,
      profit: 220,
      eps: 18.4,
      assets: 9500,
      liabilities: 7100,
      growthRate: 12,
      sourceDocument: 'Annual Report 2025',
      source: 'OFFICIAL_PDF',
    })

    expect(result).toEqual({
      valid: false,
      reason: 'duplicate_entry',
      details: { duplicate: true },
    })
    expect(mockPrisma.dataQualityAnomaly.create).toHaveBeenCalledTimes(1)
    expect(mockPrisma.dataQualityAuditLog.create).toHaveBeenCalledTimes(1)
  })

  test('filing retrieval answers only from relevant filing chunks with source citation', async () => {
    const mockPrisma = {
      company: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
      filing: {
        findMany: jest.fn(),
      },
    }

    jest.doMock('../../lib/prisma', () => ({
      __esModule: true,
      default: mockPrisma,
    }))

    const { DocumentIntelligenceService } = require('../documentIntelligence.service')

    mockPrisma.company.findUnique.mockResolvedValue({
      id: 'company-1',
      symbol: 'NABIL',
      name: 'Nabil Bank Limited',
    })
    mockPrisma.filing.findMany.mockResolvedValue([
      {
        id: 'filing-1',
        type: 'ANNUAL_REPORT',
        uploadedAt: new Date('2024-07-15T00:00:00.000Z'),
        createdAt: new Date('2024-07-15T00:00:00.000Z'),
        chunks: [
          {
            pageNumber: 32,
            chunkIndex: 0,
            content: 'Net profit increased by 12 percent supported by lower funding costs and stable asset quality.',
          },
          {
            pageNumber: 1,
            chunkIndex: 1,
            content: 'Board contact and corporate office details.',
          },
        ],
      },
    ])

    const result = await DocumentIntelligenceService.answerFromFilings({
      company: 'NABIL',
      question: 'What happened to net profit?',
    })

    expect(result).toEqual({
      answer: 'Net profit increased by 12 percent supported by lower funding costs and stable asset quality.',
      source: 'Annual Report 2024, Page 32',
    })
  })

  test('dividend tracking returns normalized dividend and corporate action history', async () => {
    const mockPrisma = {
      company: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
      dividend: {
        findMany: jest.fn(),
      },
      corporateAction: {
        findMany: jest.fn(),
      },
    }

    jest.doMock('../../lib/prisma', () => ({
      __esModule: true,
      default: mockPrisma,
    }))

    const { CorporateActionsService } = require('../corporateActions.service')

    mockPrisma.company.findUnique.mockResolvedValue({
      id: 'company-1',
      symbol: 'NABIL',
      name: 'Nabil Bank Limited',
    })
    mockPrisma.dividend.findMany.mockResolvedValue([
      {
        companyId: 'company-1',
        fiscalYear: '2080/81',
        dividendAmount: 38,
        dividendPercentage: 38,
        isCash: true,
        isBonus: false,
        paymentDate: new Date('2025-01-20T00:00:00.000Z'),
        createdAt: new Date('2025-01-10T00:00:00.000Z'),
        corporateAction: {
          announcementDate: new Date('2025-01-05T00:00:00.000Z'),
          exDate: new Date('2025-01-15T00:00:00.000Z'),
          ratio: null,
          sourceUrl: 'https://internal.local/dividend',
          actionType: {
            code: 'DIVIDEND',
            name: 'Dividend',
          },
        },
      },
    ])
    mockPrisma.corporateAction.findMany.mockResolvedValue([
      {
        companyId: 'company-1',
        announcementDate: new Date('2024-09-01T00:00:00.000Z'),
        exDate: null,
        ratio: '3:10',
        sourceUrl: 'https://internal.local/rights',
        createdAt: new Date('2024-09-01T00:00:00.000Z'),
        actionType: {
          code: 'RIGHTS_ISSUE',
          name: 'Rights Issue',
        },
      },
    ])

    const result = await CorporateActionsService.getCompanyCorporateActions('NABIL')

    expect(result.dividends).toEqual([
      {
        company_id: 'company-1',
        dividend_type: 'cash',
        amount: 38,
        announcement_date: '2025-01-05T00:00:00.000Z',
        ex_date: '2025-01-15T00:00:00.000Z',
        fiscal_year: '2080/81',
      },
    ])
    expect(result.corporate_actions).toEqual([
      {
        company_id: 'company-1',
        action_type: 'rights_issue',
        announcement_date: '2024-09-01T00:00:00.000Z',
        ex_date: null,
        ratio: '3:10',
        source_url: 'https://internal.local/rights',
      },
    ])
  })
})
