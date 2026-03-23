import { Prisma } from '@prisma/client'
import logger from '../utils/logger'
import { createError } from '../middleware/errorHandler'
import prisma from '../lib/prisma'

type IntelligenceRequest = {
  userId: string
  question: string
  symbol?: string
}

type SourceRecord = {
  type: string
  label: string
  source: string
  observedAt: string | null
  details: Record<string, unknown>
}

type DataAgentOutput = {
  company: null | {
    id: string
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
    createdAt: string
  }
  latestPrice: null | {
    date: string
    open: number | null
    close: number | null
    high: number | null
    low: number | null
    volume: string | null
  }
  previousPrice: null | {
    date: string
    close: number | null
  }
  recentDividends: Array<{
    fiscalYear: string
    dividendPercentage: number | null
    dividendAmount: number | null
    paymentDate: string | null
  }>
  recentFilings: Array<{
    title: string
    documentType: string
    publishedAt: string
    sourceUrl: string | null
  }>
  sources: SourceRecord[]
}

type AnalysisAgentOutput = {
  summary: string
  reasoning: string[]
  metrics: Array<{
    name: string
    value: number | null
    interpretation: string
  }>
  claims: Array<{
    statement: string
    sourceLabels: string[]
  }>
  confidence: number
}

type ValidationAgentOutput = {
  verified: boolean
  validationNotes: string[]
  missingEvidence: string[]
  approvedClaims: Array<{
    statement: string
    sourceLabels: string[]
  }>
  confidence: number
}

type ResponseAgentOutput = {
  answer: string
  reasoning: string
  sources: SourceRecord[]
  sourceSummary: string[]
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}

function toPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return 'N/A'
  }

  return `${round(value)}%`
}

function toCurrency(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return 'N/A'
  }

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(value)
}

function clampConfidence(value: number): number {
  return Math.max(0, Math.min(1, round(value)))
}

function isValidPositiveNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

export class FinancialIntelligenceOrchestrator {
  private static runLogger(runId: string) {
    return logger.child({ module: 'financial-intelligence', runId })
  }

  private static logAgentOutput(runId: string, agent: string, output: unknown) {
    this.runLogger(runId).info({ agent, output }, `${agent} completed`)
  }

  private static async resolveCompany(question: string, symbol?: string) {
    if (symbol) {
      const company = await prisma.company.findUnique({
        where: { symbol: symbol.trim().toUpperCase() },
        select: { id: true, symbol: true, name: true, sector: true },
      })

      return company
    }

    const companies = await prisma.company.findMany({
      select: { id: true, symbol: true, name: true, sector: true },
    })

    const normalizedQuestion = question.toLowerCase()
    return (
      companies.find((company) => normalizedQuestion.includes(company.symbol.toLowerCase())) ||
      companies.find((company) => normalizedQuestion.includes(company.name.toLowerCase())) ||
      null
    )
  }

