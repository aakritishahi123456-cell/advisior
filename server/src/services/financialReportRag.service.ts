import axios from 'axios'
import { randomUUID } from 'crypto'
import prisma from '../lib/prisma'
import { createError } from '../middleware/errorHandler'
import logger from '../utils/logger'
import { chunkPageText, splitTextIntoPages } from './documentIntelligence.service'
import { AIResponseCacheService } from './aiResponseCache.service'
import { getAIRuntimeConfig, truncateToTokenLimit } from './aiRuntime.service'

type CompanyMatch = {
  id: string
  symbol: string
  name: string
}

type IngestFinancialKnowledgeInput = {
  companyId?: string
  symbol?: string
  fileUrl?: string
  reportText?: string
  type?: string
  uploadedAt?: string | Date
  includeRatios?: boolean
  ratioYears?: number
}

type QueryFinancialKnowledgeInput = {
  company: string
  query: string
  topK?: number
  minSimilarity?: number
}

type StoredEmbedding = {
  model: string
  vector?: number[]
  terms?: Array<{ term: string; count: number }>
}

type RetrievalCandidate = {
  filingId: string
  filingType: string
  uploadedAt: Date
  pageNumber: number | null
  chunkIndex: number
  content: string
  embedding?: StoredEmbedding | null
}

type RankedChunk = RetrievalCandidate & {
  similarity: number
  lexicalScore: number
  score: number
}

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'for',
  'from',
  'has',
  'have',
  'in',
  'into',
  'is',
  'it',
  'of',
  'on',
  'or',
  'that',
  'the',
  'their',
  'there',
  'to',
  'was',
  'were',
  'what',
  'when',
  'which',
  'with',
  'year',
])

const LOCAL_EMBEDDING_DIMENSION = 128
const DEFAULT_TOP_K = 5
const DEFAULT_MIN_SIMILARITY = 0.18

function getPdfParse() {
  return require('pdf-parse')
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function normalizeChunkKey(value: string) {
  return normalizeText(value).toLowerCase()
}

export function tokenizeForRetrieval(value: string) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token))
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function hashToken(token: string) {
  let hash = 0
  for (let index = 0; index < token.length; index += 1) {
    hash = (hash * 31 + token.charCodeAt(index)) >>> 0
  }

  return hash
}

function normalizeVector(vector: number[]) {
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0))
  if (!magnitude) {
    return vector
  }

  return vector.map((value) => value / magnitude)
}

function extractTopTerms(tokens: string[]) {
  const counts = new Map<string, number>()
  for (const token of tokens) {
    counts.set(token, (counts.get(token) || 0) + 1)
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 20)
    .map(([term, count]) => ({ term, count }))
}

export function buildLocalEmbedding(text: string): StoredEmbedding {
  const tokens = tokenizeForRetrieval(text)
  const vector = new Array<number>(LOCAL_EMBEDDING_DIMENSION).fill(0)

  for (const token of tokens) {
    const bucket = hashToken(token) % LOCAL_EMBEDDING_DIMENSION
    vector[bucket] += 1
  }

  return {
    model: 'local-hash-v1',
    vector: normalizeVector(vector),
    terms: extractTopTerms(tokens),
  }
}

async function buildEmbedding(text: string): Promise<StoredEmbedding> {
  const runtime = getAIRuntimeConfig()
  const apiKey = process.env.OPENAI_API_KEY
  const boundedText = truncateToTokenLimit(text, runtime.maxInputTokens)
  if (!apiKey) {
    return buildLocalEmbedding(boundedText)
  }

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/embeddings',
      {
        model: runtime.embeddingModel,
        input: boundedText,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    )

    const vector = response.data?.data?.[0]?.embedding
    if (!Array.isArray(vector) || vector.length === 0) {
      throw new Error('Embedding response missing vector')
    }

    return {
      model: runtime.embeddingModel,
      vector: normalizeVector(vector),
      terms: extractTopTerms(tokenizeForRetrieval(boundedText)),
    }
  } catch (error) {
    logger.warn('OpenAI embedding failed. Falling back to local embedding.', {
      error: error instanceof Error ? error.message : String(error),
    })
    return buildLocalEmbedding(boundedText)
  }
}

function cosineSimilarity(left?: number[], right?: number[]) {
  if (!left || !right || left.length === 0 || right.length === 0 || left.length !== right.length) {
    return 0
  }

  let dot = 0
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index]
  }

  return dot
}

