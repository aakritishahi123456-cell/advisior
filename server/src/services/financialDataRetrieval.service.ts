import prisma from '../lib/prisma'
import { createError } from '../middleware/errorHandler'

type FinancialDataQueryInput = {
  query: string
  symbol?: string
}

type FinancialDataResponse = {
  company: string
  data: {
    revenue: number | null
    profit: number | null
    growth: number | null
    latest_price: number | null
    PE_ratio: number | null
  }
  sources: string[]
}

type CompanyMatch = {
  id: string
  symbol: string
  name: string
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase()
}

async function resolveCompany(query: string, symbol?: string): Promise<CompanyMatch> {
  if (symbol) {
    const company = await prisma.company.findUnique({
      where: { symbol: symbol.trim().toUpperCase() },
      select: { id: true, symbol: true, name: true },
    })

    if (!company) {
      throw createError(`Company not found for symbol ${symbol.trim().toUpperCase()}.`, 404)
    }

    return company
  }

  const companies = await prisma.company.findMany({
    select: { id: true, symbol: true, name: true },
  })

  const normalizedQuery = normalizeText(query)
  const tokenSet = new Set(
    normalizedQuery
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
  )

  const matches = companies.filter((company) => {
    const normalizedSymbol = normalizeText(company.symbol)
    const normalizedName = normalizeText(company.name)

    return tokenSet.has(normalizedSymbol) || normalizedQuery.includes(normalizedName)
  })

  if (matches.length === 0) {
    throw createError('No matching company was found in the internal database.', 404)
  }

  if (matches.length > 1) {
    throw createError('Query matched multiple companies. Please provide an exact symbol.', 400)
  }

  return matches[0]
}

export class FinancialDataRetrievalService {
  static async fetchRelevantFinancialData(
    input: FinancialDataQueryInput
  ): Promise<FinancialDataResponse> {
    const company = await resolveCompany(input.query, input.symbol)

    const [financials, latestPrice] = await Promise.all([
      prisma.nepseFinancial.findFirst({
        where: { symbol: company.symbol },
        orderBy: [{ asOfDate: 'desc' }, { updatedAt: 'desc' }],
        select: {
          revenue: true,
          profit: true,
          growthRate: true,
          peRatio: true,
        },
      }),
      prisma.nepsePrice.findFirst({
        where: {
          symbol: company.symbol,
          price: {
            gt: 0,
          },
        },
        orderBy: [{ timestamp: 'desc' }, { createdAt: 'desc' }],
        select: {
          price: true,
        },
      }),
    ])

    return {
      company: company.symbol,
      data: {
        revenue: financials?.revenue ?? null,
        profit: financials?.profit ?? null,
        growth: financials?.growthRate ?? null,
        latest_price: latestPrice?.price ?? null,
        PE_ratio: financials?.peRatio ?? null,
      },
      sources: [
        ...(financials ? ['financials_latest'] : []),
        ...(latestPrice ? ['nepse_price_data'] : []),
      ],
    }
  }
}
