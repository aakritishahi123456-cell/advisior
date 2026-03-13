/**
 * FinSathi AI - Feature Access Control Examples
 * Demonstrating middleware usage for restricting premium features
 */

const express = require('express');
const FeatureAccessMiddleware = require('../middleware/featureAccessMiddleware');

const app = express();

// Initialize feature access middleware
const featureAccess = new FeatureAccessMiddleware();

// Sample middleware for authentication (mock)
const authMiddleware = (req, res, next) => {
  // Mock user authentication
  req.user = {
    id: 'user-123',
    email: 'john.doe@example.com',
    isAdmin: false
  };
  next();
};

// Sample admin middleware
const adminMiddleware = (req, res, next) => {
  req.user = {
    id: 'admin-123',
    email: 'admin@finsathi.ai',
    isAdmin: true
  };
  next();
};

/**
 * Example 1: Basic AI Advisor endpoint with feature access control
 */
app.get('/api/v1/ai-advisor/generate', 
  authMiddleware,
  featureAccess.requireFeatureAccess('aiAdvisor'),
  async (req, res) => {
    try {
      // User has access to AI advisor feature
      const advice = {
        recommendation: 'BUY',
        confidence: 0.85,
        reasoning: 'Strong technical indicators and positive market sentiment',
        riskLevel: 'MEDIUM',
        targetPrice: 1525,
        stopLoss: 1450
      };

      res.json({
        success: true,
        data: advice,
        message: 'AI advice generated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to generate AI advice',
        message: error.message
      });
    }
  }
);

/**
 * Example 2: Trading signals endpoint with usage tracking
 */
app.post('/api/v1/trading-signals/generate',
  authMiddleware,
  featureAccess.requireFeatureAccessWithUsage('tradingSignals', 'GENERATE_SIGNALS'),
  async (req, res) => {
    try {
      const { symbols, timeFrame } = req.body;
      
      // User has access and usage is tracked
      const signals = [
        {
          symbol: 'NABIL',
          signal: 'BUY',
          confidence: 0.92,
          entryPrice: 1520,
          targetPrice: 1580,
          stopLoss: 1480,
          timeFrame: timeFrame || '1D'
        },
        {
          symbol: 'NICA',
          signal: 'HOLD',
          confidence: 0.68,
          entryPrice: 890,
          targetPrice: 920,
          stopLoss: 860,
          timeFrame: timeFrame || '1D'
        }
      ];

      res.json({
        success: true,
        data: signals,
        message: 'Trading signals generated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to generate trading signals',
        message: error.message
      });
    }
  }
);

/**
 * Example 3: Advanced analysis endpoint with plan level check
 */
app.post('/api/v1/analysis/advanced',
  authMiddleware,
  featureAccess.requirePlanLevel('PRO'),
  async (req, res) => {
    try {
      const { portfolioId, analysisType } = req.body;
      
      // User has PRO plan or higher
      const analysis = {
        portfolioId,
        analysisType,
        results: {
          totalReturn: 12.5,
          sharpeRatio: 1.85,
          maxDrawdown: -8.2,
          volatility: 15.3,
          beta: 0.92,
          alpha: 3.1,
          riskMetrics: {
            valueAtRisk: -2.5,
            expectedShortfall: -3.8,
            downsideDeviation: 8.1
          },
          performanceMetrics: {
            winRate: 68.5,
            profitFactor: 1.95,
            averageWin: 125.3,
            averageLoss: -64.2
          }
        },
        generatedAt: new Date().toISOString()
      };

      res.json({
        success: true,
        data: analysis,
        message: 'Advanced analysis completed successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to perform advanced analysis',
        message: error.message
      });
    }
  }
);

/**
 * Example 4: API access endpoint with rate limiting
 */
app.get('/api/v1/api/market-data',
  authMiddleware,
  featureAccess.requireAPIRateLimit(1000),
  featureAccess.requireFeatureAccess('apiAccess'),
  async (req, res) => {
    try {
      const { symbol, interval } = req.query;
      
      // User has API access and rate limits are set
      const marketData = {
        symbol,
        interval: interval || '1D',
        data: [
          { date: '2024-03-15', open: 1520, high: 1545, low: 1510, close: 1535, volume: 125000 },
          { date: '2024-03-14', open: 1515, high: 1530, low: 1505, close: 1520, volume: 118000 },
          { date: '2024-03-13', open: 1508, high: 1525, low: 1495, close: 1515, volume: 132000 }
        ],
        metadata: {
          lastUpdated: new Date().toISOString(),
          source: 'NEPSE',
          currency: 'NPR'
        }
      };

      res.json({
        success: true,
        data: marketData
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch market data',
        message: error.message
      });
    }
  }
);

/**
 * Example 5: Custom reports endpoint with usage limits
 */
