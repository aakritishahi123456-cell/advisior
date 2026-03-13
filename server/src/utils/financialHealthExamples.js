/**
 * FinSathi AI - Financial Health Scoring Examples
 * Practical examples and usage demonstrations
 */

const { 
  calculateFinancialHealthScore,
  quickFinancialHealthScore,
  getHealthCategory,
  FINANCIAL_HEALTH_THRESHOLDS,
  SCORING_WEIGHTS,
  HEALTH_CATEGORIES
} = require('./financialHealthScoring');

console.log('🎯 FinSathi AI - Financial Health Scoring Examples\n');

// Example 1: Excellent Financial Health
console.log('📊 Example 1: Excellent Financial Health');
console.log('=' .repeat(60));

const excellentFinancialData = {
  savingsRate: 35,        // 35% savings rate
  debtRatio: 0.2,         // 20% debt-to-income ratio
  incomeStability: 0.95,  // 95% stable income
  emergencyFundMonths: 15, // 15 months emergency fund
};

const excellentResult = calculateFinancialHealthScore(excellentFinancialData);
console.log('Excellent Financial Health Result:');
console.log(JSON.stringify(excellentResult, null, 2));

console.log('\nKey Insights:');
console.log(`• Overall Score: ${excellentResult.data.overallScore}/100`);
console.log(`• Category: ${excellentResult.data.category.label}`);
console.log(`• Description: ${excellentResult.data.category.description}`);
console.log(`• Strengths: ${excellentResult.data.analysis.strengths.length}`);
console.log(`• Weaknesses: ${excellentResult.data.analysis.weaknesses.length}`);
console.log(`• Improvement Potential: ${excellentResult.data.improvementPotential.totalImprovementPotential.toFixed(1)} points`);

// Example 2: Good Financial Health
console.log('\n📊 Example 2: Good Financial Health');
console.log('=' .repeat(60));

const goodFinancialData = {
  savingsRate: 22,        // 22% savings rate
  debtRatio: 0.4,         // 40% debt-to-income ratio
  incomeStability: 0.85,  // 85% stable income
  emergencyFundMonths: 8,  // 8 months emergency fund
};

const goodResult = calculateFinancialHealthScore(goodFinancialData);
console.log('Good Financial Health Result:');
console.log(JSON.stringify(goodResult, null, 2));

console.log('\nKey Insights:');
console.log(`• Overall Score: ${goodResult.data.overallScore}/100`);
console.log(`• Category: ${goodResult.data.category.label}`);
console.log(`• Strengths: ${goodResult.data.analysis.strengths.length}`);
console.log(`• Opportunities: ${goodResult.data.analysis.opportunities.length}`);
console.log(`• Action Items: ${goodResult.data.actionPlan.immediate.length + goodResult.data.actionPlan.shortTerm.length}`);

// Example 3: Needs Improvement Financial Health
console.log('\n📊 Example 3: Needs Improvement Financial Health');
console.log('=' .repeat(60));

const needsImprovementData = {
  savingsRate: 12,        // 12% savings rate
  debtRatio: 0.8,         // 80% debt-to-income ratio
  incomeStability: 0.7,   // 70% stable income
  emergencyFundMonths: 2,  // 2 months emergency fund
};

const needsImprovementResult = calculateFinancialHealthScore(needsImprovementData);
console.log('Needs Improvement Result:');
console.log(JSON.stringify(needsImprovementResult, null, 2));

console.log('\nKey Insights:');
console.log(`• Overall Score: ${needsImprovementResult.data.overallScore}/100`);
console.log(`• Category: ${needsImprovementResult.data.category.label}`);
console.log(`• Weaknesses: ${needsImprovementResult.data.analysis.weaknesses.length}`);
console.log(`• Immediate Actions: ${needsImprovementResult.data.actionPlan.immediate.length}`);
console.log(`• Timeframe: ${needsImprovementResult.data.actionPlan.estimatedTimeframe}`);

