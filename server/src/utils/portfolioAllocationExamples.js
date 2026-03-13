/**
 * FinSathi AI - Portfolio Allocation Examples
 * Practical examples and usage demonstrations
 */

const { 
  recommendPortfolioAllocation, 
  getAllPortfolioRecommendations 
} = require('./portfolioAllocation');

console.log('🎯 FinSathi AI - Portfolio Allocation Examples\n');

// Example 1: Conservative Portfolio for Retiree
console.log('📊 Example 1: Conservative Portfolio for Retiree');
console.log('=' .repeat(60));

const conservativePortfolio = recommendPortfolioAllocation('CONSERVATIVE', {
  age: 65,
  monthlyIncome: 50000,
  goalType: 'RETIREMENT',
  marketCondition: 'STABLE',
});

console.log('Conservative Portfolio Result:');
console.log(JSON.stringify(conservativePortfolio, null, 2));

console.log('\nKey Insights:');
console.log(`• Portfolio Name: ${conservativePortfolio.data.portfolio.name}`);
console.log(`• Risk Level: ${conservativePortfolio.data.portfolio.riskLevel}`);
console.log(`• Expected Return: ${conservativePortfolio.data.portfolio.expectedReturn}`);
console.log(`• Bonds Allocation: ${conservativePortfolio.data.allocation.customized.bonds}%`);
console.log(`• Blue-Chip Stocks: ${conservativePortfolio.data.allocation.customized.blueChipStocks}%`);
console.log(`• Cash Allocation: ${conservativePortfolio.data.allocation.customized.cash}%`);
console.log(`• Rebalancing: ${conservativePortfolio.data.rebalancing.frequency}`);

// Example 2: Moderate Portfolio for Young Professional
console.log('\n📊 Example 2: Moderate Portfolio for Young Professional');
console.log('=' .repeat(60));

const moderatePortfolio = recommendPortfolioAllocation('MODERATE', {
  age: 35,
  monthlyIncome: 100000,
  goalType: 'WEALTH_GROWTH',
  marketCondition: 'BULLISH',
});

console.log('Moderate Portfolio Result:');
console.log(JSON.stringify(moderatePortfolio, null, 2));

console.log('\nKey Insights:');
console.log(`• Portfolio Name: ${moderatePortfolio.data.portfolio.name}`);
console.log(`• Risk Level: ${moderatePortfolio.data.portfolio.riskLevel}`);
console.log(`• Expected Return: ${moderatePortfolio.data.portfolio.expectedReturn}`);
console.log(`• Bonds Allocation: ${moderatePortfolio.data.allocation.customized.bonds}%`);
console.log(`• Blue-Chip Stocks: ${moderatePortfolio.data.allocation.customized.blueChipStocks}%`);
console.log(`• Growth Stocks: ${moderatePortfolio.data.allocation.customized.growthStocks}%`);
console.log(`• Rebalancing: ${moderatePortfolio.data.rebalancing.frequency}`);

// Example 3: Aggressive Portfolio for Young Investor
console.log('\n📊 Example 3: Aggressive Portfolio for Young Investor');
console.log('=' .repeat(60));

const aggressivePortfolio = recommendPortfolioAllocation('AGGRESSIVE', {
  age: 28,
  monthlyIncome: 80000,
  goalType: 'WEALTH_GROWTH',
  marketCondition: 'VOLATILE',
});

console.log('Aggressive Portfolio Result:');
console.log(JSON.stringify(aggressivePortfolio, null, 2));

console.log('\nKey Insights:');
console.log(`• Portfolio Name: ${aggressivePortfolio.data.portfolio.name}`);
console.log(`• Risk Level: ${aggressivePortfolio.data.portfolio.riskLevel}`);
console.log(`• Expected Return: ${aggressivePortfolio.data.portfolio.expectedReturn}`);
console.log(`• Growth Stocks: ${aggressivePortfolio.data.allocation.customized.growthStocks}%`);
console.log(`• Blue-Chip Stocks: ${aggressivePortfolio.data.allocation.customized.blueChipStocks}%`);
console.log(`• Bonds: ${aggressivePortfolio.data.allocation.customized.bonds}%`);
console.log(`• Rebalancing: ${aggressivePortfolio.data.rebalancing.frequency}`);

// Example 4: Age-Based Customization
console.log('\n📊 Example 4: Age-Based Customization');
console.log('=' .repeat(60));

