import crypto from 'crypto'
import axios from 'axios'
import { SubscriptionPlan } from '@prisma/client'
import { createError } from '../middleware/errorHandler'
import logger from '../utils/logger'
import prisma from '../lib/prisma'
import { subscriptionService } from './subscription.service'
import { productAnalyticsService, PRODUCT_EVENTS } from './productAnalytics.service'

const PLAN_PRICING: Record<Exclude<SubscriptionPlan, 'FREE'>, { amount: number; label: string }> = {
  PRO: { amount: 999, label: 'Pro Plan' },
  INVESTOR: { amount: 2499, label: 'Investor Plan' },
}

const DEFAULT_CURRENCY = 'NPR'

type PaymentProvider = 'KHALTI' | 'ESEWA'

type InitiatePaymentInput = {
  userId: string
  provider: PaymentProvider
  plan: Exclude<SubscriptionPlan, 'FREE'>
}

type VerifyKhaltiInput = {
  userId: string
  pidx: string
}

type VerifyEsewaInput = {
  userId: string
  data?: string
  transaction_uuid?: string
  total_amount?: string | number
  product_code?: string
  status?: string
  transaction_code?: string
  signed_field_names?: string
  signature?: string
}

type GenericVerifyInput =
  | ({ provider: 'KHALTI'; userId: string; pidx: string })
  | ({
      provider: 'ESEWA'
      userId: string
      data?: string
      transaction_uuid?: string
      total_amount?: string | number
      product_code?: string
      status?: string
      transaction_code?: string
      signed_field_names?: string
      signature?: string
    })

type EsewaDecodedPayload = {
  transaction_uuid: string
  total_amount: string
  product_code: string
  status?: string
  transaction_code?: string
  signed_field_names: string
  signature: string
}

const getKhaltiConfig = () => ({
  secretKey: process.env.KHALTI_SECRET_KEY,
  baseUrl: (process.env.KHALTI_BASE_URL || 'https://dev.khalti.com/api/v2/epayment').replace(/\/$/, ''),
  websiteUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  returnUrl:
    process.env.KHALTI_RETURN_URL ||
    `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payments/khalti/callback`,
})

const getEsewaConfig = () => ({
  productCode: process.env.ESEWA_PRODUCT_CODE || 'EPAYTEST',
  secretKey: process.env.ESEWA_SECRET_KEY,
  formUrl: process.env.ESEWA_FORM_URL || 'https://rc-epay.esewa.com.np/api/epay/main/v2/form',
  statusCheckUrl:
    process.env.ESEWA_STATUS_CHECK_URL ||
    'https://rc.esewa.com.np/api/epay/transaction/status/',
  successUrl:
    process.env.ESEWA_SUCCESS_URL ||
    `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payments/esewa/success`,
  failureUrl:
    process.env.ESEWA_FAILURE_URL ||
    `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payments/esewa/failure`,
})

const getTransactionTtlMs = () => {
  const rawMinutes = Number(process.env.PAYMENT_TRANSACTION_TTL_MINUTES || '60')
  return Math.max(rawMinutes, 5) * 60 * 1000
}

const buildLocalReference = (provider: PaymentProvider, userId: string) =>
  `${provider.toLowerCase()}_${userId}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`

const normalizeAmount = (amount: number) => Number(amount.toFixed(2))

export class PaymentService {
  static getProviders() {
    return [
      {
        provider: 'KHALTI',
        enabled: Boolean(getKhaltiConfig().secretKey),
        currency: DEFAULT_CURRENCY,
      },
      {
        provider: 'ESEWA',
        enabled: Boolean(getEsewaConfig().secretKey),
        currency: DEFAULT_CURRENCY,
      },
    ]
  }

