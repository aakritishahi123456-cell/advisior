import prisma from '../lib/prisma'
import { createError } from '../middleware/errorHandler'
import logger from '../utils/logger'
import { FinancialReportRagService } from './financialReportRag.service'
import { INSUFFICIENT_DATA_MESSAGE, hasVerifiedFinancialData } from './aiSafety.service'
import { AIResponseCacheService } from './aiResponseCache.service'
import { truncateToTokenLimit } from './aiRuntime.service'

type CompanyMatch = {
  id: string
  symbol: string
  name: string
  sector: string
}

type MultiAgentInput = {
  query: string
  company?: string
}

type RetrievalAgentOutput = {
  company: {
    symbol: string
    name: string
    sector: string
  }
  latestFinancialReport: null | {
    year: number
    revenue: number
    netProfit: number
    totalAssets: number
    totalEquity: number
    totalDebt: number
  }
  retrievedChunks: Array<{
    relevant_text: string
    source_reference: string
    similarity: number
  }>
  lowSimilarity: boolean
}

type FinancialAnalystOutput = {
  ratioAnalysis: Array<{
    metric: string
    value: string
    interpretation: string
  }>
  growthSignals: string[]
  risks: string[]
  summary: string
}

type RiskAgentOutput = {
  redFlags: string[]
  riskLevel: 'low' | 'medium' | 'high'
  rationale: string
}

type ExplanationAgentOutput = {
  plainLanguageSummary: string
  keyPoints: string[]
}

type MultiAgentResult = {
  final_answer: string
  company: {
    symbol: string
    name: string
    sector: string
  }
  agents: {
    retrieval: RetrievalAgentOutput
    financial_analyst: FinancialAnalystOutput
    risk: RiskAgentOutput
    explanation: ExplanationAgentOutput
  }
  sources: Array<{
    relevant_text: string
    source_reference: string
    similarity: number
  }>
}

function round(value: number) {
  return Math.round(value * 100) / 100
}

