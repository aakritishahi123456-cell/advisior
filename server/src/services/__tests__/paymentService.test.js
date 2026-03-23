jest.mock('axios', () => ({
  post: jest.fn(),
  get: jest.fn(),
}))

jest.mock('stripe', () =>
  jest.fn().mockImplementation(() => ({
    customers: {
      list: jest.fn(),
      create: jest.fn(),
    },
    checkout: {
      sessions: {
        create: jest.fn(),
        retrieve: jest.fn(),
      },
    },
    subscriptions: {
      retrieve: jest.fn(),
    },
  }))
, { virtual: true })

const PaymentService = require('../paymentService')

describe('PaymentService verification edge cases', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('routes eSewa verification with amount and reference id', async () => {
    const service = new PaymentService()
    const verifySpy = jest
      .spyOn(service, 'verifyEsewaPayment')
      .mockResolvedValue({ provider: 'esewa', success: true })

    const result = await service.verifyPayment('esewa', 'txn-1', {
      amount: 999.99,
      refId: 'ref-77',
    })

    expect(verifySpy).toHaveBeenCalledWith('txn-1', 999.99, 'ref-77')
    expect(result).toEqual({ provider: 'esewa', success: true })
  })

  test('activates subscription only after successful verification', async () => {
    const service = new PaymentService()
    const subscriptionService = {
      subscribe: jest.fn().mockResolvedValue({
        id: 'sub-1',
        plan: { displayName: 'Pro Plan' },
        nextBillingDate: '2026-04-10T00:00:00.000Z',
      }),
    }

    const recordSpy = jest.spyOn(service, 'recordPayment').mockResolvedValue({ id: 'pay-1' })
    const confirmationSpy = jest.spyOn(service, 'sendPaymentConfirmation').mockResolvedValue({ ok: true })

    const result = await service.activateSubscription(
      {
        provider: 'khalti',
        success: true,
        paymentId: 'payment-1',
        amount: 1500,
        currency: 'NPR',
        metadata: {
          userId: 'user-1',
          planId: 'plan-pro',
          planName: 'PRO',
          couponCode: 'SAVE20',
        },
      },
      subscriptionService
    )

    expect(subscriptionService.subscribe).toHaveBeenCalledWith('user-1', 'PRO', 'khalti', 'SAVE20')
    expect(recordSpy).toHaveBeenCalled()
    expect(confirmationSpy).toHaveBeenCalled()
    expect(result.success).toBe(true)
    expect(result.subscription.id).toBe('sub-1')
  })

  test('rejects activation when verification fails and avoids side effects', async () => {
    const service = new PaymentService()
    const subscriptionService = {
      subscribe: jest.fn(),
    }
    const recordSpy = jest.spyOn(service, 'recordPayment')
    const confirmationSpy = jest.spyOn(service, 'sendPaymentConfirmation')

    await expect(
      service.activateSubscription(
        {
          provider: 'stripe',
          success: false,
          metadata: {
            userId: 'user-1',
            planId: 'plan-pro',
            planName: 'PRO',
          },
        },
        subscriptionService
      )
    ).rejects.toThrow('Payment verification failed')

    expect(subscriptionService.subscribe).not.toHaveBeenCalled()
    expect(recordSpy).not.toHaveBeenCalled()
    expect(confirmationSpy).not.toHaveBeenCalled()
  })
})
