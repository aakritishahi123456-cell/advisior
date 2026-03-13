/**
 * FinSathi AI - Investment Strategy Generator Examples
 * Practical examples and usage demonstrations
 */

const { 
  generateInvestmentStrategy,
  INVESTMENT_STRATEGY_PROMPT,
  AVAILABLE_INSTRUMENTS
} = require('./investmentStrategyGenerator');

console.log('🎯 FinSathi AI - Investment Strategy Generator Examples\n');

// Example 1: Conservative Strategy for Retiree
console.log('📊 Example 1: Conservative Strategy for Retiree');
console.log('=' .repeat(60));

const conservativeUser = {
  age: 62,
  monthlyIncome: 50000,
  monthlyExpenses: 35000,
  currentSavings: 2000000,
  investmentHorizonYears: 8,
  financialGoals: ['RETIREMENT', 'CAPITAL_PRESERVATION'],
};

const conservativeRisk = {
  riskTolerance: 'CONSERVATIVE',
  riskCapacity: 'LOW',
  investmentExperience: 'BEGINNER',
  timeHorizon: 'SHORT_TERM',
  volatilityComfort: 'LOW',
  maxAcceptableLoss: '5%',
  preferredInvestmentTypes: ['Fixed Deposits', 'Government Bonds'],
  liquidityPreference: 'HIGH',
  taxConsiderations: 'HIGH',
};

const conservativePortfolio = {
  bonds: 60,
  blueChipStocks: 30,
  growthStocks: 0,
  cash: 10,
  alternatives: 0,
};

const conservativeStrategy = generateInvestmentStrategy(
  conservativeUser, 
  conservativeRisk, 
  conservativePortfolio
);

console.log('Conservative Strategy Result:');
console.log(JSON.stringify(conservativeStrategy, null, 2));

console.log('\nKey Insights:');
console.log(`• Strategy Type: ${conservativeStrategy.data.metadata.strategyType}`);
console.log(`• Expected Return: ${conservativeStrategy.data.strategy.portfolioBreakdown.overview.expectedReturn}`);
console.log(`• Risk Level: ${conservativeStrategy.data.strategy.portfolioBreakdown.overview.riskLevel}`);
console.log(`• Recommended Companies: ${conservativeStrategy.data.strategy.recommendedCompanies.length}`);
console.log(`• Implementation Steps: ${conservativeStrategy.data.strategy.implementationGuide.stepByStep.length}`);

// Example 2: Moderate Strategy for Young Professional
console.log('\n📊 Example 2: Moderate Strategy for Young Professional');
console.log('=' .repeat(60));

const moderateUser = {
  age: 35,
  monthlyIncome: 120000,
  monthlyExpenses: 70000,
  currentSavings: 1500000,
  investmentHorizonYears: 15,
  financialGoals: ['WEALTH_CREATION', 'HOUSE_PURCHASE'],
};

const moderateRisk = {
  riskTolerance: 'MODERATE',
  riskCapacity: 'MEDIUM',
  investmentExperience: 'INTERMEDIATE',
  timeHorizon: 'MEDIUM_TERM',
  volatilityComfort: 'MODERATE',
  maxAcceptableLoss: '15%',
  preferredInvestmentTypes: ['Balanced Funds', 'Blue-Chip Stocks'],
  liquidityPreference: 'MEDIUM',
  taxConsiderations: 'MEDIUM',
};

const moderatePortfolio = {
  bonds: 30,
  blueChipStocks: 50,
  growthStocks: 20,
  cash: 0,
  alternatives: 0,
};

const moderateStrategy = generateInvestmentStrategy(
  moderateUser, 
  moderateRisk, 
  moderatePortfolio
);

console.log('Moderate Strategy Result:');
console.log(JSON.stringify(moderateStrategy, null, 2));

console.log('\nKey Insights:');
console.log(`• Strategy Type: ${moderateStrategy.data.metadata.strategyType}`);
console.log(`• Expected Return: ${moderateStrategy.data.strategy.portfolioBreakdown.overview.expectedReturn}`);
console.log(`• Risk Level: ${moderateStrategy.data.strategy.portfolioBreakdown.overview.riskLevel}`);
console.log(`• Portfolio Risk Score: ${moderateStrategy.data.strategy.riskExplanation.portfolioRiskScore}/10`);

