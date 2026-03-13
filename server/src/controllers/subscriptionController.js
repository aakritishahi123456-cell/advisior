/**
 * FinSathi AI - Subscription Management API Controller
 * REST API endpoints for subscription management and premium features
 */

const SubscriptionService = require('../services/subscriptionService');

class SubscriptionController {
  constructor() {
    this.subscriptionService = new SubscriptionService();
  }

  /**
   * Get all available subscription plans
   */
  async getPlans(req, res) {
    try {
      const plans = await this.subscriptionService.getPlans();

      res.json({
        success: true,
        data: plans
      });
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch subscription plans',
        message: error.message
      });
    }
  }

  /**
   * Get user's current subscription
   */
  async getUserSubscription(req, res) {
    try {
      const userId = req.user.id;
      const subscription = await this.subscriptionService.getUserSubscription(userId);

      res.json({
        success: true,
        data: subscription
      });
    } catch (error) {
      console.error('Error fetching user subscription:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user subscription',
        message: error.message
      });
    }
  }

  /**
   * Subscribe to a plan
   */
  async subscribe(req, res) {
    try {
      const userId = req.user.id;
      const { planName, paymentMethod, couponCode } = req.body;

      if (!planName || !paymentMethod) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'planName and paymentMethod are required'
        });
      }

      const subscription = await this.subscriptionService.subscribe(
        userId, 
        planName, 
        paymentMethod, 
        couponCode
      );

      res.status(201).json({
        success: true,
        data: subscription,
        message: 'Subscription created successfully'
      });
    } catch (error) {
      console.error('Error creating subscription:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create subscription',
        message: error.message
      });
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(req, res) {
    try {
      const userId = req.user.id;
      const { reason } = req.body;

      const result = await this.subscriptionService.cancelSubscription(userId, reason);

      res.json({
        success: true,
        data: result,
        message: 'Subscription cancelled successfully'
      });
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cancel subscription',
        message: error.message
      });
    }
  }

  /**
   * Check feature access
   */
  async checkFeatureAccess(req, res) {
    try {
      const userId = req.user.id;
      const { featureKey } = req.params;

      if (!featureKey) {
        return res.status(400).json({
          success: false,
          error: 'Feature key is required',
          message: 'Please provide a feature key'
        });
      }

      const hasAccess = await this.subscriptionService.hasFeatureAccess(userId, featureKey);

      res.json({
        success: true,
        data: {
          featureKey,
          hasAccess,
          userId
        }
      });
    } catch (error) {
      console.error('Error checking feature access:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check feature access',
        message: error.message
      });
    }
  }

  /**
   * Track feature usage
   */
  async trackFeatureUsage(req, res) {
    try {
      const userId = req.user.id;
      const { featureKey, action = 'USE' } = req.body;

      if (!featureKey) {
        return res.status(400).json({
          success: false,
          error: 'Feature key is required',
          message: 'Please provide a feature key'
        });
      }

      // Check if user has access to the feature
      const hasAccess = await this.subscriptionService.hasFeatureAccess(userId, featureKey);
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'You do not have access to this feature'
        });
      }

      const tracked = await this.subscriptionService.trackFeatureUsage(userId, featureKey, action);

      res.json({
        success: true,
        data: {
          featureKey,
          action,
          tracked,
          userId
        }
      });
    } catch (error) {
      console.error('Error tracking feature usage:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to track feature usage',
        message: error.message
      });
    }
  }

  /**
   * Get feature usage statistics
   */
  async getFeatureUsage(req, res) {
    try {
      const userId = req.user.id;
      const { featureKey, period = 'current' } = req.query;

      const usage = await this.subscriptionService.getFeatureUsage(userId, featureKey, period);

      res.json({
        success: true,
        data: usage,
        featureKey,
        period
      });
    } catch (error) {
      console.error('Error fetching feature usage:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch feature usage',
        message: error.message
      });
    }
  }

  /**
   * Validate coupon code
   */
  async validateCoupon(req, res) {
    try {
      const { couponCode, planName } = req.body;

      if (!couponCode) {
        return res.status(400).json({
          success: false,
          error: 'Coupon code is required',
          message: 'Please provide a coupon code'
        });
      }

      const coupon = await this.subscriptionService.validateCoupon(couponCode, planName);

      if (!coupon) {
        return res.status(404).json({
          success: false,
          error: 'Invalid coupon code',
          message: 'The coupon code is invalid or expired'
        });
      }

      res.json({
        success: true,
        data: coupon,
        message: 'Coupon code is valid'
      });
    } catch (error) {
      console.error('Error validating coupon:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to validate coupon',
        message: error.message
      });
    }
  }

  /**
   * Get subscription history
   */
  async getSubscriptionHistory(req, res) {
    try {
      const userId = req.user.id;

      // This would need to be implemented in the service
      const history = await this.subscriptionService.getSubscriptionHistory(userId);

      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      console.error('Error fetching subscription history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch subscription history',
        message: error.message
      });
    }
  }

  /**
   * Get payment methods
   */
  async getPaymentMethods(req, res) {
    try {
      const userId = req.user.id;

      // This would integrate with payment gateway
      const paymentMethods = [
        {
          id: 'card_1',
          type: 'credit_card',
          brand: 'Visa',
          last4: '4242',
          expiryMonth: 12,
          expiryYear: 2025,
          isDefault: true
        },
        {
          id: 'card_2',
          type: 'credit_card',
          brand: 'Mastercard',
          last4: '5555',
          expiryMonth: 8,
          expiryYear: 2024,
          isDefault: false
        }
      ];

      res.json({
        success: true,
        data: paymentMethods
      });
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch payment methods',
        message: error.message
      });
    }
  }

  /**
   * Add payment method
   */
  async addPaymentMethod(req, res) {
    try {
      const userId = req.user.id;
      const { type, cardDetails } = req.body;

      // This would integrate with payment gateway
      const paymentMethod = {
        id: 'card_' + Date.now(),
        type,
        brand: cardDetails.brand,
        last4: cardDetails.last4,
        expiryMonth: cardDetails.expiryMonth,
        expiryYear: cardDetails.expiryYear,
        isDefault: false
      };

      res.status(201).json({
        success: true,
        data: paymentMethod,
        message: 'Payment method added successfully'
      });
    } catch (error) {
      console.error('Error adding payment method:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add payment method',
        message: error.message
      });
    }
  }

  /**
   * Get billing information
   */
  async getBillingInfo(req, res) {
    try {
      const userId = req.user.id;
      const subscription = await this.subscriptionService.getUserSubscription(userId);

      const billingInfo = {
        currentPlan: subscription.plan,
        nextBillingDate: subscription.nextBillingDate,
        amount: subscription.plan.price,
        autoRenew: subscription.autoRenew,
        paymentMethod: 'Visa ending in 4242', // Would come from subscription
        billingHistory: [
          {
            id: 'payment_1',
            date: subscription.lastPaymentAt,
            amount: subscription.plan.price,
            status: 'COMPLETED',
            description: `${subscription.plan.displayName} subscription`
          }
        ]
      };

      res.json({
        success: true,
        data: billingInfo
      });
    } catch (error) {
      console.error('Error fetching billing info:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch billing information',
        message: error.message
      });
    }
  }

  /**
   * Update auto-renew setting
   */
  async updateAutoRenew(req, res) {
    try {
      const userId = req.user.id;
      const { autoRenew } = req.body;

      if (typeof autoRenew !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'Invalid autoRenew value',
          message: 'autoRenew must be a boolean'
        });
      }

      // This would need to be implemented in the service
      const result = await this.subscriptionService.updateAutoRenew(userId, autoRenew);

      res.json({
        success: true,
        data: { autoRenew },
        message: `Auto-renew ${autoRenew ? 'enabled' : 'disabled'} successfully`
      });
    } catch (error) {
      console.error('Error updating auto-renew:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update auto-renew',
        message: error.message
      });
    }
  }

  /**
   * Get subscription analytics (admin only)
   */
  async getSubscriptionAnalytics(req, res) {
    try {
      // Check if user is admin
      if (!req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'Admin access required'
        });
      }

      const { userId } = req.query;
      const analytics = await this.subscriptionService.getSubscriptionAnalytics(userId);

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Error fetching subscription analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch subscription analytics',
        message: error.message
      });
    }
  }

  /**
   * Middleware to check feature access
   */
  async requireFeatureAccess(featureKey) {
    return async (req, res, next) => {
      try {
        const userId = req.user.id;
        const hasAccess = await this.subscriptionService.hasFeatureAccess(userId, featureKey);

        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            error: 'Feature access denied',
            message: `You do not have access to the ${featureKey} feature. Please upgrade your subscription.`
          });
        }

        // Track usage
        await this.subscriptionService.trackFeatureUsage(userId, featureKey, 'API_ACCESS');

        next();
      } catch (error) {
        console.error('Error checking feature access:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to check feature access',
          message: error.message
        });
      }
    };
  }

  /**
   * Middleware to track feature usage
   */
  async trackUsage(featureKey, action = 'API_CALL') {
    return async (req, res, next) => {
      try {
        const userId = req.user.id;
        await this.subscriptionService.trackFeatureUsage(userId, featureKey, action);
        next();
      } catch (error) {
        console.error('Error tracking usage:', error);
        // Don't block the request if tracking fails
        next();
      }
    };
  }
}

module.exports = SubscriptionController;