// Example 4: Risky Financial Health
console.log('\n📊 Example 4: Risky Financial Health');
console.log('=' .repeat(60));

const riskyFinancialData = {
  savingsRate: 3,         // 3% savings rate
  debtRatio: 1.2,         // 120% debt-to-income ratio
  incomeStability: 0.4,   // 40% stable income
  emergencyFundMonths: 0.5, // 0.5 months emergency fund
};

const riskyResult = calculateFinancialHealthScore(riskyFinancialData);
console.log('Risky Financial Health Result:');
console.log(JSON.stringify(riskyResult, null, 2));

console.log('\nKey Insights:');
console.log(`• Overall Score: ${riskyResult.data.overallScore}/100`);
console.log(`• Category: ${riskyResult.data.category.label}`);
console.log(`• Threats: ${riskyResult.data.analysis.threats.length}`);
console.log(`• Immediate Actions Required: ${riskyResult.data.actionPlan.immediate.length}`);
console.log(`• Critical Priorities: ${riskyResult.data.actionPlan.priorities.filter(p => p.priority === 'HIGH').length}`);

// Example 5: Component Score Analysis
console.log('\n📊 Example 5: Component Score Analysis');
console.log('=' .repeat(60));

console.log('Component Score Analysis for Good Financial Health:');
Object.entries(goodResult.data.componentScores).forEach(([component, data]) => {
  console.log(`\n${component.replace(/([A-Z])/g, ' $1').trim()}:`);
  console.log(`  Score: ${data.score.toFixed(1)}/100`);
  console.log(`  Category: ${data.category}`);
  console.log(`  Weight: ${(data.weight * 100).toFixed(0)}%`);
  console.log(`  Description: ${data.description}`);
});

// Example 6: Financial Analysis Breakdown
console.log('\n📊 Example 6: Financial Analysis Breakdown');
console.log('=' .repeat(60));

console.log('Financial Analysis for Needs Improvement Case:');
console.log(`\nSummary: ${needsImprovementResult.data.analysis.summary}`);

console.log('\nStrengths:');
needsImprovementResult.data.analysis.strengths.forEach((strength, index) => {
  console.log(`${index + 1}. ${strength.description} (Impact: ${strength.impact}%)`);
});

console.log('\nWeaknesses:');
needsImprovementResult.data.analysis.weaknesses.forEach((weakness, index) => {
  console.log(`${index + 1}. ${weakness.description} (Impact: ${weakness.impact}%)`);
});

console.log('\nOpportunities:');
needsImprovementResult.data.analysis.opportunities.forEach((opportunity, index) => {
  console.log(`${index + 1}. ${opportunity.description} (Impact: ${opportunity.impact}%)`);
});

console.log('\nThreats:');
needsImprovementResult.data.analysis.threats.forEach((threat, index) => {
  console.log(`${index + 1}. ${threat.description} (Impact: ${threat.impact})`);
});

// Example 7: Action Plan Analysis
console.log('\n📊 Example 7: Action Plan Analysis');
console.log('=' .repeat(60));

console.log('Action Plan for Risky Financial Health:');

console.log('\nImmediate Actions (Priority: IMMEDIATE):');
riskyResult.data.actionPlan.immediate.forEach((action, index) => {
  console.log(`${index + 1}. ${action.title}`);
  console.log(`   Description: ${action.description}`);
  console.log(`   Timeframe: ${action.timeframe}`);
  console.log(`   Impact: ${action.impact}`);
  console.log(`   Difficulty: ${action.difficulty}`);
});

console.log('\nShort-Term Actions:');
riskyResult.data.actionPlan.shortTerm.forEach((action, index) => {
  console.log(`${index + 1}. ${action.title}`);
  console.log(`   Description: ${action.description}`);
  console.log(`   Timeframe: ${action.timeframe}`);
});

