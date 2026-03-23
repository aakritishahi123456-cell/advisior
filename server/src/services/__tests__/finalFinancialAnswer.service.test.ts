jest.mock('../financialDataRetrieval.service', () => ({
  FinancialDataRetrievalService: {
    fetchRelevantFinancialData: jest.fn(),
  },
}))

jest.mock('../financialDataAnalysis.service', () => ({
  FinancialDataAnalysisService: {
    analyze: jest.fn(),
  },
}))

describe('FinalFinancialAnswerService', () => {
  let FinalFinancialAnswerService: any
  let FinancialDataRetrievalService: any
  let FinancialDataAnalysisService: any

  beforeEach(() => {
    jest.resetModules()
    ;({ FinalFinancialAnswerService } = require('../finalFinancialAnswer.service'))
    ;({ FinancialDataRetrievalService } = require('../financialDataRetrieval.service'))
    ;({ FinancialDataAnalysisService } = require('../financialDataAnalysis.service'))
    jest.clearAllMocks()
  })

  test('returns explainable final answer with reasoning and sources', async () => {
    FinancialDataRetrievalService.fetchRelevantFinancialData.mockResolvedValue({
      company: 'NABIL',
      data: {
        revenue: 1000,
        profit: 200,
        growth: 10,
        latest_price: 500,
        PE_ratio: 15,
      },
      sources: ['financials_latest', 'nepse_price_data'],
    })
    FinancialDataAnalysisService.analyze.mockReturnValue({
      analysis: 'Reported revenue is 1,000. Reported profit is 200. Calculated profit margin is 20%.',
      strengths: ['The company is profitable based on the provided profit figure of 200.'],
      risks: ['Growth is negative at -5%.'],
    })

    const result = await FinalFinancialAnswerService.generate({ query: 'Is NABIL a good investment?' })

    expect(result).toEqual({
      answer:
        'NABIL: Key strengths: The company is profitable based on the provided profit figure of 200. Key risks: Growth is negative at -5%.',
      reasoning:
        'Reported revenue is 1,000. Reported profit is 200. Calculated profit margin is 20%.',
      sources: ['financials_latest', 'nepse_price_data'],
    })
  })

  test('does not hallucinate for broad unsupported questions like "Best stock in Nepal?"', async () => {
    FinancialDataRetrievalService.fetchRelevantFinancialData.mockRejectedValue(new Error('No matching company'))

    const result = await FinalFinancialAnswerService.generate({ query: 'Best stock in Nepal?' })

    expect(result).toBe('Insufficient data')
  })

  test('uses internal DB-backed data for "NABIL growth?" queries', async () => {
    FinancialDataRetrievalService.fetchRelevantFinancialData.mockResolvedValue({
      company: 'NABIL',
      data: {
        revenue: 1000,
        profit: 200,
        growth: 12,
        latest_price: 500,
        PE_ratio: 15,
      },
      sources: ['financials_latest', 'nepse_price_data'],
    })
    FinancialDataAnalysisService.analyze.mockReturnValue({
      analysis: 'Reported growth is 12%.',
      strengths: ['Growth is positive at 12%.'],
      risks: ['No specific quantitative risk is visible in the provided fields alone.'],
    })

    const result = await FinalFinancialAnswerService.generate({ query: 'NABIL growth?' })

    expect(FinancialDataRetrievalService.fetchRelevantFinancialData).toHaveBeenCalledWith({
      query: 'NABIL growth?',
    })
    expect(result).toEqual({
      answer: 'NABIL: Key strengths: Growth is positive at 12%.',
      reasoning: 'Reported growth is 12%.',
      sources: ['financials_latest', 'nepse_price_data'],
    })
  })

  test('returns Insufficient data when verified analysis is unavailable', async () => {
    FinancialDataRetrievalService.fetchRelevantFinancialData.mockResolvedValue({
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
    FinancialDataAnalysisService.analyze.mockReturnValue('INSUFFICIENT DATA')

    const result = await FinalFinancialAnswerService.generate({ query: 'Is NABIL a good investment?' })

    expect(result).toBe('Insufficient data')
  })

  test('returns Insufficient data for out-of-scope questions', async () => {
    const result = await FinalFinancialAnswerService.generate({ query: 'What is the capital of Nepal?' })

    expect(FinancialDataRetrievalService.fetchRelevantFinancialData).not.toHaveBeenCalled()
    expect(result).toBe('Insufficient data')
  })

  test('returns Insufficient data when structured data is removed', async () => {
    FinancialDataRetrievalService.fetchRelevantFinancialData.mockResolvedValue({
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
    FinancialDataAnalysisService.analyze.mockReturnValue('INSUFFICIENT DATA')

    const result = await FinalFinancialAnswerService.generate({ query: 'NABIL growth?' })

    expect(result).toBe('Insufficient data')
  })
})
