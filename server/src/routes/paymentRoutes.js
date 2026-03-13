/**
 * FinSathi AI - Payment Management API Routes
 * Express routes for payment processing and subscription activation
 */

const express = require('express');
const PaymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const controller = new PaymentController();

// Middleware for request logging
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Payment Provider Information

/**
 * GET /api/v1/payment/providers
 * Get supported payment providers
 * Public endpoint
 */
router.get('/providers', controller.getSupportedProviders.bind(controller));

/**
 * GET /api/v1/payment/providers/:provider/methods
 * Get payment methods for a specific provider
 * Public endpoint
 */
router.get('/providers/:provider/methods', controller.getPaymentMethods.bind(controller));

// Payment Session Management

/**
 * POST /api/v1/payment/session
 * Create payment session
 * Requires authentication
 * Body: { provider, planId, planName, price, couponCode? }
 */
router.post('/session', authMiddleware, controller.createPaymentSession.bind(controller));

/**
 * POST /api/v1/payment/verify
 * Verify payment and activate subscription
 * Requires authentication
 * Body: { provider, paymentId, additionalData? }
 */
router.post('/verify', authMiddleware, controller.verifyPayment.bind(controller));

/**
 * GET /api/v1/payment/status/:provider/:paymentId
 * Get payment status
 * Public endpoint (for payment provider callbacks)
 */
router.get('/status/:provider/:paymentId', controller.getPaymentStatus.bind(controller));

/**
 * GET /api/v1/payment/history
 * Get payment history for authenticated user
 * Requires authentication
 * Query params: limit, offset
 */
router.get('/history', authMiddleware, controller.getPaymentHistory.bind(controller));

// Webhook Handling

/**
 * POST /api/v1/payment/webhook/:provider
 * Handle payment provider webhooks
 * Public endpoint (secured by signature verification)
 */
router.post('/webhook/:provider', controller.handleWebhook.bind(controller));

/**
 * POST /api/v1/payment/webhook/stripe
 * Handle Stripe webhooks (specific endpoint)
 */
router.post('/webhook/stripe', (req, res) => {
  req.params.provider = 'stripe';
  controller.handleWebhook(req, res);
});

/**
 * POST /api/v1/payment/webhook/khalti
 * Handle Khalti webhooks (specific endpoint)
 */
router.post('/webhook/khalti', (req, res) => {
  req.params.provider = 'khalti';
  controller.handleWebhook(req, res);
});

/**
 * POST /api/v1/payment/webhook/esewa
 * Handle eSewa webhooks (specific endpoint)
 */
router.post('/webhook/esewa', (req, res) => {
  req.params.provider = 'esewa';
  controller.handleWebhook(req, res);
});

/**
 * POST /api/v1/payment/webhook/connectips
 * Handle ConnectIPS webhooks (specific endpoint)
 */
router.post('/webhook/connectips', (req, res) => {
  req.params.provider = 'connectips';
  controller.handleWebhook(req, res);
});

// Admin Endpoints

/**
 * POST /api/v1/payment/refund
 * Process payment refund
 * Requires admin authentication
 * Body: { provider, paymentId, amount?, reason? }
 */
router.post('/refund', authMiddleware, controller.refundPayment.bind(controller));

/**
 * GET /api/v1/payment/analytics
 * Get payment analytics
 * Requires admin authentication
 * Query params: startDate, endDate, provider
 */
router.get('/analytics', authMiddleware, controller.getPaymentAnalytics.bind(controller));

// Development and Testing

/**
 * POST /api/v1/payment/test
 * Create test payment (development only)
 * Requires authentication
 * Body: { provider, amount? }
 */
router.post('/test', authMiddleware, controller.testPayment.bind(controller));

// Payment Success/Cancellation Handlers

/**
 * GET /api/v1/payment/success
 * Payment success page handler
 * Query params: provider, paymentId, session_id
 */
