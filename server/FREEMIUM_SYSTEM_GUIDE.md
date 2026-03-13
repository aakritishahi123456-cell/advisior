# Freemium Feature Gating System Guide for FinSathi AI

## Overview
This guide documents the comprehensive freemium feature gating system implemented for FinSathi AI, including usage tracking, middleware, API behavior, and database schema.

## System Architecture

### Core Components
- **Feature Gating Middleware**: Access control for Pro features
- **Usage Tracking**: Database tables for monitoring user usage
- **API Rate Limiting**: Request-based limiting for free users
- **Usage Service**: Business logic for usage calculations and analytics
- **Database Schema**: User usage and API logging tables

### Freemium Model

#### Free Plan
- **2 company reports/month**
- **20 API requests/day**
- Basic features only
- No advanced analysis
- No PDF export

#### Pro Plan
- **Unlimited reports**
- **Unlimited API requests**
- Advanced analysis features
- PDF export
- Bulk operations
- Priority support

## Database Schema

### User Usage Table
```sql
model UserUsage {
  id           String   @id @default(cuid())
  userId       String   @map("user_id")
  month        String   // YYYY-MM format
  reportCount  Int      @default(0) @map("report_count")
  requestCount Int      @default(0) @map("request_count")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  
  @@unique([userId, month])
  @@index([userId])
  @@index([month])
  @@map("user_usage")
}
```

### API Usage Logs Table
```sql
model ApiUsageLog {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  endpoint  String
  method    String
  createdAt DateTime @default(now()) @map("created_at")

  @@index([userId])
  @@index([createdAt])
  @@index([userId, createdAt])
  @@map("api_usage_logs")
}
```

## Middleware Implementation

### 1. Feature Gating Middleware (`middleware/freemium.middleware.ts`)

#### `requirePro()` - Pro Subscription Required
```typescript
export const requirePro = (feature?: keyof UsageLimits) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user?.id;
    
    // Get user's subscription status
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    });

    const isPro = user?.subscription?.plan === 'PRO' && user?.subscription?.status === 'ACTIVE';
    
    if (!isPro) {
      // Return 402 Payment Required
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

    return next();
  };
};
```

#### `requireFeature()` - Specific Feature Access
```typescript
export const requireFeature = (feature: keyof UsageLimits) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Check if user can access feature
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
  };
};
```

### 2. API Rate Limiting Middleware
```typescript
export const apiRateLimit = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user?.id;
    const isPro = user?.subscription?.plan === 'PRO' && user?.subscription?.status === 'ACTIVE';

    if (!isPro) {
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
  };
};
```

### 3. Usage Tracking Middleware
```typescript
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
        logger.error('Usage tracking failed:', error);
      }
    }
    
    return next();
  };
};
```

## Usage Limits Configuration

### Free Plan Limits
```typescript
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
```

## API Behavior

### HTTP 402 Payment Required Response
```typescript
// Free user exceeding limits
{
  "success": false,
  "error": "Upgrade Required",
  "message": "Daily API request limit (20) exceeded",
  "usage": {
    "used": 21,
    "limit": 20,
    "remaining": 0,
    "resetsAt": "2023-12-11T00:00:00.000Z"
  },
  "upgradeUrl": "/dashboard/profile/subscription"
}
```

### Feature Access Response
```typescript
// Pro feature required
{
  "success": false,
  "error": "Feature not available",
  "message": "Advanced analysis requires Pro subscription",
  "feature": "advancedAnalysis",
  "currentPlan": "FREE",
  "upgradeUrl": "/dashboard/profile/subscription"
}
```

## Usage Tracking Service

### Current Usage Statistics
```typescript
interface UsageStats {
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
```

### Usage History
```typescript
interface UsageHistory {
  month: string;
  reportsCreated: number;
  apiRequests: number;
  subscriptionPlan: string;
}
```

### Usage Alerts
```typescript
interface UsageAlert {
  type: 'warning' | 'limit_reached' | 'upgrade_required';
  feature: string;
  current: number;
  limit: number;
  message: string;
  recommendation?: string;
}
```

## Implementation Examples

### 1. Protecting Report Creation
```typescript
// In financial report controller
router.post('/', 
  authenticateToken,
  trackUsage('report'),
  requireFeature('reportsPerMonth'),
  createFinancialReport
);
```

### 2. Protecting Advanced Analysis
```typescript
// In AI report controller
router.post('/analyze', 
  authenticateToken,
  requirePro('advancedAnalysis'),
  analyzeFinancialReport
);
```

### 3. API Rate Limiting
```typescript
// Apply to all API routes
router.use('/api/v1', authenticateToken, apiRateLimit);
```

## Database Operations