function computeLexicalScore(queryTokens: string[], chunk: RetrievalCandidate) {
  if (queryTokens.length === 0) {
    return 0
  }

  const chunkTokens = new Set(tokenizeForRetrieval(chunk.content))
  let matches = 0
  for (const token of queryTokens) {
    if (chunkTokens.has(token)) {
      matches += 1
    }
  }

  return matches / queryTokens.length
}

function formatCurrency(value?: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'N/A'
  }

  return `NPR ${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
}

function formatPercent(value?: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'N/A'
  }

  return `${value.toFixed(2)}%`
}

function safeDivide(numerator?: number | null, denominator?: number | null) {
  if (typeof numerator !== 'number' || typeof denominator !== 'number' || denominator === 0) {
    return null
  }

  return numerator / denominator
}

export function buildRatioSummaryText(input: {
  companySymbol: string
  companyName: string
  year: number
  revenue?: number | null
  netProfit?: number | null
  totalAssets?: number | null
  totalEquity?: number | null
  totalDebt?: number | null
}) {
  const profitMargin = safeDivide(input.netProfit, input.revenue)
  const roe = safeDivide(input.netProfit, input.totalEquity)
  const debtToEquity = safeDivide(input.totalDebt, input.totalEquity)

  return normalizeText(
    `${input.companyName} (${input.companySymbol}) financial ratio summary for FY${input.year}. ` +
      `Revenue ${formatCurrency(input.revenue)}. ` +
      `Net profit ${formatCurrency(input.netProfit)}. ` +
      `Total assets ${formatCurrency(input.totalAssets)}. ` +
      `Total equity ${formatCurrency(input.totalEquity)}. ` +
      `Total debt ${formatCurrency(input.totalDebt)}. ` +
      `Net profit margin ${formatPercent(profitMargin !== null ? profitMargin * 100 : null)}. ` +
      `Return on equity ${formatPercent(roe !== null ? roe * 100 : null)}. ` +
      `Debt to equity ${formatPercent(debtToEquity !== null ? debtToEquity * 100 : null)}.`
  )
}

export async function rankFinancialReportChunks(
  query: string,
  candidates: RetrievalCandidate[],
  topK = DEFAULT_TOP_K
) {
  const queryEmbedding = await buildEmbedding(query)
  const queryTokens = tokenizeForRetrieval(query)
  const uniqueCandidates: RetrievalCandidate[] = []
  const seen = new Set<string>()

  for (const candidate of candidates) {
    const key = normalizeChunkKey(candidate.content)
    if (!key || seen.has(key)) {
      continue
    }

    seen.add(key)
    uniqueCandidates.push(candidate)
  }

  const ranked = uniqueCandidates
    .map<RankedChunk>((candidate) => {
      const denseSimilarity = cosineSimilarity(queryEmbedding.vector, candidate.embedding?.vector)
      const lexicalScore = computeLexicalScore(queryTokens, candidate)
      const score = denseSimilarity * 0.8 + lexicalScore * 0.2 + (candidate.pageNumber ? 0.01 : 0)

      return {
        ...candidate,
        similarity: denseSimilarity,
        lexicalScore,
        score,
      }
    })
    .sort((left, right) => right.score - left.score || left.chunkIndex - right.chunkIndex)

  return ranked.slice(0, topK)
}

async function resolveCompany(company: string, companyId?: string): Promise<CompanyMatch> {
  if (companyId) {
    const byId = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, symbol: true, name: true },
    })

    if (!byId) {
      throw createError('Company not found for financial report ingestion.', 404)
    }

    return byId
  }

  const normalized = company.trim()
  const bySymbol = await prisma.company.findUnique({
    where: { symbol: normalized.toUpperCase() },
    select: { id: true, symbol: true, name: true },
  })

  if (bySymbol) {
    return bySymbol
  }

  const byName = await prisma.company.findFirst({
    where: {
      name: {
        equals: normalized,
        mode: 'insensitive',
      },
    },
    select: { id: true, symbol: true, name: true },
  })

  if (!byName) {
    throw createError(`Company not found for ${company}.`, 404)
  }

  return byName
}

async function downloadPdfText(fileUrl: string) {
  const response = await fetch(fileUrl)
  if (!response.ok) {
    throw createError(`Failed to download report PDF: ${response.status} ${response.statusText}`, 502)
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  const parsed = await getPdfParse()(buffer)
  const text = String(parsed.text || '')

  if (!normalizeText(text)) {
    throw createError('Unable to extract text from report PDF.', 422)
  }

  return text
}

async function upsertFilingRecord(input: {
  companyId: string
  fileUrl: string
  type: string
  uploadedAt: Date
  parsedText: string
}) {
  const existing = await prisma.filing.findFirst({
    where: {
      companyId: input.companyId,
      fileUrl: input.fileUrl,
      type: input.type,
    },
    select: { id: true },
  })

  if (existing) {
    return prisma.filing.update({
      where: { id: existing.id },
      data: {
        uploadedAt: input.uploadedAt,
        parsedText: input.parsedText.slice(0, 200_000),
      },
      select: {
        id: true,
        companyId: true,
        fileUrl: true,
        type: true,
        uploadedAt: true,
      },
    })
  }

  return prisma.filing.create({
    data: {
      companyId: input.companyId,
      fileUrl: input.fileUrl,
      type: input.type,
      uploadedAt: input.uploadedAt,
      parsedText: input.parsedText.slice(0, 200_000),
    },
    select: {
      id: true,
      companyId: true,
      fileUrl: true,
      type: true,
      uploadedAt: true,
    },
  })
}

async function replaceFilingChunks(
  filingId: string,
  chunks: Array<{ pageNumber: number | null; chunkIndex: number; content: string }>
) {
  const embeddings = await Promise.all(chunks.map((chunk) => buildEmbedding(chunk.content)))

  await prisma.$transaction([
    prisma.filingChunk.deleteMany({
      where: { filingId },
    }),
    prisma.filingChunk.createMany({
      data: chunks.map((chunk, index) => ({
        id: randomUUID(),
        filingId,
        pageNumber: chunk.pageNumber,
        chunkIndex: chunk.chunkIndex,
        content: chunk.content,
        embedding: embeddings[index] as any,
      })),
    }),
  ])
}

export class FinancialReportRagService {
  static async ingestFinancialKnowledge(input: IngestFinancialKnowledgeInput) {
    const company = await resolveCompany(input.symbol || input.companyId || '', input.companyId)
    const uploadedAt = input.uploadedAt ? new Date(input.uploadedAt) : new Date()
    const includeRatios = input.includeRatios !== false
    const type = input.type || 'ANNUAL_REPORT'
    let reportChunkCount = 0
    let ratioChunkCount = 0
    let reportFilingId: string | null = null
    let ratioFilingId: string | null = null

    if (input.fileUrl || input.reportText) {
      const rawText = input.reportText || (await downloadPdfText(input.fileUrl!))
      const pages = splitTextIntoPages(rawText)
      const sourcePages = pages.length > 0 ? pages : [{ pageNumber: 1, text: normalizeText(rawText) }]
      const deduped = new Set<string>()
      const chunkRows = sourcePages.flatMap((page) => chunkPageText(page.text, page.pageNumber, 1200))
      const uniqueChunks = chunkRows
        .map((chunk, index) => ({
          pageNumber: chunk.pageNumber,
          chunkIndex: index,
          content: normalizeText(chunk.content),
        }))
        .filter((chunk) => {
          const key = normalizeChunkKey(chunk.content)
          if (!key || deduped.has(key)) {
            return false
          }

          deduped.add(key)
          return true
        })

      if (uniqueChunks.length === 0) {
        throw createError('No report chunks were produced from the input document.', 422)
      }

      const filing = await upsertFilingRecord({
        companyId: company.id,
        fileUrl:
          input.fileUrl ||
          `inline://financial-report/${company.symbol}/${uploadedAt.toISOString()}/${type.toLowerCase()}`,
        type,
        uploadedAt,
        parsedText: rawText,
      })

      await replaceFilingChunks(filing.id, uniqueChunks)
      reportChunkCount = uniqueChunks.length
      reportFilingId = filing.id
    }

    if (includeRatios) {
      const ratioReports = await prisma.financialReport.findMany({
        where: { companyId: company.id },
        orderBy: { year: 'desc' },
        take: input.ratioYears || 5,
        select: {
          year: true,
          revenue: true,
          netProfit: true,
          totalAssets: true,
          totalEquity: true,
          totalDebt: true,
        },
      })

      if (ratioReports.length > 0) {
        const filing = await upsertFilingRecord({
          companyId: company.id,
          fileUrl: `synthetic://financial-ratios/${company.symbol}`,
          type: 'FINANCIAL_RATIO_SUMMARY',
          uploadedAt,
          parsedText: ratioReports
            .map((report) =>
              buildRatioSummaryText({
                companySymbol: company.symbol,
                companyName: company.name,
                year: report.year,
                revenue: report.revenue,
                netProfit: report.netProfit,
                totalAssets: report.totalAssets,
                totalEquity: report.totalEquity,
                totalDebt: report.totalDebt,
              })
            )
            .join('\n'),
        })

        const chunks = ratioReports.map((report, index) => ({
          pageNumber: 1,
          chunkIndex: index,
          content: buildRatioSummaryText({
            companySymbol: company.symbol,
            companyName: company.name,
            year: report.year,
            revenue: report.revenue,
            netProfit: report.netProfit,
            totalAssets: report.totalAssets,
            totalEquity: report.totalEquity,
            totalDebt: report.totalDebt,
          }),
        }))

        await replaceFilingChunks(filing.id, chunks)
        ratioChunkCount = chunks.length
        ratioFilingId = filing.id
      }
    }

    if (!reportFilingId && !ratioFilingId) {
      throw createError('Nothing to ingest. Provide a report document or ensure financial reports exist for ratio ingestion.', 400)
    }

    return {
      company: {
        id: company.id,
        symbol: company.symbol,
        name: company.name,
      },
      filings: {
        reportFilingId,
        ratioFilingId,
      },
      chunkCounts: {
        reports: reportChunkCount,
        ratios: ratioChunkCount,
        total: reportChunkCount + ratioChunkCount,
      },
    }
  }

  static async queryFinancialKnowledge(input: QueryFinancialKnowledgeInput) {
    const boundedQuery = truncateToTokenLimit(input.query)
    const cached = await AIResponseCacheService.get<Awaited<ReturnType<typeof FinancialReportRagService.queryFinancialKnowledge>>>(
      'financial-rag-query',
      { ...input, query: boundedQuery }
    )

    if (cached) {
      return cached
    }

    const company = await resolveCompany(input.company)
    const topK = input.topK || DEFAULT_TOP_K
    const minSimilarity =
      typeof input.minSimilarity === 'number' ? input.minSimilarity : DEFAULT_MIN_SIMILARITY

    const filings = await prisma.filing.findMany({
      where: { companyId: company.id },
      orderBy: [{ uploadedAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        chunks: {
          orderBy: [{ pageNumber: 'asc' }, { chunkIndex: 'asc' }],
        },
      },
    })

    const candidates: RetrievalCandidate[] = filings.flatMap((filing) =>
      filing.chunks.map((chunk) => ({
        filingId: filing.id,
        filingType: filing.type,
        uploadedAt: filing.uploadedAt,
        pageNumber: chunk.pageNumber,
        chunkIndex: chunk.chunkIndex,
        content: chunk.content,
        embedding: (chunk.embedding as StoredEmbedding | null) || buildLocalEmbedding(chunk.content),
      }))
    )

    if (candidates.length === 0) {
      const emptyResult = {
        company: {
          symbol: company.symbol,
          name: company.name,
        },
        query: boundedQuery,
        results: [],
        metadata: {
          lowSimilarity: true,
          reason: 'No indexed report chunks found for this company.',
          indexedChunkCount: 0,
        },
      }
      await AIResponseCacheService.set('financial-rag-query', { ...input, query: boundedQuery }, emptyResult)
      return emptyResult
    }

    const ranked = await rankFinancialReportChunks(boundedQuery, candidates, topK)
    const filtered = ranked.filter((chunk) => chunk.score >= minSimilarity)

    const result = {
      company: {
        symbol: company.symbol,
        name: company.name,
      },
      query: boundedQuery,
      results: filtered.map((chunk) => ({
        relevant_text: chunk.content,
        source_reference: `${company.symbol} | ${titleCase(chunk.filingType)} | Page ${chunk.pageNumber ?? 1}`,
        similarity: Number(chunk.score.toFixed(4)),
      })),
      metadata: {
        lowSimilarity: filtered.length === 0,
        indexedChunkCount: candidates.length,
        returnedChunkCount: filtered.length,
        minSimilarity,
      },
    }
    await AIResponseCacheService.set('financial-rag-query', { ...input, query: boundedQuery }, result)
    return result
  }
}