// Example 3: Aggressive Strategy for Young Investor
console.log('\n📊 Example 3: Aggressive Strategy for Young Investor');
console.log('=' .repeat(60));

const aggressiveUser = {
  age: 28,
  monthlyIncome: 80000,
  monthlyExpenses: 45000,
  currentSavings: 500000,
  investmentHorizonYears: 25,
  financialGoals: ['WEALTH_GROWTH', 'EARLY_RETIREMENT'],
};

const aggressiveRisk = {
  riskTolerance: 'AGGRESSIVE',
  riskCapacity: 'HIGH',
  investmentExperience: 'ADVANCED',
  timeHorizon: 'LONG_TERM',
  volatilityComfort: 'HIGH',
  maxAcceptableLoss: '25%',
  preferredInvestmentTypes: ['Growth Stocks', 'Sectoral Funds'],
  liquidityPreference: 'LOW',
  taxConsiderations: 'LOW',
};

const aggressivePortfolio = {
  bonds: 10,
  blueChipStocks: 20,
  growthStocks: 70,
  cash: 0,
  alternatives: 0,
};

const aggressiveStrategy = generateInvestmentStrategy(
  aggressiveUser, 
  aggressiveRisk, 
  aggressivePortfolio
);

console.log('Aggressive Strategy Result:');
console.log(JSON.stringify(aggressiveStrategy, null, 2));

console.log('\nKey Insights:');
console.log(`• Strategy Type: ${aggressiveStrategy.data.metadata.strategyType}`);
console.log(`• Expected Return: ${aggressiveStrategy.data.strategy.portfolioBreakdown.overview.expectedReturn}`);
console.log(`• Risk Level: ${aggressiveStrategy.data.strategy.portfolioBreakdown.overview.riskLevel}`);
console.log(`• Growth Stock Allocation: ${aggressivePortfolio.growthStocks}%`);

// Example 4: Strategy Comparison
console.log('\n📊 Example 4: Strategy Comparison');
console.log('=' .repeat(60));

const strategies = [
  { name: 'Conservative', strategy: conservativeStrategy },
  { name: 'Moderate', strategy: moderateStrategy },
  { name: 'Aggressive', strategy: aggressiveStrategy },
];

console.log('Strategy Comparison:');
strategies.forEach(({ name, strategy }) => {
  if (strategy.success) {
    console.log(`\n${name} Strategy:`);
    console.log(`  Type: ${strategy.data.metadata.strategyType}`);
    console.log(`  Expected Return: ${strategy.data.strategy.portfolioBreakdown.overview.expectedReturn}`);
    console.log(`  Risk Level: ${strategy.data.strategy.portfolioBreakdown.overview.riskLevel}`);
    console.log(`  Risk Score: ${strategy.data.strategy.riskExplanation.portfolioRiskScore}/10`);
    console.log(`  Companies: ${strategy.data.strategy.recommendedCompanies.length}`);
    console.log(`  Timeline: ${strategy.data.strategy.investmentTimeline.shortTerm.period} to ${strategy.data.strategy.investmentTimeline.longTerm.period}`);
  }
});

// Example 5: Portfolio Breakdown Analysis
console.log('\n📊 Example 5: Portfolio Breakdown Analysis');
console.log('=' .repeat(60));

console.log('Moderate Portfolio Breakdown:');
Object.entries(moderateStrategy.data.strategy.portfolioBreakdown.assetClasses).forEach(([asset, details]) => {
  console.log(`\n${asset.replace(/([A-Z])/g, ' $1').trim()}:`);
  console.log(`  Allocation: ${details.recommendedAllocation}%`);
  console.log(`  Expected Return: ${details.expectedReturn}`);
  console.log(`  Risk Level: ${details.riskLevel}`);
  console.log(`  Liquidity: ${details.liquidity}`);
  console.log(`  Instruments: ${details.instruments.join(', ')}`);
});

// Example 6: Recommended Companies Analysis
console.log('\n📊 Example 6: Recommended Companies Analysis');
console.log('=' .repeat(60));

