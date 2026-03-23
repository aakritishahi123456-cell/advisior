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

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
}))

describe('DataQualityService', () => {
  let DataQualityService: any

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    ;({ DataQualityService } = require('../dataQuality.service'))
  })

  test('rejects invalid live price records and logs anomaly plus audit', async () => {
    const result = await DataQualityService.validatePriceBeforeInsert({
      stockId: 'stock-1',
      symbol: 'NABIL',
      price: 0,
      change: 1.5,
      volume: 1000n,
      timestamp: new Date('2026-03-22T10:00:00.000Z'),
      source: 'NEPSE_LIVE',
    })

    expect(result.valid).toBe(false)
    expect(mockPrisma.dataQualityAnomaly.create).toHaveBeenCalledTimes(1)
    expect(mockPrisma.dataQualityAuditLog.create).toHaveBeenCalledTimes(1)
  })

  test('skips duplicate live price records and writes audit trail', async () => {
    mockPrisma.nepsePrice.findUnique.mockResolvedValue({ id: 'existing-price' })

    const result = await DataQualityService.validatePriceBeforeInsert({
      stockId: 'stock-1',
      symbol: 'NABIL',
      price: 650,
      change: 1.5,
      volume: 1000n,
      timestamp: new Date('2026-03-22T10:00:00.000Z'),
      source: 'NEPSE_LIVE',
    })

    expect(result).toEqual({
      valid: false,
      reason: 'duplicate_entry',
      details: { duplicateId: 'existing-price' },
    })
    expect(mockPrisma.dataQualityAnomaly.create).toHaveBeenCalledTimes(1)
    expect(mockPrisma.dataQualityAuditLog.create).toHaveBeenCalledTimes(1)
  })

  test('rejects financial records with missing required fields', async () => {
    const result = await DataQualityService.validateFinancialBeforeUpsert({
      companyId: 'company-1',
      symbol: 'NABIL',
      asOfDate: new Date('2025-12-31T00:00:00.000Z'),
      revenue: null,
      profit: 120,
      eps: 10,
      assets: 5000,
      liabilities: 3000,
      growthRate: 12,
      sourceDocument: 'Annual Report 2025',
      source: 'OFFICIAL_PDF',
    })

    expect(result.valid).toBe(false)
    expect(mockPrisma.dataQualityAnomaly.create).toHaveBeenCalledTimes(1)
    expect(mockPrisma.dataQualityAuditLog.create).toHaveBeenCalledTimes(1)
  })

  test('skips unchanged duplicate financial records', async () => {
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
})