router.get('/success', async (req, res) => {
  try {
    const { provider, paymentId, session_id } = req.query;
    
    if (!provider || (!paymentId && !session_id)) {
      return res.status(400).json({
        success: false,
        error: 'Missing payment information',
        message: 'Provider and payment identifier are required'
      });
    }

    // For Stripe, use session_id; for others, use paymentId
    const paymentIdentifier = session_id || paymentId;
    
    // Verify payment
    const additionalData = session_id ? {} : {}; // Add any additional data needed for verification
    const paymentVerification = await controller.paymentService.verifyPayment(provider, paymentIdentifier, additionalData);

    if (!paymentVerification.success) {
      return res.status(400).json({
        success: false,
        error: 'Payment verification failed',
        message: 'The payment could not be verified'
      });
    }

    // Activate subscription
    const activationResult = await controller.paymentService.activateSubscription(
      paymentVerification, controller.subscriptionService
    );

    // Redirect to success page or return success response
    res.json({
      success: true,
      data: activationResult,
      message: 'Payment successful and subscription activated'
    });
  } catch (error) {
    console.error('Error handling payment success:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process payment success',
      message: error.message
    });
  }
});

/**
 * GET /api/v1/payment/cancel
 * Payment cancellation page handler
 * Query params: provider, paymentId, session_id
 */
router.get('/cancel', async (req, res) => {
  try {
    const { provider, paymentId, session_id } = req.query;
    
    // Log cancellation
    console.log(`Payment cancelled: ${provider}, ${paymentId || session_id}`);
    
    res.json({
      success: false,
      message: 'Payment was cancelled',
      data: {
        provider,
        paymentId: paymentId || session_id,
        cancelledAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error handling payment cancellation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process payment cancellation',
      message: error.message
    });
  }
});

// Nepal Payment Gateway Specific Routes

/**
 * POST /api/v1/payment/khalti/initiate
 * Initiate Khalti payment
 * Requires authentication
 * Body: { planId, planName, price, couponCode? }
 */
router.post('/khalti/initiate', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { planId, planName, price, couponCode } = req.body;

    if (!planId || !planName || !price) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'planId, planName, and price are required'
      });
    }

    const paymentSession = await controller.paymentService.createKhaltiPayment(
      userId, planId, planName, price, couponCode
    );

    res.status(201).json({
      success: true,
      data: paymentSession,
      message: 'Khalti payment initiated successfully'
    });
  } catch (error) {
    console.error('Error initiating Khalti payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initiate Khalti payment',
      message: error.message
    });
  }
});

/**
 * POST /api/v1/payment/khalti/verify
 * Verify Khalti payment
 * Requires authentication
 * Body: { paymentId }
 */
router.post('/khalti/verify', authMiddleware, async (req, res) => {
  try {
    const { paymentId } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        error: 'Payment ID is required',
        message: 'Please provide a valid payment ID'
      });
    }

    const paymentVerification = await controller.paymentService.verifyKhaltiPayment(paymentId);

    if (!paymentVerification.success) {
      return res.status(400).json({
        success: false,
        error: 'Payment verification failed',
        data: paymentVerification
      });
    }

    // Activate subscription
    const activationResult = await controller.paymentService.activateSubscription(
      paymentVerification, controller.subscriptionService
    );

    res.json({
      success: true,
      data: activationResult,
      message: 'Khalti payment verified and subscription activated'
    });
  } catch (error) {
    console.error('Error verifying Khalti payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify Khalti payment',
      message: error.message
    });
  }
});

/**
 * POST /api/v1/payment/esewa/initiate
 * Initiate eSewa payment
 * Requires authentication
 * Body: { planId, planName, price, couponCode? }
 */
router.post('/esewa/initiate', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { planId, planName, price, couponCode } = req.body;

    if (!planId || !planName || !price) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'planId, planName, and price are required'
      });
    }

    const paymentSession = await controller.paymentService.createEsewaPayment(
      userId, planId, planName, price, couponCode
    );

    res.status(201).json({
      success: true,
      data: paymentSession,
      message: 'eSewa payment initiated successfully'
    });
  } catch (error) {
    console.error('Error initiating eSewa payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initiate eSewa payment',
      message: error.message
    });
  }
});

/**
 * POST /api/v1/payment/esewa/verify
 * Verify eSewa payment
 * Requires authentication
 * Body: { transactionId, amount, refId }
 */
router.post('/esewa/verify', authMiddleware, async (req, res) => {
  try {
    const { transactionId, amount, refId } = req.body;

    if (!transactionId || !amount || !refId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'transactionId, amount, and refId are required'
      });
    }

    const paymentVerification = await controller.paymentService.verifyEsewaPayment(transactionId, amount, refId);

    if (!paymentVerification.success) {
      return res.status(400).json({
        success: false,
        error: 'Payment verification failed',
        data: paymentVerification
      });
    }

    // Activate subscription
    const activationResult = await controller.paymentService.activateSubscription(
      paymentVerification, controller.subscriptionService
    );

    res.json({
      success: true,
      data: activationResult,
      message: 'eSewa payment verified and subscription activated'
    });
  } catch (error) {
    console.error('Error verifying eSewa payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify eSewa payment',
      message: error.message
    });
  }
});

