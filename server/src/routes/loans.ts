import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient, LoanType } from '@prisma/client';
import { AuthRequest, asyncHandler, createError } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createLoanSchema = z.object({
  amount: z.number().positive(),
  interestRate: z.number().positive(),
  term: z.number().int().positive(),
  type: z.nativeEnum(LoanType)
});

// Create loan application
router.post('/', asyncHandler(async (req: AuthRequest, res: any) => {
  const validatedData = createLoanSchema.parse(req.body);

  const loan = await prisma.loan.create({
    data: {
      ...validatedData,
      userId: req.user!.id
    }
  });

  res.status(201).json({
    message: 'Loan application created successfully',
    loan
  });
}));

// Get user's loans
router.get('/', asyncHandler(async (req: AuthRequest, res: any) => {
  const loans = await prisma.loan.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' }
  });

  res.json(loans);
}));

// Get specific loan
router.get('/:id', asyncHandler(async (req: AuthRequest, res: any) => {
  const loan = await prisma.loan.findFirst({
    where: {
      id: req.params.id,
      userId: req.user!.id
    }
  });

  if (!loan) {
    throw createError('Loan not found', 404);
  }

  res.json(loan);
}));

// Calculate loan simulation
router.post('/simulate', asyncHandler(async (req: AuthRequest, res: any) => {
  const simulationSchema = z.object({
    amount: z.number().positive(),
    interestRate: z.number().positive(),
    term: z.number().int().positive()
  });

  const { amount, interestRate, term } = simulationSchema.parse(req.body);

  const monthlyRate = interestRate / 100 / 12;
  const monthlyPayment = (amount * monthlyRate * Math.pow(1 + monthlyRate, term)) / 
                         (Math.pow(1 + monthlyRate, term) - 1);
  const totalPayment = monthlyPayment * term;
  const totalInterest = totalPayment - amount;

  res.json({
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    totalPayment: Math.round(totalPayment * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    principal: amount,
    interestRate,
    term
  });
}));

export default router;