  private static async runDataAgent(question: string, symbol?: string): Promise<DataAgentOutput> {
    const company = await this.resolveCompany(question, symbol)

    if (!company) {
      return {
        company: null,
        latestFinancialReport: null,
        latestPrice: null,
        previousPrice: null,
        recentDividends: [],
        recentFilings: [],
        sources: [],
      }
    }

    const [latestFinancialReport, pricePoints, recentDividends, recentFilings] = await Promise.all([
      prisma.financialReport.findFirst({
        where: { companyId: company.id },
        orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
        select: {
          year: true,
          revenue: true,
          netProfit: true,
          totalAssets: true,
          totalEquity: true,
          totalDebt: true,
          createdAt: true,
        },
      }),
      prisma.nepsePrice.findMany({
        where: { symbol: company.symbol },
        orderBy: { date: 'desc' },
        take: 2,
        select: {
          date: true,
          open: true,
          close: true,
          high: true,
          low: true,
          volume: true,
        },
      }),
      prisma.dividend.findMany({
        where: { companyId: company.id },
        orderBy: [{ paymentDate: 'desc' }, { fiscalYear: 'desc' }],
        take: 3,
        select: {
          fiscalYear: true,
          dividendPercentage: true,
          dividendAmount: true,
          paymentDate: true,
        },
      }),
      prisma.companyDocument.findMany({
        where: { companyId: company.id },
        orderBy: { publishedAt: 'desc' },
        take: 3,
        select: {
          title: true,
          documentType: true,
          publishedAt: true,
          sourceUrl: true,
        },
      }),
    ])

    const latestPrice = pricePoints[0] || null
    const previousPrice = pricePoints[1] || null

    const sources: SourceRecord[] = []

    if (latestFinancialReport) {
      sources.push({
        type: 'financial_report',
        label: `financial_report_${latestFinancialReport.year}`,
        source: `Financial report ${latestFinancialReport.year}`,
        observedAt: latestFinancialReport.createdAt.toISOString(),
        details: {
          year: latestFinancialReport.year,
          revenue: latestFinancialReport.revenue,
          netProfit: latestFinancialReport.netProfit,
          totalAssets: latestFinancialReport.totalAssets,
          totalEquity: latestFinancialReport.totalEquity,
          totalDebt: latestFinancialReport.totalDebt,
        },
      })
    }

    if (latestPrice) {
      sources.push({
        type: 'market_price',
        label: `price_${latestPrice.date.toISOString()}`,
        source: `NEPSE price snapshot ${latestPrice.date.toISOString()}`,
        observedAt: latestPrice.date.toISOString(),
        details: {
          open: latestPrice.open,
          close: latestPrice.close,
          high: latestPrice.high,
          low: latestPrice.low,
          volume: latestPrice.volume ? latestPrice.volume.toString() : null,
        },
      })
    }

    recentDividends.forEach((dividend) => {
      sources.push({
        type: 'dividend',
        label: `dividend_${dividend.fiscalYear}`,
        source: `Dividend ${dividend.fiscalYear}`,
        observedAt: dividend.paymentDate ? dividend.paymentDate.toISOString() : null,
        details: {
          fiscalYear: dividend.fiscalYear,
          dividendPercentage: dividend.dividendPercentage,
          dividendAmount: dividend.dividendAmount,
        },
      })
    })

    recentFilings.forEach((filing) => {
      sources.push({
        type: 'filing',
        label: `filing_${filing.publishedAt.toISOString()}_${filing.documentType}`,
        source: filing.sourceUrl || filing.title,
        observedAt: filing.publishedAt.toISOString(),
        details: {
          title: filing.title,
          documentType: filing.documentType,
        },
      })
    })

    return {
      company,
      latestFinancialReport: latestFinancialReport
        ? {
            ...latestFinancialReport,
            createdAt: latestFinancialReport.createdAt.toISOString(),
          }
        : null,
      latestPrice: latestPrice
        ? {
            date: latestPrice.date.toISOString(),
            open: latestPrice.open,
            close: latestPrice.close,
            high: latestPrice.high,
            low: latestPrice.low,
            volume: latestPrice.volume ? latestPrice.volume.toString() : null,
          }
        : null,
      previousPrice: previousPrice
        ? {
            date: previousPrice.date.toISOString(),
            close: previousPrice.close,
          }
        : null,
      recentDividends: recentDividends.map((dividend) => ({
        fiscalYear: dividend.fiscalYear,
        dividendPercentage: dividend.dividendPercentage,
        dividendAmount: dividend.dividendAmount,
        paymentDate: dividend.paymentDate ? dividend.paymentDate.toISOString() : null,
      })),
      recentFilings: recentFilings.map((filing) => ({
        title: filing.title,
        documentType: filing.documentType,
        publishedAt: filing.publishedAt.toISOString(),
        sourceUrl: filing.sourceUrl,
      })),
      sources,
    }
  }

