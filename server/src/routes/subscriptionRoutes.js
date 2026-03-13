/**
 * FinSathi AI - Subscription Management API Routes
 * Express routes for subscription management and premium features
 */

const express = require('express');
const SubscriptionController = require('../controllers/subscriptionController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const controller = new SubscriptionController();

// Middleware for request logging
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Subscription Plan Endpoints

/**
 * GET /api/v1/subscription/plans
 * Get all available subscription plans
 * Public endpoint
 */
router.get('/plans', controller.getPlans.bind(controller));

/**
 * GET /api/v1/subscription/current
 * Get user's current subscription
 * Requires authentication
 */
router.get('/current', authMiddleware, controller.getUserSubscription.bind(controller));

/**
 * POST /api/v1/subscription/subscribe
 * Subscribe to a plan
 * Requires authentication
 * Body: { planName, paymentMethod, couponCode? }
 */
router.post('/subscribe', authMiddleware, controller.subscribe.bind(controller));

/**
 * POST /api/v1/subscription/cancel
 * Cancel subscription
 * Requires authentication
 * Body: { reason? }
 */
router.post('/cancel', authMiddleware, controller.cancelSubscription.bind(controller));

/**
 * GET /api/v1/subscription/history
 * Get subscription history
 * Requires authentication
 */
router.get('/history', authMiddleware, controller.getSubscriptionHistory.bind(controller));

// Feature Access Endpoints

/**
 * GET /api/v1/subscription/features/:featureKey/access
 * Check if user has access to a specific feature
 * Requires authentication
 */
router.get('/features/:featureKey/access', authMiddleware, controller.checkFeatureAccess.bind(controller));

/**
 * POST /api/v1/subscription/features/:featureKey/usage
 * Track feature usage
 * Requires authentication
 * Body: { action? }
 */
router.post('/features/:featureKey/usage', authMiddleware, controller.trackFeatureUsage.bind(controller));

/**
 * GET /api/v1/subscription/features/usage
 * Get feature usage statistics
 * Requires authentication
 * Query params: featureKey?, period?
 */
router.get('/features/usage', authMiddleware, controller.getFeatureUsage.bind(controller));

// Billing and Payment Endpoints

/**
 * GET /api/v1/subscription/billing
 * Get billing information
 * Requires authentication
 */
router.get('/billing', authMiddleware, controller.getBillingInfo.bind(controller));

/**
 * PUT /api/v1/subscription/auto-renew
 * Update auto-renew setting
 * Requires authentication
 * Body: { autoRenew }
 */
router.put('/auto-renew', authMiddleware, controller.updateAutoRenew.bind(controller));

/**
 * GET /api/v1/subscription/payment-methods
 * Get available payment methods
 * Requires authentication
 */
router.get('/payment-methods', authMiddleware, controller.getPaymentMethods.bind(controller));

/**
 * POST /api/v1/subscription/payment-methods
 * Add a new payment method
 * Requires authentication
 * Body: { type, cardDetails }
 */
router.post('/payment-methods', authMiddleware, controller.addPaymentMethod.bind(controller));

// Coupon Management

/**
 * POST /api/v1/subscription/coupons/validate
 * Validate a coupon code
 * Requires authentication
 * Body: { couponCode, planName? }
 */
router.post('/coupons/validate', authMiddleware, controller.validateCoupon.bind(controller));

// Admin Endpoints

/**
 * GET /api/v1/subscription/admin/analytics
 * Get subscription analytics
 * Requires admin authentication
 * Query params: userId?
 */
router.get('/admin/analytics', authMiddleware, controller.getSubscriptionAnalytics.bind(controller));

// Feature-specific middleware examples

/**
 * AI Advisor Feature Access
 * This middleware checks if user has access to AI advisor feature
 */
const requireAIAdvisorAccess = controller.requireFeatureAccess('aiAdvisor');

/**
 * Trading Signals Feature Access
 * This middleware checks if user has access to trading signals feature
 */
const requireTradingSignalsAccess = controller.requireFeatureAccess('tradingSignals');

/**
 * Advanced Analysis Feature Access
 * This middleware checks if user has access to advanced analysis feature
 */
const requireAdvancedAnalysisAccess = controller.requireFeatureAccess('advancedAnalysis');

// Premium Feature Routes with Access Control

/**
 * GET /api/v1/subscription/premium/ai-advisor
 * AI Advisor endpoint - requires premium subscription
 */
router.get('/premium/ai-advisor', [authMiddleware, requireAIAdvisorAccess], (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'AI Advisor feature is available',
      features: ['Personalized advice', 'Risk assessment', 'Portfolio recommendations']
    }
  });
});

