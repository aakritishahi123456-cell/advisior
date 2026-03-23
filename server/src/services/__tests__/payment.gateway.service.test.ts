jest.mock('axios', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
  },
}))

const mockPrisma = {
  transaction: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  $transaction: jest.fn(),
}

const mockSubscriptionService = {
  activatePaidPlanWithClient: jest.fn(),
}

const mockProductAnalyticsService = {
  trackEventWithClient: jest.fn(),
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

jest.mock('../subscription.service', () => ({
  __esModule: true,
  subscriptionService: mockSubscriptionService,
}))

jest.mock('../productAnalytics.service', () => ({
  __esModule: true,
  PRODUCT_EVENTS: {
    PAYMENT_SUCCESS: 'payment_success',
  },
  productAnalyticsService: mockProductAnalyticsService,
}))

describe('PaymentService Nepal gateway flow', () => {
  let PaymentService: any
  let axios: any

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    process.env.KHALTI_SECRET_KEY = 'khalti-secret'
    process.env.ESEWA_SECRET_KEY = 'esewa-secret'
    process.env.ESEWA_PRODUCT_CODE = 'EPAYTEST'
    mockPrisma.$transaction.mockImplementation(async (callback: any) => callback(mockPrisma))
    axios = require('axios').default
    ;({ PaymentService } = require('../payment.service'))
  })

  test('routes generic verify requests to Khalti verification', async () => {
    const spy = jest.spyOn(PaymentService, 'verifyKhaltiPayment').mockResolvedValue({ ok: true })

    const result = await PaymentService.verifyPayment({
      provider: 'KHALTI',
      userId: 'user-1',
      pidx: 'khalti-pidx-1',
    })

    expect(spy).toHaveBeenCalledWith({
      provider: 'KHALTI',
      userId: 'user-1',
      pidx: 'khalti-pidx-1',
    })
    expect(result).toEqual({ ok: true })
  })

  test('upgrades the plan only after a successful Khalti verification', async () => {
    mockPrisma.transaction.findFirst.mockResolvedValue({
      id: 'tx-success',
      userId: 'user-1',
      provider: 'KHALTI',
      plan: 'PRO',
      localReference: 'khalti_user-1_ref',
      amount: 999,
      createdAt: new Date(),
      status: 'PENDING',
    })
    mockPrisma.transaction.findUnique.mockResolvedValue({
      id: 'tx-success',
      status: 'PENDING',
    })
    axios.post.mockResolvedValue({
      data: {
        status: 'Completed',
        total_amount: 99900,
        purchase_order_id: 'khalti_user-1_ref',
        transaction_id: 'gateway-123',
      },
    })
    mockSubscriptionService.activatePaidPlanWithClient.mockResolvedValue({
      id: 'sub-1',
      plan: 'PRO',
    })
    mockPrisma.transaction.update.mockResolvedValue({
      id: 'tx-success',
      status: 'COMPLETED',
      subscriptionId: 'sub-1',
    })

    const result = await PaymentService.verifyKhaltiPayment({
      userId: 'user-1',
      pidx: 'khalti-pidx-success',
    })

    expect(mockSubscriptionService.activatePaidPlanWithClient).toHaveBeenCalledTimes(1)
    expect(mockPrisma.transaction.update).toHaveBeenCalledWith({
      where: { id: 'tx-success' },
      data: expect.objectContaining({
        status: 'COMPLETED',
        signatureVerified: true,
      }),
    })
    expect(result).toEqual({
      subscription: {
        id: 'sub-1',
        plan: 'PRO',
      },
      transaction: {
        id: 'tx-success',
        status: 'COMPLETED',
        subscriptionId: 'sub-1',
      },
    })
  })

  test('does not upgrade the plan when Khalti payment fails', async () => {
    mockPrisma.transaction.findFirst.mockResolvedValue({
      id: 'tx-failed',
      userId: 'user-1',
      provider: 'KHALTI',
      plan: 'PRO',
      localReference: 'khalti_user-1_ref',
      amount: 999,
      createdAt: new Date(),
      status: 'PENDING',
    })
    axios.post.mockResolvedValue({
      data: {
        status: 'Pending',
        total_amount: 99900,
        purchase_order_id: 'khalti_user-1_ref',
      },
    })
    mockPrisma.transaction.update.mockResolvedValue({})

    await expect(
      PaymentService.verifyKhaltiPayment({
        userId: 'user-1',
        pidx: 'khalti-pidx-failed',
      })
    ).rejects.toThrow('Khalti payment is not completed')

    expect(mockPrisma.transaction.update).toHaveBeenCalledWith({
      where: { id: 'tx-failed' },
      data: expect.objectContaining({
        status: 'FAILED',
        fraudReason: 'Khalti payment not completed',
      }),
    })
    expect(mockSubscriptionService.activatePaidPlanWithClient).not.toHaveBeenCalled()
  })

  test('treats duplicate Khalti callbacks as idempotent successful verification', async () => {
    mockPrisma.transaction.findFirst.mockResolvedValue({
      id: 'tx-1',
      userId: 'user-1',
      provider: 'KHALTI',
      plan: 'PRO',
      localReference: 'khalti_user-1_ref',
      amount: 999,
      createdAt: new Date(),
      status: 'COMPLETED',
    })
    mockPrisma.transaction.findUnique.mockResolvedValue({
      id: 'tx-1',
      status: 'COMPLETED',
      subscription: {
        id: 'sub-1',
        plan: 'PRO',
      },
    })

    const result = await PaymentService.verifyKhaltiPayment({
      userId: 'user-1',
      pidx: 'existing-pidx',
    })

    expect(result).toEqual({
      transaction: {
        id: 'tx-1',
        status: 'COMPLETED',
        subscription: {
          id: 'sub-1',
          plan: 'PRO',
        },
      },
      subscription: {
        id: 'sub-1',
        plan: 'PRO',
      },
      duplicateCallback: true,
    })
    expect(axios.post).not.toHaveBeenCalled()
    expect(mockSubscriptionService.activatePaidPlanWithClient).not.toHaveBeenCalled()
  })

  test('rejects invalid eSewa signatures and never upgrades the user', async () => {
    mockPrisma.transaction.findFirst.mockResolvedValue({
      id: 'tx-2',
      userId: 'user-1',
      provider: 'ESEWA',
      plan: 'PRO',
      localReference: 'esewa_ref_123',
      amount: 999,
      createdAt: new Date(),
      status: 'PENDING',
    })
    mockPrisma.transaction.update.mockResolvedValue({})

    await expect(
      PaymentService.verifyEsewaPayment({
        userId: 'user-1',
        transaction_uuid: 'esewa_ref_123',
        total_amount: '999.00',
        product_code: 'EPAYTEST',
        signed_field_names: 'total_amount,transaction_uuid,product_code',
        signature: 'bad-signature',
      })
    ).rejects.toThrow('Invalid eSewa signature')

    expect(mockPrisma.transaction.update).toHaveBeenCalledWith({
      where: { id: 'tx-2' },
      data: expect.objectContaining({
        status: 'FLAGGED',
        fraudFlag: true,
        fraudReason: 'Invalid eSewa signature',
      }),
    })
    expect(mockSubscriptionService.activatePaidPlanWithClient).not.toHaveBeenCalled()
  })
})