function formatCurrency(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 'N/A'
  }

  return `NPR ${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
}

function formatRatio(value: number | null | undefined, suffix = '') {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 'N/A'
  }

  return `${round(value)}${suffix}`
}

function safeDivide(numerator: number | null | undefined, denominator: number | null | undefined) {
  if (typeof numerator !== 'number' || typeof denominator !== 'number' || denominator === 0) {
    return null
  }

  return numerator / denominator
}

export class MultiAgentFinancialSystemService {
  private static runLogger(query: string) {
    return logger.child({ module: 'multi-agent-financial-system', query })
  }

  private static async resolveCompany(company?: string, query?: string): Promise<CompanyMatch> {
    const normalizedCompany = company?.trim()

    if (normalizedCompany) {
      const bySymbol = await prisma.company.findUnique({
        where: { symbol: normalizedCompany.toUpperCase() },
        select: { id: true, symbol: true, name: true, sector: true },
      })

      if (bySymbol) {
        return bySymbol
      }

      const byName = await prisma.company.findFirst({
        where: {
          name: {
            equals: normalizedCompany,
            mode: 'insensitive',
          },
        },
        select: { id: true, symbol: true, name: true, sector: true },
      })

      if (byName) {
        return byName
      }
    }

    if (!query) {
      throw createError('Company could not be resolved.', 404)
    }

    const companies = await prisma.company.findMany({
      select: { id: true, symbol: true, name: true, sector: true },
    })
    const normalizedQuery = query.toLowerCase()
    const matched =
      companies.find((item) => normalizedQuery.includes(item.symbol.toLowerCase())) ||
      companies.find((item) => normalizedQuery.includes(item.name.toLowerCase()))

    if (!matched) {
      throw createError('Company could not be resolved from the query.', 404)
    }

    return matched
  }

  private static async runRetrievalAgent(input: MultiAgentInput): Promise<RetrievalAgentOutput> {
    const company = await this.resolveCompany(input.company, input.query)
    const latestFinancialReport = await prisma.financialReport.findFirst({
      where: { companyId: company.id },
      orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
      select: {
        year: true,
        revenue: true,
        netProfit: true,
        totalAssets: true,
        totalEquity: true,
        totalDebt: true,
      },
    })

    const rag = await FinancialReportRagService.queryFinancialKnowledge({
      company: company.symbol,
      query: input.query,
      topK: 5,
    })

    return {
      company: {
        symbol: company.symbol,
        name: company.name,
        sector: company.sector,
      },
      latestFinancialReport,
      retrievedChunks: rag.results,
      lowSimilarity: rag.metadata.lowSimilarity,
    }
  }

  private static runFinancialAnalystAgent(retrieval: RetrievalAgentOutput): FinancialAnalystOutput {
    const report = retrieval.latestFinancialReport

    if (!report) {
      return {
        ratioAnalysis: [],
        growthSignals: [],
        risks: ['No structured financial report is available for ratio analysis.'],
        summary: 'Financial Analyst Agent had no structured report data to analyze.',
      }
    }

    const netMargin = safeDivide(report.netProfit, report.revenue)
    const roe = safeDivide(report.netProfit, report.totalEquity)
    const debtToEquity = safeDivide(report.totalDebt, report.totalEquity)
    const assetIntensity = safeDivide(report.totalAssets, report.revenue)

    const ratioAnalysis = [
      {
        metric: 'Net profit margin',
        value: formatRatio(netMargin !== null ? netMargin * 100 : null, '%'),
        interpretation:
          netMargin !== null && netMargin >= 0.15
            ? 'Strong profitability from revenue.'
            : 'Profitability exists but is not especially strong.',
      },
      {
        metric: 'Return on equity',
        value: formatRatio(roe !== null ? roe * 100 : null, '%'),
        interpretation:
          roe !== null && roe >= 0.15 ? 'Equity is generating solid returns.' : 'Returns on equity are modest.',
      },
      {
        metric: 'Debt to equity',
        value: formatRatio(debtToEquity, 'x'),
        interpretation:
          debtToEquity !== null && debtToEquity <= 1 ? 'Leverage looks manageable.' : 'Leverage appears elevated.',
      },
      {
        metric: 'Assets to revenue',
        value: formatRatio(assetIntensity, 'x'),
        interpretation:
          assetIntensity !== null && assetIntensity <= 5
            ? 'Asset base is not unusually heavy relative to revenue.'
            : 'Revenue generation may be asset-heavy.',
      },
    ]

    const growthSignals: string[] = []
    const risks: string[] = []

    if (report.netProfit > 0) {
      growthSignals.push(`The company is profitable in FY${report.year} with net profit of ${formatCurrency(report.netProfit)}.`)
    }

    if (netMargin !== null && netMargin > 0.1) {
      growthSignals.push(`Net margin of ${formatRatio(netMargin * 100, '%')} suggests healthy earnings conversion.`)
    }

    if (retrieval.retrievedChunks.some((chunk) => /growth|increased|improved|expanded/i.test(chunk.relevant_text))) {
      growthSignals.push('Retrieved report evidence mentions operational growth or improvement.')
    }

    if (debtToEquity !== null && debtToEquity > 1) {
      risks.push(`Debt to equity of ${formatRatio(debtToEquity, 'x')} indicates leverage pressure.`)
    }

    if (netMargin !== null && netMargin < 0.05) {
      risks.push(`Net profit margin of ${formatRatio(netMargin * 100, '%')} is thin.`)
    }

    if (retrieval.lowSimilarity) {
      risks.push('Report retrieval returned low-similarity evidence, so document support is weak.')
    }

    return {
      ratioAnalysis,
      growthSignals,
      risks,
      summary: `${retrieval.company.symbol} FY${report.year} analysis reviewed profitability, leverage, and report evidence.`,
    }
  }

  private static runRiskAgent(
    retrieval: RetrievalAgentOutput,
    analyst: FinancialAnalystOutput
  ): RiskAgentOutput {
    const redFlags = [...analyst.risks]

    if (retrieval.retrievedChunks.length === 0) {
      redFlags.push('No relevant report chunks were retrieved for the user query.')
    }

    if (retrieval.retrievedChunks.some((chunk) => /litigation|default|non-performing|impairment|decline|loss/i.test(chunk.relevant_text))) {
      redFlags.push('Retrieved documents contain language associated with financial stress or deterioration.')
    }

    const riskLevel: 'low' | 'medium' | 'high' =
      redFlags.length >= 3 ? 'high' : redFlags.length >= 1 ? 'medium' : 'low'

    return {
      redFlags,
      riskLevel,
      rationale:
        riskLevel === 'high'
          ? 'Multiple quantitative or retrieval-quality issues were detected.'
          : riskLevel === 'medium'
            ? 'Some caution signals were detected, but not enough for a high-risk assessment.'
            : 'No material red flags were detected from the available report data.',
    }
  }

  private static runExplanationAgent(
    retrieval: RetrievalAgentOutput,
    analyst: FinancialAnalystOutput,
    risk: RiskAgentOutput
  ): ExplanationAgentOutput {
    const hasVerifiedData = hasVerifiedFinancialData({
      sources: retrieval.retrievedChunks,
      lowSimilarity: retrieval.lowSimilarity,
      structuredDataPoints: retrieval.latestFinancialReport ? 1 : 0,
    })

    if (!hasVerifiedData) {
      return {
        plainLanguageSummary: INSUFFICIENT_DATA_MESSAGE,
        keyPoints: [INSUFFICIENT_DATA_MESSAGE],
      }
    }

    const latestReport = retrieval.latestFinancialReport
    const keyPoints = [
      latestReport
        ? `${retrieval.company.symbol} reported ${formatCurrency(latestReport.revenue)} revenue and ${formatCurrency(latestReport.netProfit)} net profit in FY${latestReport.year}.`
        : 'The system could not find a structured annual financial report for this company.',
      analyst.growthSignals[0] || 'No strong growth signal was confirmed from the retrieved data.',
      risk.redFlags[0] || 'No major red flag was found in the analyzed report data.',
    ]

    const plainLanguageSummary = `${retrieval.company.name} was analyzed using report retrieval, ratio review, and risk checks. ${
      keyPoints.join(' ')
    } Overall risk is ${risk.riskLevel}.`

    return {
      plainLanguageSummary,
      keyPoints,
    }
  }

  static async run(input: MultiAgentInput): Promise<MultiAgentResult> {
    const boundedInput = {
      ...input,
      query: truncateToTokenLimit(input.query),
    }

    const cached = await AIResponseCacheService.get<MultiAgentResult>('multi-agent-financial', boundedInput)
    if (cached) {
      return cached
    }

    const runLogger = this.runLogger(boundedInput.query)
    const retrieval = await this.runRetrievalAgent(boundedInput)
    runLogger.info({ agent: 'Retrieval Agent', output: retrieval }, 'Retrieval Agent completed')

    const financialAnalyst = this.runFinancialAnalystAgent(retrieval)
    runLogger.info({ agent: 'Financial Analyst Agent', output: financialAnalyst }, 'Financial Analyst Agent completed')

    const risk = this.runRiskAgent(retrieval, financialAnalyst)
    runLogger.info({ agent: 'Risk Agent', output: risk }, 'Risk Agent completed')

    const explanation = this.runExplanationAgent(retrieval, financialAnalyst, risk)
    runLogger.info({ agent: 'Explanation Agent', output: explanation }, 'Explanation Agent completed')

    const result = {
      final_answer: explanation.plainLanguageSummary,
      company: retrieval.company,
      agents: {
        retrieval,
        financial_analyst: financialAnalyst,
        risk,
        explanation,
      },
      sources: explanation.plainLanguageSummary === INSUFFICIENT_DATA_MESSAGE ? [] : retrieval.retrievedChunks,
    }
    await AIResponseCacheService.set('multi-agent-financial', boundedInput, result)
    return result
  }
}