  private static runAnalysisAgent(data: DataAgentOutput): AnalysisAgentOutput {
    if (!data.company) {
      return {
        summary: 'No matching company was found in the internal database.',
        reasoning: ['Data Agent could not resolve the requested company from the question or symbol.'],
        metrics: [],
        claims: [],
        confidence: 0.2,
      }
    }

    const reasoning: string[] = []
    const metrics: AnalysisAgentOutput['metrics'] = []
    const claims: AnalysisAgentOutput['claims'] = []

    let confidence = 0.35

    if (data.latestFinancialReport) {
      const { revenue, netProfit, totalAssets, totalEquity, totalDebt, year } = data.latestFinancialReport
      const netMargin = revenue ? (netProfit / revenue) * 100 : null
      const debtToEquity = totalEquity ? totalDebt / totalEquity : null
      const returnOnAssets = totalAssets ? (netProfit / totalAssets) * 100 : null

      metrics.push(
        {
          name: 'Net profit margin',
          value: netMargin,
          interpretation:
            netMargin !== null && netMargin >= 15
              ? 'Healthy profitability'
              : 'Profitability is present but not strong',
        },
        {
          name: 'Debt to equity',
          value: debtToEquity,
          interpretation:
            debtToEquity !== null && debtToEquity <= 1
              ? 'Leverage appears manageable'
              : 'Leverage may need closer review',
        },
        {
          name: 'Return on assets',
          value: returnOnAssets,
          interpretation:
            returnOnAssets !== null && returnOnAssets >= 5
              ? 'Assets are generating useful returns'
              : 'Asset efficiency looks modest',
        }
      )

      reasoning.push(
        `${data.company.symbol} reported revenue of ${toCurrency(revenue)} and net profit of ${toCurrency(netProfit)} in ${year}.`,
        `Calculated net profit margin is ${toPercent(netMargin)} and debt-to-equity is ${debtToEquity !== null ? round(debtToEquity).toString() : 'N/A'}.`
      )

      claims.push(
        {
          statement: `${data.company.symbol} remained profitable in ${year}.`,
          sourceLabels: [`financial_report_${year}`],
        },
        {
          statement: `${data.company.symbol} posted a net profit margin of ${toPercent(netMargin)} in ${year}.`,
          sourceLabels: [`financial_report_${year}`],
        }
      )

      confidence += 0.25
    }

    if (isValidPositiveNumber(data.latestPrice?.close)) {
      const latestClose = data.latestPrice.close
      const previousClose = data.previousPrice?.close ?? null
      const priceChange =
        isValidPositiveNumber(previousClose) ? ((latestClose - previousClose) / previousClose) * 100 : null

      metrics.push({
        name: 'Latest price change',
        value: priceChange,
        interpretation:
          priceChange === null
            ? 'Only one price point is available'
            : priceChange >= 0
              ? 'Recent market move is positive'
              : 'Recent market move is negative',
      })

      reasoning.push(
        priceChange === null
          ? `Latest close was ${toCurrency(latestClose)}, but a comparison point was unavailable.`
          : `Latest close was ${toCurrency(latestClose)}, a ${toPercent(priceChange)} move versus the previous stored session.`
      )

      claims.push({
        statement:
          priceChange === null
            ? `${data.company.symbol} has a latest stored close price of ${toCurrency(latestClose)}.`
            : `${data.company.symbol} moved ${toPercent(priceChange)} between the last two stored sessions.`,
        sourceLabels: [data.latestPrice ? `price_${data.latestPrice.date}` : ''],
      })

      confidence += 0.2
    } else if (data.latestPrice) {
      reasoning.push(
        'Latest market price data was excluded from analysis because the stored close price was missing or invalid.'
      )
    }

    if (data.recentDividends.length > 0) {
      const latestDividend = data.recentDividends[0]
      reasoning.push(
        `Latest dividend record is for fiscal year ${latestDividend.fiscalYear} with dividend percentage ${latestDividend.dividendPercentage ?? 'N/A'}.`
      )
      claims.push({
        statement: `${data.company.symbol} has at least one stored dividend record for ${latestDividend.fiscalYear}.`,
        sourceLabels: [`dividend_${latestDividend.fiscalYear}`],
      })
      confidence += 0.1
    }

    if (data.recentFilings.length > 0) {
      reasoning.push(
        `Recent filings are available, including ${data.recentFilings
          .map((filing) => filing.title)
          .slice(0, 2)
          .join(' and ')}.`
      )
      confidence += 0.1
    }

    return {
      summary:
        reasoning.length > 0
          ? `Analysis Agent found a grounded internal view for ${data.company.symbol}.`
          : `Analysis Agent found only limited evidence for ${data.company.symbol}.`,
      reasoning,
      metrics,
      claims: claims.map((claim) => ({
        ...claim,
        sourceLabels: claim.sourceLabels.filter(Boolean),
      })),
      confidence: clampConfidence(confidence),
    }
  }

