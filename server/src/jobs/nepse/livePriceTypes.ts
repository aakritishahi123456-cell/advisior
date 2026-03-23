export type NepseLivePriceInput = {
  symbol: string
  price: number
  change: number
  volume: bigint | null
  timestamp: Date
}

export type NepseLiveCollectorResult = {
  fetched: number
  inserted: number
  rejected: number
  anomalies: number
  timestamp: string
}
