/**
 * FinSathi AI - Subscription System Examples
 * Demonstrates subscription management and premium features
 */

const SubscriptionService = require('../services/subscriptionService');

// Initialize the subscription service
const subscriptionService = new SubscriptionService();

// Sample users for demonstration
const sampleUsers = [
  {
    id: 'user-1',
    email: 'john.doe@example.com',
    name: 'John Doe',
    isAdmin: false
  },
  {
    id: 'user-2',
    email: 'jane.smith@example.com',
    name: 'Jane Smith',
    isAdmin: false
  },
  {
    id: 'admin-1',
    email: 'admin@finsathi.ai',
    name: 'Admin User',
    isAdmin: true
  }
];

// Sample payment methods
const samplePaymentMethods = [
  {
    id: 'card_1',
    type: 'credit_card',
    brand: 'Visa',
    last4: '4242',
    expiryMonth: 12,
    expiryYear: 2025
  },
  {
    id: 'card_2',
    type: 'credit_card',
    brand: 'Mastercard',
    last4: '5555',
    expiryMonth: 8,
    expiryYear: 2024
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
    maxDiscount: 200,
    usageLimit: 100,
    applicablePlans: ['PRO', 'INVESTOR']
  },
  {
    code: 'FIRSTMONTH',
    name: 'First Month Free',
    discountType: 'FIXED_AMOUNT',
    discountValue: 999,
    minAmount: 999,
    maxDiscount: 999,
    usageLimit: 50,
    applicablePlans: ['PRO']
  }
];

/**
 * Example 1: Initialize subscription plans
 */
async function example1_InitializePlans() {
  console.log('=== Example 1: Initialize Subscription Plans ===\n');
  
  try {
    await subscriptionService.initializePlans();
    console.log('✅ Subscription plans initialized successfully');
    
    const plans = await subscriptionService.getPlans();
    console.log('\nAvailable Plans:');
    plans.forEach((plan, index) => {
      console.log(`${index + 1}. ${plan.displayName} (${plan.name})`);
      console.log(`   Price: NPR ${plan.price}/month`);
      console.log(`   Features: ${Object.keys(plan.features).length} features`);
      console.log('');
    });
    
    return plans;
  } catch (error) {
    console.error('Error initializing plans:', error.message);
    return null;
  }
}

/**
 * Example 2: Subscribe user to Pro plan
 */
async function example2_SubscribeToPro() {
  console.log('\n=== Example 2: Subscribe User to Pro Plan ===\n');
  
  try {
    const userId = sampleUsers[0].id;
    const planName = 'PRO';
    const paymentMethod = samplePaymentMethods[0].id;
    
    console.log(`Subscribing user ${userId} to ${planName} plan...`);
    
    const subscription = await subscriptionService.subscribe(userId, planName, paymentMethod);
    
    console.log('✅ Subscription created successfully!');
    console.log(`Plan: ${subscription.plan.displayName}`);
    console.log(`Status: ${subscription.status}`);
    console.log(`Start Date: ${subscription.startDate}`);
    console.log(`End Date: ${subscription.endDate}`);
    console.log(`Next Billing: ${subscription.nextBillingDate}`);
    console.log(`Auto-renew: ${subscription.autoRenew}`);
    
    console.log('\nAvailable Features:');
    Object.entries(subscription.features).forEach(([key, feature]) => {
      console.log(`  ${feature.name}: ${feature.enabled ? '✅ Enabled' : '❌ Disabled'}`);
      if (feature.enabled && feature.limits) {
        console.log(`    Limits: ${JSON.stringify(feature.limits)}`);
      }
    });
    
    return subscription;
  } catch (error) {
    console.error('Error subscribing to plan:', error.message);
    return null;
  }
}

/**
 * Example 3: Check feature access
 */
