import { randomUUID } from 'crypto'
import prisma from '../lib/prisma'
import { createError } from '../middleware/errorHandler'

function getPdfParse() {
  return require('pdf-parse')
}

type IngestFilingInput = {
  companyId?: string
  symbol?: string
  fileUrl: string
  type: string
  uploadedAt?: string | Date
}

type QueryFilingInput = {
  company: string
  question: string
  limit?: number
}

type CompanyMatch = {
  id: string
  symbol: string
  name: string
}

type ChunkCandidate = {
  filingId: string
  filingType: string
  uploadedAt: Date
  pageNumber: number | null
  chunkIndex: number
  content: string
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
  'in',
  'is',
  'it',
  'of',
  'on',
  'or',
  'that',
  'the',
  'to',
  'was',
  'what',
  'when',
  'which',
  'who',
  'why',
  'with',
])

function normalizeText(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function tokenize(value: string) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token))
}

function buildPseudoEmbedding(content: string) {
  const frequency = new Map<string, number>()
  for (const token of tokenize(content)) {
    frequency.set(token, (frequency.get(token) || 0) + 1)
  }

  const terms = [...frequency.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 20)
    .map(([term, count]) => ({ term, count }))

  return { terms }
}

export function splitTextIntoPages(text: string): Array<{ pageNumber: number; text: string }> {
  const normalized = text.replace(/\r/g, '')
  const rawPages = normalized.split(/\f+/).map((page) => normalizeText(page)).filter(Boolean)

  if (rawPages.length === 0) {
    return []
  }

  return rawPages.map((page, index) => ({
    pageNumber: index + 1,
    text: page,
  }))
}

export function chunkPageText(pageText: string, pageNumber: number, maxLength = 900) {
  const paragraphs = pageText
    .split(/\n{2,}|(?<=[.?!])\s+/)
    .map((part) => normalizeText(part))
    .filter(Boolean)

  const chunks: Array<{ pageNumber: number; content: string }> = []
  let current = ''

  for (const paragraph of paragraphs) {
    if (!current) {
      current = paragraph
      continue
    }

    if (`${current} ${paragraph}`.length <= maxLength) {
      current = `${current} ${paragraph}`
      continue
    }

    chunks.push({ pageNumber, content: current })
    current = paragraph
  }

  if (current) {
    chunks.push({ pageNumber, content: current })
  }

  return chunks
}

function scoreChunk(questionTokens: string[], chunk: ChunkCandidate) {
  const content = chunk.content.toLowerCase()
  let score = 0
  let matchedTerms = 0

  for (const token of questionTokens) {
    if (content.includes(token)) {
      score += 1
      matchedTerms += 1
    }
  }

  if (matchedTerms > 0 && chunk.pageNumber !== null) {
    score += 0.01
  }

  return { score, matchedTerms }
}

function formatSource(chunk: ChunkCandidate) {
  const year = chunk.uploadedAt.getUTCFullYear()
  const prettyType = chunk.filingType
    .toLowerCase()
    .split(/[_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

  return `${prettyType} ${year}, Page ${chunk.pageNumber ?? 1}`
}

function buildAnswerFromChunk(question: string, chunk: ChunkCandidate) {
  const sentences = chunk.content
    .split(/(?<=[.?!])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)

  const questionTokens = tokenize(question)
  const matchingSentences = sentences.filter((sentence) =>
    questionTokens.some((token) => sentence.toLowerCase().includes(token))
  )

  return normalizeText((matchingSentences.slice(0, 2).join(' ') || sentences.slice(0, 2).join(' ')).trim())
}

async function resolveCompany(company: string, companyId?: string): Promise<CompanyMatch> {
  if (companyId) {
    const byId = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, symbol: true, name: true },
    })

    if (!byId) {
      throw createError('Company not found for filing ingestion.', 404)
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

async function downloadPdf(fileUrl: string) {
  const response = await fetch(fileUrl)
  if (!response.ok) {
    throw createError(`Failed to download filing PDF: ${response.status} ${response.statusText}`, 502)
  }

  return Buffer.from(await response.arrayBuffer())
}

export class DocumentIntelligenceService {
  static async ingestFiling(input: IngestFilingInput) {
    const company = await resolveCompany(input.symbol || input.companyId || '', input.companyId)
    const uploadedAt = input.uploadedAt ? new Date(input.uploadedAt) : new Date()
    const pdfBuffer = await downloadPdf(input.fileUrl)
    const parsed = await getPdfParse()(pdfBuffer)
    const text = String(parsed.text || '')

    if (!normalizeText(text)) {
      throw createError('Unable to extract text from filing PDF.', 422)
    }

    const pages = splitTextIntoPages(text)
    const chunkRows = pages.flatMap((page) => chunkPageText(page.text, page.pageNumber))

    const existing = await prisma.filing.findFirst({
      where: {
        companyId: company.id,
        fileUrl: input.fileUrl,
        type: input.type,
      },
      select: { id: true },
    })

    const filing = existing
      ? await prisma.filing.update({
          where: { id: existing.id },
          data: {
            uploadedAt,
            parsedText: normalizeText(text).slice(0, 200_000),
          },
          select: {
            id: true,
            companyId: true,
            fileUrl: true,
            type: true,
            uploadedAt: true,
          },
        })
      : await prisma.filing.create({
          data: {
            companyId: company.id,
            fileUrl: input.fileUrl,
            type: input.type,
            uploadedAt,
            parsedText: normalizeText(text).slice(0, 200_000),
          },
          select: {
            id: true,
            companyId: true,
            fileUrl: true,
            type: true,
            uploadedAt: true,
          },
        })

    await prisma.$transaction([
      prisma.filingChunk.deleteMany({
        where: { filingId: filing.id },
      }),
      prisma.filingChunk.createMany({
        data: chunkRows.map((chunk, index) => ({
          id: randomUUID(),
          filingId: filing.id,
          pageNumber: chunk.pageNumber,
          chunkIndex: index,
          content: chunk.content,
          embedding: buildPseudoEmbedding(chunk.content),
        })),
      }),
    ])

    return {
      filing,
      chunkCount: chunkRows.length,
    }
  }

  static async answerFromFilings(input: QueryFilingInput) {
    const company = await resolveCompany(input.company)
    const questionTokens = tokenize(input.question)

    if (questionTokens.length === 0) {
      return {
        answer: 'Insufficient data',
        source: null,
      }
    }

    const filings = await prisma.filing.findMany({
      where: { companyId: company.id },
      orderBy: [{ uploadedAt: 'desc' }, { createdAt: 'desc' }],
      take: input.limit || 10,
      include: {
        chunks: {
          orderBy: [{ pageNumber: 'asc' }, { chunkIndex: 'asc' }],
        },
      },
    })

    const candidates: ChunkCandidate[] = filings.flatMap((filing) =>
      filing.chunks.map((chunk) => ({
        filingId: filing.id,
        filingType: filing.type,
        uploadedAt: filing.uploadedAt,
        pageNumber: chunk.pageNumber,
        chunkIndex: chunk.chunkIndex,
        content: chunk.content,
      }))
    )

    const ranked = candidates
      .map((chunk) => ({ chunk, ...scoreChunk(questionTokens, chunk) }))
      .filter((item) => item.matchedTerms > 0)
      .sort((left, right) => right.score - left.score || left.chunk.chunkIndex - right.chunk.chunkIndex)

    if (ranked.length === 0) {
      return {
        answer: 'Insufficient data',
        source: null,
      }
    }

    const top = ranked[0].chunk

    return {
      answer: buildAnswerFromChunk(input.question, top),
      source: formatSource(top),
    }
  }
}
