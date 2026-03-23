const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  subscription: {
    findFirst: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
  },
  subscriptionLog: {
    create: jest.fn(),
  },
  usageTracking: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
    updateMany: jest.fn(),
    create: jest.fn(),
  },
  $transaction: jest.fn(),
}

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
}))

jest.mock('../../middleware/errorHandler', () => ({
  __esModule: true,
  createError: (message: string, statusCode = 500) =>
    Object.assign(new Error(message), { statusCode }),
}))

describe('SubscriptionService', () => {
  let subscriptionService: any

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    mockPrisma.$transaction.mockImplementation(async (callbackOrOperations: any) => {
      if (typeof callbackOrOperations === 'function') {
        return callbackOrOperations(mockPrisma)
      }

      return Promise.all(callbackOrOperations)
    })
    ;({ subscriptionService } = require('../subscription.service'))
  })

  test('downgrades expired pro users to free on status lookup', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: 'user-1',
      plan: 'PRO',
      planExpiry: new Date('2000-01-01T00:00:00.000Z'),
    })
    mockPrisma.usageTracking.findUnique.mockResolvedValue(null)
    mockPrisma.user.update.mockResolvedValue({})
    mockPrisma.subscription.updateMany.mockResolvedValue({})
    mockPrisma.subscriptionLog.create.mockResolvedValue({})

    const result = await subscriptionService.getStatus('user-1')

    expect(result).toEqual({
      plan: 'FREE',
      isActive: false,
      expiresAt: null,
      reportsThisMonth: {
        used: 0,
        limit: 2,
        remaining: 2,
      },
    })
    expect(mockPrisma.user.update).toHaveBeenCalled()
    expect(mockPrisma.subscription.updateMany).toHaveBeenCalled()
    expect(mockPrisma.subscriptionLog.create).toHaveBeenCalled()
  })

  test('blocks free users when monthly report limit is exceeded', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      plan: 'FREE',
      planExpiry: null,
    })
    mockPrisma.usageTracking.findUnique.mockResolvedValue({
      usageCount: 2,
    })

    await expect(
      subscriptionService.assertFeatureAccess('user-1', 'company_reports')
    ).rejects.toThrow('Free plan monthly report limit reached')
  })

  test('allows active pro users unlimited access and tracks no fixed limit', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      plan: 'PRO',
      planExpiry: new Date('2099-01-01T00:00:00.000Z'),
    })
    mockPrisma.usageTracking.findUnique.mockResolvedValue({
      usageCount: 17,
    })

    const result = await subscriptionService.assertFeatureAccess('user-1', 'company_reports')

    expect(result).toEqual({
      plan: 'PRO',
      used: 17,
      limit: null,
    })
  })

  test('consumes the last free report slot atomically', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      plan: 'FREE',
      planExpiry: null,
    })
    mockPrisma.usageTracking.updateMany.mockResolvedValueOnce({ count: 1 })
    mockPrisma.usageTracking.findUnique.mockResolvedValueOnce({
      usageCount: 2,
    })

    const result = await subscriptionService.consumeFeatureAccess('user-1', 'company_reports')

    expect(result).toEqual({
      plan: 'FREE',
      used: 2,
      limit: 2,
    })
  })

  test('blocks free users from pdf downloads', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      plan: 'FREE',
      planExpiry: null,
    })
    mockPrisma.usageTracking.findUnique.mockResolvedValue({
      usageCount: 0,
    })

    await expect(
      subscriptionService.assertFeatureAccess('user-1', 'pdf_download')
    ).rejects.toThrow('This feature requires an active Pro subscription.')
  })
})
