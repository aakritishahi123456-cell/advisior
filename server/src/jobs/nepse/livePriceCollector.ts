import { fetchNepseData } from '../../services/nepse.service'
import { NepseLiveCollectorResult } from './livePriceTypes'

export async function runNepseLivePriceCollector(): Promise<NepseLiveCollectorResult> {
  const result = await fetchNepseData()

  return {
    fetched: result.fetched,
    inserted: result.inserted,
    rejected: result.skipped,
    anomalies: result.anomalies,
    timestamp: result.timestamp,
  }
}