const ageBasedProfiles = [
  { age: 25, name: 'Young Investor' },
  { age: 35, name: 'Mid-Career Professional' },
  { age: 50, name: 'Pre-Retirement' },
  { age: 65, name: 'Retiree' },
];

console.log('Age-Based Portfolio Customization:');
ageBasedProfiles.forEach(profile => {
  const result = recommendPortfolioAllocation('MODERATE', { age: profile.age });
  console.log(`\n${profile.name} (Age ${profile.age}):`);
  console.log(`  Risk Profile: ${result.data.portfolio.riskLevel}`);
  console.log(`  Growth Stocks: ${result.data.allocation.customized.growthStocks}%`);
  console.log(`  Bonds: ${result.data.allocation.customized.bonds}%`);
  console.log(`  Cash: ${result.data.allocation.customized.cash}%`);
  console.log(`  Expected Return: ${result.data.metrics.expectedReturn}%`);
});

// Example 5: Income-Based Customization
console.log('\n📊 Example 5: Income-Based Customization');
console.log('=' .repeat(60));

const incomeBasedProfiles = [
  { income: 30000, name: 'Low Income' },
  { income: 80000, name: 'Medium Income' },
  { income: 150000, name: 'High Income' },
  { income: 300000, name: 'Very High Income' },
];

console.log('Income-Based Portfolio Customization:');
incomeBasedProfiles.forEach(profile => {
  const result = recommendPortfolioAllocation('MODERATE', { monthlyIncome: profile.income });
  console.log(`\n${profile.name} (Income: NPR ${profile.income.toLocaleString()}):`);
  console.log(`  Risk Profile: ${result.data.portfolio.riskLevel}`);
  console.log(`  Growth Stocks: ${result.data.allocation.customized.growthStocks}%`);
  console.log(`  Bonds: ${result.data.allocation.customized.bonds}%`);
  console.log(`  Investment Concentration: ${result.data.metrics.riskScore}/10`);
  console.log(`  Expected Return: ${result.data.metrics.expectedReturn}%`);
});

// Example 6: Goal-Based Customization
console.log('\n📊 Example 6: Goal-Based Customization');
console.log('=' .repeat(60));

const goalBasedProfiles = [
  { goal: 'RETIREMENT', name: 'Retirement Planning' },
  { goal: 'HOUSE_PURCHASE', name: 'House Purchase' },
  { goal: 'EDUCATION_FUND', name: 'Education Fund' },
  { goal: 'WEALTH_GROWTH', name: 'Wealth Creation' },
  { goal: 'EMERGENCY_FUND', name: 'Emergency Fund' },
];

console.log('Goal-Based Portfolio Customization:');
goalBasedProfiles.forEach(profile => {
  const result = recommendPortfolioAllocation('MODERATE', { goalType: profile.goal });
  console.log(`\n${profile.name}:`);
  console.log(`  Risk Profile: ${result.data.portfolio.riskLevel}`);
  console.log(`  Bonds: ${result.data.allocation.customized.bonds}%`);
  console.log(`  Cash: ${result.data.allocation.customized.cash}%`);
  console.log(`  Time Horizon: ${result.data.portfolio.timeHorizon}`);
  console.log(`  Expected Return: ${result.data.metrics.expectedReturn}%`);
});

// Example 7: Market Condition Adjustments
console.log('\n📊 Example 7: Market Condition Adjustments');
console.log('=' .repeat(60));

const marketConditions = [
  { condition: 'BULLISH', description: 'Rising market' },
  { condition: 'BEARISH', description: 'Falling market' },
  { condition: 'VOLATILE', description: 'High volatility' },
  { condition: 'STABLE', description: 'Stable market' },
];

console.log('Market Condition Adjustments:');
marketConditions.forEach(market => {
  const result = recommendPortfolioAllocation('MODERATE', { marketCondition: market.condition });
  console.log(`\n${market.condition.toUpperCase()} Market (${market.description}):`);
  console.log(`  Growth Stocks: ${result.data.allocation.customized.growthStocks}%`);
  console.log(`  Bonds: ${result.data.allocation.customized.bonds}%`);
  console.log(`  Cash: ${result.data.allocation.customized.cash}%`);
  console.log(`  Risk Level: ${result.data.portfolio.riskLevel}`);
  console.log(`  Expected Return: ${result.data.metrics.expectedReturn}%`);
});

// Example 8: Detailed Asset Class Breakdown
console.log('\n📊 Example 8: Detailed Asset Class Breakdown');
console.log('=' .repeat(60));