console.log('\nPriorities (by impact):');
riskyResult.data.actionPlan.priorities.forEach((priority, index) => {
  console.log(`${index + 1}. ${priority.component.replace(/([A-Z])/g, ' $1').trim()}`);
  console.log(`   Priority: ${priority.priority}`);
  console.log(`   Score: ${priority.score.toFixed(1)}/100`);
  console.log(`   Weight: ${(priority.weight * 100).toFixed(0)}%`);
});

// Example 8: Improvement Potential Analysis
console.log('\n📊 Example 8: Improvement Potential Analysis');
console.log('=' .repeat(60));

console.log('Improvement Potential for Needs Improvement Case:');
console.log(`Current Score: ${needsImprovementResult.data.improvementPotential.currentOverallScore.toFixed(1)}/100`);
console.log(`Max Possible Score: ${needsImprovementResult.data.improvementPotential.maxPossibleScore}/100`);
console.log(`Total Improvement Potential: ${needsImprovementResult.data.improvementPotential.totalImprovementPotential.toFixed(1)} points`);

console.log('\nComponent Improvement Opportunities:');
needsImprovementResult.data.improvementPotential.componentImprovements.forEach((comp, index) => {
  console.log(`${index + 1}. ${comp.component.replace(/([A-Z])/g, ' $1').trim()}:`);
  console.log(`   Current: ${comp.currentScore.toFixed(1)}/100`);
  console.log(`   Potential: ${comp.potentialScore}/100`);
  console.log(`   Improvement: ${comp.improvementPotential.toFixed(1)} points`);
  console.log(`   Weighted Impact: ${comp.weightedImpact.toFixed(1)}`);
  console.log(`   Priority: ${comp.priority}`);
});

console.log('\nQuick Wins:');
needsImprovementResult.data.improvementPotential.quickWins.forEach((win, index) => {
  console.log(`${index + 1}. ${win.component}: ${win.improvementPotential.toFixed(1)} points improvement potential`);
});

// Example 9: Recommendations Analysis
console.log('\n📊 Example 9: Recommendations Analysis');
console.log('=' .repeat(60));

console.log('Personalized Recommendations for Good Financial Health:');
goodResult.data.recommendations.forEach((rec, index) => {
  console.log(`${index + 1}. ${rec}`);
});

// Example 10: Health Category Comparison
console.log('\n📊 Example 10: Health Category Comparison');
console.log('=' .repeat(60));

console.log('Health Categories Comparison:');
Object.entries(HEALTH_CATEGORIES).forEach(([key, category]) => {
  console.log(`\n${category.label} (${category.min}-${category.max}):`);
  console.log(`  Description: ${category.description}`);
  console.log(`  Color: ${category.color}`);
  console.log(`  Recommendations:`);
  category.recommendations.forEach((rec, index) => {
    console.log(`    ${index + 1}. ${rec}`);
  });
});

// Example 11: Scoring Thresholds Analysis
console.log('\n📊 Example 11: Scoring Thresholds Analysis');
console.log('=' .repeat(60));

console.log('Financial Health Scoring Thresholds:');
Object.entries(FINANCIAL_HEALTH_THRESHOLDS).forEach(([component, thresholds]) => {
  console.log(`\n${component.replace(/([A-Z])/g, ' $1').trim()}:`);
  Object.entries(thresholds).forEach(([level, value]) => {
    console.log(`  ${level}: ${component === 'debtRatio' || component === 'incomeStability' ? '<' : '>'} ${value}${component === 'incomeStability' ? '' : component === 'debtRatio' ? '' : '%'}`);
  });
});

// Example 12: Scoring Weights Analysis
console.log('\n📊 Example 12: Scoring Weights Analysis');
console.log('=' .repeat(60));

console.log('Scoring Weights:');
Object.entries(SCORING_WEIGHTS).forEach(([component, weight]) => {
  console.log(`${component.replace(/([A-Z])/g, ' $1').trim()}: ${(weight * 100).toFixed(0)}%`);
});

