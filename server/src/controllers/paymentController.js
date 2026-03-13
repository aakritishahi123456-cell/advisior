/**
 * FinSathi AI - Payment Management API Controller
 * REST API endpoints for payment processing and subscription activation
 */

const PaymentService = require('../services/paymentService');
const SubscriptionService = require('../services/subscriptionService');

class PaymentController {
  constructor() {
    this.paymentService = new PaymentService();
    this.subscriptionService = new SubscriptionService();
  }

  /**
   * Get supported payment providers
   */
  async getSupportedProviders(req, res) {
    try {
      const providers = this.paymentService.getSupportedProviders();

      res.json({
        success: true,
        data: providers
      });
    } catch (error) {
      console.error('Error fetching payment providers:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch payment providers',
        message: error.message
      });
    }
  }

  /**
   * Create payment session
   */
  async createPaymentSession(req, res) {
    try {
      const userId = req.user.id;
      const { provider, planId, planName, price, couponCode } = req.body;

      if (!provider || !planId || !planName || !price) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'provider, planId, planName, and price are required'
        });
      }

      // Validate provider
      const supportedProviders = this.paymentService.getSupportedProviders();
      const isProviderSupported = supportedProviders.some(p => p.name === provider);
      
      if (!isProviderSupported) {
        return res.status(400).json({
          success: false,
          error: 'Unsupported payment provider',
          message: `Provider ${provider} is not supported`
        });
      }

      // Validate price
      if (price <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid price',
          message: 'Price must be greater than 0'
        });
      }

      const paymentSession = await this.paymentService.createPaymentSession(
        userId, provider, planId, planName, price, couponCode
      );

      res.status(201).json({
        success: true,
        data: paymentSession,
        message: 'Payment session created successfully'
      });
    } catch (error) {
      console.error('Error creating payment session:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create payment session',
        message: error.message
      });
    }
  }

  /**
   * Verify payment and activate subscription
   */
  async verifyPayment(req, res) {
    try {
      const { provider, paymentId, additionalData } = req.body;

      if (!provider || !paymentId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'provider and paymentId are required'
        });
      }

      // Verify payment
      const paymentVerification = await this.paymentService.verifyPayment(provider, paymentId, additionalData);

      if (!paymentVerification.success) {
        return res.status(400).json({
          success: false,
          error: 'Payment verification failed',
          message: 'The payment could not be verified',
          data: paymentVerification
        });
      }

      // Activate subscription
      const activationResult = await this.paymentService.activateSubscription(
        paymentVerification, this.subscriptionService
      );

      res.json({
        success: true,
        data: activationResult,
        message: 'Payment verified and subscription activated successfully'
      });
    } catch (error) {
      console.error('Error verifying payment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to verify payment',
        message: error.message
      });
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(req, res) {
    try {
      const { provider, paymentId } = req.params;

      if (!provider || !paymentId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'provider and paymentId are required'
        });
      }

      const paymentVerification = await this.paymentService.verifyPayment(provider, paymentId);

      res.json({
        success: true,
        data: paymentVerification
      });
    } catch (error) {
      console.error('Error getting payment status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get payment status',
        message: error.message
      });
    }
  }

  /**
   * Handle payment webhooks
   */
  async handleWebhook(req, res) {
    try {
      const { provider } = req.params;
      const event = req.headers['stripe-event'] || req.headers['khalti-event'] || 
                   req.headers['esewa-event'] || req.headers['connectips-event'];
      const data = req.body;

      // Verify webhook signature (implementation depends on provider)
      const isValid = await this.verifyWebhookSignature(provider, req);
      
      if (!isValid) {
        return res.status(401).json({
          success: false,
          error: 'Invalid webhook signature'
        });
      }

      // Process webhook
      const result = await this.paymentService.handleWebhook(provider, event, data);

      res.json({
        success: true,
        data: result,
        message: 'Webhook processed successfully'
      });
    } catch (error) {
      console.error('Error handling webhook:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to handle webhook',
        message: error.message
      });
    }
  }

  /**
   * Get payment history for user
   */
  async getPaymentHistory(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 20, offset = 0 } = req.query;

      // This would integrate with your database
      const paymentHistory = await this.getUserPaymentHistory(userId, limit, offset);

      res.json({
        success: true,
        data: paymentHistory,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: paymentHistory.length
        }
      });
    } catch (error) {
      console.error('Error fetching payment history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch payment history',
        message: error.message
      });
    }
  }

  /**
   * Get payment methods for a provider
   */
  async getPaymentMethods(req, res) {
    try {
      const { provider } = req.params;

      if (!provider) {
        return res.status(400).json({
          success: false,
          error: 'Provider is required',
          message: 'Please specify a payment provider'
        });
      }

      const providers = this.paymentService.getSupportedProviders();
      const providerInfo = providers.find(p => p.name === provider);

      if (!providerInfo) {
        return res.status(404).json({
          success: false,
          error: 'Provider not found',
          message: `Provider ${provider} is not supported`
        });
      }

      res.json({
        success: true,
        data: {
          provider: providerInfo,
          methods: providerInfo.methods,
          currencies: providerInfo.currencies
        }
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
   * Refund payment (admin only)
   */
  async refundPayment(req, res) {
    try {
      // Check if user is admin
      if (!req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'Admin access required'
        });
      }

      const { provider, paymentId, amount, reason } = req.body;

      if (!provider || !paymentId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'provider and paymentId are required'
        });
      }

      const refundResult = await this.processRefund(provider, paymentId, amount, reason);

      res.json({
        success: true,
        data: refundResult,
        message: 'Refund processed successfully'
      });
    } catch (error) {
      console.error('Error processing refund:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process refund',
        message: error.message
      });
    }
  }

  /**
   * Get payment analytics (admin only)
   */
  async getPaymentAnalytics(req, res) {
    try {
      // Check if user is admin
      if (!req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'Admin access required'
        });
      }

      const { startDate, endDate, provider } = req.query;

      const analytics = await this.getPaymentAnalyticsData(startDate, endDate, provider);

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Error fetching payment analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch payment analytics',
        message: error.message
      });
    }
  }

  /**
   * Test payment integration (development only)
   */
  async testPayment(req, res) {
    try {
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({
          success: false,
          error: 'Test mode not available in production'
        });
      }

      const { provider, amount = 100 } = req.body;

      const testPayment = await this.createTestPayment(provider, amount);

      res.json({
        success: true,
        data: testPayment,
        message: 'Test payment created successfully'
      });
    } catch (error) {
      console.error('Error creating test payment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create test payment',
        message: error.message
      });
    }
  }

  /**
   * Verify webhook signature
   */
  async verifyWebhookSignature(provider, req) {
    try {
      switch (provider.toLowerCase()) {
        case 'stripe':
          return this.verifyStripeSignature(req);
        case 'khalti':
          return this.verifyKhaltiSignature(req);
        case 'esewa':
          return this.verifyEsewaSignature(req);
        case 'connectips':
          return this.verifyConnectIPSSignature(req);
        default:
          return true; // For providers without signature verification
      }
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Verify Stripe webhook signature
   */
  verifyStripeSignature(req) {
    try {
      const stripe = this.paymentService.stripe;
      if (!stripe) return false;

      const signature = req.headers['stripe-signature'];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      
      if (!signature || !webhookSecret) {
        return false;
      }

      // Stripe signature verification would go here
      return true; // For demonstration
    } catch (error) {
      console.error('Error verifying Stripe signature:', error);
      return false;
    }
  }

  /**
   * Verify Khalti webhook signature
   */
  verifyKhaltiSignature(req) {
    try {
      const signature = req.headers['khalti-signature'];
      const secretKey = this.paymentService.nepalGateways.khalti.secretKey;
      
      if (!signature || !secretKey) {
        return false;
      }

      // Khalti signature verification would go here
      return true; // For demonstration
    } catch (error) {
      console.error('Error verifying Khalti signature:', error);
      return false;
    }
  }

  /**
   * Verify eSewa webhook signature
   */
  verifyEsewaSignature(req) {
    try {
      // eSewa doesn't use webhook signatures, so we rely on other security measures
      return true;
    } catch (error) {
      console.error('Error verifying eSewa signature:', error);
      return false;
    }
  }

  /**
   * Verify ConnectIPS webhook signature
   */
  verifyConnectIPSSignature(req) {
    try {
      const signature = req.headers['connectips-signature'];
      const secretKey = this.paymentService.nepalGateways.connectips.secretKey;
      
      if (!signature || !secretKey) {
        return false;
      }

      // ConnectIPS signature verification would go here
      return true; // For demonstration
    } catch (error) {
      console.error('Error verifying ConnectIPS signature:', error);
      return false;
    }
  }

  /**
   * Get user payment history (mock implementation)
   */
  async getUserPaymentHistory(userId, limit, offset) {
    // This would integrate with your database
    return [
      {
        id: 'payment_1',
        userId,
        provider: 'stripe',
        paymentId: 'pi_stripe_123',
        amount: 999,
        currency: 'NPR',
        status: 'COMPLETED',
        paidAt: new Date('2024-03-15T10:30:00Z'),
        metadata: {
          planName: 'Pro Plan',
          planId: 'plan_pro'
        }
      }
    ];
  }

  /**
   * Process refund (mock implementation)
   */
  async processRefund(provider, paymentId, amount, reason) {
    // This would integrate with payment provider APIs
    return {
      provider,
      paymentId,
      refundId: `refund_${provider}_${Date.now()}`,
      amount,
      reason,
      status: 'SUCCESS',
      processedAt: new Date()
    };
  }

  /**
   * Get payment analytics data (mock implementation)
   */
  async getPaymentAnalyticsData(startDate, endDate, provider) {
    // This would integrate with your database
    return {
      totalPayments: 150,
      totalRevenue: 150000,
      averagePayment: 1000,
      successRate: 95.5,
      providerDistribution: {
        stripe: 60,
        khalti: 40,
        esewa: 30,
        connectips: 20
      },
      dailyRevenue: [
        { date: '2024-03-15', revenue: 5000 },
        { date: '2024-03-14', revenue: 4500 },
        { date: '2024-03-13', revenue: 5200 }
      ]
    };
  }

  /**
   * Create test payment (development only)
   */
  async createTestPayment(provider, amount) {
    try {
      const userId = 'test_user';
      const planId = 'plan_test';
      const planName = 'Test Plan';

      return await this.paymentService.createPaymentSession(
        userId, provider, planId, planName, amount
      );
    } catch (error) {
      console.error('Error creating test payment:', error);
      throw error;
    }
  }
}

module.exports = PaymentController;
