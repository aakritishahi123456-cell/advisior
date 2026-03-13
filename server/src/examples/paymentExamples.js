/**
 * FinSathi AI - Payment System Examples
 * Demonstrating payment processing with Stripe and Nepal gateways
 */

const PaymentService = require('../services/paymentService');
const SubscriptionService = require('../services/subscriptionService');

// Initialize the payment service
const paymentService = new PaymentService();
const subscriptionService = new SubscriptionService();

// Sample users for demonstration
const sampleUsers = [
  {
    id: 'user-1',
    email: 'john.doe@example.com',
    name: 'John Doe'
  },
  {
    id: 'user-2',
    email: 'jane.smith@example.com',
    name: 'Jane Smith'
  }
];

// Sample subscription plans
const samplePlans = [
  {
    id: 'plan-pro',
    name: 'PRO',
    displayName: 'Pro Plan',
    price: 999
  },
  {
    id: 'plan-investor',
    name: 'INVESTOR',
    displayName: 'Investor Plan',
    price: 2499
  }
];

// Sample coupons
const sampleCoupons = [
  {
    code: 'WELCOME20',
    name: 'Welcome Discount',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    minAmount: 500,
    maxDiscount: 500
  },
  {
    code: 'FIRSTMONTH',
    name: 'First Month Free',
    discountType: 'FIXED_AMOUNT',
    discountValue: 999,
    minAmount: 999,
    maxDiscount: 999
  }
];

/**
 * Example 1: Get supported payment providers
 */
async function example1_GetSupportedProviders() {
  console.log('=== Example 1: Get Supported Payment Providers ===\n');
  
  try {
    const providers = paymentService.getSupportedProviders();
    
    console.log('Supported Payment Providers:');
    providers.forEach((provider, index) => {
      console.log(`${index + 1}. ${provider.displayName} (${provider.name})`);
      console.log(`   Supported: ${provider.supported ? '✅' : '❌'}`);
      console.log(`   Currencies: ${provider.currencies.join(', ')}`);
      console.log(`   Methods: ${provider.methods.join(', ')}`);
      console.log('');
    });
    
    return providers;
  } catch (error) {
    console.error('Error getting supported providers:', error.message);
    return null;
  }
}

/**
 * Example 2: Create Stripe checkout session
 */
async function example2_CreateStripeSession() {
  console.log('\n=== Example 2: Create Stripe Checkout Session ===\n');
  
  try {
    const userId = sampleUsers[0].id;
    const plan = samplePlans[0]; // Pro Plan
    const couponCode = sampleCoupons[0].code;
    
    console.log(`Creating Stripe checkout session for user ${userId}`);
    console.log(`Plan: ${plan.displayName} (${plan.name})`);
    console.log(`Price: NPR ${plan.price}`);
    console.log(`Coupon: ${couponCode}`);
    
    const session = await paymentService.createStripeCheckoutSession(
      userId, 'stripe', plan.id, plan.name, plan.price, couponCode
    );
    
    console.log('✅ Stripe checkout session created successfully!');
    console.log(`Session ID: ${session.sessionId}`);
    console.log(`Customer ID: ${session.customer}`);
    console.log(`Payment URL: ${session.paymentUrl}`);
    console.log(`Provider: ${session.provider}`);
    console.log(`Metadata:`, session.metadata);
    
    return session;
  } catch (error) {
    console.error('Error creating Stripe session:', error.message);
    return null;
  }
}

/**
 * Example 3: Create Khalti payment session
 */
async function example3_CreateKhaltiSession() {
  console.log('\n=== Example 3: Create Khalti Payment Session ===\n');
  
  try {
    const userId = sampleUsers[1].id;
    const plan = samplePlans[1]; // Investor Plan
    const couponCode = sampleCoupons[1].code;
    
    console.log(`Creating Khalti payment for user ${userId}`);
    console.log(`Plan: ${plan.displayName} (${plan.name})`);
    console.log(`Price: NPR ${plan.price}`);
    console.log(`Coupon: ${couponCode}`);
    
    const payment = await paymentService.createKhaltiPayment(
      userId, plan.id, plan.name, plan.price, couponCode
    );
    
    console.log('✅ Khalti payment created successfully!');
    console.log(`Payment ID: ${payment.paymentId}`);
    console.log(`Payment URL: ${payment.paymentUrl}`);
    console.log(`Purchase Order ID: ${payment.purchaseOrderId}`);
    console.log(`Provider: ${payment.provider}`);
    console.log(`Metadata:`, payment.metadata);
    
    return payment;
  } catch (error) {
    console.error('Error creating Khalti payment:', error.message);
    return null;
  }
}

