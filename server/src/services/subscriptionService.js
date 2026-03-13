/**
 * FinSathi AI - Subscription Management Service
 * Comprehensive subscription system for premium features
 */

const { PrismaClient } = require('@prisma/client');

class SubscriptionService {
  constructor() {
    this.prisma = new PrismaClient();
    this.plans = {
      FREE: {
        name: 'FREE',
        displayName: 'Free Plan',
        price: 0,
        features: {
          aiAdvisor: { enabled: false, limit: 0 },
          tradingSignals: { enabled: false, limit: 0 },
          advancedAnalysis: { enabled: false, limit: 0 },
          portfolioTracking: { enabled: true, limit: 1 },
          basicAnalysis: { enabled: true, limit: 10 },
          marketData: { enabled: true, limit: 'delayed' }
        }
      },
      PRO: {
        name: 'PRO',
        displayName: 'Pro Plan',
        price: 999, // NPR 999 per month
        features: {
          aiAdvisor: { enabled: true, limit: 50 },
          tradingSignals: { enabled: true, limit: 100 },
          advancedAnalysis: { enabled: true, limit: 25 },
          portfolioTracking: { enabled: true, limit: 5 },
          basicAnalysis: { enabled: true, limit: 'unlimited' },
          marketData: { enabled: true, limit: 'real-time' },
          prioritySupport: { enabled: true, limit: 'unlimited' }
        }
      },
      INVESTOR: {
        name: 'INVESTOR',
        displayName: 'Investor Plan',
        price: 2499, // NPR 2499 per month
        features: {
          aiAdvisor: { enabled: true, limit: 'unlimited' },
          tradingSignals: { enabled: true, limit: 'unlimited' },
          advancedAnalysis: { enabled: true, limit: 'unlimited' },
          portfolioTracking: { enabled: true, limit: 'unlimited' },
          basicAnalysis: { enabled: true, limit: 'unlimited' },
          marketData: { enabled: true, limit: 'real-time' },
          prioritySupport: { enabled: true, limit: 'unlimited' },
          apiAccess: { enabled: true, limit: 1000 },
          customReports: { enabled: true, limit: 50 },
          dedicatedSupport: { enabled: true, limit: 'unlimited' }
        }
      }
    };
  }

  /**
   * Initialize subscription plans in database
   */
  async initializePlans() {
    try {
      const existingPlans = await this.prisma.subscriptionPlan.findMany();
      
      if (existingPlans.length === 0) {
        for (const [planKey, planData] of Object.entries(this.plans)) {
          await this.prisma.subscriptionPlan.create({
            data: {
              name: planKey,
              displayName: planData.displayName,
              description: `${planData.displayName} features and pricing`,
              price: planData.price,
              currency: 'NPR',
              billingCycle: 'MONTHLY',
              features: planData.features,
              isActive: true,
              sortOrder: planKey === 'FREE' ? 0 : planKey === 'PRO' ? 1 : 2
            }
          });
        }
        console.log('Subscription plans initialized successfully');
      }
    } catch (error) {
      console.error('Error initializing subscription plans:', error);
      throw error;
    }
  }

  /**
   * Get all available subscription plans
   */
  async getPlans() {
    try {
      const plans = await this.prisma.subscriptionPlan.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        include: {
          planFeatures: true
        }
      });