app.post('/api/v1/reports/custom',
  authMiddleware,
  featureAccess.requireUsageLimit('customReports', 'GENERATE_REPORT'),
  async (req, res) => {
    try {
      const { reportType, parameters } = req.body;
      
      // User has access and usage limits are checked
      const report = {
        id: `report_${Date.now()}`,
        type: reportType,
        parameters,
        generatedAt: new Date().toISOString(),
        data: {
          summary: {
            totalAssets: 12,
            totalValue: 2500000,
            totalReturn: 15.2,
            riskScore: 7.2
          },
          details: [
            { symbol: 'NABIL', shares: 100, value: 152500, return: 8.5 },
            { symbol: 'NICA', shares: 200, value: 178000, return: 12.3 },
            { symbol: 'SBL', shares: 150, value: 135000, return: 18.7 }
          ],
          charts: {
            performance: 'chart_data_here',
            allocation: 'chart_data_here',
            risk: 'chart_data_here'
          }
        }
      };

      res.json({
        success: true,
        data: report,
        message: 'Custom report generated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to generate custom report',
        message: error.message
      });
    }
  }
);

/**
 * Example 6: Multiple features access (any feature)
 */
app.get('/api/v1/premium/dashboard',
  authMiddleware,
  featureAccess.requireAnyFeature(['aiAdvisor', 'tradingSignals', 'advancedAnalysis']),
  async (req, res) => {
    try {
      // User has access to at least one premium feature
      const dashboard = {
        features: {
          aiAdvisor: true,
          tradingSignals: true,
          advancedAnalysis: true,
          apiAccess: false,
          customReports: false
        },
        summary: {
          portfolioValue: 2500000,
          totalReturn: 15.2,
          riskScore: 7.2,
          lastUpdated: new Date().toISOString()
        },
        alerts: [
          { type: 'BUY', symbol: 'NABIL', confidence: 0.92 },
          { type: 'SELL', symbol: 'NICA', confidence: 0.78 }
        ],
        recommendations: [
          { symbol: 'SBL', action: 'BUY', reason: 'Strong momentum' },
          { symbol: 'NABIL', action: 'HOLD', reason: 'Consolidation phase' }
        ]
      };

      res.json({
        success: true,
        data: dashboard
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to load premium dashboard',
        message: error.message
      });
    }
  }
);

/**
 * Example 7: Feature analytics endpoint
 */
app.get('/api/v1/features/analytics',
  authMiddleware,
  featureAccess.requireFeatureAnalytics(),
  async (req, res) => {
    // This endpoint is handled by the middleware itself
    // The response will be generated by the requireFeatureAnalytics middleware
  }
);

/**
 * Example 8: Cached feature access for high-traffic endpoints
 */
app.get('/api/v1/features/status',
  authMiddleware,
  featureAccess.requireFeatureAccessCached('aiAdvisor', 300), // 5 minute cache
  async (req, res) => {
    try {
      const features = await featureAccess.getUserFeatures(req.user.id);
      
      res.json({
        success: true,
        data: features,
        message: 'Feature status retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get feature status',
        message: error.message
      });
    }
  }
);

/**
 * Example 9: Admin endpoint for feature management
 */
app.get('/api/v1/admin/features/usage',
  adminMiddleware,
  async (req, res) => {
    try {
      // Admin can view all feature usage
      const analytics = {
        totalUsers: 1250,
        activeSubscriptions: 850,
        featureUsage: {
          aiAdvisor: {
            totalUsage: 15000,
            uniqueUsers: 680,
            averageUsagePerUser: 22.1
          },
          tradingSignals: {
            totalUsage: 25000,
            uniqueUsers: 750,
            averageUsagePerUser: 33.3
          },
          advancedAnalysis: {
            totalUsage: 8000,
            uniqueUsers: 450,
            averageUsagePerUser: 17.8
          },
          apiAccess: {
            totalUsage: 50000,
            uniqueUsers: 120,
            averageUsagePerUser: 416.7
          }
        },
        planDistribution: {
          FREE: 400,
          PRO: 600,
          INVESTOR: 250
        }
      };

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get admin analytics',
        message: error.message
      });
    }
  }
);

/**
 * Example 10: Error handling for access denied
 */
