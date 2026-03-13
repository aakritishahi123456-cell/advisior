import { Request, Response, NextFunction } from 'express';
import { createError } from './errorHandler';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export interface UsageLimits {
  reportsPerMonth: number;
  apiRequestsPerDay: number;
  advancedAnalysis: boolean;
  pdfExport: boolean;
  bulkOperations: boolean;
  prioritySupport: boolean;
}

export const FREE_LIMITS: UsageLimits = {
  reportsPerMonth: 2,
  apiRequestsPerDay: 20,
  advancedAnalysis: false,
  pdfExport: false,
  bulkOperations: false,
  prioritySupport: false,
};

export const PRO_LIMITS: UsageLimits = {
  reportsPerMonth: Infinity,
  apiRequestsPerDay: Infinity,
  advancedAnalysis: true,
  pdfExport: true,
  bulkOperations: true,
  prioritySupport: true,
};

// Middleware to require Pro subscription
export const requirePro = (feature?: keyof UsageLimits) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      
      if (!userId) {
        throw createError('Authentication required', 401);
      }

      // Get user's subscription status
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          subscription: true,
          usage: {
            where: {
              month: new Date().toISOString().slice(0, 7), // YYYY-MM format
            }
          }
        }
      });

      if (!user) {
        throw createError('User not found', 404);
      }

      const isPro = user.subscription?.plan === 'PRO' && user.subscription?.status === 'ACTIVE';
      
      if (!isPro) {
        // Check if specific feature is available for free users
        if (feature && FREE_LIMITS[feature]) {
          // Feature is available for free users, check usage limits
          await checkUsageLimits(user, feature);
          return next();
        }

        // Pro feature required
        return res.status(402).json({
          success: false,
          error: 'Upgrade Required',
          message: 'This feature requires a Pro subscription',
          feature: feature || 'Pro subscription',
          upgradeUrl: '/dashboard/profile/subscription',
          currentPlan: user.subscription?.plan || 'FREE',
          limits: FREE_LIMITS,
        });
      }

      // Pro user - allow access
      return next();
    } catch (error) {
      next(error);
    }
  };
};

// Middleware to check usage limits
export const checkUsageLimits = async (user: any, feature: keyof UsageLimits) => {
  const currentUsage = user.usage?.[0] || {
    reportCount: 0,
    requestCount: 0,
    month: new Date().toISOString().slice(0, 7),
  };

  switch (feature) {
    case 'reportsPerMonth':
      if (currentUsage.reportCount >= FREE_LIMITS.reportsPerMonth) {
        throw createError('Monthly report limit exceeded. Upgrade to Pro for unlimited reports.', 402);
      }
      break;
    case 'apiRequestsPerDay':
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD format
      const todayUsage = await getDailyUsage(user.id, today);
      if (todayUsage >= FREE_LIMITS.apiRequestsPerDay) {
        throw createError('Daily API request limit exceeded. Upgrade to Pro for unlimited requests.', 402);
      }
      break;
    case 'advancedAnalysis':
      throw createError('Advanced analysis requires Pro subscription', 402);
    case 'pdfExport':
      throw createError('PDF export requires Pro subscription', 402);
    case 'bulkOperations':
      throw createError('Bulk operations require Pro subscription', 402);
    default:
      break;
  }
};

// Get daily API usage
export const getDailyUsage = async (userId: string, date: string): Promise<number> => {
  const result = await prisma.$queryRaw`
    SELECT COUNT(*) as count
    FROM api_usage_logs
    WHERE user_id = ${userId}
    AND DATE(created_at) = ${date}
  `;
  
  return Number(result[0]?.count || 0);
};

// Track API usage
export const trackApiUsage = async (userId: string, endpoint: string, method: string) => {
  try {
    await prisma.apiUsageLog.create({
      data: {
        userId,
        endpoint,
        method,
        createdAt: new Date(),
      },
    });

    // Update monthly usage
    const currentMonth = new Date().toISOString().slice(0, 7);
    await prisma.userUsage.upsert({
      where: {
        userId_month: {
          userId,
          month: currentMonth,
        },
      },
      update: {
        requestCount: {
          increment: 1,
        },
      },
      create: {
        userId,
        month: currentMonth,
        reportCount: 0,
        requestCount: 1,
      },
    });
  } catch (error) {
    logger.error('Failed to track API usage:', error);
    // Don't throw error to avoid breaking the main functionality
  }
};

