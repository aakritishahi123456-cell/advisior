/**
 * FinSathi AI - Feature Access Control Middleware
 * Middleware to restrict premium features to paying users
 */

const SubscriptionService = require('../services/subscriptionService');

class FeatureAccessMiddleware {
  constructor() {
    this.subscriptionService = new SubscriptionService();
    this.featurePlans = {
      aiAdvisor: ['PRO', 'INVESTOR'],
      tradingSignals: ['PRO', 'INVESTOR'],
      advancedAnalysis: ['PRO', 'INVESTOR'],
      apiAccess: ['INVESTOR'],
      customReports: ['INVESTOR'],
      prioritySupport: ['PRO', 'INVESTOR'],
      unlimitedPortfolio: ['INVESTOR']
    };
  }

  /**
   * Create middleware for specific feature access
   */
  requireFeatureAccess(featureKey) {
    return async (req, res, next) => {
      try {
        const userId = req.user.id;
        
        if (!userId) {
          return res.status(401).json({
            success: false,
            error: 'Authentication required',
            message: 'Please log in to access this feature'
          });
        }

        const hasAccess = await this.subscriptionService.hasFeatureAccess(userId, featureKey);
        
        if (!hasAccess) {
          const subscription = await this.subscriptionService.getUserSubscription(userId);
          const planName = subscription.plan?.name || 'FREE';
          
          return res.status(403).json({
            success: false,
            error: 'Feature access denied',
            message: `This feature requires a ${planName} plan or higher`,
            data: {
              featureKey,
              currentPlan: planName,
              requiredPlans: this.featurePlans[featureKey],
              upgradeUrl: '/subscription/plans'
            }
          });
        }

        // Track usage
        await this.subscriptionService.trackFeatureUsage(userId, featureKey, 'API_ACCESS');
        next();
      } catch (error) {
        console.error('Feature access error:', error);
        return res.status(500).json({
          success: false,
          error: 'Access check failed',
          message: 'Unable to verify feature access'
        });
      }
    };
  }

  /**
   * Create middleware for multiple features
   */
  requireAnyFeature(featureKeys) {
    return async (req, res, next) => {
      try {
        const userId = req.user.id;
        
        if (!userId) {
          return res.status(401).json({
            success: false,
            error: 'Authentication required',
            message: 'Please log in to access this feature'
          });
        }

        // Check if user has access to any of the specified features
        let hasAccess = false;
        let accessibleFeatures = [];
        
        for (const featureKey of featureKeys) {
          const access = await this.subscriptionService.hasFeatureAccess(userId, featureKey);
          if (access) {
            hasAccess = true;
            accessibleFeatures.push(featureKey);
          }
        }

        if (!hasAccess) {
          const subscription = await this.subscriptionService.getUserSubscription(userId);
          const planName = subscription.plan?.name || 'FREE';
          
          return res.status(403).json({
            success: false,
            error: 'Feature access denied',
            message: `These features require a ${planName} plan or higher`,
            data: {
              requestedFeatures: featureKeys,
              accessibleFeatures,
              currentPlan: planName,
              requiredPlans: this.getRequiredPlansForFeatures(featureKeys),
              upgradeUrl: '/subscription/plans'
            }
          });
        }

        // Track usage for all accessible features
        for (const featureKey of accessibleFeatures) {
          await this.subscriptionService.trackFeatureUsage(userId, featureKey, 'API_ACCESS');
        }

        next();
      } catch (error) {
        console.error('Multiple feature access error:', error);
        return res.status(500).json({
          success: false,
          error: 'Access check failed',
          message: 'Unable to verify feature access'
        });
      };
    }
  }

  /**
   * Create middleware with usage tracking
   */
  requireFeatureAccessWithUsage(featureKey, action = 'API_CALL') {
    return async (req, res, next) => {
      try {
        const userId = req.user.id;
        
        if (!userId) {
          return res.status(401).json({
            success: false,
            error: 'Authentication required',
            message: 'Please log in to access this feature'
          });
        }

        const hasAccess = await this.subscriptionService.hasFeatureAccess(userId, featureKey);
        
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            error: 'Feature access denied',
            message: 'This feature requires a paid subscription'
          });
        }

