import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient, SubscriptionPlan } from '@prisma/client';
import { AuthRequest, asyncHandler, createError } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const updateSubscriptionSchema = z.object({
  plan: z.nativeEnum(SubscriptionPlan)
});

// Get current subscription
router.get('/', asyncHandler(async (req: AuthRequest, res: any) => {
  const subscription = await prisma.subscription.findUnique({
    where: { userId: req.user!.id },
    include: {
      user: {
        select: { email: true, firstName: true, lastName: true }
      }
    }
  });

  if (!subscription) {
    // Create free subscription if doesn't exist
    const newSubscription = await prisma.subscription.create({
      data: {
        userId: req.user!.id,
        plan: SubscriptionPlan.FREE
      }
    });
    res.json(newSubscription);
  } else {
    res.json(subscription);
  }
}));

// Update subscription
router.put('/', asyncHandler(async (req: AuthRequest, res: any) => {
  const validatedData = updateSubscriptionSchema.parse(req.body);

  const subscription = await prisma.subscription.upsert({
    where: { userId: req.user!.id },
    update: {
      plan: validatedData.plan,
      status: 'ACTIVE',
      endDate: validatedData.plan === 'FREE' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    },
    create: {
      userId: req.user!.id,
      plan: validatedData.plan,
      status: 'ACTIVE',
      endDate: validatedData.plan === 'FREE' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  });

  res.json({
    message: 'Subscription updated successfully',
    subscription
  });
}));

// Cancel subscription
router.post('/cancel', asyncHandler(async (req: AuthRequest, res: any) => {
  const subscription = await prisma.subscription.update({
    where: { userId: req.user!.id },
    data: {
      status: 'CANCELLED'
    }
  });

  res.json({
    message: 'Subscription cancelled successfully',
    subscription
  });
}));

export default router;
