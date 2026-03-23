import { Prisma } from '@prisma/client'
import prisma from '../lib/prisma'

type LiveMarketRow = {
  symbol: string
  price: number
  change: number
  volume: bigint | null
  timestamp: Date
}

export async function getLiveMarketData(symbols?: string[]): Promise<LiveMarketRow[]> {
  const hasSymbols = Array.isArray(symbols) && symbols.length > 0

  if (hasSymbols) {
    return prisma.$queryRaw<LiveMarketRow[]>`
      WITH ranked_prices AS (
        SELECT
          s.symbol,
          p.price::float8 AS price,
          p.change_value::float8 AS change,
          p.volume,
          p."timestamp",
          ROW_NUMBER() OVER (
            PARTITION BY p.stock_id
            ORDER BY p."timestamp" DESC, p.created_at DESC, p.id DESC
          ) AS row_num
        FROM prices p
        INNER JOIN stocks s ON s.id = p.stock_id
        WHERE s.symbol IN (${Prisma.join(symbols as string[])})
      )
      SELECT symbol, price, change, volume, "timestamp"
      FROM ranked_prices
      WHERE row_num = 1
      ORDER BY symbol ASC
    `
  }

  return prisma.$queryRaw<LiveMarketRow[]>`
    WITH ranked_prices AS (
      SELECT
        s.symbol,
        p.price::float8 AS price,
        p.change_value::float8 AS change,
        p.volume,
        p."timestamp",
        ROW_NUMBER() OVER (
          PARTITION BY p.stock_id
          ORDER BY p."timestamp" DESC, p.created_at DESC, p.id DESC
        ) AS row_num
      FROM prices p
      INNER JOIN stocks s ON s.id = p.stock_id
    )
    SELECT symbol, price, change, volume, "timestamp"
    FROM ranked_prices
    WHERE row_num = 1
    ORDER BY symbol ASC
  `
}