/**
 * Example 4: Create eSewa payment session
 */
async function example4_CreateEsewaSession() {
  console.log('\n=== Example 4: Create eSewa Payment Session ===\n');
  
  try {
    const userId = sampleUsers[0].id;
    const plan = samplePlans[0]; // Pro Plan
    
    console.log(`Creating eSewa payment for user ${userId}`);
    console.log(`Plan: ${plan.displayName} (${plan.name})`);
    console.log(`Price: NPR ${plan.price}`);
    
    const payment = await paymentService.createEsewaPayment(
      userId, plan.id, plan.name, plan.price
    );
    
    console.log('✅ eSewa payment created successfully!');
    console.log(`Payment ID: ${payment.paymentId}`);
    console.log(`Payment URL: ${payment.paymentUrl}`);
    console.log(`Form Data:`, payment.formData);
    console.log(`Provider: ${payment.provider}`);
    console.log(`Metadata:`, payment.metadata);
    
    return payment;
  } catch (error) {
    console.error('Error creating eSewa payment:', error.message);
    return null;
  }
}

/**
 * Example 5: Create ConnectIPS payment session
 */
async function example5_CreateConnectIPSSession() {
  console.log('\n=== Example 5: Create ConnectIPS Payment Session ===\n');
  
  try {
    const userId = sampleUsers[1].id;
    const plan = samplePlans[1]; // Investor Plan
    
    console.log(`Creating ConnectIPS payment for user ${userId}`);
    console.log(`Plan: ${plan.displayName} (${plan.name})`);
    console.log(`Price: NPR ${plan.price}`);
    
    const payment = await paymentService.createConnectIPSPayment(
      userId, plan.id, plan.name, plan.price
    );
    
    console.log('✅ ConnectIPS payment created successfully!');
    console.log(`Payment ID: ${payment.paymentId}`);
    console.log(`Transaction ID: ${payment.transactionId}`);
    console.log(`Payment URL: ${payment.paymentUrl}`);
    console.log(`Provider: ${payment.provider}`);
    console.log(`Metadata:`, payment.metadata);
    
    return payment;
  } catch (error) {
    console.error('Error creating ConnectIPS payment:', error.message);
    return null;
  }
}

/**
 * Example 6: Verify Stripe payment
 */
async function example6_VerifyStripePayment() {
  console.log('\n=== Example 6: Verify Stripe Payment ===\n');
  
  try {
    // Simulate a Stripe checkout session ID
    const sessionId = 'cs_test_stripe_session_123456';
    
    console.log(`Verifying Stripe payment with session ID: ${sessionId}`);
    
    const verification = await paymentService.verifyStripePayment(sessionId);
    
    console.log('✅ Stripe payment verified!');
    console.log(`Success: ${verification.success}`);
    console.log(`Payment ID: ${verification.paymentId}`);
    console.log(`Subscription ID: ${verification.subscriptionId}`);
    console.log(`Amount: NPR ${verification.amount}`);
    console.log(`Currency: ${verification.currency}`);
    console.log(`Status: ${verification.status}`);
    console.log(`Customer: ${verification.customer}`);
    console.log(`Metadata:`, verification.metadata);
    
    if (verification.subscription) {
      console.log(`Subscription Details:`);
      console.log(`  Status: ${verification.subscription.status}`);
      console.log(`  Current Period: ${new Date(verification.subscription.current_period_start * 1000).toLocaleDateString()}`);
      console.log(`  Next Billing: ${new Date(verification.subscription.current_period_end * 1000).toLocaleDateString()}`);
    }
    
    return verification;
  } catch (error) {
    console.error('Error verifying Stripe payment:', error.message);
    return null;
  }
}

/**
 * Example 7: Verify Khalti payment
 */
