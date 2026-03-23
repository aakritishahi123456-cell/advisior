const mockPrisma = {
  productAnalyticsEvent: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  subscription: {
    count: jest.fn(),
  },
  subscriptionLog: {
    count: jest.fn(),
  },
}

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
}))

describe('ProductAnalyticsService', () => {
  let productAnalyticsService: any
  let PRODUCT_EVENTS: any

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    ;({ productAnalyticsService, PRODUCT_EVENTS } = require('../productAnalytics.service'))
  })

  test('tracks analytics events with metadata', async () => {
    mockPrisma.productAnalyticsEvent.create.mockResolvedValue({
      id: 'evt-1',
      eventName: 'signup',
      createdAt: new Date('2026-03-22T00:00:00.000Z'),
    })

    const event = await productAnalyticsService.trackEvent({
      userId: 'user-1',
      eventName: PRODUCT_EVENTS.SIGNUP,
      category: 'acquisition',
      properties: { source: 'landing-page' },
    })

    expect(event.id).toBe('evt-1')
    expect(mockPrisma.productAnalyticsEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          eventName: 'signup',
        }),
      })
    )
  })

  test('builds dashboard conversion and churn metrics from events', async () => {
    mockPrisma.productAnalyticsEvent.findMany.mockResolvedValue([
      {
        id: '1',
        userId: 'user-1',
        eventName: PRODUCT_EVENTS.SIGNUP,
        category: 'acquisition',
        createdAt: new Date('2026-03-20T00:00:00.000Z'),
      },
      {
        id: '2',
        userId: 'user-1',
        eventName: PRODUCT_EVENTS.UPGRADE_CLICKED,
        category: 'revenue',
        createdAt: new Date('2026-03-20T01:00:00.000Z'),
      },
      {
        id: '3',
        userId: 'user-1',
        eventName: PRODUCT_EVENTS.PAYMENT_SUCCESS,
        category: 'revenue',
        createdAt: new Date('2026-03-20T02:00:00.000Z'),
      },
      {
        id: '4',
        userId: 'user-2',
        eventName: PRODUCT_EVENTS.REPORT_GENERATED,
        category: 'activation',
        createdAt: new Date('2026-03-21T02:00:00.000Z'),
      },
    ])
    mockPrisma.subscription.count.mockResolvedValue(4)
    mockPrisma.subscriptionLog.count.mockResolvedValue(1)

    const dashboard = await productAnalyticsService.getDashboard(30)

    expect(dashboard.summary.signups).toBe(1)
    expect(dashboard.summary.reportsGenerated).toBe(1)
    expect(dashboard.summary.upgradeClicks).toBe(1)
    expect(dashboard.summary.paymentSuccesses).toBe(1)
    expect(dashboard.summary.conversionRate).toBe(100)
    expect(dashboard.summary.churnRate).toBe(20)
    expect(dashboard.usagePatterns.byEvent[0]).toEqual(expect.objectContaining({ count: 1 }))
  })
})
