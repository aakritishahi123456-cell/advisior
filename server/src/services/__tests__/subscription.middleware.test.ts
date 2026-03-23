const mockSubscriptionService = {
  assertFeatureAccess: jest.fn(),
  consumeFeatureAccess: jest.fn(),
  incrementUsage: jest.fn(),
}

jest.mock('../subscription.service', () => ({
  __esModule: true,
  subscriptionService: mockSubscriptionService,
}))

describe('checkSubscription middleware', () => {
  let checkSubscription: any

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    ;({ checkSubscription } = require('../../middleware/subscription.middleware'))
  })

  test('blocks free users from premium-only endpoints', async () => {
    mockSubscriptionService.assertFeatureAccess.mockResolvedValue({
      plan: 'FREE',
      used: 0,
      limit: 2,
    })

    const middleware = checkSubscription({ premiumOnly: true, trackUsage: false })
    const req: any = {
      user: { id: 'user-1' },
    }
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }
    const next = jest.fn()

    await middleware(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({
      error: 'This feature requires an active Pro subscription.',
      code: 'PRO_REQUIRED',
    })
    expect(next).not.toHaveBeenCalled()
  })

  test('consumes usage atomically before successful free-tier report response', async () => {
    mockSubscriptionService.consumeFeatureAccess.mockResolvedValue({
      plan: 'FREE',
      used: 2,
      limit: 2,
    })

    const middleware = checkSubscription({ featureKey: 'company_reports', trackUsage: true })
    const req: any = {
      user: { id: 'user-1' },
    }
    const res: any = {
      statusCode: 200,
    }
    const next = jest.fn()

    await middleware(req, res, next)
    expect(next).toHaveBeenCalled()
    expect(mockSubscriptionService.consumeFeatureAccess).toHaveBeenCalledWith('user-1', 'company_reports')
  })
})
