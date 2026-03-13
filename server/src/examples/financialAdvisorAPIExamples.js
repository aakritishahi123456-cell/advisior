/**
 * FinSathi AI - Financial Advisor API Examples
 * Complete API usage examples and documentation
 */

const axios = require('axios');

// API base URL (adjust based on your deployment)
const API_BASE_URL = 'http://localhost:3000/api/v1/advisor';

/**
 * Example user profiles for testing
 */
const EXAMPLE_PROFILES = {
  conservativeRetiree: {
    age: 62,
    monthlyIncome: 50000,
    monthlyExpenses: 35000,
    currentSavings: 2000000,
    investmentHorizonYears: 8,
    financialGoals: ['RETIREMENT', 'CAPITAL_PRESERVATION'],
    questionnaireScore: 25,
    totalDebt: 100000,
    employmentStability: 0.9,
    investmentExperience: 'BEGINNER',
  },
  moderateProfessional: {
    age: 35,
    monthlyIncome: 120000,
    monthlyExpenses: 70000,
    currentSavings: 1500000,
    investmentHorizonYears: 15,
    financialGoals: ['WEALTH_CREATION', 'HOUSE_PURCHASE'],
    questionnaireScore: 55,
    totalDebt: 500000,
    employmentStability: 0.85,
    investmentExperience: 'INTERMEDIATE',
  },
  aggressiveInvestor: {
    age: 28,
    monthlyIncome: 80000,
    monthlyExpenses: 45000,
    currentSavings: 500000,
    investmentHorizonYears: 25,
    financialGoals: ['WEALTH_GROWTH', 'EARLY_RETIREMENT'],
    questionnaireScore: 75,
    totalDebt: 200000,
    employmentStability: 0.75,
    investmentExperience: 'ADVANCED',
  },
  youngGraduate: {
    age: 23,
    monthlyIncome: 35000,
    monthlyExpenses: 25000,
    currentSavings: 50000,
    investmentHorizonYears: 20,
    financialGoals: ['WEALTH_CREATION'],
    questionnaireScore: 45,
    totalDebt: 150000,
    employmentStability: 0.6,
    investmentExperience: 'BEGINNER',
  },
  businessOwner: {
    age: 42,
    monthlyIncome: 200000,
    monthlyExpenses: 120000,
    currentSavings: 3000000,
    investmentHorizonYears: 12,
    financialGoals: ['WEALTH_CREATION', 'CHILD_EDUCATION'],
    questionnaireScore: 65,
    totalDebt: 2000000,
    employmentStability: 0.5,
    investmentExperience: 'ADVANCED',
  },
};

/**
 * API Request Examples
 */

