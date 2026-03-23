import prisma from '../lib/prisma'

export const PRODUCT_EVENTS = {
  SIGNUP: 'signup',
  REPORT_GENERATED: 'report_generated',
  UPGRADE_CLICKED: 'upgrade_clicked',
  PAYMENT_SUCCESS: 'payment_success',
} as const

type ProductEventName = (typeof PRODUCT_EVENTS)[keyof typeof PRODUCT_EVENTS]

type TrackEventInput = {
  userId?: string | null
  eventName: ProductEventName | string
  category: 'acquisition' | 'activation' | 'revenue' | 'engagement'
  properties?: Record<string, unknown>
  ipAddress?: string | null
  userAgent?: string | null
}

type AnalyticsDashboard = {
  summary: {
    signups: number
    reportsGenerated: number
    upgradeClicks: number
    paymentSuccesses: number
    conversionRate: number
    churnRate: number
  }
  usagePatterns: {
    byEvent: Array<{ eventName: string; count: number }>
    byDay: Array<{ date: string; count: number }>
    recentEvents: Array<{
      id: string
      eventName: string
      category: string
      createdAt: string
      userId: string | null
    }>
  }
}

export class ProductAnalyticsService {
  static async trackEvent(input: TrackEventInput) {
    return this.trackEventWithClient(prisma, input)
  }

  static async trackEventWithClient(client: typeof prisma, input: TrackEventInput) {
    return client.productAnalyticsEvent.create({
      data: {
        userId: input.userId ?? null,
        eventName: input.eventName,
        category: input.category,
        properties: input.properties ?? {},
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      },
    })
  }

  static async getDashboard(days = 30): Promise<AnalyticsDashboard> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const [events, activePaidSubscriptions, churnedSubscriptions] = await Promise.all([
      prisma.productAnalyticsEvent.findMany({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          userId: true,
          eventName: true,
          category: true,
          createdAt: true,
        },
      }),
      prisma.subscription.count({
        where: {
          plan: {
            in: ['PRO', 'INVESTOR'],
          },
          status: 'ACTIVE',
        },
      }),
      prisma.subscriptionLog.count({
        where: {
          action: {
            in: ['PLAN_EXPIRED', 'CANCELLED'],
          },
          createdAt: {
            gte: startDate,
          },
        },
      }),
    ])

    const byEventMap = new Map<string, number>()
    const byDayMap = new Map<string, number>()

    for (const event of events) {
      byEventMap.set(event.eventName, (byEventMap.get(event.eventName) ?? 0) + 1)
      const dayKey = event.createdAt.toISOString().slice(0, 10)
      byDayMap.set(dayKey, (byDayMap.get(dayKey) ?? 0) + 1)
    }

    const signups = byEventMap.get(PRODUCT_EVENTS.SIGNUP) ?? 0
    const reportsGenerated = byEventMap.get(PRODUCT_EVENTS.REPORT_GENERATED) ?? 0
    const upgradeClicks = byEventMap.get(PRODUCT_EVENTS.UPGRADE_CLICKED) ?? 0
    const paymentSuccesses = byEventMap.get(PRODUCT_EVENTS.PAYMENT_SUCCESS) ?? 0
    const conversionRate = upgradeClicks > 0 ? Number(((paymentSuccesses / upgradeClicks) * 100).toFixed(2)) : 0
    const paidBase = activePaidSubscriptions + churnedSubscriptions
    const churnRate = paidBase > 0 ? Number(((churnedSubscriptions / paidBase) * 100).toFixed(2)) : 0

    return {
      summary: {
        signups,
        reportsGenerated,
        upgradeClicks,
        paymentSuccesses,
        conversionRate,
        churnRate,
      },
      usagePatterns: {
        byEvent: [...byEventMap.entries()]
          .map(([eventName, count]) => ({ eventName, count }))
          .sort((left, right) => right.count - left.count),
        byDay: [...byDayMap.entries()]
          .map(([date, count]) => ({ date, count }))
          .sort((left, right) => left.date.localeCompare(right.date)),
        recentEvents: events.slice(0, 15).map((event) => ({
          id: event.id,
          eventName: event.eventName,
          category: event.category,
          createdAt: event.createdAt.toISOString(),
          userId: event.userId,
        })),
      },
    }
  }
}

export const productAnalyticsService = ProductAnalyticsService
