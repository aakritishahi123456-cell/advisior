export type NepseCompanyInput = {
  symbol: string
  name: string
  sector: string
  listedDate?: Date | null
}

export type NepsePriceInput = {
  symbol: string
  date: Date
  open: number | null
  close: number | null
  high: number | null
  low: number | null
  volume: bigint | null
}

export type NepseFinancialInput = {
  symbol: string
  asOfDate: Date
  eps: number | null
  peRatio: number | null
  marketCap: bigint | null
  dividendYield: number | null
}

export type NepseCollectorResult = {
  businessDate: string
  companiesUpserted: number
  pricesInserted: number
  financialsUpserted: number
  source: string
}