console.log('\nCustom Weights Example:');
const customWeights = {
  savingsRate: 0.35,      // Increase weight for savings
  debtRatio: 0.30,        // Increase weight for debt
  incomeStability: 0.15,  // Decrease weight for income
  emergencyFund: 0.20,    // Keep emergency fund weight
};

const customResult = calculateFinancialHealthScore(goodFinancialData, { weights: customWeights });
console.log(`Original Score: ${goodResult.data.overallScore.toFixed(1)}/100`);
console.log(`Custom Weight Score: ${customResult.data.overallScore.toFixed(1)}/100`);
console.log(`Difference: ${(customResult.data.overallScore - goodResult.data.overallScore).toFixed(1)} points`);

// Example 13: Quick Score Function
console.log('\n📊 Example 13: Quick Score Function');
console.log('=' .repeat(60));

const testCases = [
  { name: 'Excellent', data: excellentFinancialData },
  { name: 'Good', data: goodFinancialData },
  { name: 'Needs Improvement', data: needsImprovementData },
  { name: 'Risky', data: riskyFinancialData },
];

console.log('Quick Score Comparison:');
testCases.forEach(testCase => {
  const quickScore = quickFinancialHealthScore(testCase.data);
  const detailedScore = calculateFinancialHealthScore(testCase.data);
  console.log(`${testCase.name}: Quick=${quickScore.toFixed(1)}, Detailed=${detailedScore.data.overallScore.toFixed(1)}`);
});

// Example 14: Edge Cases and Validation
console.log('\n📊 Example 14: Edge Cases and Validation');
console.log('=' .repeat(60));

// Test edge cases
const edgeCases = [
  {
    name: 'Perfect Score',
    data: { savingsRate: 50, debtRatio: 0, incomeStability: 1, emergencyFundMonths: 24 },
  },
  {
    name: 'Zero Score',
    data: { savingsRate: 0, debtRatio: 5, incomeStability: 0, emergencyFundMonths: 0 },
  },
  {
    name: 'Minimum Values',
    data: { savingsRate: 0, debtRatio: 0, incomeStability: 0, emergencyFundMonths: 0 },
  },
  {
    name: 'Maximum Values',
    data: { savingsRate: 100, debtRatio: 10, incomeStability: 1, emergencyFundMonths: 60 },
  },
];

console.log('Edge Case Analysis:');
edgeCases.forEach(testCase => {
  const result = calculateFinancialHealthScore(testCase.data);
  console.log(`\n${testCase.name}:`);
  console.log(`  Score: ${result.data.overallScore.toFixed(1)}/100`);
  console.log(`  Category: ${result.data.category.label}`);
  console.log(`  Valid: ${result.success}`);
});

// Example 15: Error Handling
console.log('\n📊 Example 15: Error Handling');
console.log('=' .repeat(60));

// Test invalid inputs
const invalidInputs = [
  {
    name: 'Negative Savings Rate',
    data: { savingsRate: -10, debtRatio: 0.5, incomeStability: 0.8, emergencyFundMonths: 3 },
  },
  {
    name: 'Savings Rate > 100',
    data: { savingsRate: 150, debtRatio: 0.5, incomeStability: 0.8, emergencyFundMonths: 3 },
  },
  {
    name: 'Missing Field',
    data: { savingsRate: 20, debtRatio: 0.5, incomeStability: 0.8 }, // Missing emergencyFundMonths
  },
  {
    name: 'Invalid Income Stability',
    data: { savingsRate: 20, debtRatio: 0.5, incomeStability: 1.5, emergencyFundMonths: 3 },
  },
];

console.log('Error Handling Test:');
invalidInputs.forEach(testCase => {
  const result = calculateFinancialHealthScore(testCase.data);
  console.log(`\n${testCase.name}:`);
  console.log(`  Success: ${result.success}`);
  if (!result.success) {
    console.log(`  Error: ${result.error}`);
    console.log(`  Code: ${result.code}`);
  }
});

