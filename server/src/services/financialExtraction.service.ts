import prisma from '../lib/prisma'
import logger from '../utils/logger'
import { DataQualityService } from './dataQuality.service'

function getPdfParse() {
  return require('pdf-parse')
}

type ExtractionInput = {
  documentId?: string
  companyId?: string
  symbol?: string
  pdfUrl: string
  title?: string
  documentType?: string
  publishedAt?: string | Date
  year?: number
}

export type ExtractedFinancialMetrics = {
  revenue: number | null
  profit: number | null
  eps: number | null
  assets: number | null
  liabilities: number | null
}

const MULTIPLIERS: Record<string, number> = {
  thousand: 1_000,
  lakh: 100_000,
  million: 1_000_000,
  crore: 10_000_000,
  billion: 1_000_000_000,
}

const METRIC_PATTERNS: Record<keyof ExtractedFinancialMetrics, RegExp[]> = {
  revenue: [
    /(?:revenue|sales|turnover|income from operations)\s*[:\-]?\s*(?:npr|rs\.?)?\s*([-(]?\s*[0-9,.\s]+\)?)\s*(thousand|lakh|million|crore|billion)?/gi,
  ],
  profit: [
    /(?:net profit|profit after tax|net income|profit)\s*[:\-]?\s*(?:npr|rs\.?)?\s*([-(]?\s*[0-9,.\s]+\)?)\s*(thousand|lakh|million|crore|billion)?/gi,
  ],
  eps: [
    /(?:earnings per share|eps)\s*[:\-]?\s*(?:npr|rs\.?)?\s*([-(]?\s*[0-9,.\s]+\)?)/gi,
  ],
  assets: [
    /(?:total assets|assets)\s*[:\-]?\s*(?:npr|rs\.?)?\s*([-(]?\s*[0-9,.\s]+\)?)\s*(thousand|lakh|million|crore|billion)?/gi,
  ],
  liabilities: [
    /(?:total liabilities|liabilities)\s*[:\-]?\s*(?:npr|rs\.?)?\s*([-(]?\s*[0-9,.\s]+\)?)\s*(thousand|lakh|million|crore|billion)?/gi,
  ],
}

function resolveMultiplier(unit?: string): number {
  if (!unit) {
    return 1
  }

  return MULTIPLIERS[unit.toLowerCase()] || 1
}

export function normalizeFinancialNumber(rawValue: string, unit?: string): number | null {
  const trimmed = rawValue
    .trim()
    .replace(/[–—]/g, '-')
    .replace(/^(npr|rs\.?)\s*/i, '')
  if (!trimmed) {
    return null
  }

  const negative =
    trimmed.startsWith('(') && trimmed.endsWith(')') || trimmed.startsWith('-')
  const cleaned = trimmed.replace(/[(),\s-]/g, '')
  if (!cleaned) {
    return null
  }

  const parsed = Number(cleaned)
  if (!Number.isFinite(parsed)) {
    return null
  }

  const normalized = parsed * resolveMultiplier(unit)
  return negative ? normalized * -1 : normalized
}

function pickBestMetricValue(text: string, patterns: RegExp[]): number | null {
  const values: number[] = []

  for (const pattern of patterns) {
    const matches = text.matchAll(pattern)
    for (const match of matches) {
      const value = normalizeFinancialNumber(match[1], match[2])
      if (value !== null) {
        values.push(value)
      }
    }
  }

  if (values.length === 0) {
    return null
  }

  values.sort((a, b) => Math.abs(a) - Math.abs(b))
  return values[values.length - 1]
}

export function extractFinancialMetricsFromText(text: string): ExtractedFinancialMetrics {
  const normalizedText = text.replace(/\s+/g, ' ').toLowerCase()

  return {
    revenue: pickBestMetricValue(normalizedText, METRIC_PATTERNS.revenue),
    profit: pickBestMetricValue(normalizedText, METRIC_PATTERNS.profit),
    eps: pickBestMetricValue(normalizedText, METRIC_PATTERNS.eps),
    assets: pickBestMetricValue(normalizedText, METRIC_PATTERNS.assets),
    liabilities: pickBestMetricValue(normalizedText, METRIC_PATTERNS.liabilities),
  }
}