const detailedResult = recommendPortfolioAllocation('MODERATE');
if (detailedResult.success) {
  console.log('Detailed Asset Class Breakdown:');
  Object.entries(detailedResult.data.allocation.detailed).forEach(([asset, details]) => {
    console.log(`\n${details.displayName} (${details.percentage}%):`);
    console.log(`  Description: ${details.description}`);
    console.log(`  Risk Level: ${details.riskLevel}`);
    console.log(`  Expected Return: ${details.expectedReturn}`);
    console.log(`  Liquidity: ${details.liquidity}`);
    console.log(`  NEPSE Examples: ${details.nePSEExamples.join(', ')}`);
  });
}

// Example 9: Portfolio Risk Assessment
console.log('\n📊 Example 9: Portfolio Risk Assessment');
console.log('=' .repeat(60));

const riskProfiles = ['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE'];
console.log('Portfolio Risk Assessment:');
riskProfiles.forEach(profile => {
  const result = recommendPortfolioAllocation(profile);
  if (result.success) {
    console.log(`\n${profile} Portfolio:`);
    console.log(`  Overall Risk Level: ${result.data.portfolio.riskLevel}`);
    console.log(`  Risk Score: ${result.data.metrics.riskScore}/10`);
    console.log(`  Diversification Level: ${result.data.metrics.diversificationLevel}`);
    console.log(`  Risk Factors: ${result.data.riskAssessment.riskFactors.length} identified`);
    result.data.riskAssessment.riskFactors.forEach(factor => {
      console.log(`    - ${factor.type}: ${factor.description}`);
    });
  }
});

// Example 10: Investment Recommendations
console.log('\n📊 Example 10: Investment Recommendations');
console.log('=' .repeat(60));

const recommendationResult = recommendPortfolioAllocation('MODERATE');
if (recommendationResult.success) {
  console.log('Investment Recommendations:');
  recommendationResult.data.recommendations.forEach((rec, index) => {
    console.log(`\n${index + 1}. ${rec.title} (${rec.priority}):`);
    console.log(`   Type: ${rec.type}`);
    console.log(`   Description: ${rec.description}`);
    console.log(`   Details: ${rec.details}`);
  });
}

// Example 11: Rebalancing Strategy
console.log('\n📊 Example 11: Rebalancing Strategy');
console.log('=' .repeat(60));

console.log('Rebalancing Strategies:');
['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE'].forEach(profile => {
  const result = recommendPortfolioAllocation(profile);
  if (result.success) {
    console.log(`\n${profile} Portfolio:`);
    console.log(`  Frequency: ${result.data.rebalancing.frequency}`);
    console.log(`  Description: ${result.data.rebalancing.description}`);
    console.log(`  Triggers:`);
    result.data.rebalancing.triggers.forEach(trigger => {
      console.log(`    - ${trigger}`);
    });
  }
});

// Example 12: Portfolio Metrics Comparison
console.log('\n📊 Example 12: Portfolio Metrics Comparison');
console.log('=' .repeat(60));

console.log('Portfolio Metrics Comparison:');
['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE'].forEach(profile => {
  const result = recommendPortfolioAllocation(profile);
  if (result.success) {
    console.log(`\n${profile} Portfolio:`);
    console.log(`  Expected Return: ${result.data.metrics.expectedReturn}%`);
    console.log(`  Risk Score: ${result.data.metrics.riskScore}/10`);
    console.log(`  Diversification Score: ${result.data.metrics.diversificationScore}/10`);
    console.log(`  Risk Level: ${result.data.metrics.riskLevel}`);
    console.log(`  Diversification Level: ${result.data.metrics.diversificationLevel}`);
  }
});

// Example 13: NEPSE-Specific Recommendations
console.log('\n📊 Example 13: NEPSE-Specific Recommendations');
console.log('=' .repeat(60));