// Example 16: Real-World Scenarios
console.log('\n📊 Example 16: Real-World Scenarios');
console.log('=' .repeat(60));

const realWorldScenarios = [
  {
    name: 'Recent Graduate',
    profile: {
      savingsRate: 5,         // Just started saving
      debtRatio: 0.3,         // Student loans
      incomeStability: 0.6,   // Entry-level job
      emergencyFundMonths: 1,  // Minimal savings
    },
  },
  {
    name: 'Mid-Career Professional',
    profile: {
      savingsRate: 18,        // Good savings habit
      debtRatio: 0.4,         // Mortgage and car loan
      incomeStability: 0.9,   // Stable career
      emergencyFundMonths: 6,  // Decent emergency fund
    },
  },
  {
    name: 'Approaching Retirement',
    profile: {
      savingsRate: 25,        // High savings rate
      debtRatio: 0.1,         // Low debt
      incomeStability: 0.95,  // Stable retirement income
      emergencyFundMonths: 12, // Well-funded emergency
    },
  },
  {
    name: 'Small Business Owner',
    profile: {
      savingsRate: 8,         // Variable income
      debtRatio: 1.1,         // Business loans
      incomeStability: 0.5,   // Variable business income
      emergencyFundMonths: 2,  // Limited cash reserves
    },
  },
];

console.log('Real-World Scenario Analysis:');
realWorldScenarios.forEach(scenario => {
  const result = calculateFinancialHealthScore(scenario.profile);
  console.log(`\n${scenario.name}:`);
  console.log(`  Score: ${result.data.overallScore.toFixed(1)}/100`);
  console.log(`  Category: ${result.data.category.label}`);
  console.log(`  Key Focus: ${result.data.actionPlan.priorities[0]?.component || 'Balanced approach'}`);
  console.log(`  Timeframe: ${result.data.actionPlan.estimatedTimeframe}`);
});

// Example 17: Progress Tracking Simulation
console.log('\n📊 Example 17: Progress Tracking Simulation');
console.log('=' .repeat(60));

// Simulate financial health improvement over time
const progressData = [
  { month: 'Jan', savingsRate: 5, debtRatio: 1.2, incomeStability: 0.6, emergencyFundMonths: 0.5 },
  { month: 'Feb', savingsRate: 8, debtRatio: 1.1, incomeStability: 0.65, emergencyFundMonths: 1 },
  { month: 'Mar', savingsRate: 12, debtRatio: 1.0, incomeStability: 0.7, emergencyFundMonths: 1.5 },
  { month: 'Apr', savingsRate: 15, debtRatio: 0.9, incomeStability: 0.75, emergencyFundMonths: 2 },
  { month: 'May', savingsRate: 18, debtRatio: 0.8, incomeStability: 0.8, emergencyFundMonths: 3 },
  { month: 'Jun', savingsRate: 20, debtRatio: 0.7, incomeStability: 0.85, emergencyFundMonths: 4 },
];

console.log('Financial Health Progress Tracking:');
progressData.forEach(month => {
  const score = quickFinancialHealthScore(month);
  const category = getHealthCategory(score);
  console.log(`${month.month}: ${score.toFixed(1)}/100 (${category.label})`);
});

// Example 18: Component Impact Analysis
console.log('\n📊 Example 18: Component Impact Analysis');
console.log('=' .repeat(60));

console.log('Component Impact on Overall Score:');
const baseData = { savingsRate: 15, debtRatio: 0.5, incomeStability: 0.8, emergencyFundMonths: 3 };
const baseScore = quickFinancialHealthScore(baseData);

console.log(`Base Score: ${baseScore.toFixed(1)}/100`);