function inferYear(input: ExtractionInput): number {
  if (typeof input.year === 'number') {
    return input.year
  }

  const title = input.title || ''
  const yearFromTitle = title.match(/\b(20\d{2})\b/)
  if (yearFromTitle) {
    return Number(yearFromTitle[1])
  }

  const publishedAt = input.publishedAt ? new Date(input.publishedAt) : new Date()
  return publishedAt.getUTCFullYear()
}

async function resolveCompany(input: ExtractionInput) {
  if (input.companyId) {
    return prisma.company.findUnique({
      where: { id: input.companyId },
      select: { id: true, symbol: true, name: true },
    })
  }

  if (input.symbol) {
    return prisma.company.findUnique({
      where: { symbol: input.symbol.trim().toUpperCase() },
      select: { id: true, symbol: true, name: true },
    })
  }

  return null
}

async function findExistingDocument(input: ExtractionInput, companyId: string) {
  if (input.documentId) {
    return prisma.companyDocument.findFirst({
      where: {
        id: input.documentId,
        companyId,
      },
      select: {
        id: true,
        title: true,
        documentType: true,
        publishedAt: true,
      },
    })
  }

  if (input.pdfUrl) {
    const existingByUrl = await prisma.companyDocument.findFirst({
      where: {
        companyId,
        sourceUrl: input.pdfUrl,
      },
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        title: true,
        documentType: true,
        publishedAt: true,
      },
    })

    if (existingByUrl) {
      return existingByUrl
    }
  }

  if (!input.title) {
    return null
  }

  return prisma.companyDocument.findFirst({
    where: {
      companyId,
      title: input.title,
      documentType: input.documentType || 'ANNUAL_REPORT',
    },
    orderBy: { publishedAt: 'desc' },
    select: {
      id: true,
      title: true,
      documentType: true,
      publishedAt: true,
    },
  })
}

async function downloadPdfBuffer(pdfUrl: string): Promise<Buffer> {
  const response = await fetch(pdfUrl)
  if (!response.ok) {
    throw new Error(`Failed to download PDF: ${response.status} ${response.statusText}`)
  }

  const contentType = (response.headers.get('content-type') || '').toLowerCase()
  if (!contentType.includes('pdf') && !pdfUrl.toLowerCase().endsWith('.pdf')) {
    throw new Error('Official source did not return a PDF file')
  }

  return Buffer.from(await response.arrayBuffer())
}

