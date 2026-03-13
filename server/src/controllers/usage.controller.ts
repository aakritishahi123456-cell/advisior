import { Request, Response } from 'express';
import { usageService } from '../services/usage.service';
import { asyncHandler } from '../middleware/asyncHandler';
import { createError } from '../middleware/errorHandler';
import logger from '../utils/logger';

// Get current usage statistics
export const getCurrentUsage = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  
  const usage = await usageService.getCurrentUsage(userId);
  
  res.json({
    success: true,
    data: usage,
  });
});

// Get usage history
export const getUsageHistory = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const months = parseInt(req.query.months as string) || 12;
  
  const history = await usageService.getUsageHistory(userId, months);
  
  res.json({
    success: true,
    data: history,
  });
});

// Get usage summary for dashboard
export const getUsageSummary = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  
  const summary = await usageService.getUsageSummary(userId);
  
  res.json({
    success: true,
    data: summary,
  });
});

// Get usage alerts
export const getUsageAlerts = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  
  const alerts = await usageService.checkUsageAlerts(userId);
  
  res.json({
    success: true,
    data: alerts,
  });
});

// Export usage data
export const exportUsageData = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const format = (req.query.format as string) || 'json';
  
  if (!['csv', 'json'].includes(format)) {
    throw createError('Invalid format. Use csv or json', 400);
  }
  
  const data = await usageService.exportUsageData(userId, format as 'csv' | 'json');
  
  const filename = `usage-report-${new Date().toISOString().slice(0, 10)}.${format}`;
  
  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  } else {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  }
  
  res.send(data);
});

// Get usage forecast
export const getUsageForecast = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const months = parseInt(req.query.months as string) || 3;
  
  const forecast = await usageService.getUsageForecast(userId, months);
  
  res.json({
    success: true,
    data: forecast,
  });
});

// Admin: Get usage statistics
export const getAdminUsageStats = asyncHandler(async (req: Request, res: Response) => {
  // Check if user is admin
  const user = (req as any).user;
  if (user.role !== 'PRO') {
    throw createError('Admin access required', 403);
  }
  
  const stats = await usageService.getAdminUsageStats();
  
  res.json({
    success: true,
    data: stats,
  });
});

// Admin: Reset user usage (for testing)
export const resetUserUsage = asyncHandler(async (req: Request, res: Response) => {
  // Check if user is admin
  const user = (req as any).user;
  if (user.role !== 'PRO') {
    throw createError('Admin access required', 403);
  }
  
  const { userId, month } = req.body;
  
  if (!userId) {
    throw createError('User ID is required', 400);
  }
  
  await usageService.resetMonthlyUsage(userId, month);
  
  logger.info(`Admin ${user.id} reset usage for user ${userId} for month ${month || 'current'}`);
  
  res.json({
    success: true,
    message: 'Usage reset successfully',
  });
});

// Track report usage (internal endpoint)
export const trackReportUsage = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  
  try {
    // This would be called internally after creating a report
    // The actual tracking is handled in the middleware
    res.json({
      success: true,
      message: 'Report usage tracked',
    });
  } catch (error) {
    logger.error('Failed to track report usage:', error);
    throw createError('Failed to track usage', 500);
  }
});

// Get usage limits for current user
export const getUsageLimits = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  });

  if (!user) {
    throw createError('User not found', 404);
  }

  const isPro = user.subscription?.plan === 'PRO' && user.subscription?.status === 'ACTIVE';
  
  const limits = isPro ? {
    reportsPerMonth: Infinity,
    apiRequestsPerDay: Infinity,
    advancedAnalysis: true,
    pdfExport: true,
    bulkOperations: true,
    prioritySupport: true,
  } : {
    reportsPerMonth: 2,
    apiRequestsPerDay: 20,
    advancedAnalysis: false,
    pdfExport: false,
    bulkOperations: false,
    prioritySupport: false,
  };

  res.json({
    success: true,
    data: {
      limits,
      isPro,
      currentPlan: user.subscription?.plan || 'FREE',
      subscriptionStatus: user.subscription?.status || 'NONE',
    },
  });
});