async function example7_VerifyKhaltiPayment() {
  console.log('\n=== Example 7: Verify Khalti Payment ===\n');
  
  try {
    // Simulate a Khalti payment ID
    const paymentId = 'test_khalti_payment_123456';
    
    console.log(`Verifying Khalti payment with payment ID: ${paymentId}`);
    
    const verification = await paymentService.verifyKhaltiPayment(paymentId);
    
    console.log('✅ Khalti payment verified!');
    console.log(`Success: ${verification.success}`);
    console.log(`Payment ID: ${verification.paymentId}`);
    console.log(`Transaction ID: ${verification.transactionId}`);
    console.log(`Amount: NPR ${verification.amount}`);
    console.log(`Currency: ${verification.currency}`);
    console.log(`Status: ${verification.status}`);
    console.log(`Paid On: ${verification.paidOn}`);
    console.log(`Metadata:`, verification.metadata);
    
    return verification;
  } catch (error) {
    console.error('Error verifying Khalti payment:', error.message);
    return null;
  }
}

/**
 * Example 8: Activate subscription after successful payment
 */
async function example8_ActivateSubscription() {
  console.log('\n=== Example 8: Activate Subscription After Payment ===\n');
  
  try {
    // Simulate a successful payment verification
    const mockPaymentVerification = {
      provider: 'stripe',
      success: true,
      paymentId: 'pi_stripe_123456',
      amount: 999,
      currency: 'NPR',
      status: 'COMPLETED',
      metadata: {
        userId: sampleUsers[0].id,
        planId: samplePlans[0].id,
        planName: samplePlans[0].name,
        couponCode: sampleCoupons[0].code
      }
    };
    
    console.log('Activating subscription after successful payment...');
    console.log(`Provider: ${mockPaymentVerification.provider}`);
    console.log(`Amount: NPR ${mockPaymentVerification.amount}`);
    console.log(`Plan: ${mockPaymentVerification.metadata.planName}`);
    console.log(`User: ${mockPaymentVerification.metadata.userId}`);
    
    // Initialize subscription service if needed
    await subscriptionService.initializePlans();
    
    const activationResult = await paymentService.activateSubscription(
      mockPaymentVerification,
      subscriptionService
    );
    
    console.log('✅ Subscription activated successfully!');
    console.log(`Subscription ID: ${activationResult.subscription.id}`);
    console.log(`Plan: ${activationResult.subscription.plan.displayName}`);
    console.log(`Status: ${activationResult.subscription.status}`);
    console.log(`Start Date: ${activationResult.subscription.startDate}`);
    console.log(`End Date: ${activationResult.subscription.endDate}`);
    console.log(`Auto-renew: ${activationResult.subscription.autoRenew}`);
    
    return activationResult;
  } catch (error) {
    console.error('Error activating subscription:', error.message);
    return null;
  }
}

/**
 * Example 9: Handle payment failure scenarios
 */
async function example9_PaymentFailureScenarios() {
  console.log('\n=== Example 9: Payment Failure Scenarios ===\n');
  
  try {
    // Simulate failed payment verification
    const failedVerification = {
      provider: 'stripe',
      success: false,
      paymentId: 'pi_stripe_failed_123',
      status: 'failed',
      metadata: {
        userId: sampleUsers[0].id,
        planId: samplePlans[0].id,
        planName: samplePlans[0].name
      }
    };
    
    console.log('Handling failed payment verification...');
    console.log(`Provider: ${failedVerification.provider}`);
    console.log(`Success: ${failedVerification.success}`);
    console.log(`Status: ${failedVerification.status}`);
    
    // Handle failed payment
    const errorHandling = {
      recordFailure: true,
      notifyUser: true,
      retryAllowed: true,
      failureReason: 'Payment was declined by the payment provider'
    };
    
    console.log('✅ Payment failure handled:');
    console.log(`  Failure Recorded: ${errorHandling.recordFailure}`);
    console.log(`  User Notified: ${errorHandling.notifyUser}`);
    console.log(`  Retry Allowed: ${errorHandling.retryAllowed}`);
    console.log(`  Reason: ${errorHandling.failureReason}`);
    
    return errorHandling;
  } catch (error) {
    console.error('Error handling payment failure:', error.message);
    return null;
  }
}

/**
 * Example 10: Coupon validation and application
 */