console.log('Moderate Strategy Recommended Companies:');
moderateStrategy.data.strategy.recommendedCompanies.forEach((company, index) => {
  console.log(`\n${index + 1}. ${company.name} (${company.symbol})`);
  console.log(`  Sector: ${company.sector}`);
  console.log(`  Recommendation: ${company.recommendation}`);
  console.log(`  Thesis: ${company.thesis}`);
  console.log(`  Target Return: ${company.targetReturn}`);
  console.log(`  Holding Period: ${company.holdingPeriod}`);
  console.log(`  Risk Level: ${company.riskLevel}`);
});

// Example 7: Risk Analysis
console.log('\n📊 Example 7: Risk Analysis');
console.log('=' .repeat(60));

console.log('Moderate Strategy Risk Analysis:');
console.log(`Overall Risk Level: ${moderateStrategy.data.strategy.riskExplanation.overallRiskLevel}`);
console.log(`Portfolio Risk Score: ${moderateStrategy.data.strategy.riskExplanation.portfolioRiskScore}/10`);
console.log(`Worst Case Scenario: ${moderateStrategy.data.strategy.riskExplanation.worstCaseScenario}`);
console.log(`Recovery Timeline: ${moderateStrategy.data.strategy.riskExplanation.recoveryTimeline}`);

console.log('\nKey Risk Factors:');
moderateStrategy.data.strategy.riskExplanation.riskFactors.forEach(factor => {
  console.log(`• ${factor}`);
});

console.log('\nMitigation Strategies:');
moderateStrategy.data.strategy.riskExplanation.mitigationStrategies.forEach(strategy => {
  console.log(`• ${strategy}`);
});

console.log('\nMarket Risks:');
Object.entries(moderateStrategy.data.strategy.riskExplanation.marketRisks).forEach(([risk, description]) => {
  console.log(`• ${risk.replace(/([A-Z])/g, ' $1').trim()}: ${description}`);
});

// Example 8: Investment Timeline
console.log('\n📊 Example 8: Investment Timeline');
console.log('=' .repeat(60));

console.log('Moderate Strategy Investment Timeline:');

console.log('\nShort Term (0-6 months):');
moderateStrategy.data.strategy.investmentTimeline.shortTerm.actions.forEach(action => {
  console.log(`• ${action}`);
});
console.log(`Expected Progress: ${moderateStrategy.data.strategy.investmentTimeline.shortTerm.expectedProgress}`);

console.log('\nMedium Term (6-24 months):');
moderateStrategy.data.strategy.investmentTimeline.mediumTerm.actions.forEach(action => {
  console.log(`• ${action}`);
});
console.log(`Expected Progress: ${moderateStrategy.data.strategy.investmentTimeline.mediumTerm.expectedProgress}`);

console.log('\nLong Term (2-5+ years):');
moderateStrategy.data.strategy.investmentTimeline.longTerm.actions.forEach(action => {
  console.log(`• ${action}`);
});
console.log(`Expected Progress: ${moderateStrategy.data.strategy.investmentTimeline.longTerm.expectedProgress}`);

console.log('\nRebalancing Schedule:');
console.log(`Frequency: ${moderateStrategy.data.strategy.investmentTimeline.rebalancing.frequency}`);
moderateStrategy.data.strategy.investmentTimeline.rebalancing.triggers.forEach(trigger => {
  console.log(`• ${trigger}`);
});

// Example 9: Implementation Guide
console.log('\n📊 Example 9: Implementation Guide');
console.log('=' .repeat(60));

console.log('Implementation Steps:');
moderateStrategy.data.strategy.implementationGuide.stepByStep.forEach(step => {
  console.log(`\nStep ${step.step}: ${step.title}`);
  console.log(`Timeframe: ${step.timeframe}`);
  step.actions.forEach(action => {
    console.log(`• ${action}`);
  });
});

console.log('\nRequired Documentation:');
moderateStrategy.data.strategy.implementationGuide.documentation.forEach(doc => {
  console.log(`• ${doc}`);
});

console.log('\nTax Considerations:');
moderateStrategy.data.strategy.implementationGuide.taxConsiderations.forEach(tax => {
  console.log(`• ${tax}`);
});

