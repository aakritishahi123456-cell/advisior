import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { requireAuth, type AuthRequest } from '../middleware/auth.middleware'
import { asyncHandler, createError } from '../middleware/errorHandler'

const router = Router()
const prisma = new PrismaClient()

const simulationSchema = z.object({
  amount: z.number().positive('Amount must be greater than zero'),
  rate: z.number().positive('Rate must be greater than zero'),
  tenure: z.number().int().positive('Tenure must be greater than zero'),
})

const updateSimulationSchema = simulationSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'At least one field is required'
)

const calculateLoan = (amount: number, rate: number, tenureYears: number) => {
  const monthlyRate = rate / 12 / 100
  const months = tenureYears * 12
  const emi =
    monthlyRate === 0
      ? amount / months
      : (amount * monthlyRate * (1 + monthlyRate) ** months) /
        ((1 + monthlyRate) ** months - 1)
  const totalPayment = emi * months
  const totalInterest = totalPayment - amount

  return {
    emi: Number(emi.toFixed(2)),
    totalPayment: Number(totalPayment.toFixed(2)),
    totalInterest: Number(totalInterest.toFixed(2)),
  }
}

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req: AuthRequest, res: any) => {
    const simulations = await prisma.loanSimulation.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    })

    res.json({
      success: true,
      data: simulations,
    })
  })
)

router.post(
  '/',
  requireAuth,
  asyncHandler(async (req: AuthRequest, res: any) => {
    const validatedData = simulationSchema.parse(req.body)
    const calculated = calculateLoan(
      validatedData.amount,
      validatedData.rate,
      validatedData.tenure
    )

    const simulation = await prisma.loanSimulation.create({
      data: {
        userId: req.user!.id,
        amount: validatedData.amount,
        rate: validatedData.rate,
        tenure: validatedData.tenure,
        ...calculated,
      },
    })

    res.status(201).json({
      success: true,
      data: simulation,
    })
  })
)

router.patch(
  '/:id',
  requireAuth,
  asyncHandler(async (req: AuthRequest, res: any) => {
    const validatedData = updateSimulationSchema.parse(req.body)

    const existing = await prisma.loanSimulation.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
    })

    if (!existing) {
      throw createError('Loan simulation not found', 404)
    }

    const nextAmount = validatedData.amount ?? existing.amount
    const nextRate = validatedData.rate ?? existing.rate
    const nextTenure = validatedData.tenure ?? existing.tenure
    const calculated = calculateLoan(nextAmount, nextRate, nextTenure)

    const simulation = await prisma.loanSimulation.update({
      where: { id: existing.id },
      data: {
        amount: nextAmount,
        rate: nextRate,
        tenure: nextTenure,
        ...calculated,
      },
    })

    res.json({
      success: true,
      data: simulation,
    })
  })
)

router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req: AuthRequest, res: any) => {
    const existing = await prisma.loanSimulation.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
    })

    if (!existing) {
      throw createError('Loan simulation not found', 404)
    }

    await prisma.loanSimulation.delete({
      where: { id: existing.id },
    })

    res.json({
      success: true,
      message: 'Loan simulation deleted successfully',
    })
  })
)

export default router
