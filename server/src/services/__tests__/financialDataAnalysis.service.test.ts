describe('FinancialDataAnalysisService', () => {
  let FinancialDataAnalysisService: any

  beforeEach(() => {
    jest.resetModules()
    ;({ FinancialDataAnalysisService } = require('../financialDataAnalysis.service'))
  })

  test('analyzes profitable and growing structured data without assumptions', () => {
    const result = FinancialDataAnalysisService.analyze({
      company: 'NABIL',
      data: {
        revenue: 1000,
        profit: 200,
        growth: 10,
        latest_price: 500,
        PE_ratio: 15,
      },
    })

    expect(result).not.toBe('INSUFFICIENT DATA')
    if (result === 'INSUFFICIENT DATA') {
      throw new Error('Expected verified analysis.')
    }
    expect(result.analysis).toContain('Reported revenue is 1,000')
    expect(result.analysis).toContain('Calculated profit margin is 20%')
    expect(result.analysis).toContain('P/E ratio is 15')
    expect(result.strengths).toContain('The company is profitable based on the provided profit figure of 200.')
    expect(result.strengths).toContain('Growth is positive at 10%.')
    expect(result.risks).toContain('No specific quantitative risk is visible in the provided fields alone.')
  })

  test('flags unavailable and negative data explicitly', () => {
    const result = FinancialDataAnalysisService.analyze({
      company: 'NABIL',
      data: {
        revenue: null,
        profit: -50,
        growth: -5,
        latest_price: null,
        PE_ratio: null,
      },
    })

    expect(result).not.toBe('INSUFFICIENT DATA')
    if (result === 'INSUFFICIENT DATA') {
      throw new Error('Expected verified analysis.')
    }
    expect(result.strengths).toContain('No clear quantitative strength can be stated from the provided data alone.')
    expect(result.risks).toContain('Revenue data is unavailable, which limits trend and margin analysis.')
    expect(result.risks).toContain('The company is loss-making based on the provided profit figure of -50.')
    expect(result.risks).toContain('Growth is negative at -5%.')
    expect(result.risks).toContain('Latest price data is unavailable.')
    expect(result.risks).toContain('P/E ratio is unavailable, which limits valuation comparison.')
  })

  test('returns INSUFFICIENT DATA when the payload cannot support meaningful claims', () => {
    const result = FinancialDataAnalysisService.analyze({
      company: 'NABIL',
      data: {
        revenue: null,
        profit: null,
        growth: null,
        latest_price: null,
        PE_ratio: null,
      },
    })

    expect(result).toBe('INSUFFICIENT DATA')
  })
})