console.log('\nMonitoring:');
console.log(`Frequency: ${moderateStrategy.data.strategy.implementationGuide.monitoring.frequency}`);
console.log(`Key Metrics: ${moderateStrategy.data.strategy.implementationGuide.monitoring.keyMetrics.join(', ')}`);

// Example 10: Generated Strategy Document
console.log('\n📊 Example 10: Generated Strategy Document');
console.log('=' .repeat(60));

console.log('Strategy Document Preview:');
console.log(moderateStrategy.data.document.split('\n').slice(0, 20).join('\n'));
console.log('... (document continues with detailed sections)');

// Example 11: Prompt Template Analysis
console.log('\n📊 Example 11: Prompt Template Analysis');
console.log('=' .repeat(60));

console.log('Investment Strategy Prompt Template:');
console.log('Length:', INVESTMENT_STRATEGY_PROMPT.length, 'characters');
console.log('Sections included:');
console.log('• User Profile Analysis');
console.log('• Risk Profile Assessment');
console.log('• Portfolio Allocation Review');
console.log('• Market Context Integration');
console.log('• NEPSE-Specific Recommendations');
console.log('• Risk Management Strategies');
console.log('• Implementation Guidance');

// Example 12: Available Instruments Analysis
console.log('\n📊 Example 12: Available Instruments Analysis');
console.log('=' .repeat(60));

console.log('Available Investment Instruments in Nepal:');
console.log(AVAILABLE_INSTRUMENTS);

// Example 13: Custom Market Context
console.log('\n📊 Example 13: Custom Market Context');
console.log('=' .repeat(60));

const customMarketData = {
  nepseIndex: 2150,
  nepseChange: 3.2,
  marketSentiment: 'VERY_BULLISH',
  gdpGrowth: 6.1,
  inflationRate: 5.8,
  interestRate: 8.2,
  exchangeRate: 131.8,
  sectorPerformance: 'Banking and Insurance sectors outperforming, Hydropower stable',
  marketOutlook: 'Strong bullish trend with continued growth expected',
};

const customMarketStrategy = generateInvestmentStrategy(
  moderateUser, 
  moderateRisk, 
  moderatePortfolio,
  { marketData: customMarketData }
);

console.log('Custom Market Context Strategy:');
console.log(`NEPSE Index: ${customMarketData.nepseIndex} (${customMarketData.nepseChange}%)`);
console.log(`Market Sentiment: ${customMarketData.marketSentiment}`);
console.log(`Strategy Type: ${customMarketStrategy.data.metadata.strategyType}`);
console.log(`Expected Return: ${customMarketStrategy.data.strategy.portfolioBreakdown.overview.expectedReturn}`);

// Example 14: Error Handling
console.log('\n📊 Example 14: Error Handling');
console.log('=' .repeat(60));

// Test invalid user profile
const invalidUser = {
  age: 17,  // Below minimum
  monthlyIncome: -1000,  // Negative
  investmentHorizonYears: 0,  // Zero
};

const invalidStrategy = generateInvestmentStrategy(
  invalidUser, 
  moderateRisk, 
  moderatePortfolio
);

console.log('Invalid Input Result:');
console.log(JSON.stringify(invalidStrategy, null, 2));

// Test invalid portfolio allocation
const invalidPortfolio = {
  bonds: 60,
  blueChipStocks: 50,  // Total > 100%
  growthStocks: 10,
};

const invalidPortfolioStrategy = generateInvestmentStrategy(
  moderateUser, 
  moderateRisk, 
  invalidPortfolio
);

console.log('\nInvalid Portfolio Result:');
console.log(JSON.stringify(invalidPortfolioStrategy, null, 2));

// Example 15: Strategy Customization
console.log('\n📊 Example 15: Strategy Customization');
console.log('=' .repeat(60));

const customPortfolio = {
  bonds: 25,
  blueChipStocks: 45,
  growthStocks: 25,
  cash: 5,
  alternatives: 0,
};

const customStrategy = generateInvestmentStrategy(
  moderateUser, 
  moderateRisk, 
  customPortfolio
);

