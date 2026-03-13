/**
 * FinSathi AI - Payment System Service
 * Comprehensive payment processing with Stripe and Nepal gateways
 */

const Stripe = require('stripe');
const axios = require('axios');
const crypto = require('crypto');

class PaymentService {
  constructor() {
    // Initialize Stripe (test mode for development)
    this.stripe = process.env.STRIPE_SECRET_KEY ? 
      new Stripe(process.env.STRIPE_SECRET_KEY) : null;
    
    // Nepal payment gateway configurations
    this.nepalGateways = {
      khalti: {
        baseUrl: process.env.KHALTI_API_URL || 'https://a.khalti.com/api/v2',
        secretKey: process.env.KHALTI_SECRET_KEY,
        merchantId: process.env.KHALTI_MERCHANT_ID
      },
      esewa: {
        baseUrl: process.env.ESEWA_API_URL || 'https://esewa.com.np/epay/main',
        merchantCode: process.env.ESEWA_MERCHANT_CODE,
        verificationUrl: process.env.ESEWA_VERIFICATION_URL || 'https://esewa.com.np/epay/transrec'
      },
      connectIPS: {
        baseUrl: process.env.CONNECTIPS_API_URL || 'https://connectips.com/connect/api/v1',
        merchantId: process.env.CONNECTIPS_MERCHANT_ID,
        secretKey: process.env.CONNECTIPS_SECRET_KEY
      }
    };
  }