### Tracking Report Usage
```typescript
export const trackReportUsage = async (userId: string) => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  
  await prisma.userUsage.upsert({
    where: {
      userId_month: { userId, month: currentMonth },
    },
    update: {
      reportCount: { increment: 1 },
    },
    create: {
      userId,
      month: currentMonth,
      reportCount: 1,
      requestCount: 0,
    },
  });
};
```

### Tracking API Usage
```typescript
export const trackApiUsage = async (userId: string, endpoint: string, method: string) => {
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
      userId_month: { userId, month: currentMonth },
    },
    update: {
      requestCount: { increment: 1 },
    },
    create: {
      userId,
      month: currentMonth,
      reportCount: 0,
      requestCount: 1,
    },
  });
};
```

## API Endpoints

### Usage Monitoring
```typescript
// GET /api/v1/usage/current
// Get current usage statistics
{
  "success": true,
  "data": {
    "reportsPerMonth": {
      "used": 1,
      "limit": 2,
      "remaining": 1
    },
    "apiRequestsPerDay": {
      "used": 15,
      "limit": 20,
      "remaining": 5
    }
  }
}

// GET /api/v1/usage/summary
// Complete usage summary for dashboard
{
  "success": true,
  "data": {
    "current": { ... },
    "history": [ ... ],
    "alerts": [ ... ],
    "subscriptionPlan": "FREE",
    "isPro": false
  }
}

// GET /api/v1/usage/alerts
// Usage warnings and alerts
{
  "success": true,
  "data": [
    {
      "type": "warning",
      "feature": "api_requests",
      "current": 15,
      "limit": 20,
      "message": "You've used 15 of 20 API requests today",
      "recommendation": "Monitor your usage or upgrade to Pro"
    }
  ]
}
```

### Admin Endpoints
```typescript
// GET /api/v1/usage/admin/stats
// Admin usage statistics
{
  "success": true,
  "data": {
    "totalUsers": 1250,
    "proUsers": 45,
    "freeUsers": 1205,
    "totalReportsThisMonth": 2450,
    "totalApiRequestsToday": 18750,
    "averageReportsPerUser": 1.96,
    "averageApiRequestsPerUser": 15.0
  }
}
```

## Integration Examples

### 1. Financial Report Creation with Usage Tracking
```typescript
// In financial report controller
export const createFinancialReport = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { companyId, year, revenue, ...reportData } = req.body;

  // Create the report
  const report = await FinancialReportRepository.create({
    userId,
    companyId,
    year,
    ...reportData
  });

  // Track usage (handled by middleware)
  // Usage is automatically tracked when this endpoint is called

  res.status(201).json({
    success: true,
    data: report,
  });
});
```

### 2. Loan Simulation with Rate Limiting
```typescript
// In loan controller
router.post('/simulate', 
  authenticateToken,
  apiRateLimit,
  loanSimulationController.simulateLoan
);
```

### 3. Advanced Analysis with Pro Requirement
```typescript
// In AI controller
router.post('/analyze', 
  authenticateToken,
  requirePro('advancedAnalysis'),
  aiAnalysisController.analyzeReport
);
```

## Frontend Integration

### Usage Display Component
```typescript
// Usage dashboard component
export const UsageDashboard = () => {
  const { data: usage } = useQuery({
    queryKey: ['usage', 'summary'],
    queryFn: () => usageApi.getUsageSummary(),
  });

  return (
    <div className="space-y-6">
      {/* Usage cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <UsageCard
          title="Reports This Month"
          used={usage.current.reportsPerMonth.used}
          limit={usage.current.reportsPerMonth.limit}
          icon={DocumentTextIcon}
        />
        <UsageCard
          title="API Requests Today"
          used={usage.current.apiRequestsPerDay.used}
          limit={usage.current.apiRequestsPerDay.limit}
          icon={GlobeAltIcon}
        />
        <SubscriptionCard
          plan={usage.subscriptionPlan}
          isPro={usage.isPro}
        />
      </div>

      {/* Usage alerts */}
      {usage.alerts.length > 0 && (
        <Alerts>
          {usage.alerts.map(alert => (
            <Alert key={alert.feature} severity={alert.type}>
              {alert.message}
              {alert.recommendation && (
                <div className="mt-2">
                  <Button 
                    onClick={() => router.push('/dashboard/profile/subscription')}
                    variant="outline"
                    size="sm"
                  >
                    Upgrade to Pro
                  </Button>
                </div>
              )}
            </Alert>
          ))}
        </Alerts>
      )}

      {/* Usage history chart */}
      <UsageChart history={usage.history} />
    </div>
  );
};
```

