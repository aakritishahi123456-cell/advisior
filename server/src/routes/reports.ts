import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient, ReportType } from '@prisma/client';
import { AuthRequest, asyncHandler, createError } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createReportSchema = z.object({
  title: z.string().min(1),
  reportType: z.nativeEnum(ReportType),
  content: z.string().optional()
});

// Upload financial report
router.post('/', asyncHandler(async (req: AuthRequest, res: any) => {
  const validatedData = createReportSchema.parse(req.body);

  const report = await prisma.financialReport.create({
    data: {
      ...validatedData,
      userId: req.user!.id
    }
  });

  res.status(201).json({
    message: 'Financial report created successfully',
    report
  });
}));

// Get user's reports
router.get('/', asyncHandler(async (req: AuthRequest, res: any) => {
  const reports = await prisma.financialReport.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' }
  });

  res.json(reports);
}));

// Get specific report
router.get('/:id', asyncHandler(async (req: AuthRequest, res: any) => {
  const report = await prisma.financialReport.findFirst({
    where: {
      id: req.params.id,
      userId: req.user!.id
    }
  });

  if (!report) {
    throw createError('Report not found', 404);
  }

  res.json(report);
}));

// Delete report
router.delete('/:id', asyncHandler(async (req: AuthRequest, res: any) => {
  const report = await prisma.financialReport.findFirst({
    where: {
      id: req.params.id,
      userId: req.user!.id
    }
  });

  if (!report) {
    throw createError('Report not found', 404);
  }

  await prisma.financialReport.delete({
    where: { id: req.params.id }
  });

  res.json({ message: 'Report deleted successfully' });
}));

export default router;