console.log('Custom Portfolio Strategy:');
console.log(`Portfolio Allocation:`);
Object.entries(customPortfolio).forEach(([asset, percentage]) => {
  console.log(`  ${asset}: ${percentage}%`);
});
console.log(`Expected Return: ${customStrategy.data.strategy.portfolioBreakdown.overview.expectedReturn}`);
console.log(`Risk Level: ${customStrategy.data.strategy.portfolioBreakdown.overview.riskLevel}`);
console.log(`Strategy Type: ${customStrategy.data.metadata.strategyType}`);

// Example 16: Age-Based Strategy Comparison
console.log('\n📊 Example 16: Age-Based Strategy Comparison');
console.log('=' .repeat(60));

const ageProfiles = [
  { age: 25, name: 'Young Adult', riskTolerance: 'AGGRESSIVE' },
  { age: 35, name: 'Mid-Career', riskTolerance: 'MODERATE' },
  { age: 50, name: 'Pre-Retirement', riskTolerance: 'MODERATE' },
  { age: 65, name: 'Retiree', riskTolerance: 'CONSERVATIVE' },
];

console.log('Age-Based Strategy Comparison:');
ageProfiles.forEach(profile => {
  const user = { ...moderateUser, age: profile.age };
  const risk = { ...moderateRisk, riskTolerance: profile.riskTolerance };
  const portfolio = profile.riskTolerance === 'AGGRESSIVE' ? aggressivePortfolio :
                   profile.riskTolerance === 'CONSERVATIVE' ? conservativePortfolio :
                   moderatePortfolio;
  
  const strategy = generateInvestmentStrategy(user, risk, portfolio);
  
  console.log(`\n${profile.name} (Age ${profile.age}):`);
  console.log(`  Risk Tolerance: ${profile.riskTolerance}`);
  console.log(`  Strategy Type: ${strategy.data.metadata.strategyType}`);
  console.log(`  Expected Return: ${strategy.data.strategy.portfolioBreakdown.overview.expectedReturn}`);
  console.log(`  Risk Level: ${strategy.data.strategy.portfolioBreakdown.overview.riskLevel}`);
});

// Example 17: Income-Based Strategy Comparison
console.log('\n📊 Example 17: Income-Based Strategy Comparison');
console.log('=' .repeat(60));

const incomeProfiles = [
  { income: 30000, name: 'Low Income', riskTolerance: 'CONSERVATIVE' },
  { income: 80000, name: 'Medium Income', riskTolerance: 'MODERATE' },
  { income: 200000, name: 'High Income', riskTolerance: 'AGGRESSIVE' },
];

console.log('Income-Based Strategy Comparison:');
incomeProfiles.forEach(profile => {
  const user = { ...moderateUser, monthlyIncome: profile.income };
  const risk = { ...moderateRisk, riskTolerance: profile.riskTolerance };
  const portfolio = profile.riskTolerance === 'AGGRESSIVE' ? aggressivePortfolio :
                   profile.riskTolerance === 'CONSERVATIVE' ? conservativePortfolio :
                   moderatePortfolio;
  
  const strategy = generateInvestmentStrategy(user, risk, portfolio);
  
  console.log(`\n${profile.name} (NPR ${profile.income.toLocaleString()}/month):`);
  console.log(`  Risk Tolerance: ${profile.riskTolerance}`);
  console.log(`  Strategy Type: ${strategy.data.metadata.strategyType}`);
  console.log(`  Expected Return: ${strategy.data.strategy.portfolioBreakdown.overview.expectedReturn}`);
  console.log(`  Investment Capacity: NPR ${(profile.income - moderateUser.monthlyExpenses).toLocaleString()}/month`);
});

// Example 18: Goal-Based Strategy Comparison
console.log('\n📊 Example 18: Goal-Based Strategy Comparison');
console.log('=' .repeat(60));

const goalProfiles = [
  { goals: ['RETIREMENT'], riskTolerance: 'CONSERVATIVE', horizon: 10 },
  { goals: ['HOUSE_PURCHASE'], riskTolerance: 'MODERATE', horizon: 8 },
  { goals: ['WEALTH_CREATION'], riskTolerance: 'AGGRESSIVE', horizon: 20 },
  { goals: ['EDUCATION_FUND'], riskTolerance: 'MODERATE', horizon: 12 },
];

