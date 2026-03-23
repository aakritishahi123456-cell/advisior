import prisma from '../lib/prisma'

type RetrievedCompanyContext = {
  company: {
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
  }
  latestPrice: null | {
    date: string
    close: number | null
    open: number | null
    high: number | null
    low: number | null
    volume: string | null
  }
  recentPrices: Array<{
    date: string
    close: number | null
    volume: string | null
  }>
  recentDividends: Array<{
    fiscalYear: string
    dividendPercentage: number | null
    dividendAmount: number | null
    isBonus: boolean
    isCash: boolean
    paymentDate: string | null
  }>
  filings: Array<{
    title: string
    publishedAt: string
    documentType: string
    sourceLabel: string
    excerpt: string | null
  }>
}

export type TrustedAdvisorResult = {
  answer: string
  reasoning: string
  sources: string[]
}

function makeSourceLabel(title: string, sourceUrl?: string | null): string {
  if (sourceUrl) {
    const normalized = sourceUrl.split('?')[0]
    const parts = normalized.split('/')
    const last = parts[parts.length - 1]
    if (last) {
      return last
    }
  }

  return title
}

function trimText(value?: string | null, maxLength: number = 800): string | null {
  if (!value) {
    return null
  }

  const collapsed = value.replace(/\s+/g, ' ').trim()
  if (!collapsed) {
    return null
  }

  return collapsed.length > maxLength ? `${collapsed.slice(0, maxLength)}...` : collapsed
}

function buildStrictPrompt(question: string, context: RetrievedCompanyContext): string {
  return [
    'You are a financial analyst.',
    'Answer ONLY using provided data.',
    `If data missing say exactly: "Insufficient data".`,
    'Return strict JSON with keys: answer, reasoning, sources.',
    'Do not use outside knowledge.',
    '',
    `User question: ${question}`,
    '',
    'Provided internal data:',
    JSON.stringify(context, null, 2),
  ].join('\n')
}

function buildDeterministicAnswer(question: string, context: RetrievedCompanyContext): TrustedAdvisorResult {
  const { company, latestFinancialReport, latestPrice, recentDividends, filings } = context
  const sources = Array.from(
    new Set(
      filings.map((filing) => filing.sourceLabel).filter(Boolean).concat(
        latestFinancialReport ? [`financial_report_${latestFinancialReport.year}`] : [],
        latestPrice ? [`price_${latestPrice.date}`] : [],
        recentDividends.length > 0 ? recentDividends.map((item) => `dividend_${item.fiscalYear}`) : []
      )
    )
  )

  if (!latestFinancialReport && !latestPrice && recentDividends.length === 0 && filings.length === 0) {
    return {
      answer: 'Insufficient data',
      reasoning: 'No verified internal filings, financials, price data, or dividends were found for the requested company.',
      sources: [],
    }
  }

  const answerParts: string[] = []
  const reasoningParts: string[] = []

  answerParts.push(`Internal data for ${company.symbol} (${company.name}) is available.`)

  if (latestFinancialReport) {
    answerParts.push(
      `Latest financial report year: ${latestFinancialReport.year}, revenue ${latestFinancialReport.revenue}, net profit ${latestFinancialReport.netProfit}.`
    )
    reasoningParts.push(
      `Used financial_reports for ${latestFinancialReport.year}: revenue=${latestFinancialReport.revenue}, netProfit=${latestFinancialReport.netProfit}, totalAssets=${latestFinancialReport.totalAssets}, totalEquity=${latestFinancialReport.totalEquity}, totalDebt=${latestFinancialReport.totalDebt}.`
    )
  }

  if (latestPrice) {
    answerParts.push(
      `Latest recorded price on ${latestPrice.date}: close ${latestPrice.close ?? 'N/A'}, volume ${latestPrice.volume ?? 'N/A'}.`
    )
    reasoningParts.push(
      `Used internal price data on ${latestPrice.date} with close=${latestPrice.close ?? 'N/A'} and volume=${latestPrice.volume ?? 'N/A'}.`
    )
  }

  if (recentDividends.length > 0) {
    const latestDividend = recentDividends[0]
    answerParts.push(
      `Latest dividend record is fiscal year ${latestDividend.fiscalYear} with percentage ${latestDividend.dividendPercentage ?? 'N/A'}.`
    )
    reasoningParts.push(
      `Used dividends table record for fiscal year ${latestDividend.fiscalYear} with dividendPercentage=${latestDividend.dividendPercentage ?? 'N/A'} and dividendAmount=${latestDividend.dividendAmount ?? 'N/A'}.`
    )
  }

  if (filings.length > 0) {
    reasoningParts.push(
      `Referenced filings: ${filings.map((filing) => filing.sourceLabel).join(', ')}.`
    )
  }

  return {
    answer: answerParts.join(' '),
    reasoning: reasoningParts.length > 0 ? reasoningParts.join(' ') : `Insufficient data for question: ${question}`,
    sources,
  }
}