app.use((err, req, res, next) => {
  if (err.name === 'FeatureAccessDenied') {
    return res.status(403).json({
      success: false,
      error: 'Feature access denied',
      message: err.message,
      data: {
        featureKey: err.featureKey,
        currentPlan: err.currentPlan,
        requiredPlans: err.requiredPlans,
        upgradeUrl: '/subscription/plans'
      }
    });
  }

  if (err.name === 'UsageLimitExceeded') {
    return res.status(429).json({
      success: false,
      error: 'Usage limit exceeded',
      message: err.message,
      data: {
        featureKey: err.featureKey,
        limit: err.limit,
        used: err.used,
        resetDate: err.resetDate
      }
    });
  }

  // Handle other errors
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

/**
 * Example 11: Middleware composition
 */
app.post('/api/v1/portfolio/optimize',
  authMiddleware,
  [
    featureAccess.requireFeatureAccess('aiAdvisor'),
    featureAccess.requirePlanLevel('PRO'),
    featureAccess.requireUsageLimit('advancedAnalysis', 'OPTIMIZE_PORTFOLIO')
  ],
  async (req, res) => {
    try {
      const { portfolioId, optimizationGoals, riskTolerance } = req.body;
      
      // User has passed all access checks
      const optimization = {
        portfolioId,
        optimizationGoals,
        riskTolerance,
        results: {
          currentAllocation: {
            'Banking': 45,
            'Energy': 25,
            'Finance': 20,
            'Manufacturing': 10
          },
          optimizedAllocation: {
            'Banking': 35,
            'Energy': 30,
            'Finance': 25,
            'Manufacturing': 10
          },
          expectedReturn: 18.5,
          expectedRisk: 12.2,
          sharpeRatio: 1.52
        },
        generatedAt: new Date().toISOString()
      };

      res.json({
        success: true,
        data: optimization,
        message: 'Portfolio optimization completed successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to optimize portfolio',
        message: error.message
      });
    }
  }
);

/**
 * Example 12: Dynamic feature access based on user context
 */
app.get('/api/v1/features/dynamic/:featureKey',
  authMiddleware,
  async (req, res) => {
    try {
      const { featureKey } = req.params;
      const userId = req.user.id;
      
      // Check access dynamically
      const hasAccess = await featureAccess.subscriptionService.hasFeatureAccess(userId, featureKey);
      
      if (!hasAccess) {
        const subscription = await featureAccess.checkSubscription(userId);
        const currentPlan = subscription?.plan?.name || 'FREE';
        
        return res.status(403).json({
          success: false,
          error: 'Feature access denied',
          message: `The ${featureKey} feature requires a paid subscription`,
          data: {
            featureKey,
            currentPlan,
            upgradeUrl: '/subscription/plans'
          }
        });
      }

      // Get feature details
      const features = await featureAccess.getUserFeatures(userId);
      const feature = features.find(f => f.key === featureKey);
      
      res.json({
        success: true,
        data: {
          featureKey,
          hasAccess: true,
          details: feature,
          availableActions: ['view', 'use', 'track']
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to check feature access',
        message: error.message
      });
    }
  }
);

/**
 * Example 13: Feature access with conditional logic
 */
app.get('/api/v1/features/conditional/:featureKey',
  authMiddleware,
  async (req, res) => {
    try {
      const { featureKey } = req.params;
      const userId = req.user.id;
      
      // Check subscription
      const subscription = await featureAccess.checkSubscription(userId);
      const currentPlan = subscription?.plan?.name || 'FREE';
      
      // Define conditional access rules
      const accessRules = {
        aiAdvisor: {
          FREE: false,
          PRO: true,
          INVESTOR: true
        },
        tradingSignals: {
          FREE: false,
          PRO: true,
          INVESTOR: true
        },
        advancedAnalysis: {
          FREE: false,
          PRO: true,
          INVESTOR: true
        },
        apiAccess: {
          FREE: false,
          PRO: false,
          INVESTOR: true
        }
      };

      const hasAccess = accessRules[featureKey]?.[currentPlan] || false;
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'Feature access denied',
          message: `The ${featureKey} feature is not available in your ${currentPlan} plan`,
          data: {
            featureKey,
            currentPlan,
            accessRules: accessRules[featureKey],
            upgradeUrl: '/subscription/plans'
          }
        });
      }

      res.json({
        success: true,
        data: {
          featureKey,
          hasAccess,
          currentPlan,
          accessLevel: currentPlan
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to check conditional access',
        message: error.message
      });
    }
  }
);

// Export the app for testing
module.exports = app;

/**
 * Usage Examples:
 * 
 * 1. Basic feature access:
 *    app.get('/endpoint', authMiddleware, featureAccess.requireFeatureAccess('aiAdvisor'), handler);
 * 
 * 2. With usage tracking:
 *    app.post('/endpoint', authMiddleware, featureAccess.requireFeatureAccessWithUsage('aiAdvisor', 'GENERATE'), handler);
 * 
 * 3. Plan level check:
 *    app.get('/endpoint', authMiddleware, featureAccess.requirePlanLevel('PRO'), handler);
 * 
 * 4. Usage limits:
 *    app.post('/endpoint', authMiddleware, featureAccess.requireUsageLimit('customReports', 'GENERATE'), handler);
 * 
 * 5. Multiple features:
 *    app.get('/endpoint', authMiddleware, featureAccess.requireAnyFeature(['aiAdvisor', 'tradingSignals']), handler);
 * 
 * 6. Cached access:
 *    app.get('/endpoint', authMiddleware, featureAccess.requireFeatureAccessCached('aiAdvisor', 300), handler);
 * 
 * 7. API rate limiting:
 *    app.get('/endpoint', authMiddleware, featureAccess.requireAPIRateLimit(1000), handler);
 */
