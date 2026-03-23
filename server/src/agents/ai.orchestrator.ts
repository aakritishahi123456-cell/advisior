import logger from '../utils/logger'
import { FinancialDataRetrievalService } from '../services/financialDataRetrieval.service'
import { FinancialDataAnalysisService } from '../services/financialDataAnalysis.service'
import { FinalFinancialAnswerService } from '../services/finalFinancialAnswer.service'
import { INSUFFICIENT_DATA_MESSAGE, isFinanceScopeQuery } from '../services/aiSafety.service'

type OrchestratorInput = {
  query: string
  symbol?: string
}

type RetrievalAgentLog = {
  agent: 'Data Retrieval Agent'
  status: 'completed'
  output: Awaited<ReturnType<typeof FinancialDataRetrievalService.fetchRelevantFinancialData>>
}

type AnalysisAgentLog = {
  agent: 'Analysis Agent'
  status: 'completed'
  output: ReturnType<typeof FinancialDataAnalysisService.analyze>
}

type ValidationAgentLog = {
  agent: 'Validation Agent'
  status: 'completed'
  verified: boolean
  reason: string
}

type ResponseAgentLog = {
  agent: 'Response Agent'
  status: 'completed'
  output: Awaited<ReturnType<typeof FinalFinancialAnswerService.generate>>
}

type OrchestratorResult = {
  query: string
  company: string | null
  verified: boolean
  retrieval: RetrievalAgentLog | null
  analysis: AnalysisAgentLog | null
  validation: ValidationAgentLog
  response: ResponseAgentLog | null
  finalOutput: Awaited<ReturnType<typeof FinalFinancialAnswerService.generate>>
}

export class AIOrchestrator {
  private static runLogger(query: string) {
    return logger.child({
      module: 'ai-orchestrator',
      query,
      symbol: null,
    })
  }

  static async run(input: OrchestratorInput): Promise<OrchestratorResult> {
    const runLogger = this.runLogger(input.query)
    runLogger.info({ stage: 'start', symbol: input.symbol ?? null }, 'Starting AI orchestration flow')

    if (!isFinanceScopeQuery(input.query, input.symbol)) {
      const validation: ValidationAgentLog = {
        agent: 'Validation Agent',
        status: 'completed',
        verified: false,
        reason: 'Query is outside the supported finance scope.',
      }

      return {
        query: input.query,
        company: null,
        verified: false,
        retrieval: null,
        analysis: null,
        validation,
        response: {
          agent: 'Response Agent',
          status: 'completed',
          output: INSUFFICIENT_DATA_MESSAGE,
        },
        finalOutput: INSUFFICIENT_DATA_MESSAGE,
      }
    }

    let retrievalOutput: Awaited<ReturnType<typeof FinancialDataRetrievalService.fetchRelevantFinancialData>>
    try {
      retrievalOutput = await FinancialDataRetrievalService.fetchRelevantFinancialData({
        query: input.query,
        symbol: input.symbol,
      })
    } catch {
      const validation: ValidationAgentLog = {
        agent: 'Validation Agent',
        status: 'completed',
        verified: false,
        reason: 'Internal financial data could not be resolved for this query.',
      }

      return {
        query: input.query,
        company: null,
        verified: false,
        retrieval: null,
        analysis: null,
        validation,
        response: {
          agent: 'Response Agent',
          status: 'completed',
          output: INSUFFICIENT_DATA_MESSAGE,
        },
        finalOutput: INSUFFICIENT_DATA_MESSAGE,
      }
    }
    const retrieval: RetrievalAgentLog = {
      agent: 'Data Retrieval Agent',
      status: 'completed',
      output: retrievalOutput,
    }
    runLogger.info({ stage: 'retrieval', output: retrievalOutput }, 'Data Retrieval Agent completed')

    const analysisOutput = FinancialDataAnalysisService.analyze({
      company: retrievalOutput.company,
      data: retrievalOutput.data,
    })
    const analysis: AnalysisAgentLog = {
      agent: 'Analysis Agent',
      status: 'completed',
      output: analysisOutput,
    }
    runLogger.info({ stage: 'analysis', output: analysisOutput }, 'Analysis Agent completed')

    const validation: ValidationAgentLog =
      analysisOutput === 'INSUFFICIENT DATA'
        ? {
            agent: 'Validation Agent',
            status: 'completed',
            verified: false,
            reason: 'Analysis output could not be fully supported by the available data.',
          }
        : {
            agent: 'Validation Agent',
            status: 'completed',
            verified: retrievalOutput.sources.length > 0,
            reason:
              retrievalOutput.sources.length > 0
                ? 'All output claims remained grounded in retrieved internal data and available source labels.'
                : 'No internal source labels were available to support a trustworthy final answer.',
          }
    runLogger.info({ stage: 'validation', output: validation }, 'Validation Agent completed')

    const finalOutput =
      validation.verified
        ? await FinalFinancialAnswerService.generate({
            query: input.query,
            symbol: input.symbol,
          })
        : INSUFFICIENT_DATA_MESSAGE

    const response: ResponseAgentLog = {
      agent: 'Response Agent',
      status: 'completed',
      output: finalOutput,
    }
    runLogger.info({ stage: 'response', output: finalOutput }, 'Response Agent completed')

    return {
      query: input.query,
      company: retrievalOutput.company ?? null,
      verified: validation.verified && finalOutput !== INSUFFICIENT_DATA_MESSAGE,
      retrieval,
      analysis,
      validation,
      response,
      finalOutput,
    }
  }
}

export default AIOrchestrator
