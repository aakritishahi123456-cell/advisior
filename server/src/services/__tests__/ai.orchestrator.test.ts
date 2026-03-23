jest.mock('../../services/financialDataRetrieval.service', () => ({
  FinancialDataRetrievalService: {
    fetchRelevantFinancialData: jest.fn(),
  },
}))

jest.mock('../../services/financialDataAnalysis.service', () => ({
  FinancialDataAnalysisService: {
    analyze: jest.fn(),
  },
}))

jest.mock('../../services/finalFinancialAnswer.service', () => ({
  FinalFinancialAnswerService: {
    generate: jest.fn(),
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

describe('AIOrchestrator', () => {
  let AIOrchestrator: any
  let FinancialDataRetrievalService: any
  let FinancialDataAnalysisService: any
  let FinalFinancialAnswerService: any

  beforeEach(() => {
    jest.resetModules()
    ;({ AIOrchestrator } = require('../../agents/ai.orchestrator'))
    ;({ FinancialDataRetrievalService } = require('../../services/financialDataRetrieval.service'))
    ;({ FinancialDataAnalysisService } = require('../../services/financialDataAnalysis.service'))
    ;({ FinalFinancialAnswerService } = require('../../services/finalFinancialAnswer.service'))
    jest.clearAllMocks()
  })

  test('runs the multi-agent flow end to end', async () => {
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
      analysis: 'Verified analysis.',
      strengths: ['Profitable.'],
      risks: ['Valuation should be monitored.'],
    })
    FinalFinancialAnswerService.generate.mockResolvedValue({
      answer: 'NABIL: Key strengths: Profitable. Key risks: Valuation should be monitored.',
      reasoning: 'Verified analysis.',
      sources: ['financials_latest', 'nepse_price_data'],
    })

    const result = await AIOrchestrator.run({
      query: 'Is NABIL a good investment?',
      symbol: 'NABIL',
    })

    expect(FinancialDataRetrievalService.fetchRelevantFinancialData).toHaveBeenCalledWith({
      query: 'Is NABIL a good investment?',
      symbol: 'NABIL',
    })
    expect(FinancialDataAnalysisService.analyze).toHaveBeenCalledWith({
      company: 'NABIL',
      data: {
        revenue: 1000,
        profit: 200,
        growth: 10,
        latest_price: 500,
        PE_ratio: 15,
      },
    })
    expect(FinalFinancialAnswerService.generate).toHaveBeenCalledWith({
      query: 'Is NABIL a good investment?',
      symbol: 'NABIL',
    })
    expect(result.verified).toBe(true)
    expect(result.finalOutput).toEqual({
      answer: 'NABIL: Key strengths: Profitable. Key risks: Valuation should be monitored.',
      reasoning: 'Verified analysis.',
      sources: ['financials_latest', 'nepse_price_data'],
    })
  })

  test('returns Insufficient data when validation fails', async () => {
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

    const result = await AIOrchestrator.run({
      query: 'Is NABIL a good investment?',
    })

    expect(FinalFinancialAnswerService.generate).not.toHaveBeenCalled()
    expect(result.verified).toBe(false)
    expect(result.finalOutput).toBe('No verified data available')
    expect(result.validation.reason).toContain('could not be fully supported')
  })

  test('returns Insufficient data when finance query has no resolvable company data', async () => {
    FinancialDataRetrievalService.fetchRelevantFinancialData.mockRejectedValue(new Error('No matching company'))

    const result = await AIOrchestrator.run({
      query: 'Best stock in Nepal?',
    })

    expect(FinancialDataAnalysisService.analyze).not.toHaveBeenCalled()
    expect(FinalFinancialAnswerService.generate).not.toHaveBeenCalled()
    expect(result.finalOutput).toBe('No verified data available')
    expect(result.validation.reason).toContain('could not be resolved')
  })

  test('rejects queries outside the finance scope', async () => {
    const result = await AIOrchestrator.run({
      query: 'Write me a poem about mountains.',
    })

    expect(FinancialDataRetrievalService.fetchRelevantFinancialData).not.toHaveBeenCalled()
    expect(FinancialDataAnalysisService.analyze).not.toHaveBeenCalled()
    expect(FinalFinancialAnswerService.generate).not.toHaveBeenCalled()
    expect(result.verified).toBe(false)
    expect(result.finalOutput).toBe('No verified data available')
    expect(result.validation.reason).toContain('outside the supported finance scope')
  })
})