### Upgrade Prompt Component
```typescript
// Pro feature gate component
export const ProFeatureGate = ({ 
  feature, 
  children, 
  fallback 
}: { 
  feature: string; 
  children: React.ReactNode; 
  fallback: React.ReactNode; 
}) => {
  const { isPro } = useSubscription();

  if (!isPro && !canAccessFeature(user, feature as keyof UsageLimits)) {
    return fallback;
  }

  return <>{children}</ProFeatureGate>;
};
```

## Error Handling

### HTTP 402 Responses
```typescript
// Custom error handler for freemium features
const handleFreemiumError = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (error.status === 402) {
    return res.status(402).json({
      success: false,
      error: error.error,
      message: error.message,
      feature: error.feature,
      upgradeUrl: error.upgradeUrl,
      limits: error.limits,
    });
  }
  
  next(error);
};
```

## Monitoring and Analytics

### Usage Metrics
- **Daily API requests**: Track API usage patterns
- **Monthly reports**: Monitor report creation trends
- **Upgrade conversions**: Track free-to-pro conversions
- **Feature usage**: Most popular features among free users
- **Usage alerts**: Warning and limit notifications

### Admin Dashboard
- **User statistics**: Total users, Pro/Free breakdown
- **Usage trends**: Peak usage times and patterns
- **Revenue metrics**: Subscription conversion rates
- **Top users**: Most active users by usage

## Security Considerations

### 1. Authentication Required
- All usage tracking requires authenticated users
- User ID validation prevents unauthorized access
- Token validation ensures session integrity

### 2. Rate Limiting
- Prevents abuse of free tier
- Protects server resources
- Fair usage distribution

### 3. Data Integrity
- Atomic usage tracking operations
- Consistent monthly aggregation
- Accurate daily counting

### 4. Privacy Compliance
- Usage data anonymization options
- Data retention policies
- User consent for analytics

## Performance Optimization

### 1. Database Indexing
```sql
-- Optimize for usage queries
CREATE INDEX CONCURRENTLY ON user_usage (userId, month);
CREATE INDEX ON api_usage_logs (userId, created_at);
CREATE INDEX ON api_usage_logs (created_at);
```

### 2. Caching Strategy
- Cache current usage for dashboard
- Cache admin statistics
- Cache usage forecasts

### 3. Batch Processing
- Aggregate usage data periodically
- Clean up old API logs
- Archive historical data

## Testing Strategy

### Unit Tests
```typescript
describe('Usage Service', () => {
  it('should track report usage', async () => {
    const userId = 'test-user-id';
    await usageService.trackReportUsage(userId);
    
    const usage = await usageService.getCurrentUsage(userId);
    expect(usage.reportsPerMonth.used).toBe(1);
  });

  it('should check API limits', async () => {
    const userId = 'test-user-id';
    const alerts = await usageService.checkUsageAlerts(userId);
    expect(alerts).toHaveLength(0);
  });
});
```

### Integration Tests
```typescript
describe('Freemium Middleware', () => {
  it('should block free users from Pro features', async () => {
      const response = await request(app)
        .post('/api/v1/reports/analyze')
        .set('Authorization', `Bearer ${freeUserToken}`)
        .expect(402);
      
      expect(response.body.error).toBe('Upgrade Required');
    });

  it('should allow Pro users unlimited access', async () => {
      const response = await request(app)
        .post('/api/v1/reports/analyze')
        .set('Authorization', `Bearer ${proUserToken}`)
        .expect(200);
    });
});
```

## Migration Guide

### Database Migration
```sql
-- Create user usage table
CREATE TABLE user_usage (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  month TEXT NOT NULL,
  report_count INTEGER DEFAULT 0,
  request_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX user_usage_user_id_month_key ON user_usage(user_id, month);
CREATE INDEX user_usage_month_index ON user_usage(month);

-- Create API usage logs table
CREATE TABLE api_usage_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX api_usage_logs_user_id_index ON api_usage_logs(user_id);
CREATE INDEX api_usage_logs_created_at_index ON api_usage_logs(created_at);
CREATE INDEX api_usage_logs_user_created_at_index ON api_usage_logs(user_id, created_at);
```

### Data Migration Script
```typescript
// Migrate existing user data
const migrateUsageData = async () => {
  const users = await prisma.user.findMany({
    where: { role: 'FREE' },
    include: { subscription: true },
  });

  for (const user of users) {
    // Create initial usage record for current month
      const currentMonth = new Date().toISOString().slice(0, 7);
      await prisma.userUsage.create({
        data: {
          userId: user.id,
          month: currentMonth,
          reportCount: 0,
          requestCount: 0,
        },
        skipDuplicates: true,
      });
    }
};
};
```

This comprehensive freemium system provides robust feature gating, accurate usage tracking, and clear upgrade prompts for FinSathi AI users.
