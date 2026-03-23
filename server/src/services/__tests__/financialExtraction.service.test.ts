describe('FinancialExtractionService helpers', () => {
  let extractFinancialMetricsFromText: any
  let normalizeFinancialNumber: any

  beforeEach(() => {
    jest.resetModules()
    ;({ extractFinancialMetricsFromText, normalizeFinancialNumber } = require('../financialExtraction.service'))
  })

  test('normalizes formatted financial values into numbers', () => {
    expect(normalizeFinancialNumber('1,234.50')).toBe(1234.5)
    expect(normalizeFinancialNumber('(250)', 'million')).toBe(-250000000)
    expect(normalizeFinancialNumber('12.5', 'crore')).toBe(125000000)
    expect(normalizeFinancialNumber('Rs. 1 500', 'lakh')).toBe(150000000)
    expect(normalizeFinancialNumber('-75.5', 'million')).toBe(-75500000)
  })

  test('extracts structured metrics from report text', () => {
    const text = `
      Revenue: NPR 1,250 million
      Net Profit: NPR 220 million
      EPS: 18.4
      Total Assets: NPR 9,500 million
      Total Liabilities: NPR 7,100 million
    `

    const result = extractFinancialMetricsFromText(text)

    expect(result).toEqual({
      revenue: 1250000000,
      profit: 220000000,
      eps: 18.4,
      assets: 9500000000,
      liabilities: 7100000000,
    })
  })

  test('extracts quarterly report metrics with mixed formatting', () => {
    const text = `
      Income from operations - Rs. 845.7 crore
      Profit after tax: (12.5) million
      Earnings per share: Rs. 4.25
      Assets: Rs. 15,400 million
      Liabilities - Rs. 11,275 million
    `

    const result = extractFinancialMetricsFromText(text)

    expect(result).toEqual({
      revenue: 8457000000,
      profit: -12500000,
      eps: 4.25,
      assets: 15400000000,
      liabilities: 11275000000,
    })
  })
})