export class FinancialExtractionService {
  static async ingestCompanyReport(input: ExtractionInput) {
    const company = await resolveCompany(input)
    if (!company) {
      throw new Error('Company not found for financial extraction')
    }

    const year = inferYear(input)
    const publishedAt = input.publishedAt ? new Date(input.publishedAt) : new Date()
    const pdfBuffer = await downloadPdfBuffer(input.pdfUrl)
    const parsed = await getPdfParse()(pdfBuffer)
    const extractedText = String(parsed.text || '').trim()

    if (!extractedText) {
      throw new Error('Unable to extract text from PDF')
    }

    const metrics = extractFinancialMetricsFromText(extractedText)
    const asOfDate = new Date(Date.UTC(year, 11, 31))
    const existingDocument = await findExistingDocument(input, company.id)

    const document = existingDocument
      ? await prisma.companyDocument.update({
          where: { id: existingDocument.id },
          data: {
            title: input.title || existingDocument.title,
            documentType: input.documentType || existingDocument.documentType,
            sourceUrl: input.pdfUrl,
            publishedAt,
            parsedText: extractedText.slice(0, 50_000),
          },
          select: {
            id: true,
            title: true,
            documentType: true,
            publishedAt: true,
          },
        })
      : await prisma.companyDocument.create({
          data: {
            companyId: company.id,
            title: input.title || `${company.symbol}_${year}_report.pdf`,
            documentType: input.documentType || 'ANNUAL_REPORT',
            sourceUrl: input.pdfUrl,
            publishedAt,
            parsedText: extractedText.slice(0, 50_000),
          },
          select: {
            id: true,
            title: true,
            documentType: true,
            publishedAt: true,
          },
        })

    await prisma.$transaction([
      prisma.extractedFinancialFact.deleteMany({
        where: {
          companyId: company.id,
          documentId: document.id,
        },
      }),
      prisma.extractedFinancialFact.createMany({
        data: [
          { metricName: 'Revenue', metricValue: metrics.revenue === null ? 'N/A' : String(metrics.revenue), context: 'Extracted from report text', companyId: company.id, documentId: document.id },
          { metricName: 'Net Profit', metricValue: metrics.profit === null ? 'N/A' : String(metrics.profit), context: 'Extracted from report text', companyId: company.id, documentId: document.id },
          { metricName: 'EPS', metricValue: metrics.eps === null ? 'N/A' : String(metrics.eps), context: 'Extracted from report text', companyId: company.id, documentId: document.id },
          { metricName: 'Assets', metricValue: metrics.assets === null ? 'N/A' : String(metrics.assets), context: 'Extracted from report text', companyId: company.id, documentId: document.id },
          { metricName: 'Liabilities', metricValue: metrics.liabilities === null ? 'N/A' : String(metrics.liabilities), context: 'Extracted from report text', companyId: company.id, documentId: document.id },
        ],
      }),
    ])

    const previousFinancial = await prisma.nepseFinancial.findFirst({
      where: {
        symbol: company.symbol,
        asOfDate: { lt: asOfDate },
      },
      orderBy: { asOfDate: 'desc' },
      select: { revenue: true },
    })

    const growthRate =
      metrics.revenue !== null && previousFinancial?.revenue
        ? ((metrics.revenue - previousFinancial.revenue) / previousFinancial.revenue) * 100
        : null

    const qualityResult = await DataQualityService.validateFinancialBeforeUpsert({
      companyId: company.id,
      symbol: company.symbol,
      asOfDate,
      revenue: metrics.revenue,
      profit: metrics.profit,
      eps: metrics.eps,
      assets: metrics.assets,
      liabilities: metrics.liabilities,
      growthRate,
      sourceDocument: input.title || document.title,
      source: 'OFFICIAL_PDF',
    })

    if (!qualityResult.valid) {
      throw new Error(`Financial extraction rejected by quality rules: ${qualityResult.reason}`)
    }

    const financial = await prisma.nepseFinancial.upsert({
      where: {
        symbol_asOfDate: {
          symbol: company.symbol,
          asOfDate,
        },
      },
      create: {
        symbol: company.symbol,
        asOfDate,
        revenue: metrics.revenue,
        profit: metrics.profit,
        eps: metrics.eps,
        assets: metrics.assets,
        growthRate,
        sourceDocument: input.title || document.title,
        source: 'OFFICIAL_PDF',
      },
      update: {
        revenue: metrics.revenue,
        profit: metrics.profit,
        eps: metrics.eps,
        assets: metrics.assets,
        growthRate,
        sourceDocument: input.title || document.title,
        source: 'OFFICIAL_PDF',
      },
      select: {
        symbol: true,
        asOfDate: true,
        revenue: true,
        profit: true,
        eps: true,
        assets: true,
        growthRate: true,
        sourceDocument: true,
      },
    })

    logger.info(
      {
        symbol: company.symbol,
        documentId: document.id,
        year,
        revenue: metrics.revenue,
        profit: metrics.profit,
        eps: metrics.eps,
        assets: metrics.assets,
        liabilities: metrics.liabilities,
      },
      'Structured financial report extracted'
    )

    return {
      company,
      document,
      financial,
      extractedMetrics: metrics,
    }
  }

  static async processPendingCompanyReports(limit = 10) {
    const pendingDocuments = await prisma.companyDocument.findMany({
      where: {
        sourceUrl: { not: null },
        documentType: { in: ['ANNUAL_REPORT', 'QUARTERLY_REPORT'] },
        OR: [
          { extractedFacts: { none: {} } },
          { parsedText: null },
        ],
      },
      include: {
        company: {
          select: { id: true, symbol: true },
        },
      },
      orderBy: { publishedAt: 'desc' },
      take: limit,
    })

    let processed = 0
    let failed = 0

    for (const document of pendingDocuments) {
      try {
        await this.ingestCompanyReport({
          documentId: document.id,
          companyId: document.companyId,
          symbol: document.company.symbol,
          pdfUrl: document.sourceUrl || '',
          title: document.title,
          documentType: document.documentType,
          publishedAt: document.publishedAt,
        })
        processed += 1
      } catch (error) {
        failed += 1
        logger.error(
          {
            documentId: document.id,
            symbol: document.company.symbol,
            error: error instanceof Error ? error.message : String(error),
          },
          'Failed to process company report for financial extraction'
        )
      }
    }

    return {
      scanned: pendingDocuments.length,
      processed,
      failed,
    }
  }
}