// Test impact of improving each component by 20%
Object.keys(baseData).forEach(component => {
  const testData = { ...baseData };
  
  if (component === 'savingsRate') {
    testData[component] = Math.min(100, testData[component] + 20);
  } else if (component === 'debtRatio') {
    testData[component] = Math.max(0, testData[component] - 0.2);
  } else if (component === 'incomeStability') {
    testData[component] = Math.min(1, testData[component] + 0.2);
  } else if (component === 'emergencyFundMonths') {
    testData[component] = testData[component] + 3;
  }
  
  const newScore = quickFinancialHealthScore(testData);
  const improvement = newScore - baseScore;
  const weight = SCORING_WEIGHTS[component];
  
  console.log(`Improving ${component.replace(/([A-Z])/g, ' $1').trim()} by 20%: +${improvement.toFixed(1)} points (Weight: ${(weight * 100).toFixed(0)}%)`);
});

// Example 19: Target Score Planning
console.log('\n📊 Example 19: Target Score Planning');
console.log('=' .repeat(60));

const targetScores = [70, 80, 90];
console.log('Target Score Planning from Current State (Needs Improvement):');

targetScores.forEach(target => {
  const currentScore = needsImprovementResult.data.overallScore;
  const needed = target - currentScore;
  
  if (needed > 0) {
    console.log(`\nTarget: ${target}/100 (Need +${needed.toFixed(1)} points)`);
    
    // Find components with highest improvement potential
    const topImprovements = needsImprovementResult.data.improvementPotential.componentImprovements
      .filter(comp => comp.improvementPotential > 0)
      .slice(0, 3);
    
    console.log('Focus Areas:');
    topImprovements.forEach((comp, index) => {
      const contribution = Math.min(comp.improvementPotential, needed / 3);
      console.log(`  ${index + 1}. ${comp.component}: Potential +${contribution.toFixed(1)} points`);
    });
  } else {
    console.log(`Target ${target}/100: Already achieved!`);
  }
});

// Example 20: Integration with Financial Goals
console.log('\n📊 Example 20: Integration with Financial Goals');
console.log('=' .repeat(60));

const financialGoals = [
  { name: 'Buy House', targetScore: 75, timeframe: '2 years' },
  { name: 'Retirement', targetScore: 85, timeframe: '10 years' },
  { name: 'Emergency Fund', targetScore: 70, timeframe: '6 months' },
  { name: 'Debt Free', targetScore: 80, timeframe: '3 years' },
];

console.log('Financial Goal Alignment:');
financialGoals.forEach(goal => {
  const currentScore = goodResult.data.overallScore;
  const gap = goal.targetScore - currentScore;
  
  console.log(`\n${goal.name}:`);
  console.log(`  Target Score: ${goal.targetScore}/100`);
  console.log(`  Current Score: ${currentScore.toFixed(1)}/100`);
  console.log(`  Gap: ${gap > 0 ? '+' : ''}${gap.toFixed(1)} points`);
  console.log(`  Timeframe: ${goal.timeframe}`);
  console.log(`  Feasible: ${gap <= 20 ? 'Yes' : gap <= 40 ? 'Challenging' : 'Very Difficult'}`);
});

console.log('\n✅ Financial Health Scoring Examples Complete!');
console.log('\n🎯 Key Features Demonstrated:');
console.log('• Comprehensive multi-factor financial health scoring');
console.log('• Four main components: savings rate, debt ratio, income stability, emergency fund');
console.log('• Weighted scoring system with customizable weights');
console.log('• Four health categories: Excellent, Good, Needs Improvement, Risky');
console.log('• Detailed financial analysis with SWOT assessment');
console.log('• Actionable improvement plans with priorities');
console.log('• Improvement potential analysis and quick wins');
console.log('• Personalized recommendations based on score');
console.log('• Progress tracking and trend analysis');
console.log('• Real-world scenario applications');
console.log('• Target score planning and goal alignment');
console.log('• Error handling and validation');
console.log('• Edge case handling and boundary testing');
console.log('• Component impact analysis');
console.log('• Quick score function for simple use cases');
console.log('• Production-ready implementation with comprehensive documentation');