/**
 * GET /api/v1/subscription/premium/trading-signals
 * Trading Signals endpoint - requires premium subscription
 */
router.get('/premium/trading-signals', [authMiddleware, requireTradingSignalsAccess], (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'Trading Signals feature is available',
      features: ['Buy/sell signals', 'Technical analysis', 'Market insights']
    }
  });
});

/**
 * GET /api/v1/subscription/premium/advanced-analysis
 * Advanced Analysis endpoint - requires premium subscription
 */
router.get('/premium/advanced-analysis', [authMiddleware, requireAdvancedAnalysisAccess], (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'Advanced Analysis feature is available',
      features: ['Detailed analytics', 'Risk metrics', 'Performance reports']
    }
  });
});

// Usage tracking for premium features

/**
 * POST /api/v1/subscription/premium/ai-advisor/generate
 * Generate AI advice - tracks usage
 */
router.post('/premium/ai-advisor/generate', [
  authMiddleware, 
  requireAIAdvisorAccess,
  controller.trackUsage('aiAdvisor', 'GENERATE_ADVICE')
], (req, res) => {
  res.json({
    success: true,
    data: {
      advice: 'Generated AI advice based on your portfolio',
      timestamp: new Date().toISOString()
    }
  });
});

/**
 * POST /api/v1/subscription/premium/trading-signals/generate
 * Generate trading signals - tracks usage
 */
router.post('/premium/trading-signals/generate', [
  authMiddleware, 
  requireTradingSignalsAccess,
  controller.trackUsage('tradingSignals', 'GENERATE_SIGNALS')
], (req, res) => {
  res.json({
    success: true,
    data: {
      signals: [
        { symbol: 'NABIL', signal: 'BUY', confidence: 0.85 },
        { symbol: 'NICA', signal: 'HOLD', confidence: 0.72 }
      ],
      timestamp: new Date().toISOString()
    }
  });
});

/**
 * POST /api/v1/subscription/premium/advanced-analysis/report
 * Generate advanced analysis report - tracks usage
 */
router.post('/premium/advanced-analysis/report', [
  authMiddleware, 
  requireAdvancedAnalysisAccess,
  controller.trackUsage('advancedAnalysis', 'GENERATE_REPORT')
], (req, res) => {
  res.json({
    success: true,
    data: {
      report: {
        portfolioAnalysis: 'Detailed portfolio analysis',
        riskAssessment: 'Comprehensive risk assessment',
        recommendations: 'Personalized recommendations'
      },
      timestamp: new Date().toISOString()
    }
  });
});

// Feature Limits and Quotas

/**
 * GET /api/v1/subscription/limits/:featureKey
 * Get usage limits for a feature
 */
router.get('/limits/:featureKey', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { featureKey } = req.params;
    
    const subscription = await controller.subscriptionService.getUserSubscription(userId);
    const feature = subscription.features[featureKey];
    
    if (!feature) {
      return res.status(404).json({
        success: false,
        error: 'Feature not found',
        message: `Feature ${featureKey} is not available`
      });
    }

    res.json({
      success: true,
      data: {
        featureKey,
        enabled: feature.enabled,
        limits: feature.limits,
        usage: feature.usage,
        remaining: feature.limits?.maxUses ? 
          Math.max(0, feature.limits.maxUses - (feature.usage?.usageCount || 0)) : 
          'unlimited'
      }
    });
  } catch (error) {
    console.error('Error fetching feature limits:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feature limits',
      message: error.message
    });
  }
});

