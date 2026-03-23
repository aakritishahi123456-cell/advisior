import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { portfolioService } from '../services/portfolio.service';

const router = Router();

router.get(
  '/:userId',
  requireAuth,
  asyncHandler(async (req: AuthRequest, res: any) => {
    const { userId } = req.params;

    if (!userId) {
      throw createError('User ID is required', 400);
    }

    if (!req.user || req.user.id !== userId) {
      throw createError('Access denied', 403);
    }

    const portfolio = await portfolioService.getUserPortfolio(userId);

    res.json({
      success: true,
      userId,
      data: portfolio,
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