  private static runValidationAgent(
    data: DataAgentOutput,
    analysis: AnalysisAgentOutput
  ): ValidationAgentOutput {
    const availableLabels = new Set(data.sources.map((source) => source.label))
    const validationNotes: string[] = []
    const missingEvidence: string[] = []

    const approvedClaims = analysis.claims.filter((claim) => {
      const supported = claim.sourceLabels.every((label) => availableLabels.has(label))
      if (!supported) {
        missingEvidence.push(claim.statement)
      }
      return supported
    })

    if (data.company) {
      validationNotes.push(`Validated company resolution for ${data.company.symbol}.`)
    } else {
      validationNotes.push('No company could be resolved, so downstream reasoning remains low confidence.')
    }

    if (analysis.metrics.length === 0) {
      validationNotes.push('No quantitative metrics were available to validate.')
    } else {
      validationNotes.push(`Validated ${analysis.metrics.length} computed metrics against stored database fields.`)
    }

    if (data.latestPrice && !isValidPositiveNumber(data.latestPrice.close)) {
      validationNotes.push('Invalid stock price data was detected and excluded from the final answer.')
    }

    if (missingEvidence.length > 0) {
      validationNotes.push(`${missingEvidence.length} claim(s) were excluded because source coverage was incomplete.`)
    } else {
      validationNotes.push('All response claims are backed by at least one stored source record.')
    }

    let confidence = analysis.confidence
    if (missingEvidence.length > 0) {
      confidence -= 0.2
    }
    if (!data.latestFinancialReport) {
      confidence -= 0.15
    }

    return {
      verified: missingEvidence.length === 0 && Boolean(data.company),
      validationNotes,
      missingEvidence,
      approvedClaims,
      confidence: clampConfidence(confidence),
    }
  }

  private static runResponseAgent(
    data: DataAgentOutput,
    analysis: AnalysisAgentOutput,
    validation: ValidationAgentOutput
  ): ResponseAgentOutput {
    if (!data.company) {
      return {
        answer: 'Insufficient data: no matching company was found in the internal financial database.',
        reasoning: validation.validationNotes.join(' '),
        sources: [],
        sourceSummary: [],
      }
    }

    const approvedSourceLabels = new Set(validation.approvedClaims.flatMap((claim) => claim.sourceLabels))
    const sources = data.sources.filter((source) => approvedSourceLabels.has(source.label))

    const answerSections = [
      `Financial intelligence summary for ${data.company.symbol} (${data.company.name}): ${analysis.summary}`,
      validation.approvedClaims.length > 0
        ? validation.approvedClaims.map((claim) => claim.statement).join(' ')
        : 'The system found company records, but validated conclusions are limited.',
    ]

    const reasoning = [...analysis.reasoning, ...validation.validationNotes].join(' ')

    return {
      answer: answerSections.join(' '),
      reasoning,
      sources,
      sourceSummary: sources.map((source) => `${source.label}: ${source.source}`),
    }
  }

  static async runFinancialQuery(input: IntelligenceRequest) {
    const runId = `fi_${Date.now()}`
    const query = await prisma.researchQuery.create({
      data: {
        userId: input.userId,
        queryText: input.question,
        status: 'RUNNING',
      },
    })

    try {
      const data = await this.runDataAgent(input.question, input.symbol)
      this.logAgentOutput(runId, 'Data Agent', data)

      const analysis = this.runAnalysisAgent(data)
      this.logAgentOutput(runId, 'Analysis Agent', analysis)

      const validation = this.runValidationAgent(data, analysis)
      this.logAgentOutput(runId, 'Validation Agent', validation)

      const response = this.runResponseAgent(data, analysis, validation)
      this.logAgentOutput(runId, 'Response Agent', response)

      const answerRecord = await prisma.researchAnswer.create({
        data: {
          queryId: query.id,
          answerText: response.answer,
          confidenceScore: validation.confidence,
          reasoningChain: {
            runId,
            agents: {
              data,
              analysis,
              validation,
              response,
            },
          } as Prisma.InputJsonValue,
          citations: response.sources as unknown as Prisma.InputJsonValue,
        },
      })

      await prisma.researchQuery.update({
        where: { id: query.id },
        data: { status: 'COMPLETED' },
      })

      return {
        queryId: query.id,
        answerId: answerRecord.id,
        runId,
        company: data.company,
        answer: response.answer,
        reasoning: response.reasoning,
        sources: response.sources,
        sourceSummary: response.sourceSummary,
        confidence: validation.confidence,
        verified: validation.verified,
        agentLogs: {
          data,
          analysis,
          validation,
          response,
        },
      }
    } catch (error) {
      await prisma.researchQuery.update({
        where: { id: query.id },
        data: { status: 'FAILED' },
      })

      const message = error instanceof Error ? error.message : 'Unknown orchestration failure'
      this.runLogger(runId).error({ error: message }, 'Financial intelligence workflow failed')
      throw createError(message, 500)
    }
  }
}