const nepseResult = recommendPortfolioAllocation('MODERATE');
if (nepseResult.success) {
  console.log('NEPSE-Specific Investment Recommendations:');
  Object.entries(nepseResult.data.allocation.detailed).forEach(([asset, details]) => {
    console.log(`\n${details.displayName} (${details.percentage}%):`);
    console.log(`  NEPSE Examples: ${details.nePSEExamples.join(', ')}`);
    console.log(`  Recommended Instruments:`);
    
    // NEPSE-specific recommendations
    if (asset === 'bonds') {
      console.log(`    - Government Securities (Treasury Bills)`);
      console.log(`    - Corporate Debentures (A-rated companies)`);
      console.log(`    - Bank Fixed Deposits (top banks)`);
    } else if (asset === 'blueChipStocks') {
      console.log(`    - NEPSE Blue-Chip: NABIL, NICA, SCB`);
      console.log(`    - Banking Sector: EBL, NBL, PRVU`);
      console.log(`    - Insurance: SIC, NLIC, ULIC`);
      console.log(`    - Telecom: NTC, SMARTTEL`);
    } else if (asset === 'growthStocks') {
      console.log(`    - Growth Sectors: Hydropower, Tourism`);
      console.log(`    - Small-Cap Opportunities`);
      console.log(`    - Technology and Innovation`);
    } else if (asset === 'cash') {
      console.log(`    - High-Yield Savings Accounts`);
      console.log(`    - Money Market Funds`);
      console.log(`    - Treasury Bills (short-term)`);
    }
  });
}

// Example 14: Complete Portfolio Overview
console.log('\n📊 Example 14: Complete Portfolio Overview');
console.log('=' .repeat(60));

const completeResult = recommendPortfolioAllocation('MODERATE', {
  age: 35,
  monthlyIncome: 100000,
  goalType: 'WEALTH_GROWTH',
  marketCondition: 'BULLISH',
});

if (completeResult.success) {
  console.log('Complete Portfolio Overview:');
  console.log(`Profile: ${completeResult.data.portfolio.name}`);
  console.log(`Risk Level: ${completeResult.data.portfolio.riskLevel}`);
  console.log(`Expected Return: ${completeResult.data.portfolio.expectedReturn}`);
  console.log(`Time Horizon: ${completeResult.data.portfolio.timeHorizon}`);
  console.log(`Volatility: ${completeResult.data.portfolio.volatility}`);
  
  console.log('\nAsset Allocation:');
  Object.entries(completeResult.data.allocation.customized).forEach(([asset, percentage]) => {
    console.log(`  ${asset}: ${percentage}%`);
  });
  
  console.log('\nPortfolio Metrics:');
  console.log(`  Expected Return: ${completeResult.data.metrics.expectedReturn}%`);
  console.log(`  Risk Score: ${completeResult.data.metrics.riskScore}/10`);
  console.log(`  Diversification: ${completeResult.data.metrics.diversificationLevel}`);
  
  console.log('\nTop Recommendations:');
  completeResult.data.recommendations.slice(0, 3).forEach((rec, index) => {
    console.log(`${index + 1}. ${rec.title}`);
  });
}

// Example 15: All Portfolio Templates
console.log('\n📊 Example 15: All Portfolio Templates');
console.log('=' .repeat(60));

const allTemplates = getAllPortfolioRecommendations();
console.log('All Available Portfolio Templates:');

Object.entries(allTemplates.templates).forEach(([key, template]) => {
  console.log(`\n${key} - ${template.name}:`);
  console.log(`  Description: ${template.description}`);
  console.log(`  Risk Level: ${template.riskLevel}`);
  console.log(`  Expected Return: ${template.expectedReturn}`);
  console.log(`  Time Horizon: ${template.timeHorizon}`);
  console.log(`  Volatility: ${template.volatility}`);
  
  console.log(`  Allocation:`);
  Object.entries(template.allocation).forEach(([asset, percentage]) => {
    console.log(`    ${asset}: ${percentage}%`);
  });
  
  console.log(`  Suitable For: ${template.suitableFor}`);
  console.log(`  Characteristics:`);
  template.characteristics.forEach(char => {
    console.log(`    - ${char}`);
  });
});

console.log('\n✅ Portfolio Allocation Examples Complete!');
console.log('\n🎯 Key Features Demonstrated:');
console.log('• Risk-based portfolio allocation');
console.log('• Conservative, Moderate, and Aggressive templates');
console.log('• Age-based customization');
console.log('• Income-based customization');
console.log('• Goal-based customization');
console.log('• Market condition adjustments');
console.log('• Detailed asset class breakdown');
console.log('• Portfolio risk assessment');
console.log('• Investment recommendations');
console.log('• Rebalancing strategies');
console.log('• NEPSE-specific recommendations');
console.log('• Portfolio metrics calculation');
console.log('• Diversification analysis');
console.log('• Tax efficiency considerations');
console.log('• Production-ready implementation');
