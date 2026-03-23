describe('StructuredFinancialAnalysisService', () => {
  let StructuredFinancialAnalysisService: any

  beforeEach(() => {
    jest.resetModules()
    ;({ StructuredFinancialAnalysisService } = require('../structuredFinancialAnalysis.service'))
  })

  test('returns strong verdict for profitable low-debt company with improving revenue', () => {
    const result = StructuredFinancialAnalysisService.analyze({
      roe: 18,
      eps: 24,
      debt_ratio: 0.3,
      revenue_trend: 'increasing',
    })

    expect(result.verdict).toBe('Strong')
    expect(result.risk_level).toBe('Low')
    expect(result.strength.length).toBeGreaterThan(0)
  })

  test('returns weak verdict and high risk for declining weak fundamentals', () => {
    const result = StructuredFinancialAnalysisService.analyze({
      roe: 7,
      eps: -2,
      debt_ratio: 0.75,
      revenue_trend: 'declining',
    })

    expect(result.verdict).toBe('Weak')
    expect(result.risk_level).toBe('High')
    expect(result.weakness).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Weak profitability'),
        expect.stringContaining('declining'),
        expect.stringContaining('high leverage'),
      ])
    )
  })
})

