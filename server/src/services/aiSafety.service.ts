const FINANCE_KEYWORDS = [
  'stock',
  'stocks',
  'share',
  'shares',
  'investment',
  'invest',
  'portfolio',
  'revenue',
  'profit',
  'growth',
  'price',
  'valuation',
  'pe',
  'p/e',
  'dividend',
  'equity',
  'financial',
  'finance',
  'nepse',
  'bank',
  'loan',
  'interest',
]

export const INSUFFICIENT_DATA_MESSAGE = 'No verified data available'

export function hasVerifiedFinancialData(input: {
  sources?: Array<unknown>
  lowSimilarity?: boolean
  structuredDataPoints?: number
}): boolean {
  const sourceCount = input.sources?.length || 0
  const structuredDataPoints = input.structuredDataPoints || 0

  if (input.lowSimilarity) {
    return false
  }

  return sourceCount > 0 || structuredDataPoints > 0
}

export function isFinanceScopeQuery(query: string, symbol?: string): boolean {
  if (symbol && symbol.trim().length > 0) {
    return true
  }

  const normalized = query.trim().toLowerCase()
  return FINANCE_KEYWORDS.some((keyword) => normalized.includes(keyword))
}