/**
 * POST /api/v1/payment/connectips/initiate
 * Initiate ConnectIPS payment
 * Requires authentication
 * Body: { planId, planName, price, couponCode? }
 */
router.post('/connectips/initiate', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { planId, planName, price, couponCode } = req.body;

    if (!planId || !planName || !price) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'planId, planName, and price are required'
      });
    }

    const paymentSession = await controller.paymentService.createConnectIPSPayment(
      userId, planId, planName, price, couponCode
    );

    res.status(201).json({
      success: true,
      data: paymentSession,
      message: 'ConnectIPS payment initiated successfully'
    });
  } catch (error) {
    console.error('Error initiating ConnectIPS payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initiate ConnectIPS payment',
      message: error.message
    });
  }
});

/**
 * POST /api/v1/payment/connectips/verify
 * Verify ConnectIPS payment
 * Requires authentication
 * Body: { transactionId }
 */
router.post('/connectips/verify', authMiddleware, async (req, res) => {
  try {
    const { transactionId } = req.body;

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        error: 'Transaction ID is required',
        message: 'Please provide a valid transaction ID'
      });
    }

    const paymentVerification = await controller.paymentService.verifyConnectIPSPayment(transactionId);

    if (!paymentVerification.success) {
      return res.status(400).json({
        success: false,
        error: 'Payment verification failed',
        data: paymentVerification
      });
    }

    // Activate subscription
    const activationResult = await controller.paymentService.activateSubscription(
      paymentVerification, controller.subscriptionService
    );

    res.json({
      success: true,
      data: activationResult,
      message: 'ConnectIPS payment verified and subscription activated'
    });
  } catch (error) {
    console.error('Error verifying ConnectIPS payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify ConnectIPS payment',
      message: error.message
    });
  }
});

// Coupon Management

/**
 * POST /api/v1/payment/coupons/validate
 * Validate coupon code
 * Requires authentication
 * Body: { couponCode, planName }
 */
router.post('/coupons/validate', authMiddleware, async (req, res) => {
  try {
    const { couponCode, planName } = req.body;

    if (!couponCode) {
      return res.status(400).json({
        success: false,
        error: 'Coupon code is required',
        message: 'Please provide a valid coupon code'
      });
    }

    // This would integrate with your coupon validation service
    const coupon = {
      code: couponCode,
      name: 'Test Coupon',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      minAmount: 500,
      maxDiscount: 500,
      applicablePlans: ['PRO', 'INVESTOR'],
      isValid: true,
      expiresAt: new Date('2024-12-31')
    };

    res.json({
      success: true,
      data: coupon,
      message: 'Coupon is valid'
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate coupon',
      message: error.message
    });
  }
});

// Payment Methods Management

/**
 * GET /api/v1/payment/methods
 * Get user's saved payment methods
 * Requires authentication
 */
router.get('/methods', authMiddleware, async (req, res) => {
  try {
    // This would integrate with your payment method storage
    const paymentMethods = [
      {
        id: 'pm_stripe_1',
        type: 'card',
        brand: 'Visa',
        last4: '4242',
        expiryMonth: 12,
        expiryYear: 2025,
        isDefault: true,
        provider: 'stripe'
      },
      {
        id: 'pm_khalti_1',
        type: 'wallet',
        identifier: '9800000000',
        isDefault: false,
        provider: 'khalti'
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
});

/**
 * POST /api/v1/payment/methods
 * Add a new payment method
 * Requires authentication
 * Body: { type, details, provider }
 */
router.post('/methods', authMiddleware, async (req, res) => {
  try {
    const { type, details, provider } = req.body;

    if (!type || !details || !provider) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'type, details, and provider are required'
      });
    }

    // This would integrate with payment provider APIs
    const paymentMethod = {
      id: `pm_${provider}_${Date.now()}`,
      type,
      ...details,
      provider,
      isDefault: false,
      createdAt: new Date()
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
});

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Payment API Error:', error);
  
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
