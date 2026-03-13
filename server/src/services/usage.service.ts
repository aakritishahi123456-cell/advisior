import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export interface UsageStats {
  reportsPerMonth: {
    used: number;
    limit: number;
    remaining: number;
  };
  apiRequestsPerDay: {
    used: number;
    limit: number;
    remaining: number;
  };
  month: string;
  date: string;
}

export interface UsageHistory {
  month: string;
  reportsCreated: number;
  apiRequests: number;
  subscriptionPlan: string;
}

export interface UsageAlert {
  type: 'warning' | 'limit_reached' | 'upgrade_required';
  feature: string;
  current: number;
  limit: number;
  message: string;
  recommendation?: string;
}

export class UsageService {
  // Get current usage statistics for a user
  async getCurrentUsage(userId: string): Promise<UsageStats> {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const [monthlyUsage, dailyUsage] = await Promise.all([
      prisma.userUsage.findFirst({
        where: {
          userId,
          month: currentMonth,
        },
      }),
      this.getDailyApiUsage(userId, today),
    ]);

    const FREE_LIMITS = {
      reportsPerMonth: 2,
      apiRequestsPerDay: 20,
    };

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
  }

  // Get daily API usage count
  private async getDailyApiUsage(userId: string, date: string): Promise<number> {
    const result = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM api_usage_logs
      WHERE user_id = ${userId}
      AND DATE(created_at) = ${date}
    `;
    
    return Number(result[0]?.count || 0);
  }

  // Get usage history for a user
  async getUsageHistory(userId: string, months: number = 12): Promise<UsageHistory[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const usageHistory = await prisma.userUsage.findMany({
      where: {
        userId,
        month: {
          gte: startDate.toISOString().slice(0, 7),
          lte: endDate.toISOString().slice(0, 7),
        },
      },
      orderBy: { month: 'asc' },
    });

    return usageHistory.map(usage => ({
      month: usage.month,
      reportsCreated: usage.reportCount,
      apiRequests: usage.requestCount,
      subscriptionPlan: user.subscription?.plan || 'FREE',
    }));
  }

  // Check if user has exceeded any limits
  async checkUsageAlerts(userId: string): Promise<UsageAlert[]> {
    const usage = await this.getCurrentUsage(userId);
    const alerts: UsageAlert[] = [];

    // Check report limit
    if (usage.reportsPerMonth.used >= usage.reportsPerMonth.limit) {
      alerts.push({
        type: 'limit_reached',
        feature: 'reports',
        current: usage.reportsPerMonth.used,
        limit: usage.reportsPerMonth.limit,
        message: `You've reached your monthly limit of ${usage.reportsPerMonth.limit} reports`,
        recommendation: 'Upgrade to Pro for unlimited reports',
      });
    } else if (usage.reportsPerMonth.used >= usage.reportsPerMonth.limit * 0.8) {
      alerts.push({
        type: 'warning',
        feature: 'reports',
        current: usage.reportsPerMonth.used,
        limit: usage.reportsPerMonth.limit,
        message: `You've used ${usage.reportsPerMonth.used} of ${usage.reportsPerMonth.limit} reports this month`,
        recommendation: 'Consider upgrading if you need more reports',
      });
    }

    // Check API request limit
    if (usage.apiRequestsPerDay.used >= usage.apiRequestsPerDay.limit) {
      alerts.push({
        type: 'limit_reached',
        feature: 'api_requests',
        current: usage.apiRequestsPerDay.used,
        limit: usage.apiRequestsPerDay.limit,
        message: `You've reached your daily limit of ${usage.apiRequestsPerDay.limit} API requests`,
        recommendation: 'Upgrade to Pro for unlimited API access',
      });
    } else if (usage.apiRequestsPerDay.used >= usage.apiRequestsPerDay.limit * 0.8) {
      alerts.push({
        type: 'warning',
        feature: 'api_requests',
        current: usage.apiRequestsPerDay.used,
        limit: usage.apiRequestsPerDay.limit,
        message: `You've used ${usage.apiRequestsPerDay.used} of ${usage.apiRequestsPerDay.limit} API requests today`,
        recommendation: 'Monitor your usage or upgrade to Pro',
      });
    }

    return alerts;
  }

  // Get usage summary for dashboard
  async getUsageSummary(userId: string): Promise<{
    current: UsageStats;
    history: UsageHistory[];
    alerts: UsageAlert[];
    subscriptionPlan: string;
    isPro: boolean;
  }> {
    const [current, history, alerts] = await Promise.all([
      this.getCurrentUsage(userId),
      this.getUsageHistory(userId),
      this.checkUsageAlerts(userId),
    ]);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    return {
      current,
      history,
      alerts,
      subscriptionPlan: user?.subscription?.plan || 'FREE',
      isPro: user?.subscription?.plan === 'PRO' && user?.subscription?.status === 'ACTIVE',
    };
  }

  // Reset monthly usage (for testing or admin purposes)
  async resetMonthlyUsage(userId: string, month?: string): Promise<void> {
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    
    await prisma.userUsage.deleteMany({
      where: {
        userId,
        month: targetMonth,
      },
    });

    logger.info(`Reset usage for user ${userId} for month ${targetMonth}`);
  }

  // Get usage statistics for admin
  async getAdminUsageStats(): Promise<{
    totalUsers: number;
    proUsers: number;
    freeUsers: number;
    totalReportsThisMonth: number;
    totalApiRequestsToday: number;
    averageReportsPerUser: number;
    averageApiRequestsPerUser: number;
    topUsersByReports: Array<{
      userId: string;
      email: string;
      reportsCreated: number;
      plan: string;
    }>;
    topUsersByApiRequests: Array<{
      userId: string;
      email: string;
      apiRequests: number;
      plan: string;
    }>;
  }> {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const today = new Date().toISOString().slice(0, 10);

    const [totalUsers, proUsers, totalReports, totalApiRequests, topReports, topApi] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          subscription: {
            some: {
              plan: 'PRO',
              status: 'ACTIVE',
            },
          },
        },
      }),
      prisma.userUsage.aggregate({
        where: { month: currentMonth },
        _sum: { reportCount: true },
      }),
      prisma.apiUsageLog.count({
        where: {
          createdAt: {
            gte: new Date(today),
          },
        },
      }),
      // Top users by reports
      prisma.userUsage.findMany({
        where: { month: currentMonth },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              subscription: {
                select: { plan: true, status: true },
              },
            },
          },
        },
        orderBy: { reportCount: 'desc' },
        take: 10,
      }),
      // Top users by API requests
      prisma.$queryRaw`
        SELECT 
          u.id as user_id,
          u.email,
          COUNT(aul.id) as api_requests,
          COALESCECE(s.plan, 'FREE') as plan
        FROM users u
        LEFT JOIN api_usage_logs aul ON u.id = aul.user_id 
          AND DATE(aul.created_at) = ${today}
        LEFT JOIN subscriptions s ON u.id = s.user_id
        GROUP BY u.id, u.email, s.plan
        ORDER BY api_requests DESC
        LIMIT 10
      `,
    ]);

    const freeUsers = totalUsers - proUsers;

    return {
      totalUsers,
      proUsers,
      freeUsers,
      totalReportsThisMonth: totalReports._sum.reportCount || 0,
      totalApiRequestsToday: totalApiRequests,
      averageReportsPerUser: totalUsers > 0 ? (totalReports._sum.reportCount || 0) / totalUsers : 0,
      averageApiRequestsPerUser: totalUsers > 0 ? totalApiRequests / totalUsers : 0,
      topUsersByReports: topReports.map(item => ({
        userId: item.user.id,
        email: item.user.email,
        reportsCreated: item.reportCount,
        plan: item.user.subscription?.plan || 'FREE',
      })),
      topUsersByApiRequests: topApi.map((item: any) => ({
        userId: item.user_id,
        email: item.email,
        apiRequests: Number(item.api_requests),
        plan: item.plan,
      })),
    };
  }

  // Get usage forecast
  async getUsageForecast(userId: string, months: number = 3): Promise<{
    month: string;
    projectedReports: number;
    projectedApiRequests: number;
    recommendations: string[];
  }[]> {
    const history = await this.getUsageHistory(userId, 6);
    const forecasts = [];

    for (let i = 1; i <= months; i++) {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + i);
      const futureMonth = futureDate.toISOString().slice(0, 7);

      // Simple projection based on historical average
      const avgReports = history.length > 0 
        ? history.reduce((sum, h) => sum + h.reportsCreated, 0) / history.length
        : 0;
      
      const avgApiRequests = history.length > 0
        ? history.reduce((sum, h) => sum + h.apiRequests, 0) / history.length
        : 0;

      const recommendations: string[] = [];
      
      if (avgReports > 1.5) {
        recommendations.push('Consider upgrading to Pro for unlimited reports');
      }
      
      if (avgApiRequests > 15) {
        recommendations.push('Upgrade to Pro for unlimited API access');
      }

      forecasts.push({
        month: futureMonth,
        projectedReports: Math.round(avgReports),
        projectedApiRequests: Math.round(avgApiRequests),
        recommendations,
      });
    }

    return forecasts;
  }

  // Export usage data for reporting
  async exportUsageData(userId: string, format: 'csv' | 'json' = 'json'): Promise<string> {
    const summary = await this.getUsageSummary(userId);
    
    if (format === 'csv') {
      const csvHeaders = ['Month', 'Reports Created', 'API Requests', 'Plan'];
      const csvRows = summary.history.map(h => [
        h.month,
        h.reportsCreated.toString(),
        h.apiRequests.toString(),
        h.subscriptionPlan
      ]);

      return [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');
    } else {
      return JSON.stringify(summary, null, 2);
    }
  }
}

export const usageService = new UsageService();