console.log('Goal-Based Strategy Comparison:');
goalProfiles.forEach(profile => {
  const user = { ...moderateUser, financialGoals: profile.goals, investmentHorizonYears: profile.horizon };
  const risk = { ...moderateRisk, riskTolerance: profile.riskTolerance };
  const portfolio = profile.riskTolerance === 'AGGRESSIVE' ? aggressivePortfolio :
                   profile.riskTolerance === 'CONSERVATIVE' ? conservativePortfolio :
                   moderatePortfolio;
  
  const strategy = generateInvestmentStrategy(user, risk, portfolio);
  
  console.log(`\n${profile.goals.join(' & ')} (${profile.horizon} years):`);
  console.log(`  Risk Tolerance: ${profile.riskTolerance}`);
  console.log(`  Strategy Type: ${strategy.data.metadata.strategyType}`);
  console.log(`  Expected Return: ${strategy.data.strategy.portfolioBreakdown.overview.expectedReturn}`);
  console.log(`  Recommended Companies: ${strategy.data.strategy.recommendedCompanies.length}`);
});

// Example 19: Strategy Performance Simulation
console.log('\n📊 Example 19: Strategy Performance Simulation');
console.log('=' .repeat(60));

console.log('Strategy Performance Simulation (5-Year Projection):');

strategies.forEach(({ name, strategy }) => {
  if (strategy.success) {
    const expectedReturn = parseFloat(strategy.data.strategy.portfolioBreakdown.overview.expectedReturn.split('-')[0]);
    const initialInvestment = 1000000; // NPR 10 lakh
    
    // Simple compound interest calculation
    const projectedValue = initialInvestment * Math.pow(1 + (expectedReturn / 100), 5);
    const totalReturn = projectedValue - initialInvestment;
    const returnPercentage = (totalReturn / initialInvestment) * 100;
    
    console.log(`\n${name} Strategy (5 years):`);
    console.log(`  Expected Annual Return: ${expectedReturn}%`);
    console.log(`  Initial Investment: NPR ${initialInvestment.toLocaleString()}`);
    console.log(`  Projected Value: NPR ${projectedValue.toLocaleString()}`);
    console.log(`  Total Return: NPR ${totalReturn.toLocaleString()}`);
    console.log(`  Return Percentage: ${returnPercentage.toFixed(1)}%`);
  }
});

// Example 20: Strategy Documentation Quality
console.log('\n📊 Example 20: Strategy Documentation Quality');
console.log('=' .repeat(60));

console.log('Strategy Documentation Analysis:');
console.log(`Document Length: ${moderateStrategy.data.document.length} characters`);
console.log(`Sections Included:`);
console.log(`• Executive Summary`);
console.log(`• Portfolio Breakdown (${Object.keys(moderateStrategy.data.strategy.portfolioBreakdown.assetClasses).length} asset classes)`);
console.log(`• Recommended Companies (${moderateStrategy.data.strategy.recommendedCompanies.length} companies)`);
console.log(`• Risk Explanation (${moderateStrategy.data.strategy.riskExplanation.riskFactors.length} risk factors)`);
console.log(`• Investment Timeline (3 time periods)`);
console.log(`• Implementation Guide (${moderateStrategy.data.strategy.implementationGuide.stepByStep.length} steps)`);
console.log(`• Disclaimer and Compliance`);

console.log('\n✅ Investment Strategy Generator Examples Complete!');
console.log('\n🎯 Key Features Demonstrated:');
console.log('• Comprehensive AI prompt template for investment strategies');
console.log('• Personalized strategy generation based on user profiles');
console.log('• Risk-appropriate portfolio recommendations');
console.log('• NEPSE-specific company recommendations');
console.log('• Detailed risk analysis and mitigation strategies');
console.log('• Step-by-step implementation guidance');
console.log('• Investment timeline and rebalancing schedules');
console.log('• Tax considerations and compliance requirements');
console.log('• Market context integration');
console.log('• Multi-scenario strategy comparison');
console.log('• Error handling and validation');
console.log('• Customization options for different profiles');
console.log('• Performance simulation capabilities');
console.log('• Professional documentation generation');
console.log('• Production-ready implementation');
