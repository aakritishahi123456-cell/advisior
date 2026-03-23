import { FinancialDataRetrievalService } from './financialDataRetrieval.service'
import { FinancialDataAnalysisService } from './financialDataAnalysis.service'
import { INSUFFICIENT_DATA_MESSAGE, isFinanceScopeQuery } from './aiSafety.service'

type FinalFinancialAnswerInput = {
  query: string
  symbol?: string
}

type FinalFinancialAnswerOutput = {
  answer: string
  reasoning: string
  sources: string[]
}

export class FinalFinancialAnswerService {
  static async generate(
    input: FinalFinancialAnswerInput
  ): Promise<FinalFinancialAnswerOutput | typeof INSUFFICIENT_DATA_MESSAGE> {
    if (!isFinanceScopeQuery(input.query, input.symbol)) {
      return INSUFFICIENT_DATA_MESSAGE
    }

    try {
      const retrieval = await FinancialDataRetrievalService.fetchRelevantFinancialData(input)
      const analysis = FinancialDataAnalysisService.analyze({
        company: retrieval.company,
        data: retrieval.data,
      })

      if (analysis === 'INSUFFICIENT DATA') {
        return INSUFFICIENT_DATA_MESSAGE
      }

      const summaryParts: string[] = []

      if (analysis.strengths[0] && !analysis.strengths[0].startsWith('No clear quantitative strength')) {
        summaryParts.push(`Key strengths: ${analysis.strengths.join(' ')}`)
      }

      if (analysis.risks[0] && !analysis.risks[0].startsWith('No specific quantitative risk')) {
        summaryParts.push(`Key risks: ${analysis.risks.join(' ')}`)
      }

      if (summaryParts.length === 0) {
        return INSUFFICIENT_DATA_MESSAGE
      }

      return {
        answer: `${retrieval.company}: ${summaryParts.join(' ')}`.trim(),
        reasoning: analysis.analysis,
        sources: retrieval.sources,
      }
    } catch {
      return INSUFFICIENT_DATA_MESSAGE
    }
  }
}