// Example 1: Generate Complete Financial Plan
async function generateCompletePlan() {
  try {
    console.log('🎯 Example 1: Generate Complete Financial Plan');
    console.log('=' .repeat(60));
    
    const response = await axios.post(`${API_BASE_URL}/plan`, EXAMPLE_PROFILES.moderateProfessional);
    
    console.log('✅ Success - Complete Financial Plan Generated');
    console.log(`Plan ID: ${response.data.meta.generatedAt}`);
    console.log(`Processing Time: ${Date.now() - Date.parse(response.data.meta.generatedAt)}ms`);
    console.log(`Components: ${response.data.meta.components.join(', ')}`);
    
    // Display key results
    const plan = response.data.data;
    console.log('\n📊 Key Results:');
    console.log(`• Risk Profile: ${plan.riskProfile.profile.name}`);
    console.log(`• Financial Health: ${plan.financialHealth.category.label} (${plan.financialHealth.overallScore}/100)`);
    console.log(`• Total Monthly Investment: NPR ${plan.investmentPlans.analysis.totalMonthlyInvestment.toLocaleString()}`);
    console.log(`• Portfolio Strategy: ${plan.portfolioAllocation.portfolio.name}`);
    console.log(`• Top Companies: ${plan.topCompanies.companies.length} recommended`);
    
    console.log('\n📋 Next Steps:');
    plan.nextSteps.forEach((step, index) => {
      console.log(`${index + 1}. ${step.title} (${step.timeframe}) - ${step.priority}`);
    });
    
    return response.data;
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

// Example 2: Get Risk Profile Only
async function getRiskProfile() {
  try {
    console.log('\n🎯 Example 2: Get Risk Profile Only');
    console.log('=' .repeat(60));
    
    const response = await axios.post(`${API_BASE_URL}/risk-profile`, EXAMPLE_PROFILES.conservativeRetiree);
    
    console.log('✅ Success - Risk Profile Generated');
    const riskProfile = response.data.data;
    
    console.log('\n📊 Risk Profile Results:');
    console.log(`• Profile Type: ${riskProfile.profile.name}`);
    console.log(`• Risk Score: ${riskProfile.score}/100`);
    console.log(`• Risk Level: ${riskProfile.profile.riskLevel}`);
    console.log(`• Expected Returns: ${riskProfile.profile.expectedReturn}`);
    console.log(`• Volatility: ${riskProfile.profile.volatility}`);
    
    console.log('\n🎯 Component Analysis:');
    Object.entries(riskProfile.components).forEach(([component, data]) => {
      console.log(`• ${component.replace(/([A-Z])/g, ' $1').trim()}: ${data.score}/100 (${data.level})`);
    });
    
    console.log('\n💡 Recommendations:');
    riskProfile.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
    
    return response.data;
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

// Example 3: Get Investment Plans
async function getInvestmentPlans() {
  try {
    console.log('\n🎯 Example 3: Get Investment Plans');
    console.log('=' .repeat(60));
    
    const response = await axios.post(`${API_BASE_URL}/investment-plans`, EXAMPLE_PROFILES.aggressiveInvestor);
    
    console.log('✅ Success - Investment Plans Generated');
    const plans = response.data.data;
    
    console.log('\n📊 Investment Plan Analysis:');
    console.log(`• Total Goals: ${plans.summary.totalGoals}`);
    console.log(`• Total Monthly Investment: NPR ${plans.analysis.totalMonthlyInvestment.toLocaleString()}`);
    console.log(`• Investment to Income Ratio: ${plans.analysis.investmentToIncomeRatio.toFixed(1)}%`);
    console.log(`• Affordable: ${plans.analysis.affordable ? 'Yes' : 'No'}`);
    console.log(`• Remaining Capacity: NPR ${plans.analysis.remainingCapacity.toLocaleString()}`);
    
    console.log('\n🎯 Goal-by-Goal Analysis:');
    plans.plans.forEach((plan, index) => {
      console.log(`${index + 1}. ${plan.goalType}:`);
      console.log(`   • Required Investment: NPR ${plan.monthlyInvestment.required.toLocaleString()}/month`);
      console.log(`   • Total Investment: NPR ${plan.monthlyInvestment.totalInvestment.toLocaleString()}`);
      console.log(`   • Expected Returns: ${plan.projections.expectedReturns}`);
      console.log(`   • Priority: ${plan.priority}`);
      console.log(`   • Affordability: ${plan.affordability}`);
    });
    
    console.log('\n💡 Recommendations:');
    plans.analysis.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
    
    return response.data;
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

// Example 4: Get Portfolio Allocation
async function getPortfolioAllocation() {
  try {
    console.log('\n🎯 Example 4: Get Portfolio Allocation');
    console.log('=' .repeat(60));
    
    const response = await axios.post(`${API_BASE_URL}/portfolio-allocation`, EXAMPLE_PROFILES.youngGraduate);
    
    console.log('✅ Success - Portfolio Allocation Generated');
    const allocation = response.data.data;
    
    console.log('\n📊 Portfolio Allocation Results:');
    console.log(`• Strategy: ${allocation.portfolio.name}`);
    console.log(`• Risk Level: ${allocation.portfolio.riskLevel}`);
    console.log(`• Expected Returns: ${allocation.portfolio.expectedReturn}`);
    console.log(`• Diversification Score: ${allocation.diversificationScore}/100`);
    console.log(`• Risk Alignment: ${allocation.riskAlignment}`);
    
    console.log('\n💼 Asset Allocation:');
    Object.entries(allocation.allocation.customized).forEach(([asset, percentage]) => {
      const assetName = asset.replace(/([A-Z])/g, ' $1').trim();
      console.log(`• ${assetName}: ${percentage}%`);
    });
    
    console.log('\n📈 Detailed Breakdown:');
    Object.entries(allocation.allocation.detailed).forEach(([asset, details]) => {
      console.log(`\n${details.displayName} (${details.percentage}%):`);
      console.log(`  • Expected Return: ${details.expectedReturn}`);
      console.log(`  • Risk Level: ${details.riskLevel}`);
      console.log(`  • Liquidity: ${details.liquidity}`);
      console.log(`  • Examples: ${details.nePSEExamples.join(', ')}`);
    });
    
    console.log('\n⚖️ Rebalancing Strategy:');
    console.log(`• Frequency: ${allocation.rebalancingStrategy.frequency}`);
    console.log(`• Method: ${allocation.rebalancingStrategy.method}`);
    
    return response.data;
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

// Example 5: Get Top Companies
async function getTopCompanies() {
  try {
    console.log('\n🎯 Example 5: Get Top Companies');
    console.log('=' .repeat(60));
    
    const response = await axios.post(`${API_BASE_URL}/top-companies`, EXAMPLE_PROFILES.businessOwner);
    
    console.log('✅ Success - Top Companies Generated');
    const companies = response.data.data;
    
    console.log('\n📊 Company Selection Results:');
    console.log(`• Total Companies: ${companies.companies.length}`);
    console.log(`• Sectors Covered: ${companies.analysis.sectorDistribution.distribution}`);
    console.log(`• Risk Distribution: High (${companies.analysis.riskDistribution.high}), Medium (${companies.analysis.riskDistribution.medium}), Low (${companies.analysis.riskDistribution.low})`);
    console.log(`• Portfolio Alignment: ${companies.portfolioAlignment.alignment}`);
    
    console.log('\n🏆 Top Recommended Companies:');
    companies.companies.forEach((company, index) => {
      console.log(`${index + 1}. ${company.name} (${company.symbol})`);
      console.log(`   • Sector: ${company.sector}`);
      console.log(`   • Grade: ${company.grade}`);
      console.log(`   • Score: ${company.score}/100`);
      console.log(`   • ROE: ${company.metrics.roe}%`);
      console.log(`   • Debt Ratio: ${company.metrics.debtRatio}`);
      console.log(`   • Health Score: ${company.metrics.healthScore}`);
      console.log(`   • Investment Suitability: ${company.assessment.investmentSuitability}`);
    });
    
    console.log('\n📈 Sector Distribution:');
    Object.entries(companies.analysis.sectorDistribution.percentages).forEach(([sector, percentage]) => {
      console.log(`• ${sector}: ${percentage}%`);
    });
    
    console.log('\n💡 Investment Rationale:');
    Object.entries(companies.investmentRationale).forEach(([key, value]) => {
      console.log(`• ${key.replace(/([A-Z])/g, ' $1').trim()}: ${value}`);
    });
    
    return response.data;
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

// Example 6: Get Investment Strategy
async function getInvestmentStrategy() {
  try {
    console.log('\n🎯 Example 6: Get Investment Strategy');
    console.log('=' .repeat(60));
    
    const response = await axios.post(`${API_BASE_URL}/investment-strategy`, EXAMPLE_PROFILES.moderateProfessional);
    
    console.log('✅ Success - Investment Strategy Generated');
    const strategy = response.data.data;
    
    console.log('\n📊 Strategy Overview:');
    console.log(`• Strategy Type: ${strategy.metadata.strategyType}`);
    console.log(`• Expected Return: ${strategy.portfolioBreakdown.overview.expectedReturn}`);
    console.log(`• Risk Level: ${strategy.portfolioBreakdown.overview.riskLevel}`);
    console.log(`• Feasibility: ${strategy.feasibility.feasibility}`);
    console.log(`• Complexity: ${strategy.feasibility.complexity}`);
    
    console.log('\n💼 Portfolio Breakdown:');
    Object.entries(strategy.portfolioBreakdown.assetClasses).forEach(([asset, details]) => {
      const assetName = asset.replace(/([A-Z])/g, ' $1').trim();
      console.log(`• ${assetName}:`);
      console.log(`  - Allocation: ${details.recommendedAllocation}%`);
      console.log(`  - Expected Return: ${details.expectedReturn}`);
      console.log(`  - Risk Level: ${details.riskLevel}`);
      console.log(`  - Instruments: ${details.instruments.slice(0, 2).join(', ')}...`);
    });
    
    console.log('\n🏆 Recommended Companies:');
    strategy.recommendedCompanies.slice(0, 3).forEach((company, index) => {
      console.log(`${index + 1}. ${company.name} (${company.symbol})`);
      console.log(`   • Recommendation: ${company.recommendation}`);
      console.log(`   • Target Return: ${company.targetReturn}`);
      console.log(`   • Holding Period: ${company.holdingPeriod}`);
    });
    
    console.log('\n⚠️ Risk Analysis:');
    console.log(`• Overall Risk Level: ${strategy.riskExplanation.overallRiskLevel}`);
    console.log(`• Portfolio Risk Score: ${strategy.riskExplanation.portfolioRiskScore}/10`);
    console.log(`• Worst Case Scenario: ${strategy.riskExplanation.worstCaseScenario}`);
    console.log(`• Recovery Timeline: ${strategy.riskExplanation.recoveryTimeline}`);
    
    console.log('\n📅 Investment Timeline:');
    console.log(`• Short Term (${strategy.investmentTimeline.shortTerm.period}):`);
    strategy.investmentTimeline.shortTerm.actions.slice(0, 2).forEach(action => {
      console.log(`  - ${action}`);
    });
    
    console.log('\n🔧 Implementation Steps:');
    strategy.implementationGuide.stepByStep.slice(0, 3).forEach((step, index) => {
      console.log(`${index + 1}. ${step.title} (${step.timeframe})`);
    });
    
    return response.data;
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

// Example 7: Get Financial Health Score
async function getFinancialHealth() {
  try {
    console.log('\n🎯 Example 7: Get Financial Health Score');
    console.log('=' .repeat(60));
    
    const response = await axios.post(`${API_BASE_URL}/financial-health`, EXAMPLE_PROFILES.youngGraduate);
    
    console.log('✅ Success - Financial Health Score Generated');
    const health = response.data.data;
    
    console.log('\n📊 Financial Health Results:');
    console.log(`• Overall Score: ${health.overallScore}/100`);
    console.log(`• Category: ${health.category.label}`);
    console.log(`• Description: ${health.category.description}`);
    console.log(`• Color: ${health.category.color}`);
    
    console.log('\n🎯 Component Scores:');
    Object.entries(health.componentScores).forEach(([component, data]) => {
      const componentName = component.replace(/([A-Z])/g, ' $1').trim();
      console.log(`• ${componentName}: ${data.score.toFixed(1)}/100 (${data.category})`);
      console.log(`  - Weight: ${(data.weight * 100).toFixed(0)}%`);
      console.log(`  - Description: ${data.description}`);
    });
    
    console.log('\n💪 Strengths:');
    health.analysis.strengths.forEach((strength, index) => {
      console.log(`${index + 1}. ${strength.description} (Impact: ${strength.impact}%)`);
    });
    
    console.log('\n⚠️ Weaknesses:');
    health.analysis.weaknesses.forEach((weakness, index) => {
      console.log(`${index + 1}. ${weakness.description} (Impact: ${weakness.impact}%)`);
    });
    
    console.log('\n🎯 Opportunities:');
    health.analysis.opportunities.forEach((opportunity, index) => {
      console.log(`${index + 1}. ${opportunity.description} (Impact: ${opportunity.impact}%)`);
    });
    
    console.log('\n📈 Improvement Potential:');
    console.log(`• Current Score: ${health.improvementPotential.currentOverallScore.toFixed(1)}/100`);
    console.log(`• Max Possible Score: ${health.improvementPotential.maxPossibleScore}/100`);
    console.log(`• Total Improvement Potential: ${health.improvementPotential.totalImprovementPotential.toFixed(1)} points`);
    
    console.log('\n🚀 Quick Wins:');
    health.improvementPotential.quickWins.forEach((win, index) => {
      console.log(`${index + 1}. ${win.component}: +${win.improvementPotential.toFixed(1)} points`);
    });
    
    return response.data;
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

// Example 8: Validate Profile
async function validateProfile() {
  try {
    console.log('\n🎯 Example 8: Validate Profile');
    console.log('=' .repeat(60));
    
    // Test with invalid profile
    const invalidProfile = {
      age: 17,  // Invalid age
      monthlyIncome: 50000,
      monthlyExpenses: 60000,  // Expenses > income
      currentSavings: -1000,  // Negative savings
    };
    
    const response = await axios.post(`${API_BASE_URL}/validate`, invalidProfile);
    
    console.log('✅ Profile Validation Results:');
    console.log(`• Valid: ${response.data.data.valid}`);
    console.log(`• Message: ${response.data.data.message}`);
    
    if (response.data.data.warnings && response.data.data.warnings.length > 0) {
      console.log('\n⚠️ Warnings:');
      response.data.data.warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning}`);
      });
    }
    
    return response.data;
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

// Example 9: Get Plan Summary
async function getPlanSummary() {
  try {
    console.log('\n🎯 Example 9: Get Plan Summary');
    console.log('=' .repeat(60));
    
    const response = await axios.post(`${API_BASE_URL}/summary`, EXAMPLE_PROFILES.moderateProfessional);
    
    console.log('✅ Success - Plan Summary Generated');
    const summary = response.data.data;
    
    console.log('\n📊 User Profile Summary:');
    console.log(`• Age: ${summary.userProfile.age}`);
    console.log(`• Monthly Income: NPR ${summary.userProfile.monthlyIncome.toLocaleString()}`);
    console.log(`• Savings Rate: ${summary.userProfile.savingsRate.toFixed(1)}%`);
    console.log(`• Investment Capacity: NPR ${summary.userProfile.investmentCapacity.toLocaleString()}`);
    
    console.log('\n🎯 Risk Profile:');
    console.log(`• Type: ${summary.riskProfile.name}`);
    console.log(`• Score: ${summary.riskProfile.score}/100`);
    console.log(`• Description: ${summary.riskProfile.description}`);
    
    console.log('\n💚 Financial Health:');
    console.log(`• Score: ${summary.financialHealth.score}/100`);
    console.log(`• Category: ${summary.financialHealth.category}`);
    console.log(`• Key Factors: ${summary.financialHealth.keyFactors.join(', ')}`);
    
    console.log('\n💡 Quick Recommendations:');
    summary.quickRecommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
    
    console.log('\n📋 Next Steps:');
    summary.nextSteps.forEach((step, index) => {
      console.log(`${index + 1}. ${step}`);
    });
    
    return response.data;
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

// Example 10: Error Handling
async function demonstrateErrorHandling() {
  try {
    console.log('\n🎯 Example 10: Error Handling');
    console.log('=' .repeat(60));
    
    // Test with missing required fields
    const incompleteProfile = {
      age: 35,
      // Missing monthlyIncome, monthlyExpenses, currentSavings
    };
    
    try {
      const response = await axios.post(`${API_BASE_URL}/plan`, incompleteProfile);
      console.log('❌ Expected error but request succeeded');
    } catch (error) {
      console.log('✅ Expected error caught successfully');
      console.log('Error Response:');
      console.log(`• Status: ${error.response.status}`);
      console.log(`• Error: ${error.response.data.error}`);
      console.log(`• Code: ${error.response.data.code}`);
      
      if (error.response.data.missingFields) {
        console.log(`• Missing Fields: ${error.response.data.missingFields.join(', ')}`);
      }
    }
    
    // Test with invalid data types
    const invalidDataProfile = {
      age: 'thirty-five',  // Invalid type
      monthlyIncome: '100000',  // String instead of number
      monthlyExpenses: 60000,
      currentSavings: 500000,
    };
    
    try {
      const response = await axios.post(`${API_BASE_URL}/plan`, invalidDataProfile);
      console.log('❌ Expected error but request succeeded');
    } catch (error) {
      console.log('✅ Invalid data error caught successfully');
      console.log('Error Response:');
      console.log(`• Status: ${error.response.status}`);
      console.log(`• Error: ${error.response.data.error}`);
      console.log(`• Code: ${error.response.data.code}`);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    throw error;
  }
}

// Example 11: Custom Options
async function demonstrateCustomOptions() {
  try {
    console.log('\n🎯 Example 11: Custom Options');
    console.log('=' .repeat(60));
    
    // Custom options for conservative investor
    const customOptions = {
      marketCondition: 'VOLATILE',
      companyLimit: 5,
      minROE: 15,
      maxDebtRatio: 1.5,
      inflationRate: 7,
    };
    
    const response = await axios.post(`${API_BASE_URL}/plan`, EXAMPLE_PROFILES.conservativeRetiree, {
      params: customOptions
    });
    
    console.log('✅ Success - Custom Options Applied');
    console.log('Custom Options Used:');
    Object.entries(customOptions).forEach(([key, value]) => {
      console.log(`• ${key}: ${value}`);
    });
    
    const plan = response.data.data;
    console.log('\n📊 Results with Custom Options:');
    console.log(`• Top Companies: ${plan.topCompanies.companies.length} (limited to ${customOptions.companyLimit})`);
    console.log(`• Min ROE Filter: ${customOptions.minROE}%`);
    console.log(`• Max Debt Ratio: ${customOptions.maxDebtRatio}`);
    
    return response.data;
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

// Example 12: Performance Comparison
async function demonstratePerformanceComparison() {
  try {
    console.log('\n🎯 Example 12: Performance Comparison');
    console.log('=' .repeat(60));
    
    const profiles = [
      { name: 'Conservative Retiree', profile: EXAMPLE_PROFILES.conservativeRetiree },
      { name: 'Moderate Professional', profile: EXAMPLE_PROFILES.moderateProfessional },
      { name: 'Aggressive Investor', profile: EXAMPLE_PROFILES.aggressiveInvestor },
    ];
    
    console.log('📊 Performance Comparison Across Profiles:');
    
    for (const { name, profile } of profiles) {
      const startTime = Date.now();
      const response = await axios.post(`${API_BASE_URL}/summary`, profile);
      const endTime = Date.now();
      
      const summary = response.data.data;
      console.log(`\n${name}:`);
      console.log(`• Processing Time: ${endTime - startTime}ms`);
      console.log(`• Risk Profile: ${summary.riskProfile.name}`);
      console.log(`• Financial Health: ${summary.financialHealth.category} (${summary.financialHealth.score}/100)`);
      console.log(`• Investment Capacity: NPR ${summary.userProfile.investmentCapacity.toLocaleString()}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

// Main function to run all examples
async function runAllExamples() {
  try {
    console.log('🚀 FinSathi AI - Financial Advisor API Examples');
    console.log('=' .repeat(80));
    console.log('Base URL:', API_BASE_URL);
    console.log('Starting comprehensive API testing...\n');
    
    // Run all examples with error handling
    const examples = [
      { name: 'Complete Plan', fn: generateCompletePlan },
      { name: 'Risk Profile', fn: getRiskProfile },
      { name: 'Investment Plans', fn: getInvestmentPlans },
      { name: 'Portfolio Allocation', fn: getPortfolioAllocation },
      { name: 'Top Companies', fn: getTopCompanies },
      { name: 'Investment Strategy', fn: getInvestmentStrategy },
      { name: 'Financial Health', fn: getFinancialHealth },
      { name: 'Validate Profile', fn: validateProfile },
      { name: 'Plan Summary', fn: getPlanSummary },
      { name: 'Error Handling', fn: demonstrateErrorHandling },
      { name: 'Custom Options', fn: demonstrateCustomOptions },
      { name: 'Performance Comparison', fn: demonstratePerformanceComparison },
    ];
    
    for (const { name, fn } of examples) {
      try {
        await fn();
        console.log(`\n✅ ${name} completed successfully\n`);
      } catch (error) {
        console.log(`\n❌ ${name} failed: ${error.message}\n`);
      }
    }
    
    console.log('🎉 All examples completed!');
    console.log('\n📝 API Documentation Summary:');
    console.log('• POST /v1/advisor/plan - Generate complete financial plan');
    console.log('• POST /v1/advisor/risk-profile - Get risk profile only');
    console.log('• POST /v1/advisor/investment-plans - Calculate investment plans');
    console.log('• POST /v1/advisor/portfolio-allocation - Get portfolio allocation');
    console.log('• POST /v1/advisor/top-companies - Get recommended companies');
    console.log('• POST /v1/advisor/investment-strategy - Generate AI strategy');
    console.log('• POST /v1/advisor/financial-health - Calculate health score');
    console.log('• POST /v1/advisor/validate - Validate user profile');
    console.log('• POST /v1/advisor/summary - Get lightweight summary');
    
  } catch (error) {
    console.error('🚨 Critical error in examples:', error.message);
  }
}

// Export functions for individual testing
module.exports = {
  generateCompletePlan,
  getRiskProfile,
  getInvestmentPlans,
  getPortfolioAllocation,
  getTopCompanies,
  getInvestmentStrategy,
  getFinancialHealth,
  validateProfile,
  getPlanSummary,
  demonstrateErrorHandling,
  demonstrateCustomOptions,
  demonstratePerformanceComparison,
  runAllExamples,
  EXAMPLE_PROFILES,
  API_BASE_URL,
};

// Run all examples if this file is executed directly
if (require.main === module) {
  runAllExamples();
}
