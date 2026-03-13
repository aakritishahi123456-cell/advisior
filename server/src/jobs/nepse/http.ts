import axios, { AxiosInstance } from 'axios'
import logger from '@/utils/logger'

type NepseHttpConfig = {
  baseUrl: string
  timeoutMs: number
}

export class NepseHttpClient {
  private client: AxiosInstance
  private marketOpenPath: string
  private securityPath: string
  private dailyTradePath: string

  constructor({ baseUrl, timeoutMs }: NepseHttpConfig) {
    this.client = axios.create({
      baseURL: baseUrl.replace(/\/+$/, ''),
      timeout: timeoutMs,
      headers: {
        'User-Agent': 'FinSathi-AI/NEPSE-Collector',
        Accept: 'application/json, text/plain, */*',
      },
    })

    this.marketOpenPath = process.env.NEPSE_MARKET_OPEN_PATH || '/nepse-data/market-open'
    this.securityPath = process.env.NEPSE_SECURITY_PATH || '/security'
    this.dailyTradePath = process.env.NEPSE_DAILY_TRADE_PATH || '/securityDailyTradeStat/58'
  }

  async getMarketOpen(): Promise<boolean | null> {
    try {
      const res = await this.client.get(this.marketOpenPath)
      // Observed shapes: { isOpen: true } or { marketOpen: true } or boolean
      const data = res.data as any
      if (typeof data === 'boolean') return data
      if (data && typeof data.isOpen === 'boolean') return data.isOpen
      if (data && typeof data.marketOpen === 'boolean') return data.marketOpen
      return null
    } catch (error) {
      logger.warn({ error }, 'NEPSE market-open check failed; continuing without it')
      return null
    }
  }

  async fetchCompaniesRaw(): Promise<any> {
    const res = await this.client.get(this.securityPath, { params: { nonDelisted: true } })
    return res.data
  }

  async fetchDailyTradeRaw(businessDateISO: string): Promise<any> {
    // NEPSE “Daily Trade Stat” commonly exposes a pageable endpoint. We keep params flexible.
    const res = await this.client.post(this.dailyTradePath, null, {
      params: {
        page: 0,
        size: 5000,
        businessDate: businessDateISO,
      },
    })
    return res.data
  }
}
