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

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
}))

describe('CorporateActionsService', () => {
  let CorporateActionsService: any

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    ;({ CorporateActionsService } = require('../corporateActions.service'))
  })

  test('returns normalized dividend and corporate action history for a symbol', async () => {
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
        announcementDate: new Date('2024-08-01T00:00:00.000Z'),
        exDate: new Date('2024-08-10T00:00:00.000Z'),
        ratio: '10:1',
        sourceUrl: 'https://internal.local/split',
        createdAt: new Date('2024-08-01T00:00:00.000Z'),
        actionType: {
          code: 'STOCK_SPLIT',
          name: 'Stock Split',
        },
      },
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

    expect(result).toEqual({
      company: {
        id: 'company-1',
        symbol: 'NABIL',
        name: 'Nabil Bank Limited',
      },
      dividends: [
        {
          company_id: 'company-1',
          dividend_type: 'cash',
          amount: 38,
          announcement_date: '2025-01-05T00:00:00.000Z',
          ex_date: '2025-01-15T00:00:00.000Z',
          fiscal_year: '2080/81',
        },
      ],
      corporate_actions: [
        {
          company_id: 'company-1',
          action_type: 'rights_issue',
          announcement_date: '2024-09-01T00:00:00.000Z',
          ex_date: null,
          ratio: '3:10',
          source_url: 'https://internal.local/rights',
        },
        {
          company_id: 'company-1',
          action_type: 'split',
          announcement_date: '2024-08-01T00:00:00.000Z',
          ex_date: '2024-08-10T00:00:00.000Z',
          ratio: '10:1',
          source_url: 'https://internal.local/split',
        },
      ],
    })
  })

  test('falls back to exact company name lookup when symbol is not found', async () => {
    mockPrisma.company.findUnique.mockResolvedValue(null)
    mockPrisma.company.findFirst.mockResolvedValue({
      id: 'company-2',
      symbol: 'NICA',
      name: 'NIC Asia Bank Limited',
    })
    mockPrisma.dividend.findMany.mockResolvedValue([])
    mockPrisma.corporateAction.findMany.mockResolvedValue([])

    const result = await CorporateActionsService.getCompanyCorporateActions('NIC Asia Bank Limited')

    expect(result.company).toEqual({
      id: 'company-2',
      symbol: 'NICA',
      name: 'NIC Asia Bank Limited',
    })
    expect(result.dividends).toEqual([])
    expect(result.corporate_actions).toEqual([])
  })
})