async function example3_CheckFeatureAccess() {
  console.log('\n=== Example 3: Check Feature Access ===\n');
  
  try {
    const userId = sampleUsers[0].id;
    const featuresToCheck = ['aiAdvisor', 'tradingSignals', 'advancedAnalysis', 'portfolioTracking'];
    
    console.log(`Checking feature access for user ${userId}:`);
    
    for (const featureKey of featuresToCheck) {
      const hasAccess = await subscriptionService.hasFeatureAccess(userId, featureKey);
      console.log(`  ${featureKey}: ${hasAccess ? '✅ Access Granted' : '❌ Access Denied'}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error checking feature access:', error.message);
    return false;
  }
}

/**
 * Example 4: Track feature usage
 */
async function example4_TrackFeatureUsage() {
  console.log('\n=== Example 4: Track Feature Usage ===\n');
  
  try {
    const userId = sampleUsers[0].id;
    const usageEvents = [
      { featureKey: 'aiAdvisor', action: 'GENERATE_ADVICE' },
      { featureKey: 'tradingSignals', action: 'GENERATE_SIGNALS' },
      { featureKey: 'aiAdvisor', action: 'VIEW_REPORT' },
      { featureKey: 'advancedAnalysis', action: 'GENERATE_REPORT' }
    ];
    
    console.log(`Tracking feature usage for user ${userId}:`);
    
    for (const event of usageEvents) {
      const tracked = await subscriptionService.trackFeatureUsage(userId, event.featureKey, event.action);
      console.log(`  ${event.featureKey} (${event.action}): ${tracked ? '✅ Tracked' : '❌ Failed'}`);
    }
    
    // Get usage statistics
    console.log('\nUsage Statistics:');
    for (const featureKey of ['aiAdvisor', 'tradingSignals', 'advancedAnalysis']) {
      const usage = await subscriptionService.getFeatureUsage(userId, featureKey, 'current');
      console.log(`  ${featureKey}: ${usage ? usage.length + ' records' : 'No usage data'}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error tracking feature usage:', error.message);
    return false;
  }
}

/**
 * Example 5: Upgrade to Investor plan
 */
async function example5_UpgradeToInvestor() {
  console.log('\n=== Example 5: Upgrade to Investor Plan ===\n');
  
  try {
    const userId = sampleUsers[0].id;
    const planName = 'INVESTOR';
    const paymentMethod = samplePaymentMethods[1].id;
    const couponCode = 'WELCOME20';
    
    console.log(`Upgrading user ${userId} to ${planName} plan with coupon ${couponCode}...`);
    
    // Validate coupon first
    const coupon = await subscriptionService.validateCoupon(couponCode, planName);
    if (coupon) {
      console.log(`✅ Coupon validated: ${coupon.name} (${coupon.discountValue}% off)`);
    } else {
      console.log('❌ Invalid coupon');
    }
    
    const subscription = await subscriptionService.subscribe(userId, planName, paymentMethod, couponCode);
    
    console.log('✅ Upgrade successful!');
    console.log(`New Plan: ${subscription.plan.displayName}`);
    console.log(`New Price: NPR ${subscription.plan.price}/month`);
    
    console.log('\nNew Features Available:');
    Object.entries(subscription.features).forEach(([key, feature]) => {
      if (feature.enabled) {
        console.log(`  ✅ ${feature.name}`);
      }
    });
    
    return subscription;
  } catch (error) {
    console.error('Error upgrading subscription:', error.message);
    return null;
  }
}

/**
 * Example 6: Validate and apply coupons
 */
async function example6_CouponManagement() {
  console.log('\n=== Example 6: Coupon Management ===\n');
  
  try {
    console.log('Testing coupon validation:');
    
    for (const coupon of sampleCoupons) {
      console.log(`\nTesting coupon: ${coupon.code}`);
      
      // Test with different plans
      const plans = ['PRO', 'INVESTOR'];
      for (const plan of plans) {
        const validated = await subscriptionService.validateCoupon(coupon.code, plan);
        if (validated) {
          const originalPrice = plan === 'PRO' ? 999 : 2499;
          const discountedPrice = subscriptionService.applyCouponDiscount(originalPrice, validated);
          const savings = originalPrice - discountedPrice;
          
          console.log(`  ✅ Valid for ${plan}: Save NPR ${savings} (${discountedPrice} vs ${originalPrice})`);
        } else {
          console.log(`  ❌ Invalid for ${plan}`);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error testing coupons:', error.message);
    return false;
  }
}

/**
 * Example 7: Subscription analytics
 */
async function example7_SubscriptionAnalytics() {
  console.log('\n=== Example 7: Subscription Analytics ===\n');
  
  try {
    // Get overall analytics
    const analytics = await subscriptionService.getSubscriptionAnalytics();
    
    console.log('📊 Subscription Analytics Overview:');
    console.log(`Total Subscriptions: ${analytics.totalSubscriptions}`);
    console.log(`Active Subscriptions: ${analytics.activeSubscriptions}`);
    console.log(`Monthly Recurring Revenue: NPR ${analytics.revenue.monthly.toLocaleString()}`);
    console.log(`Churn Rate: ${analytics.churnRate.toFixed(2)}%`);
    
    console.log('\nPlan Distribution:');
    Object.entries(analytics.planDistribution).forEach(([plan, count]) => {
      const percentage = (count / analytics.totalSubscriptions * 100).toFixed(1);
      console.log(`  ${plan}: ${count} subscriptions (${percentage}%)`);
    });
    
    // Get user-specific analytics
    const userId = sampleUsers[0].id;
    const userAnalytics = await subscriptionService.getSubscriptionAnalytics(userId);
    
    if (userAnalytics.totalSubscriptions > 0) {
      console.log(`\n👤 User ${userId} Analytics:`);
      console.log(`Total Subscriptions: ${userAnalytics.totalSubscriptions}`);
      console.log(`Active Subscriptions: ${userAnalytics.activeSubscriptions}`);
      console.log(`Monthly Cost: NPR ${userAnalytics.revenue.monthly.toLocaleString()}`);
    }
    
    return analytics;
  } catch (error) {
    console.error('Error getting analytics:', error.message);
    return null;
  }
}

/**
 * Example 8: Feature limits and quotas
 */
async function example8_FeatureLimits() {
  console.log('\n=== Example 8: Feature Limits and Quotas ===\n');
  
  try {
    const userId = sampleUsers[0].id;
    const subscription = await subscriptionService.getUserSubscription(userId);
    
    console.log(`Feature Limits for ${subscription.plan.displayName}:`);
    
    Object.entries(subscription.features).forEach(([key, feature]) => {
      console.log(`\n${feature.name} (${key}):`);
      console.log(`  Enabled: ${feature.enabled ? '✅' : '❌'}`);
      
      if (feature.enabled && feature.limits) {
        console.log(`  Limits: ${JSON.stringify(feature.limits)}`);
        
        if (feature.usage) {
          const used = feature.usage.usageCount || 0;
          const limit = feature.limits.maxUses;
          const remaining = limit && limit !== 'unlimited' ? Math.max(0, limit - used) : 'unlimited';
          
          console.log(`  Usage: ${used}/${limit || 'unlimited'}`);
          console.log(`  Remaining: ${remaining}`);
        }
      }
    });
    
    // Test usage limits
    console.log('\n🧪 Testing Usage Limits:');
    
    // Track some usage to test limits
    const testFeatures = ['aiAdvisor', 'tradingSignals'];
    for (const featureKey of testFeatures) {
      const hasAccess = await subscriptionService.hasFeatureAccess(userId, featureKey);
      console.log(`  ${featureKey}: ${hasAccess ? '✅ Can use' : '❌ No access'}`);
      
      if (hasAccess) {
        // Track usage multiple times
        for (let i = 0; i < 3; i++) {
          await subscriptionService.trackFeatureUsage(userId, featureKey, 'TEST_USAGE');
        }
        
        const updatedAccess = await subscriptionService.hasFeatureAccess(userId, featureKey);
        console.log(`  ${featureKey} after usage: ${updatedAccess ? '✅ Still can use' : '❌ Limit reached'}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error testing feature limits:', error.message);
    return false;
  }
}

/**
 * Example 9: Subscription lifecycle management
 */
async function example9_SubscriptionLifecycle() {
  console.log('\n=== Example 9: Subscription Lifecycle Management ===\n');
  
  try {
    const userId = sampleUsers[1].id; // Second user
    
    console.log(`🔄 Testing subscription lifecycle for user ${userId}`);
    
    // 1. Start with free plan
    console.log('\n1. Free Plan (Default):');
    const freeSubscription = await subscriptionService.getUserSubscription(userId);
    console.log(`  Plan: ${freeSubscription.plan.displayName}`);
    console.log(`  Price: NPR ${freeSubscription.plan.price}`);
    console.log(`  Features: ${Object.keys(freeSubscription.features).length}`);
    
    // 2. Subscribe to Pro plan
    console.log('\n2. Subscribe to Pro Plan:');
    const proSubscription = await subscriptionService.subscribe(userId, 'PRO', samplePaymentMethods[0].id);
    console.log(`  Status: ${proSubscription.status}`);
    console.log(`  End Date: ${proSubscription.endDate}`);
    
    // 3. Check auto-renewal
    console.log('\n3. Auto-renewal Status:');
    console.log(`  Auto-renew: ${proSubscription.autoRenew ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`  Next Billing: ${proSubscription.nextBillingDate}`);
    
    // 4. Cancel subscription
    console.log('\n4. Cancel Subscription:');
    const cancelResult = await subscriptionService.cancelSubscription(userId, 'Testing cancellation');
    console.log(`  Result: ${cancelResult.success ? '✅ Cancelled' : '❌ Failed'}`);
    
    // 5. Check status after cancellation
    const cancelledSubscription = await subscriptionService.getUserSubscription(userId);
    console.log(`  Status: ${cancelledSubscription.status}`);
    
    // 6. Subscribe again (simulating reactivation)
    console.log('\n5. Reactivate Subscription:');
    const reactivatedSubscription = await subscriptionService.subscribe(userId, 'PRO', samplePaymentMethods[0].id);
    console.log(`  Status: ${reactivatedSubscription.status}`);
    
    return true;
  } catch (error) {
    console.error('Error testing subscription lifecycle:', error.message);
    return false;
  }
}

/**
 * Example 10: Premium features demonstration
 */
async function example10_PremiumFeatures() {
  console.log('\n=== Example 10: Premium Features Demonstration ===\n');
  
  try {
    const userId = sampleUsers[0].id; // User with Investor plan
    
    console.log(`🎯 Demonstrating Premium Features for Investor Plan User`);
    
    const premiumFeatures = [
      {
        key: 'aiAdvisor',
        name: 'AI Advisor',
        actions: ['GENERATE_ADVICE', 'VIEW_REPORT', 'UPDATE_PREFERENCES']
      },
      {
        key: 'tradingSignals',
        name: 'Trading Signals',
        actions: ['GENERATE_SIGNALS', 'VIEW_SIGNALS', 'EXPORT_SIGNALS']
      },
      {
        key: 'advancedAnalysis',
        name: 'Advanced Analysis',
        actions: ['GENERATE_REPORT', 'VIEW_ANALYTICS', 'EXPORT_REPORT']
      },
      {
        key: 'apiAccess',
        name: 'API Access',
        actions: ['API_CALL', 'VIEW_DOCUMENTATION', 'GET_API_KEY']
      }
    ];
    
    for (const feature of premiumFeatures) {
      console.log(`\n📊 ${feature.name} (${feature.key}):`);
      
      // Check access
      const hasAccess = await subscriptionService.hasFeatureAccess(userId, feature.key);
      console.log(`  Access: ${hasAccess ? '✅ Granted' : '❌ Denied'}`);
      
      if (hasAccess) {
        // Simulate feature usage
        for (const action of feature.actions) {
          const tracked = await subscriptionService.trackFeatureUsage(userId, feature.key, action);
          console.log(`  ${action}: ${tracked ? '✅ Used' : '❌ Failed'}`);
        }
        
        // Get usage statistics
        const usage = await subscriptionService.getFeatureUsage(userId, feature.key, 'current');
        const totalUsage = usage ? usage.reduce((sum, u) => sum + u.usageCount, 0) : 0;
        console.log(`  Total Usage: ${totalUsage} times`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error demonstrating premium features:', error.message);
    return false;
  }
}

/**
 * Run all examples
 */
async function runAllExamples() {
  console.log('🚀 FinSathi AI - Subscription System Examples\n');
  console.log('Demonstrating comprehensive subscription management...\n');
  
  try {
    await example1_InitializePlans();
    await example2_SubscribeToPro();
    await example3_CheckFeatureAccess();
    await example4_TrackFeatureUsage();
    await example5_UpgradeToInvestor();
    await example6_CouponManagement();
    await example7_SubscriptionAnalytics();
    await example8_FeatureLimits();
    await example9_SubscriptionLifecycle();
    await example10_PremiumFeatures();
    
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
  example1_InitializePlans,
  example2_SubscribeToPro,
  example3_CheckFeatureAccess,
  example4_TrackFeatureUsage,
  example5_UpgradeToInvestor,
  example6_CouponManagement,
  example7_SubscriptionAnalytics,
  example8_FeatureLimits,
  example9_SubscriptionLifecycle,
  example10_PremiumFeatures,
  sampleUsers,
  samplePaymentMethods,
  sampleCoupons
};
