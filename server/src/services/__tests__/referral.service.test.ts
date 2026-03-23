const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
    findFirst: jest.fn(),
  },
  referral: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  },
  reward: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  subscription: {
    findFirst: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  },
  subscriptionLog: {
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

describe('ReferralService', () => {
  let referralService: any

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    mockPrisma.$transaction.mockImplementation(async (callback: any) => callback(mockPrisma))
    ;({ referralService } = require('../referral.service'))
  })

  test('returns referral status with generated link and rewards summary', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'demo@finsathi.ai',
      referralCode: 'DEMO123',
    })
    mockPrisma.referral.findMany.mockResolvedValue([
      {
        id: 'ref-1',
        convertedAt: new Date('2026-03-20T00:00:00.000Z'),
        invitee: { email: 'friend@example.com' },
      },
    ])
    mockPrisma.reward.findMany.mockResolvedValue([
      {
        id: 'reward-1',
        premiumDays: 7,
        grantedAt: new Date('2026-03-21T00:00:00.000Z'),
        expiresAt: new Date('2099-03-28T00:00:00.000Z'),
        triggerCount: 3,
      },
    ])

    const result = await referralService.getStatus('user-1')

    expect(result.referralCode).toBe('DEMO123')
    expect(result.totalPremiumDaysEarned).toBe(7)
    expect(result.referrals).toHaveLength(1)
    expect(result.rewards).toHaveLength(1)
  })

  test('rejects self-referrals', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'demo@finsathi.ai',
      plan: 'FREE',
      planExpiry: null,
    })
    mockPrisma.user.findFirst.mockResolvedValue({
      id: 'user-1',
      email: 'demo@finsathi.ai',
      referralCode: 'SELF123',
    })

    await expect(referralService.useReferralCode('user-1', 'SELF123')).rejects.toThrow(
      'You cannot use your own referral code'
    )
  })

  test('grants 7 pro days on every third successful referral', async () => {
    mockPrisma.user.findUnique
      .mockResolvedValueOnce({
        id: 'invitee-1',
        email: 'new@example.com',
        plan: 'FREE',
        planExpiry: null,
      })
      .mockResolvedValueOnce({
        id: 'inviter-1',
        plan: 'FREE',
        planExpiry: null,
      })
    mockPrisma.user.findFirst.mockResolvedValue({
      id: 'inviter-1',
      email: 'owner@example.com',
      referralCode: 'OWNER9',
    })
    mockPrisma.referral.findUnique.mockResolvedValue(null)
    mockPrisma.referral.create.mockResolvedValue({ id: 'ref-3' })
    mockPrisma.referral.count.mockResolvedValue(3)
    mockPrisma.reward.findUnique.mockResolvedValue(null)
    mockPrisma.subscription.findFirst.mockResolvedValue({
      id: 'sub-1',
    })
    mockPrisma.reward.create.mockResolvedValue({
      id: 'reward-3',
      premiumDays: 7,
      expiresAt: new Date('2026-03-29T00:00:00.000Z'),
    })
    mockPrisma.subscription.update.mockResolvedValue({})
    mockPrisma.user.update.mockResolvedValue({})
    mockPrisma.subscriptionLog.create.mockResolvedValue({})

    const result = await referralService.useReferralCode('invitee-1', 'OWNER9')

    expect(result.reward?.premiumDays).toBe(7)
    expect(mockPrisma.reward.create).toHaveBeenCalledTimes(1)
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          plan: 'PRO',
        }),
      })
    )
  })
})