  /**
   * Create Stripe checkout session
   */
  async createStripeCheckoutSession(userId, planId, planName, price, couponCode = null) {
    try {
      if (!this.stripe) {
        throw new Error('Stripe is not configured');
      }

      // Create or retrieve Stripe customer
      let customer;
      const existingCustomers = await this.stripe.customers.list({ email: `${userId}@finsathi.ai`, limit: 1 });
      
      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
      } else {
        customer = await this.stripe.customers.create({
          email: `${userId}@finsathi.ai`,
          metadata: { userId }
        });
      }

      // Create price object
      let priceData = {
        currency: 'npr',
        unit_amount: Math.round(price * 100), // Convert to cents
        product_data: {
          name: `${planName} Subscription`,
          description: `Monthly subscription for ${planName} plan`
        }
      };

      // Apply coupon discount if provided
      let discounts = [];
      if (couponCode) {
        const coupon = await this.validateStripeCoupon(couponCode, planName);
        if (coupon) {
          discounts = [{ coupon: coupon.id }];
        }
      }

      const session = await this.stripe.checkout.sessions.create({
        customer: customer.id,
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [priceData],
        discounts,
        success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`,
        metadata: {
          userId,
          planId,
          planName,
          couponCode: couponCode || ''
        },
        subscription_data: {
          metadata: {
            userId,
          planId,
          planName
          }
        },
        allow_promotion_codes: false // We handle coupons manually
      });

      return {
        provider: 'stripe',
        sessionId: session.id,
        paymentUrl: session.url,
        customer: customer.id,
        metadata: session.metadata
      };
    } catch (error) {
      console.error('Error creating Stripe checkout session:', error);
      throw new Error(`Failed to create Stripe checkout session: ${error.message}`);
    }
  }

  /**
   * Create Khalti payment session
   */
  async createKhaltiPayment(userId, planId, planName, price, couponCode = null) {
    try {
      const { baseUrl, secretKey, merchantId } = this.nepalGateways.khalti;

      // Apply coupon discount if provided
      let finalPrice = price;
      if (couponCode) {
        const coupon = await this.validateNepalCoupon(couponCode, planName);
        if (coupon) {
          finalPrice = this.applyCouponDiscount(price, coupon);
        }
      }

      const payload = {
        return_url: `${process.env.FRONTEND_URL}/payment/khalti/success`,
        website_url: process.env.FRONTEND_URL,
        amount: finalPrice * 100, // Khalti expects amount in paisa
        purchase_order_id: `order_${userId}_${Date.now()}`,
        purchase_order_name: `${planName} Subscription`,
        customer_info: {
          name: `User ${userId}`,
          email: `${userId}@finsathi.ai`,
          phone: '9800000000', // Default phone for demo
        },
        product_details: [
          {
            identity: planId,
            name: `${planName} Subscription`,
            total_price: finalPrice * 100,
            quantity: 1,
            unit_price: finalPrice * 100
          }
        ],
        merchant_id: merchantId,
        coupon_code: couponCode || null
      };

      const response = await axios.post(`${baseUrl}/epayment/initiate/`, payload, {
        headers: {
          'Authorization': `Key ${secretKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.success) {
        return {
          provider: 'khalti',
          paymentId: response.data.payment_id,
          paymentUrl: response.data.payment_url,
          purchaseOrderId: response.data.purchase_order_id,
          metadata: {
            userId,
            planId,
            planName,
            couponCode: couponCode || '',
            amount: finalPrice
          }
        };
      } else {
        throw new Error(response.data.message || 'Khalti payment initiation failed');
      }
    } catch (error) {
      console.error('Error creating Khalti payment:', error);
      throw new Error(`Failed to create Khalti payment: ${error.message}`);
    }
  }

  /**
   * Create eSewa payment session
   */
  async createEsewaPayment(userId, planId, planName, price, couponCode = null) {
    try {
      const { merchantCode } = this.nepalGateways.esewa;

      // Apply coupon discount if provided
      let finalPrice = price;
      if (couponCode) {
        const coupon = await this.validateNepalCoupon(couponCode, planName);
        if (coupon) {
          finalPrice = this.applyCouponDiscount(price, coupon);
        }
      }

      const transactionId = `finsathi_${userId}_${Date.now()}`;
      const signature = this.generateEsewaSignature(merchantCode, transactionId, finalPrice, '0');

      const paymentData = {
        amt: finalPrice.toFixed(2),
        psc: 0, // Service charge (0 for subscriptions)
        pdc: 0, // Delivery charge (0 for subscriptions)
        txAmt: 0, // Total amount (same as amt for subscriptions)
        scd: '0', // Service charge decimal
        pid: transactionId,
        su: `${process.env.FRONTEND_URL}/payment/esewa/success`,
        fu: `${process.env.FRONTEND_URL}/payment/esewa/failure`,
        merchantCode,
        signature
      };

      // eSewa uses form post, so we return the form data and URL
      return {
        provider: 'esewa',
        paymentId: transactionId,
        paymentUrl: 'https://esewa.com.np/epay/main',
        formData: paymentData,
        metadata: {
          userId,
          planId,
          planName,
          couponCode: couponCode || '',
          amount: finalPrice
        }
      };
    } catch (error) {
      console.error('Error creating eSewa payment:', error);
      throw new Error(`Failed to create eSewa payment: ${error.message}`);
    }
  }

  /**
   * Create ConnectIPS payment session
   */
  async createConnectIPSPayment(userId, planId, planName, price, couponCode = null) {
    try {
      const { baseUrl, merchantId, secretKey } = this.nepalGateways.connectIPS;

      // Apply coupon discount if provided
      let finalPrice = price;
      if (couponCode) {
        const coupon = await this.validateNepalCoupon(couponCode, planName);
        if (coupon) {
          finalPrice = this.applyCouponDiscount(price, coupon);
        }
      }

      const orderId = `finsathi_${userId}_${Date.now()}`;
      const payload = {
        merchant_id: merchantId,
        order_id: orderId,
        amount: finalPrice,
        currency: 'NPR',
        customer_name: `User ${userId}`,
        customer_email: `${userId}@finsathi.ai`,
        customer_phone: '9800000000',
        product_details: {
          name: `${planName} Subscription`,
          description: `Monthly subscription for ${planName} plan`,
          unit_price: finalPrice,
          quantity: 1
        },
        return_url: `${process.env.FRONTEND_URL}/payment/connectips/success`,
        cancel_url: `${process.env.FRONTEND_URL}/payment/connectips/cancel`,
        metadata: {
          userId,
          planId,
          planName,
          couponCode: couponCode || ''
        }
      };

      const response = await axios.post(`${baseUrl}/payment/initiate`, payload, {
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.success) {
        return {
          provider: 'connectips',
          paymentId: orderId,
          paymentUrl: response.data.payment_url,
          transactionId: response.data.transaction_id,
          metadata: {
            userId,
            planId,
            planName,
            couponCode: couponCode || '',
            amount: finalPrice
          }
        };
      } else {
        throw new Error(response.data.message || 'ConnectIPS payment initiation failed');
      }
    } catch (error) {
      console.error('Error creating ConnectIPS payment:', error);
      throw new Error(`Failed to create ConnectIPS payment: ${error.message}`);
    }
  }

  /**
   * Verify Stripe payment
   */
  async verifyStripePayment(sessionId) {
    try {
      if (!this.stripe) {
        throw new Error('Stripe is not configured');
      }

      const session = await this.stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status === 'paid') {
        // Get subscription details
        const subscription = await this.stripe.subscriptions.retrieve(session.subscription);
        
        return {
          provider: 'stripe',
          success: true,
          paymentId: session.payment_intent,
          subscriptionId: session.subscription,
          customer: session.customer,
          amount: session.amount_total / 100,
          currency: session.currency,
          status: session.payment_status,
          metadata: session.metadata,
          subscription: {
            id: subscription.id,
            status: subscription.status,
            current_period_start: subscription.current_period_start,
            current_period_end: subscription.current_period_end,
            cancel_at_period_end: subscription.cancel_at_period_end
          }
        };
      } else {
        return {
          provider: 'stripe',
          success: false,
          paymentId: session.payment_intent,
          status: session.payment_status,
          metadata: session.metadata
        };
      }
    } catch (error) {
      console.error('Error verifying Stripe payment:', error);
      throw new Error(`Failed to verify Stripe payment: ${error.message}`);
    }
  }

  /**
   * Verify Khalti payment
   */
  async verifyKhaltiPayment(paymentId) {
    try {
      const { baseUrl, secretKey } = this.nepalGateways.khalti;

      const response = await axios.post(`${baseUrl}/epayment/lookup/`, {
        pidx: paymentId
      }, {
        headers: {
          'Authorization': `Key ${secretKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.status === 'Completed') {
        const payment = response.data;
        
        return {
          provider: 'khalti',
          success: true,
          paymentId: payment.pidx,
          transactionId: payment.transaction_id,
          amount: payment.total_amount / 100,
          currency: 'NPR',
          status: payment.status,
          paidOn: payment.paid_on,
          metadata: payment.merchant_extras || {}
        };
      } else {
        return {
          provider: 'khalti',
          success: false,
          paymentId,
          status: response.data?.status || 'unknown',
          metadata: {}
        };
      }
    } catch (error) {
      console.error('Error verifying Khalti payment:', error);
      throw new Error(`Failed to verify Khalti payment: ${error.message}`);
    }
  }

  /**
   * Verify eSewa payment
   */
  async verifyEsewaPayment(transactionId, amount, refId) {
    try {
      const { merchantCode, verificationUrl } = this.nepalGateways.esewa;

      const response = await axios.post(verificationUrl, {
        merchant_code: merchantCode,
        transaction_id: transactionId,
        amount: amount.toFixed(2),
        reference_id: refId
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.success) {
        const verification = response.data;
        
        return {
          provider: 'esewa',
          success: true,
          paymentId: transactionId,
          referenceId: refId,
          amount: parseFloat(verification.amount),
          currency: 'NPR',
          status: verification.status,
          verifiedOn: verification.date,
          metadata: {}
        };
      } else {
        return {
          provider: 'esewa',
          success: false,
          paymentId: transactionId,
          status: 'failed',
          metadata: {}
        };
      }
    } catch (error) {
      console.error('Error verifying eSewa payment:', error);
      throw new Error(`Failed to verify eSewa payment: ${error.message}`);
    }
  }

  /**
   * Verify ConnectIPS payment
   */
  async verifyConnectIPSPayment(transactionId) {
    try {
      const { baseUrl, secretKey } = this.nepalGateways.connectIPS;

      const response = await axios.get(`${baseUrl}/payment/verify/${transactionId}`, {
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.success) {
        const payment = response.data.payment;
        
        return {
          provider: 'connectips',
          success: true,
          paymentId: transactionId,
          transactionId: payment.transaction_id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          paidOn: payment.paid_at,
          metadata: payment.metadata || {}
        };
      } else {
        return {
          provider: 'connectips',
          success: false,
          paymentId: transactionId,
          status: response.data?.status || 'unknown',
          metadata: {}
        };
      }
    } catch (error) {
      console.error('Error verifying ConnectIPS payment:', error);
      throw new Error(`Failed to verify ConnectIPS payment: ${error.message}`);
    }
  }

  /**
   * Create payment session (unified method)
   */
  async createPaymentSession(userId, provider, planId, planName, price, couponCode = null) {
    switch (provider.toLowerCase()) {
      case 'stripe':
        return await this.createStripeCheckoutSession(userId, planId, planName, price, couponCode);
      case 'khalti':
        return await this.createKhaltiPayment(userId, planId, planName, price, couponCode);
      case 'esewa':
        return await this.createEsewaPayment(userId, planId, planName, price, couponCode);
      case 'connectips':
        return await this.createConnectIPSPayment(userId, planId, planName, price, couponCode);
      default:
        throw new Error(`Unsupported payment provider: ${provider}`);
    }
  }

  /**
   * Verify payment (unified method)
   */
  async verifyPayment(provider, paymentId, additionalData = {}) {
    switch (provider.toLowerCase()) {
      case 'stripe':
        return await this.verifyStripePayment(paymentId);
      case 'khalti':
        return await this.verifyKhaltiPayment(paymentId);
      case 'esewa':
        return await this.verifyEsewaPayment(paymentId, additionalData.amount, additionalData.refId);
      case 'connectips':
        return await this.verifyConnectIPSPayment(paymentId);
      default:
        throw new Error(`Unsupported payment provider: ${provider}`);
    }
  }

  /**
   * Activate subscription after successful payment
   */
  async activateSubscription(paymentVerification, subscriptionService) {
    try {
      const { provider, success, metadata, amount } = paymentVerification;
      
      if (!success) {
        throw new Error('Payment verification failed');
      }

      const { userId, planId, planName, couponCode } = metadata;
      
      // Create subscription in database
      const subscription = await subscriptionService.subscribe(
        userId,
        planName,
        provider,
        couponCode
      );

      // Record payment
      await this.recordPayment(paymentVerification, subscription.id);

      // Send confirmation
      await this.sendPaymentConfirmation(userId, subscription, paymentVerification);

      return {
        success: true,
        subscription,
        payment: paymentVerification
      };
    } catch (error) {
      console.error('Error activating subscription:', error);
      throw new Error(`Failed to activate subscription: ${error.message}`);
    }
  }

  /**
   * Record payment in database
   */
  async recordPayment(paymentVerification, subscriptionId) {
    try {
      // This would integrate with your database
      const paymentRecord = {
        subscriptionId,
        provider: paymentVerification.provider,
        paymentId: paymentVerification.paymentId,
        amount: paymentVerification.amount,
        currency: paymentVerification.currency,
        status: 'COMPLETED',
        paidAt: new Date(),
        metadata: paymentVerification
      };

      console.log('Payment recorded:', paymentRecord);
      return paymentRecord;
    } catch (error) {
      console.error('Error recording payment:', error);
      throw error;
    }
  }

  /**
   * Send payment confirmation
   */
  async sendPaymentConfirmation(userId, subscription, paymentVerification) {
    try {
      // This would integrate with your email service
      const confirmationData = {
        userId,
        subscriptionId: subscription.id,
        planName: subscription.plan.displayName,
        amount: paymentVerification.amount,
        provider: paymentVerification.provider,
        paymentId: paymentVerification.paymentId,
        nextBillingDate: subscription.nextBillingDate
      };

      console.log('Payment confirmation sent:', confirmationData);
      return confirmationData;
    } catch (error) {
      console.error('Error sending payment confirmation:', error);
      throw error;
    }
  }

  /**
   * Validate Stripe coupon
   */
  async validateStripeCoupon(couponCode, planName) {
    try {
      if (!this.stripe) {
        return null;
      }

      // This would integrate with your coupon database
      // For now, return a mock coupon
      return {
        id: 'coupon_stripe_test',
        name: 'Test Coupon',
        percent_off: 20,
        duration: 'once'
      };
    } catch (error) {
      console.error('Error validating Stripe coupon:', error);
      return null;
    }
  }

  /**
   * Validate Nepal coupon
   */
  async validateNepalCoupon(couponCode, planName) {
    try {
      // This would integrate with your coupon database
      // For now, return a mock coupon
      return {
        code: couponCode,
        name: 'Test Coupon',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        minAmount: 500,
        maxDiscount: 500
      };
    } catch (error) {
      console.error('Error validating Nepal coupon:', error);
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

    // Apply minimum amount and maximum discount limits
    if (coupon.minAmount && originalAmount < coupon.minAmount) {
      return originalAmount; // Coupon not applicable
    }

    if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
      discountAmount = coupon.maxDiscount;
    }

    return Math.max(0, originalAmount - discountAmount);
  }

  /**
   * Generate eSewa signature
   */
  generateEsewaSignature(merchantCode, transactionId, amount, scd) {
    const secret = process.env.ESEWA_SECRET_KEY || 'test_secret';
    const string = merchantCode + transactionId + amount + scd + secret;
    return crypto.createHash('sha256').update(string).digest('hex');
  }

  /**
   * Get supported payment providers
   */
  getSupportedProviders() {
    const providers = [
      {
        name: 'stripe',
        displayName: 'Stripe (International)',
        supported: !!this.stripe,
        currencies: ['USD', 'EUR', 'GBP'],
        methods: ['card']
      },
      {
        name: 'khalti',
        displayName: 'Khalti (Digital Wallet)',
        supported: !!this.nepalGateways.khalti.secretKey,
        currencies: ['NPR'],
        methods: ['khalti_wallet', 'mobile_banking']
      },
      {
        name: 'esewa',
        displayName: 'eSewa (Digital Wallet)',
        supported: !!this.nepalGateways.esewa.merchantCode,
        currencies: ['NPR'],
        methods: ['esewa_wallet', 'mobile_banking']
      },
      {
        name: 'connectips',
        displayName: 'Connect IPS (Bank Transfer)',
        supported: !!this.nepalGateways.connectips.secretKey,
        currencies: ['NPR'],
        methods: ['bank_transfer', 'mobile_banking']
      }
    ];

    return providers.filter(p => p.supported);
  }

  /**
   * Handle payment webhook
   */
  async handleWebhook(provider, event, data) {
    try {
      switch (provider.toLowerCase()) {
        case 'stripe':
          return await this.handleStripeWebhook(event, data);
        case 'khalti':
          return await this.handleKhaltiWebhook(event, data);
        default:
          throw new Error(`Webhook not supported for provider: ${provider}`);
      }
    } catch (error) {
      console.error('Error handling webhook:', error);
      throw error;
    }
  }

  /**
   * Handle Stripe webhook
   */
  async handleStripeWebhook(event, data) {
    switch (event) {
      case 'invoice.payment_succeeded':
        console.log('Stripe payment succeeded:', data);
        // Activate subscription
        break;
      case 'invoice.payment_failed':
        console.log('Stripe payment failed:', data);
        // Handle failed payment
        break;
      case 'customer.subscription.deleted':
        console.log('Stripe subscription cancelled:', data);
        // Cancel subscription
        break;
      default:
        console.log('Unhandled Stripe webhook event:', event);
    }
  }

  /**
   * Handle Khalti webhook
   */
  async handleKhaltiWebhook(event, data) {
    switch (event) {
      case 'payment.completed':
        console.log('Khalti payment completed:', data);
        // Activate subscription
        break;
      case 'payment.failed':
        console.log('Khalti payment failed:', data);
        // Handle failed payment
        break;
      default:
        console.log('Unhandled Khalti webhook event:', event);
    }
  }
}

module.exports = PaymentService;
