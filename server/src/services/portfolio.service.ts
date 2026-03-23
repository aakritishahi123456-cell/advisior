import { Prisma } from '@prisma/client'
import prisma from '../lib/prisma'
import logger from '../utils/logger'

type PriceSnapshotRow = {
  stockId: string
  price: number
  rowNum: number
  timestamp: Date
}

type PortfolioItemSummary = {
  symbol: string
  quantity: number
  buyPrice: number
  currentPrice: number
  currentValue: number
  profitLoss: number
  dailyChange: number
  dailyChangePercent: number
  isActive: boolean
  inactiveReason: string | null
}

type UserPortfolioSummary = {
  totalValue: number
  totalInvestment: number
  totalProfitLoss: number
  dailyChange: number
  dailyChangePercent: number
  activeItems: number
  inactiveItems: number
  items: PortfolioItemSummary[]
}

export class PortfolioService {
  async getUserPortfolio(userId: string): Promise<UserPortfolioSummary> {
    const portfolio = await prisma.portfolio.findUnique({
      where: { userId },
      include: {
        items: {
          where: {
            quantity: {
              gt: 0,
            },
          },
          include: {
            stock: true,
          },
          orderBy: {
            stock: {
              symbol: 'asc',
            },
          },
        },
      },
    })

    if (!portfolio || portfolio.items.length === 0) {
      return {
        totalValue: 0,
        totalInvestment: 0,
        totalProfitLoss: 0,
        dailyChange: 0,
        dailyChangePercent: 0,
        activeItems: 0,
        inactiveItems: 0,
        items: [],
      }
    }

    const stockIds = portfolio.items.map((item) => item.stockId)
    const priceSnapshots = await prisma.$queryRaw<PriceSnapshotRow[]>`
      WITH ranked_prices AS (
        SELECT
          p.stock_id AS "stockId",
          p.price::float8 AS price,
          p."timestamp" AS timestamp,
          ROW_NUMBER() OVER (
            PARTITION BY p.stock_id
            ORDER BY p."timestamp" DESC, p.created_at DESC, p.id DESC
          ) AS "rowNum"
        FROM prices p
        WHERE p.stock_id IN (${Prisma.join(stockIds)})
      )
      SELECT "stockId", price, "rowNum", timestamp
      FROM ranked_prices
      WHERE "rowNum" <= 2
    `

    const priceMap = new Map<string, { currentPrice: number; yesterdayPrice: number | null }>()
    const latestTimestampByStockId = new Map<string, Date>()
    for (const row of priceSnapshots) {
      const snapshot = priceMap.get(row.stockId) ?? {
        currentPrice: 0,
        yesterdayPrice: null,
      }

      if (row.rowNum === 1) {
        snapshot.currentPrice = row.price
        latestTimestampByStockId.set(row.stockId, row.timestamp)
      }

      if (row.rowNum === 2) {
        snapshot.yesterdayPrice = row.price
      }

      priceMap.set(row.stockId, snapshot)
    }

    const latestMarketTimestamp = priceSnapshots.reduce<Date | null>((latest, row) => {
      if (row.rowNum !== 1) {
        return latest
      }

      if (!latest || row.timestamp > latest) {
        return row.timestamp
      }

      return latest
    }, null)

    const items = portfolio.items.map<PortfolioItemSummary>((item) => {
      if (!item.stock) {
        logger.error(
          {
            userId,
            portfolioId: portfolio.id,
            portfolioItemId: item.id,
            stockId: item.stockId,
          },
          'Portfolio item is missing its stock relation'
        )
      }

      const snapshot = priceMap.get(item.stockId)
      const currentPrice = snapshot?.currentPrice ?? 0
      const yesterdayPrice = snapshot?.yesterdayPrice ?? 0
      const latestPriceTimestamp = latestTimestampByStockId.get(item.stockId) ?? null
      const hasAnyPrice = latestPriceTimestamp !== null
      const isSuspended =
        latestMarketTimestamp !== null &&
        latestPriceTimestamp !== null &&
        latestPriceTimestamp.getTime() < latestMarketTimestamp.getTime()
      const currentValue = item.quantity * currentPrice
      const investedValue = item.quantity * item.buyPrice
      const profitLoss = currentValue - investedValue
      const dailyChange =
        snapshot?.yesterdayPrice === null || snapshot?.yesterdayPrice === undefined
          ? 0
          : (currentPrice - yesterdayPrice) * item.quantity
      const dailyChangePercent =
        snapshot?.yesterdayPrice === null ||
        snapshot?.yesterdayPrice === undefined ||
        yesterdayPrice === 0
          ? 0
          : ((currentPrice - yesterdayPrice) / yesterdayPrice) * 100
      const isActive = hasAnyPrice && !isSuspended
      const inactiveReason = !hasAnyPrice ? 'no_price_data' : isSuspended ? 'suspended' : null

      return {
        symbol: item.stock?.symbol ?? 'UNKNOWN',
        quantity: item.quantity,
        buyPrice: item.buyPrice,
        currentPrice,
        currentValue,
        profitLoss,
        dailyChange,
        dailyChangePercent,
        isActive,
        inactiveReason,
      }
    })

    const totals = items.reduce(
      (acc, item) => {
        acc.totalValue += item.currentValue
        acc.totalInvestment += item.quantity * item.buyPrice
        acc.totalProfitLoss += item.profitLoss
        acc.dailyChange += item.dailyChange
        acc.activeItems += item.isActive ? 1 : 0
        acc.inactiveItems += item.isActive ? 0 : 1
        return acc
      },
      {
        totalValue: 0,
        totalInvestment: 0,
        totalProfitLoss: 0,
        dailyChange: 0,
        activeItems: 0,
        inactiveItems: 0,
      }
    )

    const dailyChangePercent =
      totals.totalValue - totals.dailyChange <= 0
        ? 0
        : (totals.dailyChange / (totals.totalValue - totals.dailyChange)) * 100

    return {
      totalValue: totals.totalValue,
      totalInvestment: totals.totalInvestment,
      totalProfitLoss: totals.totalProfitLoss,
      dailyChange: totals.dailyChange,
      dailyChangePercent,
      activeItems: totals.activeItems,
      inactiveItems: totals.inactiveItems,
      items,
    }
  }
}

export const portfolioService = new PortfolioService()