// Subscription Comparison

/**
 * GET /api/v1/subscription/compare
 * Compare subscription plans
 */
router.get('/compare', async (req, res) => {
  try {
    const plans = await controller.subscriptionService.getPlans();
    
    const comparison = plans.map(plan => ({
      name: plan.name,
      displayName: plan.displayName,
      price: plan.price,
      features: plan.features,
      isPopular: plan.name === 'PRO'
    }));

    res.json({
      success: true,
      data: comparison
    });
  } catch (error) {
    console.error('Error comparing plans:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to compare plans',
      message: error.message
    });
  }
});

// Subscription Upgrade/Downgrade

/**
 * POST /api/v1/subscription/upgrade
 * Upgrade subscription plan
 */
router.post('/upgrade', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { targetPlan, paymentMethod, couponCode } = req.body;

    if (!targetPlan || !paymentMethod) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'targetPlan and paymentMethod are required'
      });
    }

    const subscription = await controller.subscriptionService.subscribe(
      userId, 
      targetPlan, 
      paymentMethod, 
      couponCode
    );

    res.json({
      success: true,
      data: subscription,
      message: 'Subscription upgraded successfully'
    });
  } catch (error) {
    console.error('Error upgrading subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upgrade subscription',
      message: error.message
    });
  }
});

// Subscription Status Check

/**
 * GET /api/v1/subscription/status
 * Check subscription status and features
 */
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const subscription = await controller.subscriptionService.getUserSubscription(userId);

    const status = {
      plan: subscription.plan.displayName,
      status: subscription.status,
      endDate: subscription.endDate,
      autoRenew: subscription.autoRenew,
      features: Object.keys(subscription.features).map(key => ({
        key,
        name: subscription.features[key].name,
        enabled: subscription.features[key].enabled,
        usage: subscription.features[key].usage
      }))
    };

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error checking subscription status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check subscription status',
      message: error.message
    });
  }
});

// Webhook for payment gateway notifications

/**
 * POST /api/v1/subscription/webhook/payment
 * Handle payment gateway webhooks
 */
router.post('/webhook/payment', async (req, res) => {
  try {
    const { event, data } = req.body;

    // Verify webhook signature (implementation depends on payment gateway)
    const isValid = await verifyWebhookSignature(req);
    
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid webhook signature'
      });
    }

    // Process webhook event
    switch (event) {
      case 'payment.succeeded':
        await handlePaymentSuccess(data);
        break;
      case 'payment.failed':
        await handlePaymentFailure(data);
        break;
      case 'subscription.created':
        await handleSubscriptionCreated(data);
        break;
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(data);
        break;
      default:
        console.log('Unhandled webhook event:', event);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process webhook'
    });
  }
});

// Helper functions for webhook handling
async function verifyWebhookSignature(req) {
  // Implementation depends on payment gateway
  return true; // For demonstration
}

async function handlePaymentSuccess(data) {
  console.log('Payment success:', data);
  // Update subscription status, send confirmation email, etc.
}

async function handlePaymentFailure(data) {
  console.log('Payment failure:', data);
  // Update subscription status, send notification, etc.
}

async function handleSubscriptionCreated(data) {
  console.log('Subscription created:', data);
  // Send welcome email, initialize features, etc.
}

async function handleSubscriptionCancelled(data) {
  console.log('Subscription cancelled:', data);
  // Process cancellation, send confirmation, etc.
}

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Subscription API Error:', error);
  
  if (error.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json({
      success: false,
      error: 'Database error',
      message: 'Invalid request parameters'
    });
  }
  
  if (error.name === 'PrismaClientUnknownRequestError') {
    return res.status(500).json({
      success: false,
      error: 'Database connection error',
      message: 'Unable to connect to database'
    });
  }
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

module.exports = router;