        // Track usage
        await this.subscriptionService.trackFeatureUsage(userId, featureKey, action);
        next();
      } catch (error) {
        console.error('Feature access with usage error:', error);
        return res.status(500).json({
          success: false,
          error: 'Access check failed',
          message: 'Unable to verify feature access'
        });
      };
    }
  }

  /**
   * Create middleware with plan level check
   */
  requirePlanLevel(minimumPlan) {
    return async (req, res, next) => {
      try {
        const userId = req.user.id;
        
        if (!userId) {
          return res.status(401).json({
            success: false,
            error: 'Authentication required',
            message: 'Please log in to access this feature'
          });
        }

        const subscription = await this.subscriptionService.getUserSubscription(userId);
        const currentPlan = subscription.plan?.name || 'FREE';
        const planLevels = ['FREE', 'PRO', 'INVESTOR'];
        const currentLevel = planLevels.indexOf(currentPlan);
        const requiredLevel = planLevels.indexOf(minimumPlan);

        if (currentLevel < requiredLevel) {
          return res.status(403).json({
            success: false,
            error: 'Plan level insufficient',
            message: `This feature requires a ${minimumPlan} plan or higher`,
            data: {
              currentPlan,
              requiredPlan: minimumPlan,
              upgradeUrl: '/subscription/plans'
            }
          });
        }

        next();
      } catch (error) {
        console.error('Plan level check error:', error);
        return res.status(500).json({
          success: false,
          error: 'Plan check failed',
          message: 'Unable to verify subscription level'
        });
      };
    }
  }

  /**
   * Create middleware for usage limit checking
   */
  requireUsageLimit(featureKey, action = 'API_CALL') {
    return async (req, res, next) => {
      try {
        const userId = req.user.id;
        
        if (!userId) {
          return res.status(401).json({
            success: false,
            error: 'Authentication required',
            message: 'Please log in to access this feature'
          });
        }

        const subscription = await this.subscriptionService.getUserSubscription(userId);
        const feature = subscription.features[featureKey];
        
        if (!feature || !feature.enabled) {
          return res.status(403).json({
            success: false,
            error: 'Feature not available',
            message: 'This feature is not available in your plan'
          });
        }

        // Check usage limits
        if (feature.limits && feature.limits.maxUses) {
          const usage = feature.usage?.usageCount || 0;
          const remaining = feature.limits.maxUses - usage;
          
          if (remaining <= 0) {
            return res.status(429).json({
              success: false,
              error: 'Usage limit exceeded',
              message: `You have reached your limit for ${feature.name}`,
              data: {
                featureKey,
                limit: feature.limits.maxUses,
                used: usage,
                remaining: 0,
                resetDate: feature.usage?.periodEnd
              }
            });
          }

          // Add usage limit headers
          res.set('X-Usage-Limit', feature.limits.maxUses);
          res.set('X-Usage-Used', usage);
          res.set('X-Usage-Remaining', remaining);
        }

        // Track usage
        await this.subscriptionService.trackFeatureUsage(userId, featureKey, action);
        next();
      } catch (error) {
        console.error('Usage limit check error:', error);
        return res.status(500).json({
          success: false,
          error: 'Usage check failed',
          message: 'Unable to check usage limits'
        });
      };
    }
  }

  /**
   * Get required plans for multiple features
   */
  getRequiredPlansForFeatures(featureKeys) {
    const requiredPlans = new Set();
    
    for (const featureKey of featureKeys) {
      const plans = this.featurePlans[featureKey] || [];
      plans.forEach(plan => requiredPlans.add(plan));
    }
    
    return Array.from(requiredPlans);
  }

  /**
   * Create middleware for API rate limiting based on subscription
   */
  requireAPIRateLimit(defaultLimit = 100) {
    return async (req, res, next) => {
      try {
        const userId = req.user.id;
        
        if (!userId) {
          return res.status(401).json({
            success: false,
            error: 'Authentication required',
            message: 'Please log in to access this API'
          });
        }

        const subscription = await this.subscriptionService.getUserSubscription(userId);
        const planName = subscription.plan?.name || 'FREE';
        
        // Set rate limits based on plan
        let rateLimit = defaultLimit;
        switch (planName) {
          case 'PRO':
            rateLimit = 1000;
            break;
          case 'INVESTOR':
            rateLimit = 5000;
            break;
          default:
            rateLimit = defaultLimit;
        }

        res.set('X-Rate-Limit', rateLimit);
        next();
      } catch (error) {
        console.error('API rate limiting error:', error);
        res.status(500).json({
          success: false,
          error: 'Rate limiting failed',
          message: 'Unable to set rate limit'
        });
      };
    }
  }

  /**
   * Create middleware for concurrent request limiting
   */
  requireConcurrencyLimit(maxConcurrent = 5) {
    return async (req, res, next) => {
      try {
        const userId = req.user.id;
        
        if (!userId) {
          return res.status(401).json({
            success: false,
            error: 'Authentication required',
            message: 'Please log in to access this API'
          });
        }

        const subscription = await this.subscriptionService.getUserSubscription(userId);
        const planName = subscription.plan?.name || 'FREE';
        
        // Set concurrent request limits based on plan
        let maxConcurrent = maxConcurrent;
        switch (planName) {
          case 'PRO':
            maxConcurrent = 10;
            break;
          case 'INVESTOR':
            maxConcurrent = 50;
            break;
          default:
            maxConcurrent = 5;
        }

        res.set('X-Concurrency-Limit', maxConcurrent);
        next();
      } catch (error) {
          console.error('Concurrency limiting error:', error);
          res.status(500).json({
            success: false,
            error: 'Concurrency limiting failed',
            message: 'Unable to set concurrency limit'
          });
      };
    };
  }

  /**
   * Create middleware for feature access with caching
   */
  requireFeatureAccessCached(featureKey, cacheTime = 300) {
    const cache = new Map();
    
    return async (req, res, next) => {
      try {
        const userId = req.user.id;
        const cacheKey = `${userId}:${featureKey}`;
        
        if (!userId) {
          return res.status(401).json({
            success: false,
            error: 'Authentication required',
            message: 'Please log in to access this feature'
          });
        }

        // Check cache first
        if (cache.has(cacheKey)) {
          const cached = cache.get(cacheKey);
          const now = Date.now();
          
          if (now - cached.timestamp < cacheTime) {
            if (!cached.hasAccess) {
              return res.status(403).json({
                success: false,
                error: 'Feature access denied',
                message: cached.errorMessage
              });
            }
            
          // Track usage
          await this.subscriptionService.trackFeatureUsage(userId, featureKey, 'API_ACCESS');
          return next();
        }

        // Check access and cache result
        const hasAccess = await this.subscriptionService.hasFeatureAccess(userId, featureKey);
        
        const errorMessage = this.getAccessDeniedMessage(userId, featureKey);
        
        cache.set(cacheKey, {
          hasAccess,
          errorMessage,
          timestamp: Date.now()
        });

        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            error: 'Feature access denied',
            message: errorMessage
          });
        }

        // Track usage
        await this.subscriptionService.trackFeatureUsage(userId, featureKey, 'API_ACCESS');
        return next();
      } catch (error) {
        console.error('Cached feature access error:', error);
        return res.status(500).json({
          success: false,
          error: 'Access check failed',
          message: 'Unable to verify feature access'
        });
      }
    };
  }

  /**
   * Get access denied message for a user and feature
   */
  getAccessDeniedMessage(userId, featureKey) {
    const requiredPlans = this.featurePlans[featureKey] || [];
    const subscription = this.subscriptionService.getUserSubscription(userId);
    const currentPlan = subscription.plan?.name || 'FREE';
    
    if (requiredPlans.length === 0) {
      return `The ${featureKey} feature requires a paid subscription`;
    }
    
    return `The ${featureKey} feature requires a ${requiredPlans.join(' or ')} plan. Your current plan is ${currentPlan}.`;
  }

  /**
   * Check if user has subscription without throwing error
   */
  async checkSubscription(userId) {
    try {
      const subscription = await this.subscriptionService.getUserSubscription(userId);
      return subscription;
    } catch (error) {
      console.error('Error checking subscription:', error);
      return null;
    }
  }

  /**
   * Get user's available features
   */
  async getUserFeatures(userId) {
    try {
      const subscription = await this.subscriptionService.getUserSubscription(userId);
      const features = subscription.features || {};
      
      return Object.keys(features).map(key => ({
        key,
        name: features[key].name || key,
        enabled: features[key].enabled,
        limits: features[key].limits,
        usage: features[key].usage
      }));
    } catch (error) {
      console.error('Error getting user features:', error);
      return [];
    }
  }

  /**
   * Create middleware for feature analytics
   */
  requireFeatureAnalytics() {
    return async (req, res, next) => {
      try {
        const userId = req.user.id;
        
        if (!userId) {
          return res.status(401).json({
            success: false,
            error: 'Authentication required',
            message: 'Please log in to view analytics'
          });
        }

        // Get user's feature usage
        const features = await this.getUserFeatures(userId);
        const usageAnalytics = {};
        
        for (const feature of features) {
          const usage = await this.subscriptionService.getFeatureUsage(userId, feature.key, 'current');
          usageAnalytics[feature.key] = {
            name: feature.name,
            enabled: feature.enabled,
            usage: usage ? usage.length : 0,
            limits: feature.limits
          };
        }

        res.json({
          success: true,
          data: usageAnalytics
        });
      } catch (error) {
        console.error('Error getting feature analytics:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to get feature analytics',
          message: error.message
        });
      }
    };
  }
}

module.exports = FeatureAccessMiddleware;