      return plans.map(plan => ({
        ...plan,
        features: plan.planFeatures.reduce((acc, feature) => {
          acc[feature.featureKey] = {
            name: feature.featureName,
            description: feature.description,
            enabled: feature.isEnabled,
            limits: feature.limits
          };
          return acc;
        }, {})
      }));
    } catch (error) {
      throw new Error(`Failed to get subscription plans: ${error.message}`);
    }
  }

  /**
   * Get user's current subscription
   */
  async getUserSubscription(userId) {
    try {
      const subscription = await this.prisma.subscription.findFirst({
        where: {
          userId,
          status: 'ACTIVE',
          endDate: {
            gt: new Date()
          }
        },
        include: {
          plan: {
            include: {
              planFeatures: true
            }
          },
          usage: true,
          featureAccess: true
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!subscription) {
        // Return free plan as default
        return this.getDefaultSubscription(userId);
      }

      return {
        ...subscription,
        features: subscription.plan.planFeatures.reduce((acc, feature) => {
          acc[feature.featureKey] = {
            name: feature.featureName,
            description: feature.description,
            enabled: feature.isEnabled,
            limits: feature.limits,
            usage: this.getFeatureUsage(subscription.usage, feature.featureKey),
            access: subscription.featureAccess.find(fa => fa.featureKey === feature.featureKey)
          };
          return acc;
        }, {})
      };
    } catch (error) {
      throw new Error(`Failed to get user subscription: ${error.message}`);
    }
  }

  /**
   * Get default free subscription
   */
  getDefaultSubscription(userId) {
    return {
      id: null,
      userId,
      plan: this.plans.FREE,
      status: 'ACTIVE',
      features: this.plans.FREE.features,
      usage: [],
      featureAccess: []
    };
  }

  /**
   * Subscribe user to a plan
   */
  async subscribe(userId, planName, paymentMethod, couponCode = null) {
    try {
      const plan = await this.prisma.subscriptionPlan.findUnique({
        where: { name: planName, isActive: true }
      });

      if (!plan) {
        throw new Error('Invalid subscription plan');
      }

      // Check if user has existing active subscription
      const existingSubscription = await this.prisma.subscription.findFirst({
        where: {
          userId,
          status: 'ACTIVE',
          endDate: {
            gt: new Date()
          }
        }
      });

      let finalPrice = plan.price;
      let couponApplied = null;

      // Apply coupon if provided
      if (couponCode) {
        const coupon = await this.validateCoupon(couponCode, plan.name);
        if (coupon) {
          finalPrice = this.applyCouponDiscount(plan.price, coupon);
          couponApplied = coupon;
        }
      }

      // Calculate subscription dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1); // 1 month from now
      const nextBillingDate = new Date(endDate);

      // Create or update subscription
      let subscription;
      if (existingSubscription) {
        // Upgrade/downgrade existing subscription
        subscription = await this.prisma.subscription.update({
          where: { id: existingSubscription.id },
          data: {
            planId: plan.id,
            status: 'ACTIVE',
            startDate,
            endDate,
            nextBillingDate,
            autoRenew: true,
            paymentMethod,
            lastPaymentAt: new Date()
          }
        });

        // Log upgrade/downgrade event
        await this.logSubscriptionEvent(subscription.id, userId, 'UPGRADED', {
          fromPlan: existingSubscription.planId,
          toPlan: plan.id,
          couponApplied: couponCode
        });
      } else {
        // Create new subscription
        subscription = await this.prisma.subscription.create({
          data: {
            userId,
            planId: plan.id,
            status: 'ACTIVE',
            startDate,
            endDate,
            nextBillingDate,
            autoRenew: true,
            paymentMethod,
            lastPaymentAt: new Date()
          }
        });

        // Log creation event
        await this.logSubscriptionEvent(subscription.id, userId, 'CREATED', {
          planId: plan.id,
          couponApplied: couponCode
        });
      }

      // Create payment record
      if (finalPrice > 0) {
        await this.prisma.payment.create({
          data: {
            subscriptionId: subscription.id,
            userId,
            amount: finalPrice,
            status: 'COMPLETED',
            paymentMethod,
            transactionId: this.generateTransactionId(),
            paidAt: new Date()
          }
        });

        // Track coupon usage if applied
        if (couponApplied) {
          await this.trackCouponUsage(couponApplied.id, userId, subscription.id, finalPrice, plan.price);
        }
      }

      // Initialize feature access
      await this.initializeFeatureAccess(subscription.id, userId, plan.features);

      return await this.getUserSubscription(userId);
    } catch (error) {
      throw new Error(`Failed to subscribe: ${error.message}`);
    }
  }

  /**
   * Cancel user subscription
   */
  async cancelSubscription(userId, reason = null) {
    try {
      const subscription = await this.prisma.subscription.findFirst({
        where: {
          userId,
          status: 'ACTIVE',
          endDate: {
            gt: new Date()
          }
        }
      });

      if (!subscription) {
        throw new Error('No active subscription found');
      }

      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'CANCELLED',
          autoRenew: false,
          cancelledAt: new Date(),
          cancellationReason: reason
        }
      });

      // Log cancellation event
      await this.logSubscriptionEvent(subscription.id, userId, 'CANCELLED', {
        reason
      });

      return { success: true, message: 'Subscription cancelled successfully' };
    } catch (error) {
      throw new Error(`Failed to cancel subscription: ${error.message}`);
    }
  }

  /**
   * Check if user has access to a feature
   */
  async hasFeatureAccess(userId, featureKey) {
    try {
      const subscription = await this.getUserSubscription(userId);
      
      if (!subscription) {
        return false;
      }

      const feature = subscription.features[featureKey];
      if (!feature || !feature.enabled) {
        return false;
      }

      // Check usage limits
      if (feature.limits && feature.limits.maxUses) {
        const currentUsage = feature.usage?.usageCount || 0;
        return currentUsage < feature.limits.maxUses;
      }

      return true;
    } catch (error) {
      console.error('Error checking feature access:', error);
      return false;
    }
  }

  /**
   * Track feature usage
   */
  async trackFeatureUsage(userId, featureKey, action = 'USE') {
    try {
      const subscription = await this.getUserSubscription(userId);
      
      if (!subscription || !subscription.id) {
        return; // No subscription to track usage for
      }

      const feature = subscription.features[featureKey];
      if (!feature || !feature.enabled) {
        return;
      }

      // Update feature access
      const existingAccess = subscription.featureAccess.find(fa => fa.featureKey === featureKey);
      
      if (existingAccess) {
        await this.prisma.featureAccess.update({
          where: { id: existingAccess.id },
          data: {
            lastUsedAt: new Date(),
            usageCount: existingAccess.usageCount + 1
          }
        });
      } else {
        await this.prisma.featureAccess.create({
          data: {
            subscriptionId: subscription.id,
            userId,
            featureKey,
            isGranted: true,
            lastUsedAt: new Date(),
            usageCount: 1
          }
        });
      }

      // Update usage tracking for billing period
      const periodStart = new Date();
      periodStart.setDate(periodStart.getDate() - periodStart.getDate() + 1); // Start of month
      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      periodEnd.setDate(0); // End of month

      await this.prisma.subscriptionUsage.upsert({
        where: {
          subscriptionId_featureKey_periodStart: {
            subscriptionId: subscription.id,
            featureKey,
            periodStart
          }
        },
        update: {
          usageCount: {
            increment: 1
          },
          lastUsedAt: new Date()
        },
        create: {
          subscriptionId: subscription.id,
          userId,
          featureKey,
          usageCount: 1,
          usageLimit: feature.limits?.maxUses || null,
          periodStart,
          periodEnd,
          lastUsedAt: new Date()
        }
      });

      // Log usage analytics
      await this.prisma.usageAnalytics.create({
        data: {
          userId,
          featureKey,
          action,
          timestamp: new Date()
        }
      });

      return true;
    } catch (error) {
      console.error('Error tracking feature usage:', error);
      return false;
    }
  }

  /**
   * Get feature usage statistics
   */
  async getFeatureUsage(userId, featureKey = null, period = 'current') {
    try {
      const subscription = await this.getUserSubscription(userId);
      
      if (!subscription || !subscription.id) {
        return null;
      }

      let whereClause = {
        subscriptionId: subscription.id,
        userId
      };

      if (featureKey) {
        whereClause.featureKey = featureKey;
      }

      if (period === 'current') {
        const periodStart = new Date();
        periodStart.setDate(periodStart.getDate() - periodStart.getDate() + 1);
        const periodEnd = new Date();
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        periodEnd.setDate(0);

        whereClause.periodStart = periodStart;
        whereClause.periodEnd = periodEnd;
      }

      const usage = await this.prisma.subscriptionUsage.findMany({
        where: whereClause,
        orderBy: { periodStart: 'desc' }
      });

      return usage;
    } catch (error) {
      throw new Error(`Failed to get feature usage: ${error.message}`);
    }
  }

  /**
   * Validate coupon code
   */
  async validateCoupon(couponCode, planName = null) {
    try {
      const coupon = await this.prisma.coupon.findUnique({
        where: { 
          code: couponCode.toUpperCase(),
          isActive: true,
          startDate: { lte: new Date() },
          endDate: { gte: new Date() }
        }
      });

      if (!coupon) {
        return null;
      }

      // Check if coupon applies to the plan
      if (coupon.applicablePlans.length > 0 && planName && !coupon.applicablePlans.includes(planName)) {
        return null;
      }

      // Check usage limits
      const totalUsage = await this.prisma.couponUsage.count({
        where: { couponId: coupon.id }
      });

      if (coupon.usageLimit && totalUsage >= coupon.usageLimit) {
        return null;
      }

      return coupon;
    } catch (error) {
      console.error('Error validating coupon:', error);
      return null;
    }
  }

  /**
   * Apply coupon discount
   */
  applyCouponDiscount(originalAmount, coupon) {
    let discountAmount = 0;

    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = originalAmount * (coupon.discountValue / 100);
    } else if (coupon.discountType === 'FIXED_AMOUNT') {
      discountAmount = coupon.discountValue;
    }

    // Apply maximum discount limit
    if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
      discountAmount = coupon.maxDiscount;
    }

    return Math.max(0, originalAmount - discountAmount);
  }

  /**
   * Track coupon usage
   */
  async trackCouponUsage(couponId, userId, subscriptionId, finalAmount, originalAmount) {
    try {
      await this.prisma.couponUsage.create({
        data: {
          couponId,
          userId,
          subscriptionId,
          discountAmount: originalAmount - finalAmount,
          originalAmount,
          finalAmount
        }
      });
    } catch (error) {
      console.error('Error tracking coupon usage:', error);
    }
  }

  /**
   * Initialize feature access for subscription
   */
  async initializeFeatureAccess(subscriptionId, userId, features) {
    try {
      const featureAccessData = Object.keys(features).map(featureKey => ({
        subscriptionId,
        userId,
        featureKey,
        isGranted: features[featureKey].enabled,
        grantedAt: new Date(),
        usageCount: 0
      }));

      await this.prisma.featureAccess.createMany({
        data: featureAccessData,
        skipDuplicates: true
      });
    } catch (error) {
      console.error('Error initializing feature access:', error);
    }
  }

  /**
   * Get feature usage from usage records
   */
  getFeatureUsage(usageRecords, featureKey) {
    const featureUsage = usageRecords.find(u => u.featureKey === featureKey);
    return featureUsage ? {
      usageCount: featureUsage.usageCount,
      usageLimit: featureUsage.usageLimit,
      periodStart: featureUsage.periodStart,
      periodEnd: featureUsage.periodEnd
    } : null;
  }

  /**
   * Log subscription events
   */
  async logSubscriptionEvent(subscriptionId, userId, eventType, eventData) {
    try {
      await this.prisma.subscriptionEvent.create({
        data: {
          subscriptionId,
          userId,
          eventType,
          eventData,
          description: this.getEventDescription(eventType, eventData)
        }
      });
    } catch (error) {
      console.error('Error logging subscription event:', error);
    }
  }

  /**
   * Get human-readable event description
   */
  getEventDescription(eventType, eventData) {
    const descriptions = {
      CREATED: 'Subscription created',
      UPGRADED: 'Subscription upgraded',
      DOWNGRADED: 'Subscription downgraded',
      CANCELLED: 'Subscription cancelled',
      RENEWED: 'Subscription renewed',
      PAYMENT_FAILED: 'Payment failed'
    };

    return descriptions[eventType] || 'Subscription event';
  }

  /**
   * Generate transaction ID
   */
  generateTransactionId() {
    return 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Process subscription renewal
   */
  async processRenewal(subscriptionId) {
    try {
      const subscription = await this.prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: { plan: true }
      });

      if (!subscription || !subscription.autoRenew) {
        return { success: false, message: 'Subscription not found or auto-renew disabled' };
      }

      // Process payment (this would integrate with payment gateway)
      const paymentSuccess = await this.processPayment(subscription);

      if (paymentSuccess) {
        // Extend subscription
        const newEndDate = new Date(subscription.endDate);
        newEndDate.setMonth(newEndDate.getMonth() + 1);
        
        const updatedSubscription = await this.prisma.subscription.update({
          where: { id: subscriptionId },
          data: {
            endDate: newEndDate,
            nextBillingDate: newEndDate,
            lastPaymentAt: new Date(),
            status: 'ACTIVE'
          }
        });

        // Log renewal event
        await this.logSubscriptionEvent(subscriptionId, subscription.userId, 'RENEWED', {
          newEndDate,
          amount: subscription.plan.price
        });

        return { success: true, subscription: updatedSubscription };
      } else {
        // Mark as failed
        await this.prisma.subscription.update({
          where: { id: subscriptionId },
          data: { status: 'SUSPENDED' }
        });

        // Log payment failure
        await this.logSubscriptionEvent(subscriptionId, subscription.userId, 'PAYMENT_FAILED', {
          amount: subscription.plan.price
        });

        return { success: false, message: 'Payment failed' };
      }
    } catch (error) {
      throw new Error(`Failed to process renewal: ${error.message}`);
    }
  }

  /**
   * Process payment (mock implementation)
   */
  async processPayment(subscription) {
    // This would integrate with actual payment gateway
    // For now, return success for demonstration
    return true;
  }

  /**
   * Get subscription analytics
   */
  async getSubscriptionAnalytics(userId = null) {
    try {
      let whereClause = {};
      if (userId) {
        whereClause.userId = userId;
      }

      const subscriptions = await this.prisma.subscription.findMany({
        where: whereClause,
        include: {
          plan: true,
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      const analytics = {
        totalSubscriptions: subscriptions.length,
        activeSubscriptions: subscriptions.filter(s => s.status === 'ACTIVE').length,
        planDistribution: {},
        revenue: {
          monthly: 0,
          total: 0
        },
        churnRate: 0,
        mrr: 0 // Monthly Recurring Revenue
      };

      // Calculate plan distribution
      subscriptions.forEach(sub => {
        const planName = sub.plan.name;
        analytics.planDistribution[planName] = (analytics.planDistribution[planName] || 0) + 1;
        
        if (sub.status === 'ACTIVE') {
          analytics.revenue.monthly += sub.plan.price;
          analytics.mrr += sub.plan.price;
        }
      });

      // Calculate churn rate (simplified)
      const cancelledSubscriptions = subscriptions.filter(s => s.status === 'CANCELLED').length;
      analytics.churnRate = subscriptions.length > 0 ? (cancelledSubscriptions / subscriptions.length) * 100 : 0;

      return analytics;
    } catch (error) {
      throw new Error(`Failed to get subscription analytics: ${error.message}`);
    }
  }

  /**
   * Get subscription history
   */
  async getSubscriptionHistory(userId) {
    try {
      const subscriptions = await this.prisma.subscription.findMany({
        where: { userId },
        include: {
          plan: true
        },
        orderBy: { createdAt: 'desc' }
      });

      return subscriptions.map(sub => ({
        id: sub.id,
        plan: sub.plan.name,
        planDisplayName: sub.plan.displayName,
        status: sub.status,
        startDate: sub.startDate,
        endDate: sub.endDate,
        createdAt: sub.createdAt
      }));
    } catch (error) {
      throw new Error(`Failed to get subscription history: ${error.message}`);
    }
  }

  /**
   * Update auto-renew setting
   */
  async updateAutoRenew(userId, autoRenew) {
    try {
      const subscription = await this.prisma.subscription.findFirst({
        where: {
          userId,
          status: 'ACTIVE',
          endDate: { gt: new Date() }
        }
      });

      if (!subscription) {
        throw new Error('No active subscription found');
      }

      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { autoRenew }
      });

      return { success: true, autoRenew };
    } catch (error) {
      throw new Error(`Failed to update auto-renew: ${error.message}`);
    }
  }
}

module.exports = SubscriptionService;
