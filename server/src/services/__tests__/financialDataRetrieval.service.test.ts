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

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
}))

describe('FinancialDataRetrievalService', () => {
  let FinancialDataRetrievalService: any

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    ;({ FinancialDataRetrievalService } = require('../financialDataRetrieval.service'))
  })

  test('returns structured financial data for an exact symbol query', async () => {
    mockPrisma.company.findMany.mockResolvedValue([
      { id: 'company-1', symbol: 'NABIL', name: 'Nabil Bank Limited' },
    ])
    mockPrisma.nepseFinancial.findFirst.mockResolvedValue({
      revenue: 1000,
      profit: 220,
      growthRate: 12.5,
      peRatio: 18.4,
    })
    mockPrisma.nepsePrice.findFirst.mockResolvedValue({
      price: 560,
    })

    const result = await FinancialDataRetrievalService.fetchRelevantFinancialData({
      query: 'Is NABIL a good investment?',
    })

    expect(result).toEqual({
      company: 'NABIL',
      data: {
        revenue: 1000,
        profit: 220,
        growth: 12.5,
        latest_price: 560,
        PE_ratio: 18.4,
      },
      sources: ['financials_latest', 'nepse_price_data'],
    })
  })

  test('returns null values when database fields are unavailable', async () => {
    mockPrisma.company.findUnique.mockResolvedValue({
      id: 'company-1',
      symbol: 'NABIL',
      name: 'Nabil Bank Limited',
    })
    mockPrisma.nepseFinancial.findFirst.mockResolvedValue(null)
    mockPrisma.nepsePrice.findFirst.mockResolvedValue(null)

    const result = await FinancialDataRetrievalService.fetchRelevantFinancialData({
      query: 'NABIL',
      symbol: 'NABIL',
    })

    expect(result).toEqual({
      company: 'NABIL',
      data: {
        revenue: null,
        profit: null,
        growth: null,
        latest_price: null,
        PE_ratio: null,
      },
      sources: [],
    })
  })
})