function getAllowedSources(context: RetrievedCompanyContext): string[] {
  return Array.from(
    new Set(
      context.filings.map((filing) => filing.sourceLabel).filter(Boolean).concat(
        context.latestFinancialReport ? [`financial_report_${context.latestFinancialReport.year}`] : [],
        context.latestPrice ? [`price_${context.latestPrice.date}`] : [],
        context.recentDividends.length > 0
          ? context.recentDividends.map((item) => `dividend_${item.fiscalYear}`)
          : []
      )
    )
  )
}

export class TrustedAdvisorService {
  private static companyCache: Array<{ id: string; symbol: string; name: string; sector: string }> | null = null

  private static async getCompanies() {
    if (!this.companyCache) {
      this.companyCache = await prisma.company.findMany({
        select: {
          id: true,
          symbol: true,
          name: true,
          sector: true,
        },
      })
    }

    return this.companyCache
  }

  static async resolveCompanyFromMessage(message: string) {
    const companies = await this.getCompanies()
    const lowered = message.toLowerCase()

    const bySymbol = companies.find((company) => {
      return lowered.includes(company.symbol.toLowerCase())
    })
    if (bySymbol) {
      return bySymbol
    }

    return (
      companies.find((company) => lowered.includes(company.name.toLowerCase())) || null
    )
  }

  static async retrieveContext(message: string): Promise<RetrievedCompanyContext | null> {
    const company = await this.resolveCompanyFromMessage(message)
    if (!company) {
      return null
    }

    const [latestFinancialReport, latestPrice, recentPrices, recentDividends, filings] = await Promise.all([
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
        },
      }),
      prisma.nepsePrice.findFirst({
        where: { symbol: company.symbol },
        orderBy: { date: 'desc' },
        select: {
          date: true,
          close: true,
          open: true,
          high: true,
          low: true,
          volume: true,
        },
      }),
      prisma.nepsePrice.findMany({
        where: { symbol: company.symbol },
        orderBy: { date: 'desc' },
        take: 5,
        select: {
          date: true,
          close: true,
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
          isBonus: true,
          isCash: true,
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
          parsedText: true,
        },
      }),
    ])

    return {
      company,
      latestFinancialReport: latestFinancialReport
        ? {
            ...latestFinancialReport,
          }
        : null,
      latestPrice: latestPrice
        ? {
            date: latestPrice.date.toISOString(),
            close: latestPrice.close,
            open: latestPrice.open,
            high: latestPrice.high,
            low: latestPrice.low,
            volume: latestPrice.volume ? latestPrice.volume.toString() : null,
          }
        : null,
      recentPrices: recentPrices.map((row) => ({
        date: row.date.toISOString(),
        close: row.close,
        volume: row.volume ? row.volume.toString() : null,
      })),
      recentDividends: recentDividends.map((row) => ({
        fiscalYear: row.fiscalYear,
        dividendPercentage: row.dividendPercentage,
        dividendAmount: row.dividendAmount,
        isBonus: row.isBonus,
        isCash: row.isCash,
        paymentDate: row.paymentDate ? row.paymentDate.toISOString() : null,
      })),
      filings: filings.map((row) => ({
        title: row.title,
        documentType: row.documentType,
        publishedAt: row.publishedAt.toISOString(),
        sourceLabel: makeSourceLabel(row.title, row.sourceUrl),
        excerpt: trimText(row.parsedText),
      })),
    }
  }

  static async answerQuestion(message: string): Promise<TrustedAdvisorResult> {
    const context = await this.retrieveContext(message)

    if (!context) {
      return {
        answer: 'Insufficient data',
        reasoning: 'No matching company was found in the verified internal database, so no internal financial data could be retrieved.',
        sources: [],
      }
    }

    const hasAnyData =
      Boolean(context.latestFinancialReport) ||
      Boolean(context.latestPrice) ||
      context.recentDividends.length > 0 ||
      context.filings.length > 0

    if (!hasAnyData) {
      return {
        answer: 'Insufficient data',
        reasoning: `Company ${context.company.symbol} was identified, but no verified internal filings, financials, price data, or dividends were available.`,
        sources: [],
      }
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return buildDeterministicAnswer(message, context)
    }

    const allowedSources = getAllowedSources(context)

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You are a financial analyst. Answer ONLY using provided data. If data missing say "Insufficient data". Return JSON with keys answer, reasoning, sources.',
          },
          {
            role: 'user',
            content: buildStrictPrompt(message, context),
          },
        ],
      }),
    })

    if (!response.ok) {
      return buildDeterministicAnswer(message, context)
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const content = data.choices?.[0]?.message?.content?.trim()

    if (!content) {
      return buildDeterministicAnswer(message, context)
    }

    try {
      const parsed = JSON.parse(content) as Partial<TrustedAdvisorResult>
      const filteredSources = Array.isArray(parsed.sources)
        ? parsed.sources
            .map((item) => String(item))
            .filter((item) => allowedSources.includes(item))
        : []

      return {
        answer: parsed.answer?.trim() || 'Insufficient data',
        reasoning: parsed.reasoning?.trim() || 'Insufficient data',
        sources: filteredSources.length > 0 ? filteredSources : allowedSources,
      }
    } catch {
      return buildDeterministicAnswer(message, context)
    }
  }
}
