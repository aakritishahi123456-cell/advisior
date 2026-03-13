import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, asyncHandler, createError } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get user profile
router.get('/profile', asyncHandler(async (req: AuthRequest, res: any) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: {
      subscription: {
        select: { plan: true, status: true, endDate: true }
      }
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      createdAt: true,
      subscription: true
    }
  });

  if (!user) {
    throw createError('User not found', 404);
  }

  res.json(user);
}));

// Update user profile
router.put('/profile', asyncHandler(async (req: AuthRequest, res: any) => {
  const updateSchema = z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional()
  });

  const validatedData = updateSchema.parse(req.body);

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: validatedData,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      createdAt: true
    }
  });

  res.json({
    message: 'Profile updated successfully',
    user
  });
}));

export default router;
