import { Router } from 'express'
import { SubscriptionPlan } from '@prisma/client'
import { z } from 'zod'
import { asyncHandler } from '../middleware/errorHandler'
import { requireAuth, type AuthRequest } from '../middleware/auth.middleware'
import { PaymentService } from '../services/payment.service'

const router = Router()

const initiateSchema = z.object({
  provider: z.enum(['KHALTI', 'ESEWA']),
  plan: z.enum([SubscriptionPlan.PRO, SubscriptionPlan.INVESTOR]),
})

const genericVerifySchema = z.discriminatedUnion('provider', [
  z.object({
    provider: z.literal('KHALTI'),
    pidx: z.string().min(1),
  }),
  z.object({
    provider: z.literal('ESEWA'),
    data: z.string().min(1).optional(),
    transaction_uuid: z.string().min(1).optional(),
    total_amount: z.union([z.string(), z.number()]).optional(),
    product_code: z.string().min(1).optional(),
    status: z.string().optional(),
    transaction_code: z.string().optional(),
    signed_field_names: z.string().optional(),
    signature: z.string().optional(),
  }).refine(
    (value) =>
      Boolean(value.data) ||
      Boolean(
        value.transaction_uuid &&
          value.total_amount !== undefined &&
          value.product_code &&
          value.signed_field_names &&
          value.signature
      ),
    { message: 'Invalid eSewa verification payload' }
  ),
])

const khaltiVerifySchema = z.object({
  pidx: z.string().min(1),
})

const esewaVerifySchema = z
  .object({
    data: z.string().min(1).optional(),
    transaction_uuid: z.string().min(1).optional(),
    total_amount: z.union([z.string(), z.number()]).optional(),
    product_code: z.string().min(1).optional(),
    status: z.string().optional(),
    transaction_code: z.string().optional(),
    signed_field_names: z.string().optional(),
    signature: z.string().optional(),
  })
  .refine(
    (value) =>
      Boolean(value.data) ||
      Boolean(
        value.transaction_uuid &&
          value.total_amount !== undefined &&
          value.product_code &&
          value.signed_field_names &&
          value.signature
      ),
    { message: 'Invalid eSewa verification payload' }
  )

router.get(
  '/providers',
  asyncHandler(async (_req, res) => {
    res.json({
      success: true,
      data: PaymentService.getProviders(),
    })
  })
)

router.get(
  '/transactions',
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    const transactions = await PaymentService.getTransactions(req.user!.id)
    res.json({
      success: true,
      data: transactions,
    })
  })
)

router.post(
  '/initiate',
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    const payload = initiateSchema.parse(req.body)
    const session = await PaymentService.initiatePayment({
      userId: req.user!.id,
      provider: payload.provider,
      plan: payload.plan,
    })

    res.status(201).json({
      success: true,
      data: session,
    })
  })
)

router.post(
  '/verify',
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    const payload = genericVerifySchema.parse(req.body)
    const result = await PaymentService.verifyPayment({
      userId: req.user!.id,
      ...payload,
    } as any)

    res.json({
      success: true,
      data: result,
    })
  })
)

router.get(
  '/transactions/:transactionId',
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    const result = await PaymentService.getTransactionStatus(req.user!.id, req.params.transactionId)

    res.json({
      success: true,
      data: result,
    })
  })
)

router.post(
  '/subscriptions/initiate',
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    const payload = initiateSchema.parse(req.body)
    const session = await PaymentService.initiateSubscriptionPayment({
      userId: req.user!.id,
      provider: payload.provider,
      plan: payload.plan,
    })

    res.status(201).json({
      success: true,
      data: session,
    })
  })
)

router.post(
  '/khalti/verify',
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    const payload = khaltiVerifySchema.parse(req.body)
    const result = await PaymentService.verifyKhaltiPayment({
      userId: req.user!.id,
      pidx: payload.pidx,
    })

    res.json({
      success: true,
      data: result,
    })
  })
)

router.post(
  '/esewa/verify',
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    const payload = esewaVerifySchema.parse(req.body)
    const result = await PaymentService.verifyEsewaPayment({
      userId: req.user!.id,
      ...payload,
    })

    res.json({
      success: true,
      data: result,
    })
  })
)

export default router