async function example10_CouponManagement() {
  console.log('\n=== Example 10: Coupon Management ===\n');
  
  try {
    console.log('Testing coupon validation and application:');
    
    for (const coupon of sampleCoupons) {
      console.log(`\nTesting coupon: ${coupon.code}`);
      console.log(`Name: ${coupon.name}`);
      console.log(`Type: ${coupon.discountType}`);
      console.log(`Value: ${coupon.discountValue}${coupon.discountType === 'PERCENTAGE' ? '%' : ''}`);
      console.log(`Min Amount: NPR ${coupon.minAmount}`);
      console.log(`Max Discount: NPR ${coupon.maxDiscount}`);
      
      // Test with different plans
      for (const plan of samplePlans) {
        console.log(`  Testing with ${plan.name} (NPR ${plan.price}):`);
        
        const originalPrice = plan.price;
        const finalPrice = paymentService.applyCouponDiscount(originalPrice, coupon);
        const savings = originalPrice - finalPrice;
        
        console.log(`    Original Price: NPR ${originalPrice}`);
        console.log(`    Final Price: NPR ${finalPrice}`);
        console.log(`    Savings: NPR ${savings}`);
        console.log(`    Discount: ${((savings / originalPrice) * 100).toFixed(2)}%`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error testing coupons:', error.message);
    return null;
  }
}

/**
 * Example 11: Webhook handling
 */
async function example11_WebhookHandling() {
  console.log('\n=== Example 11: Webhook Handling ===\n');
  
  try {
    // Simulate Stripe webhook event
    const stripeWebhookEvent = {
      type: 'invoice.payment_succeeded',
      data: {
        id: 'evt_stripe_webhook_123',
        object: 'event',
        type: 'invoice.payment_succeeded',
        created: Date.now() / 1000,
        data: {
          object: 'invoice',
          id: 'in_stripe_invoice_123',
          customer: 'cus_stripe_customer_123',
          payment_intent: 'pi_stripe_payment_123',
          amount_paid: 99900, // in cents
          currency: 'npr',
          status: 'paid'
        }
      }
    };
    
    console.log('Handling Stripe webhook event:');
    console.log(`Event Type: ${stripeWebhookEvent.type}`);
    console.log(`Event ID: ${stripeWebhookEvent.data.id}`);
    console.log(`Customer: ${stripeWebhookEvent.data.data.customer}`);
    console.log(`Amount: NPR ${stripeWebhookEvent.data.data.amount_paid / 100}`);
    console.log(`Status: ${stripeWebhookEvent.data.data.status}`);
    
    // Handle webhook
    const result = await paymentService.handleWebhook('stripe', stripeWebhookEvent.type, stripeWebhookEvent.data);
    
    console.log('✅ Webhook handled successfully!');
    console.log(`Result: ${result}`);
    
    // Simulate Khalti webhook event
    const khaltiWebhookEvent = {
      type: 'payment.completed',
      data: {
        idx: 'khalti_webhook_123',
        pidx: 'test_khalti_payment_123456',
        transaction_id: 'txn_khalti_123456',
        amount: 99900,
        mobile: '9800000000',
        status: 'Completed',
        paid_on: '2024-03-15T10:30:00Z',
        merchant_extras: {
          userId: sampleUsers[0].id,
          planId: samplePlans[0].id,
          planName: samplePlans[0].name
        }
      }
    };
    
    console.log('\nHandling Khalti webhook event:');
    console.log(`Event Type: ${khaltiWebhookEvent.type}`);
    console.log(`Payment ID: ${khaltiWebhookEvent.data.pidx}`);
    console.log(`Amount: NPR ${khaltiWebhookEvent.data.amount / 100}`);
    console.log(`Status: ${khaltiWebhookEvent.data.status}`);
    
    const khaltiResult = await paymentService.handleWebhook('khalti', khaltiWebhookEvent.type, khaltiWebhookEvent.data);
    
    console.log('✅ Khalti webhook handled successfully!');
    console.log(`Result: ${khaltiResult}`);
    
    return { stripeResult: result, khaltiResult };
  } catch (error) {
    console.error('Error handling webhooks:', error.message);
    return null;
  }
}

/**
 * Example 12: Payment analytics
 */
async function example12_PaymentAnalytics() {
  console.log('\n=== Example 12: Payment Analytics ===\n');
  
  try {
    // Mock payment analytics data
    const analytics = {
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
        { date: '2024-03-13', revenue: 5200 },
        { date: '2024-03-12', revenue: 4800 },
        { date: '2024-03-11', revenue: 5100 }
      ],
      planDistribution: {
        PRO: 100,
        INVESTOR: 50
      },
      paymentMethods: {
        card: 80,
        digital_wallet: 60,
        bank_transfer: 10
      }
    };
    
    console.log('📊 Payment Analytics Overview:');
    console.log(`Total Payments: ${analytics.totalPayments}`);
    console.log(`Total Revenue: NPR ${analytics.totalRevenue.toLocaleString()}`);
    console.log(`Average Payment: NPR ${analytics.averagePayment.toLocaleString()}`);
    console.log(`Success Rate: ${analytics.successRate}%`);
    
    console.log('\n📈 Provider Distribution:');
    Object.entries(analytics.providerDistribution).forEach(([provider, count]) => {
      const percentage = (count / analytics.totalPayments * 100).toFixed(1);
      console.log(`  ${provider}: ${count} payments (${percentage}%)`);
    });
    
    console.log('\n💰 Plan Distribution:');
    Object.entries(analytics.planDistribution).forEach(([plan, count]) => {
      const percentage = (count / analytics.totalPayments * 100).toFixed(1);
      console.log(`  ${plan}: ${count} subscriptions (${percentage}%)`);
    });
    
    console.log('\n💳 Payment Methods:');
    Object.entries(analytics.paymentMethods).forEach(([method, count]) => {
      const percentage = (count / analytics.totalPayments * 100).toFixed(1);
      console.log(`  ${method.replace('_', ' ')}: ${count} payments (${percentage}%)`);
    });
    
    console.log('\n📅 Daily Revenue (Last 5 days):');
    analytics.dailyRevenue.forEach(day => {
      console.log(`  ${day.date}: NPR ${day.revenue.toLocaleString()}`);
    });
    
    return analytics;
  } catch (error) {
    console.error('Error getting payment analytics:', error.message);
    return null;
  }
}

/**
 * Example 13: Refund processing
 */
async function example13_RefundProcessing() {
  console.log('\n=== Example 13: Refund Processing ===\n');
  
  try {
    // Simulate refund request
    const refundRequest = {
      provider: 'stripe',
      paymentId: 'pi_stripe_123456',
      amount: 999,
      reason: 'Customer requested refund'
    };
    
    console.log('Processing refund request:');
    console.log(`Provider: ${refundRequest.provider}`);
    console.log(`Payment ID: ${refundRequest.paymentId}`);
    console.log(`Amount: NPR ${refundRequest.amount}`);
    console.log(`Reason: ${refundRequest.reason}`);
    
    // Process refund
    const refundResult = await paymentService.processRefund(
      refundRequest.provider,
      refundRequest.paymentId,
      refundRequest.amount,
      refundRequest.reason
    );
    
    console.log('✅ Refund processed successfully!');
    console.log(`Refund ID: ${refundResult.refundId}`);
    console.log(`Status: ${refundResult.status}`);
    console.log(`Processed At: ${refundResult.processedAt}`);
    
    return refundResult;
  } catch (error) {
    console.error('Error processing refund:', error.message);
    return null;
  }
}

/**
 * Example 14: Test payment integration
 */
async function example14_TestPaymentIntegration() {
  console.log('\n=== Example 14: Test Payment Integration ===\n');
  
  try {
    if (process.env.NODE_ENV === 'production') {
      console.log('❌ Test mode not available in production');
      return null;
    }
    
    const testProviders = ['stripe', 'khalti'];
    
    for (const provider of testProviders) {
      console.log(`\nTesting ${provider} integration:`);
      
      const testPayment = await paymentService.createTestPayment(provider, 100);
      
      if (testPayment) {
        console.log(`✅ ${provider} test payment created`);
        console.log(`  Payment ID: ${testPayment.paymentId || testPayment.sessionId}`);
        console.log(`  Payment URL: ${testPayment.paymentUrl}`);
      } else {
        console.log(`❌ ${provider} test payment failed`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error testing payment integration:', error.message);
    return null;
  }
}

/**
 * Example 15: Complete payment flow simulation
 */
async function example15_CompletePaymentFlow() {
  console.log('\n=== Example 15: Complete Payment Flow Simulation ===\n');
  
  try {
    const userId = sampleUsers[0].id;
    const plan = samplePlans[0]; // Pro Plan
    const provider = 'stripe';
    const couponCode = sampleCoupons[0].code;
    
    console.log(`🔄 Simulating complete payment flow for user ${userId}`);
    console.log(`Plan: ${plan.displayName} (${plan.name})`);
    console.log(`Provider: ${provider}`);
    console.log(`Price: NPR ${plan.price}`);
    console.log(`Coupon: ${couponCode}`);
    
    // Step 1: Create payment session
    console.log('\nStep 1: Creating payment session...');
    const paymentSession = await paymentService.createPaymentSession(
      userId, provider, plan.id, plan.name, plan.price, couponCode
    );
    
    console.log(`✅ Payment session created: ${paymentSession.sessionId || paymentSession.paymentId}`);
    
    // Step 2: Simulate user payment
    console.log('\nStep 2: Simulating user payment...');
    console.log(`User navigates to: ${paymentSession.paymentUrl}`);
    console.log('User completes payment form...');
    
    // Step 3: Verify payment
    console.log('\nStep 3: Verifying payment...');
    const paymentVerification = await paymentService.verifyPayment(
      provider, 
      paymentSession.sessionId || paymentSession.paymentId
    );
    
    if (!paymentVerification.success) {
      console.log('❌ Payment verification failed');
      return null;
    }
    
    console.log('✅ Payment verified successfully!');
    console.log(`Payment ID: ${paymentVerification.paymentId}`);
    console.log(`Amount: NPR ${paymentVerification.amount}`);
    
    // Step 4: Activate subscription
    console.log('\nStep 4: Activating subscription...');
    const activationResult = await paymentService.activateSubscription(
      paymentVerification,
      subscriptionService
    );
    
    console.log('✅ Subscription activated successfully!');
    console.log(`Subscription ID: ${activationResult.subscription.id}`);
    console.log(`Status: ${activationResult.subscription.status}`);
    console.log(`End Date: ${activationResult.subscription.endDate}`);
    
    // Step 5: Send confirmation
    console.log('\nStep 5: Sending confirmation...');
    console.log('✅ Payment confirmation sent to user');
    console.log('✅ Subscription activation email sent');
    console.log('✅ Receipt generated');
    
    console.log('\n🎉 Complete payment flow successful!');
    console.log('User now has access to premium features');
    
    return activationResult;
  } catch (error) {
    console.error('Error in complete payment flow:', error.message);
    return null;
  }
}

/**
 * Run all examples
 */
async function runAllExamples() {
  console.log('🚀 FinSathi AI - Payment System Examples\n');
  console.log('Demonstrating payment processing with Stripe and Nepal gateways...\n');
  
  try {
    await example1_GetSupportedProviders();
    await example2_CreateStripeSession();
    await example3_CreateKhaltiSession();
    await example4_CreateEsewaSession();
    await example5_CreateConnectIPSSession();
    await example6_VerifyStripePayment();
    await example7_VerifyKhaltiPayment();
    await example8_ActivateSubscription();
    await example9_PaymentFailureScenarios();
    await example10_CouponManagement();
    await example11_WebhookHandling();
    await example12_PaymentAnalytics();
    await example13_RefundProcessing();
    await example14_TestPaymentIntegration();
    await example15_CompletePaymentFlow();
    
    console.log('\n✅ All examples completed successfully!');
  } catch (error) {
    console.error('❌ Error running examples:', error.message);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples();
}

module.exports = {
  runAllExamples,
  example1_GetSupportedProviders,
  example2_CreateStripeSession,
  example3_CreateKhaltiSession,
  example4_CreateEsewaSession,
  example5_CreateConnectIPSSession,
  example6_VerifyStripePayment,
  example7_VerifyKhaltiPayment,
  example8_ActivateSubscription,
  example9_PaymentFailureScenarios,
  example10_CouponManagement,
  example11_WebhookHandling,
  example12_PaymentAnalytics,
  example13_RefundProcessing,
  example14_TestPaymentIntegration,
  example15_CompletePaymentFlow,
  sampleUsers,
  samplePlans,
  sampleCoupons
};