  static async getTransactions(userId: string) {
    return prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        provider: true,
        plan: true,
        amount: true,
        currency: true,
        status: true,
        localReference: true,
        externalReference: true,
        gatewayTransactionId: true,
        signatureVerified: true,
        fraudFlag: true,
        fraudReason: true,
        verifiedAt: true,
        createdAt: true,
      },
    })
  }

  static async getTransactionStatus(userId: string, transactionId: string) {
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId,
      },
      include: {
        subscription: true,
      },
    })

    if (!transaction) {
      throw createError('Transaction not found', 404)
    }

    return transaction
  }

  static async initiateSubscriptionPayment(input: InitiatePaymentInput) {
    const planConfig = PLAN_PRICING[input.plan]
    if (!planConfig) {
      throw createError('Unsupported subscription plan', 400)
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: input.userId },
      select: {
        plan: true,
        planExpiry: true,
      },
    })

    if (!currentUser) {
      throw createError('User not found', 404)
    }

    if (
      currentUser.plan === input.plan &&
      currentUser.planExpiry &&
      currentUser.planExpiry.getTime() >= Date.now()
    ) {
      throw createError('User already has an active subscription for this plan', 409)
    }

    const existingPending = await prisma.transaction.findFirst({
      where: {
        userId: input.userId,
        provider: input.provider,
        plan: input.plan,
        status: 'PENDING',
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
      },
    })

    if (existingPending && Date.now() - existingPending.createdAt.getTime() < getTransactionTtlMs()) {
      throw createError('A pending payment already exists for this subscription upgrade', 409)
    }

    const localReference = buildLocalReference(input.provider, input.userId)
    const amount = normalizeAmount(planConfig.amount)

    const pendingTransaction = await prisma.transaction.create({
      data: {
        userId: input.userId,
        provider: input.provider,
        plan: input.plan,
        amount,
        currency: DEFAULT_CURRENCY,
        localReference,
        status: 'PENDING',
      },
    })

    try {
      const session =
        input.provider === 'KHALTI'
          ? await this.createKhaltiSession({
              transactionId: pendingTransaction.id,
              userId: input.userId,
              localReference,
              plan: input.plan,
              amount,
            })
          : await this.createEsewaSession({
              transactionId: pendingTransaction.id,
              localReference,
              plan: input.plan,
              amount,
            })

      return {
        transactionId: pendingTransaction.id,
        provider: input.provider,
        plan: input.plan,
        amount,
        ...session,
      }
    } catch (error) {
      await prisma.transaction.update({
        where: { id: pendingTransaction.id },
        data: {
          status: 'FAILED',
          gatewayResponse: this.toJsonValue({ error: error instanceof Error ? error.message : 'Unknown error' }),
        },
      })

      throw error
    }
  }

  static async initiatePayment(input: InitiatePaymentInput) {
    return this.initiateSubscriptionPayment(input)
  }

  static async verifyPayment(input: GenericVerifyInput) {
    if (input.provider === 'KHALTI') {
      return this.verifyKhaltiPayment(input)
    }

    return this.verifyEsewaPayment(input)
  }

  static async verifyKhaltiPayment(input: VerifyKhaltiInput) {
    const tx = await prisma.transaction.findFirst({
      where: {
        userId: input.userId,
        provider: 'KHALTI',
        externalReference: input.pidx,
      },
    })

    if (!tx) {
      throw createError('Pending Khalti transaction not found', 404)
    }

    const duplicateResult = await this.getCompletedVerificationResult(tx.id, tx.status)
    if (duplicateResult) {
      return duplicateResult
    }

    this.ensureTransactionIsVerifiable(tx.createdAt, tx.status)

    const config = getKhaltiConfig()
    if (!config.secretKey) {
      throw createError('Khalti is not configured', 500)
    }

    const response = await axios.post(
      `${config.baseUrl}/lookup/`,
      { pidx: input.pidx },
      {
        headers: {
          Authorization: `Key ${config.secretKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const payload = response.data || {}
    const gatewayAmount = normalizeAmount(Number(payload.total_amount || 0) / 100)

    if (payload.status !== 'Completed') {
      await this.markTransactionFailed(tx.id, 'Khalti payment not completed', payload)
      throw createError('Khalti payment is not completed', 400)
    }

    if (payload.purchase_order_id !== tx.localReference || gatewayAmount !== normalizeAmount(tx.amount)) {
      await this.flagTransaction(tx.id, 'Khalti verification mismatch', payload)
      throw createError('Khalti payment verification mismatch', 400)
    }

    const { subscription, transaction } = await this.completeVerifiedTransaction({
      transactionId: tx.id,
      userId: tx.userId,
      plan: tx.plan,
      gatewayTransactionId: String(payload.transaction_id || ''),
      gatewayPayload: payload,
    })

    return { transaction, subscription }
  }

  static async verifyEsewaPayment(input: VerifyEsewaInput) {
    const payload = this.parseEsewaPayload(input)
    const tx = await prisma.transaction.findFirst({
      where: {
        userId: input.userId,
        provider: 'ESEWA',
        localReference: payload.transaction_uuid,
      },
    })

    if (!tx) {
      throw createError('Pending eSewa transaction not found', 404)
    }

    const duplicateResult = await this.getCompletedVerificationResult(tx.id, tx.status)
    if (duplicateResult) {
      return duplicateResult
    }

    this.ensureTransactionIsVerifiable(tx.createdAt, tx.status)

    const config = getEsewaConfig()
    if (!config.secretKey) {
      throw createError('eSewa is not configured', 500)
    }

    const signatureValid = this.verifyEsewaSignature(payload, config.secretKey)
    if (!signatureValid) {
      await this.flagTransaction(tx.id, 'Invalid eSewa signature', payload)
      throw createError('Invalid eSewa signature', 400)
    }

    const callbackAmount = normalizeAmount(Number(payload.total_amount || 0))
    if (payload.product_code !== config.productCode || callbackAmount !== normalizeAmount(tx.amount)) {
      await this.flagTransaction(tx.id, 'eSewa callback mismatch', payload)
      throw createError('eSewa payment verification mismatch', 400)
    }

    const statusResponse = await axios.get(config.statusCheckUrl, {
      params: {
        product_code: config.productCode,
        total_amount: payload.total_amount,
        transaction_uuid: payload.transaction_uuid,
      },
    })

    const statusPayload = statusResponse.data || {}
    const remoteStatus = String(statusPayload.status || payload.status || '').toUpperCase()

    if (remoteStatus !== 'COMPLETE' && remoteStatus !== 'COMPLETED') {
      await this.markTransactionFailed(tx.id, 'eSewa status check failed', {
        callback: payload,
        statusCheck: statusPayload,
      })
      throw createError('eSewa payment is not completed', 400)
    }

    const combinedPayload = {
      callback: payload,
      statusCheck: statusPayload,
    }

    const { subscription, transaction } = await this.completeVerifiedTransaction({
      transactionId: tx.id,
      userId: tx.userId,
      plan: tx.plan,
      gatewayTransactionId: String(statusPayload.transaction_code || payload.transaction_code || ''),
      gatewayPayload: combinedPayload,
    })

    return { transaction, subscription }
  }

  private static async createKhaltiSession(input: {
    transactionId: string
    userId: string
    localReference: string
    plan: Exclude<SubscriptionPlan, 'FREE'>
    amount: number
  }) {
    const config = getKhaltiConfig()
    if (!config.secretKey) {
      throw createError('Khalti is not configured', 500)
    }

    const payload = {
      return_url: config.returnUrl,
      website_url: config.websiteUrl,
      amount: Math.round(input.amount * 100),
      purchase_order_id: input.localReference,
      purchase_order_name: `${PLAN_PRICING[input.plan].label} Subscription`,
      customer_info: {
        name: `User ${input.userId}`,
        email: `user-${input.userId}@local.finsathi`,
      },
    }

    const response = await axios.post(`${config.baseUrl}/initiate/`, payload, {
      headers: {
        Authorization: `Key ${config.secretKey}`,
        'Content-Type': 'application/json',
      },
    })

    const gateway = response.data || {}
    if (!gateway.pidx || !gateway.payment_url) {
      throw createError('Khalti initiation failed', 502)
    }

    await prisma.transaction.update({
      where: { id: input.transactionId },
      data: {
        externalReference: String(gateway.pidx),
        gatewayRequest: this.toJsonValue(payload),
        gatewayResponse: this.toJsonValue(gateway),
      },
    })

    return {
      checkoutId: String(gateway.pidx),
      paymentUrl: String(gateway.payment_url),
    }
  }

  private static async createEsewaSession(input: {
    transactionId: string
    localReference: string
    plan: Exclude<SubscriptionPlan, 'FREE'>
    amount: number
  }) {
    const config = getEsewaConfig()
    if (!config.secretKey) {
      throw createError('eSewa is not configured', 500)
    }

    const totalAmount = input.amount.toFixed(2)
    const signedFieldNames = 'total_amount,transaction_uuid,product_code'
    const formData = {
      amount: totalAmount,
      tax_amount: '0',
      total_amount: totalAmount,
      transaction_uuid: input.localReference,
      product_code: config.productCode,
      product_service_charge: '0',
      product_delivery_charge: '0',
      success_url: config.successUrl,
      failure_url: config.failureUrl,
      signed_field_names: signedFieldNames,
      signature: this.generateEsewaSignature(
        {
          total_amount: totalAmount,
          transaction_uuid: input.localReference,
          product_code: config.productCode,
          signed_field_names: signedFieldNames,
          signature: '',
        },
        config.secretKey
      ),
    }

    await prisma.transaction.update({
      where: { id: input.transactionId },
      data: {
        gatewayRequest: this.toJsonValue(formData),
      },
    })

    return {
      checkoutId: input.localReference,
      paymentUrl: config.formUrl,
      formData,
    }
  }

  private static parseEsewaPayload(input: VerifyEsewaInput): EsewaDecodedPayload {
    if (input.data) {
      try {
        const decoded = Buffer.from(input.data, 'base64').toString('utf8')
        return JSON.parse(decoded)
      } catch (error) {
        throw createError('Unable to decode eSewa payload', 400)
      }
    }

    if (
      !input.transaction_uuid ||
      input.total_amount === undefined ||
      !input.product_code ||
      !input.signed_field_names ||
      !input.signature
    ) {
      throw createError('Incomplete eSewa verification payload', 400)
    }

    return {
      transaction_uuid: input.transaction_uuid,
      total_amount: String(input.total_amount),
      product_code: input.product_code,
      status: input.status,
      transaction_code: input.transaction_code,
      signed_field_names: input.signed_field_names,
      signature: input.signature,
    }
  }

  private static generateEsewaSignature(payload: EsewaDecodedPayload, secretKey: string) {
    const message = payload.signed_field_names
      .split(',')
      .map((field) => `${field}=${payload[field as keyof EsewaDecodedPayload] || ''}`)
      .join(',')

    return crypto.createHmac('sha256', secretKey).update(message).digest('base64')
  }

  private static verifyEsewaSignature(payload: EsewaDecodedPayload, secretKey: string) {
    const expected = this.generateEsewaSignature(payload, secretKey)
    const expectedBuffer = Buffer.from(expected)
    const providedBuffer = Buffer.from(payload.signature)

    if (expectedBuffer.length !== providedBuffer.length) {
      return false
    }

    return crypto.timingSafeEqual(expectedBuffer, providedBuffer)
  }

  private static async completeVerifiedTransaction(input: {
    transactionId: string
    userId: string
    plan: SubscriptionPlan
    gatewayTransactionId: string
    gatewayPayload: unknown
  }) {
    return prisma.$transaction(async (tx) => {
      const currentTransaction = await tx.transaction.findUnique({
        where: { id: input.transactionId },
      })

      if (!currentTransaction) {
        throw createError('Transaction not found', 404)
      }

      if (currentTransaction.status === 'COMPLETED') {
        throw createError('Transaction already verified', 409)
      }

      const subscription = await subscriptionService.activatePaidPlanWithClient(tx as typeof prisma, {
        userId: input.userId,
        plan: input.plan,
        transactionId: input.transactionId,
        gatewayMeta: this.toJsonValue(input.gatewayPayload),
      })

      const transaction = await tx.transaction.update({
        where: { id: input.transactionId },
        data: {
          subscriptionId: subscription.id,
          status: 'COMPLETED',
          gatewayTransactionId: input.gatewayTransactionId,
          signatureVerified: true,
          verifiedAt: new Date(),
          gatewayResponse: this.toJsonValue(input.gatewayPayload),
        },
      })

      await productAnalyticsService.trackEventWithClient(tx as typeof prisma, {
        userId: input.userId,
        eventName: PRODUCT_EVENTS.PAYMENT_SUCCESS,
        category: 'revenue',
        properties: {
          transactionId: transaction.id,
          plan: input.plan,
          gatewayTransactionId: input.gatewayTransactionId,
        },
      })

      return { subscription, transaction }
    })
  }

  private static async getCompletedVerificationResult(transactionId: string, status: string) {
    if (status !== 'COMPLETED') {
      return null
    }

    const existing = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        subscription: true,
      },
    })

    if (!existing) {
      throw createError('Transaction not found', 404)
    }

    return {
      transaction: existing,
      subscription: existing.subscription,
      duplicateCallback: true,
    }
  }

  private static ensureTransactionIsVerifiable(createdAt: Date, status: string) {
    if (status === 'COMPLETED') {
      throw createError('Transaction already verified', 409)
    }

    if (status !== 'PENDING') {
      throw createError('Transaction is not in a verifiable state', 400)
    }

    if (Date.now() - createdAt.getTime() > getTransactionTtlMs()) {
      throw createError('Transaction verification window has expired', 400)
    }
  }

  private static async markTransactionFailed(transactionId: string, reason: string, payload: unknown) {
    logger.warn({ transactionId, reason }, 'Payment verification failed')
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'FAILED',
        fraudReason: reason,
        gatewayResponse: this.toJsonValue(payload),
      },
    })
  }

  private static async flagTransaction(transactionId: string, reason: string, payload: unknown) {
    logger.warn({ transactionId, reason }, 'Potential payment fraud detected')
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'FLAGGED',
        fraudFlag: true,
        fraudReason: reason,
        gatewayResponse: this.toJsonValue(payload),
      },
    })
  }

  private static toJsonValue(value: unknown) {
    if (value === undefined) {
      return null
    }

    return JSON.parse(JSON.stringify(value))
  }
}