// Track report usage
export const trackReportUsage = async (userId: string) => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    await prisma.userUsage.upsert({
      where: {
        userId_month: {
          userId,
          month: currentMonth,
        },
      },
      update: {
        reportCount: {
          increment: 1,
        },
      },
      create: {
        userId,
        month: currentMonth,
        reportCount: 1,
        requestCount: 0,
      },
    });
  } catch (error) {
    logger.error('Failed to track report usage:', error);
    throw createError('Failed to track usage', 500);
  }
};

// Get user's current usage
export const getUserUsage = async (userId: string) => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const today = new Date().toISOString().slice(0, 10);

  const [monthlyUsage, dailyUsage] = await Promise.all([
    prisma.userUsage.findFirst({
      where: {
        userId,
        month: currentMonth,
      },
    }),
    getDailyUsage(userId, today),
  ]);

  return {
    reportsPerMonth: {
      used: monthlyUsage?.reportCount || 0,
      limit: FREE_LIMITS.reportsPerMonth,
      remaining: Math.max(0, FREE_LIMITS.reportsPerMonth - (monthlyUsage?.reportCount || 0)),
    },
    apiRequestsPerDay: {
      used: dailyUsage,
      limit: FREE_LIMITS.apiRequestsPerDay,
      remaining: Math.max(0, FREE_LIMITS.apiRequestsPerDay - dailyUsage),
    },
    month: currentMonth,
    date: today,
  };
};

// Middleware for API rate limiting
export const apiRateLimit = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      
      if (!userId) {
        return next(); // Skip for unauthenticated endpoints
      }

      // Get user's subscription
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true },
      });

      const isPro = user?.subscription?.plan === 'PRO' && user?.subscription?.status === 'ACTIVE';

      if (!isPro) {
        // Check daily API limit for free users
        const today = new Date().toISOString().slice(0, 10);
        const todayUsage = await getDailyUsage(userId, today);

        if (todayUsage >= FREE_LIMITS.apiRequestsPerDay) {
          return res.status(402).json({
            success: false,
            error: 'API limit exceeded',
            message: `Daily API request limit (${FREE_LIMITS.apiRequestsPerDay}) exceeded`,
            usage: {
              used: todayUsage,
              limit: FREE_LIMITS.apiRequestsPerDay,
              resetsAt: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
            },
            upgradeUrl: '/dashboard/profile/subscription',
          });
        }
      }

      // Track this API call
      await trackApiUsage(userId, req.path, req.method);
      
      return next();
    } catch (error) {
      next(error);
    }
  };
};

// Check if user can access a specific feature
export const canAccessFeature = (user: any, feature: keyof UsageLimits): boolean => {
  const isPro = user?.subscription?.plan === 'PRO' && user?.subscription?.status === 'ACTIVE';
  
  if (isPro) {
    return true;
  }

  // Free user - check if feature is available
  return FREE_LIMITS[feature] !== false;
};

// Get user's plan limits
export const getUserLimits = (user: any): UsageLimits => {
  const isPro = user?.subscription?.plan === 'PRO' && user?.subscription?.status === 'ACTIVE';
  return isPro ? PRO_LIMITS : FREE_LIMITS;
};

// Middleware to check specific feature access
export const requireFeature = (feature: keyof UsageLimits) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      
      if (!userId) {
        throw createError('Authentication required', 401);
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true },
      });

      if (!user) {
        throw createError('User not found', 404);
      }

      if (!canAccessFeature(user, feature)) {
        return res.status(402).json({
          success: false,
          error: 'Feature not available',
          message: `This feature is not available in your current plan`,
          feature,
          currentPlan: user.subscription?.plan || 'FREE',
          upgradeUrl: '/dashboard/profile/subscription',
        });
      }

      // Check usage limits for free users
      if (!canAccessFeature(user, feature)) {
        await checkUsageLimits(user, feature);
      }

      return next();
    } catch (error) {
      next(error);
    }
  };
};

// Usage tracking middleware
export const trackUsage = (type: 'report' | 'api') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user?.id;
    
    if (userId) {
      try {
        if (type === 'report') {
          await trackReportUsage(userId);
        } else if (type === 'api') {
          await trackApiUsage(userId, req.path, req.method);
        }
      } catch (error) {
        // Log error but don't break the request
        logger.error('Usage tracking failed:', error);
      }
    }
    
    return next();
  };
};
