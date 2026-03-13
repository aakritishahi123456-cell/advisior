/**
 * FinSathi AI - Goal-Based Investment Planner Examples
 * Practical examples and usage demonstrations
 */

const { 
  calculateMonthlyInvestment, 
  calculateMultipleGoals, 
  calculateInflationAdjustedGoal 
} = require('./goalBasedInvestmentPlanner');

console.log('🎯 FinSathi AI - Goal-Based Investment Planner Examples\n');

// Example 1: Retirement Planning
console.log('📊 Example 1: Retirement Planning');
console.log('=' .repeat(60));

const retirementGoal = {
  goalAmount: 20000000,      // NPR 2 crore for retirement
  currentSavings: 2000000,   // NPR 20 lakh already saved
  yearsToGoal: 25,           // 25 years to retirement
  expectedReturnRate: 12,    // 12% annual return
};

const retirementResult = calculateMonthlyInvestment(retirementGoal);
console.log('Retirement Planning Result:');
console.log(JSON.stringify(retirementResult, null, 2));

console.log('\nKey Insights:');
console.log(`• Monthly Investment Required: NPR ${retirementResult.data.monthlyInvestment.required.toLocaleString()}`);
console.log(`• Total Investment Needed: NPR ${retirementResult.data.monthlyInvestment.totalInvestment.toLocaleString()}`);
console.log(`• Interest Earned on Current Savings: NPR ${retirementResult.data.projections.interestEarnedOnCurrent.toLocaleString()}`);
console.log(`• Interest Earned on New Investments: NPR ${retirementResult.data.projections.interestEarnedOnNew.toLocaleString()}`);
console.log(`• Risk Level: ${retirementResult.data.riskMetrics.overallRiskLevel}`);

// Example 2: House Purchase Goal
console.log('\n📊 Example 2: House Purchase Goal');
console.log('=' .repeat(60));

const houseGoal = {
  goalAmount: 8000000,       // NPR 80 lakh for house
  currentSavings: 1000000,    // NPR 10 lakh saved
  yearsToGoal: 8,            // 8 years to buy house
  expectedReturnRate: 10,      // 10% annual return
};

const houseResult = calculateMonthlyInvestment(houseGoal);
console.log('House Purchase Result:');
console.log(JSON.stringify(houseResult, null, 2));

console.log('\nKey Insights:');
console.log(`• Monthly Investment Required: NPR ${houseResult.data.monthlyInvestment.required.toLocaleString()}`);
console.log(`• Goal Completion: ${houseResult.data.goalAnalysis.percentageCompleted.toFixed(1)}% already achieved`);
console.log(`• Years to Goal: ${houseResult.data.goalAnalysis.yearsToGoal} years`);
console.log(`• Expected Return: ${houseResult.data.goalAnalysis.expectedReturnRate}% annually`);

// Example 3: Education Fund
console.log('\n📊 Example 3: Children\'s Education Fund');
console.log('=' .repeat(60));

const educationGoal = {
  goalAmount: 5000000,       // NPR 50 lakh for education
  currentSavings: 500000,     // NPR 5 lakh saved
  yearsToGoal: 12,            // 12 years until college
  expectedReturnRate: 8,       // 8% annual return (conservative)
};

const educationResult = calculateMonthlyInvestment(educationGoal);
console.log('Education Fund Result:');
console.log(JSON.stringify(educationResult, null, 2));

console.log('\nKey Insights:');
console.log(`• Monthly Investment Required: NPR ${educationResult.data.monthlyInvestment.required.toLocaleString()}`);
console.log(`• Risk Level: ${educationResult.data.riskMetrics.overallRiskLevel}`);
console.log(`• Affordability: ${educationResult.data.affordability.affordabilityLevel}`);

// Example 4: Short-Term Goal (Vacation)
console.log('\n📊 Example 4: Short-Term Goal (Vacation)');
console.log('=' .repeat(60));

const vacationGoal = {
  goalAmount: 500000,        // NPR 5 lakh for vacation
  currentSavings: 100000,    // NPR 1 lakh saved
  yearsToGoal: 2,            // 2 years to vacation
  expectedReturnRate: 6,       // 6% annual return (conservative)
};

const vacationResult = calculateMonthlyInvestment(vacationGoal);
console.log('Vacation Result:');
console.log(JSON.stringify(vacationResult, null, 2));

console.log('\nKey Insights:');
console.log(`• Monthly Investment Required: NPR ${vacationResult.data.monthlyInvestment.required.toLocaleString()}`);
console.log(`• Time Horizon Risk: ${vacationResult.data.riskMetrics.timeHorizonRisk}`);
console.log(`• Recommendation: Consider conservative investments for short-term goals`);

// Example 5: Wealth Creation Goal
console.log('\n📊 Example 5: Wealth Creation Goal');
console.log('=' .repeat(60));

const wealthGoal = {
  goalAmount: 10000000,      // NPR 1 crore wealth target
  currentSavings: 2000000,    // NPR 20 lakh saved
  yearsToGoal: 15,           // 15 years to wealth target
  expectedReturnRate: 15,      // 15% annual return (aggressive)
};

const wealthResult = calculateMonthlyInvestment(wealthGoal);
console.log('Wealth Creation Result:');
console.log(JSON.stringify(wealthResult, null, 2));

console.log('\nKey Insights:');
console.log(`• Monthly Investment Required: NPR ${wealthResult.data.monthlyInvestment.required.toLocaleString()}`);
console.log(`• Return Rate Risk: ${wealthResult.data.riskMetrics.returnRateRisk}`);
console.log(`• Expected Returns: ${wealthResult.data.projections.interestEarnedOnNew.toLocaleString()}`);

// Example 6: Multiple Goals Simultaneously
console.log('\n📊 Example 6: Multiple Goals Simultaneously');
console.log('=' .repeat(60));

const multipleGoals = [
  {
    goalAmount: 20000000,      // Retirement
    currentSavings: 2000000,
    yearsToGoal: 25,
    expectedReturnRate: 12,
  },
  {
    goalAmount: 8000000,       // House
    currentSavings: 1000000,
    yearsToGoal: 8,
    expectedReturnRate: 10,
  },
  {
    goalAmount: 5000000,       // Education
    currentSavings: 500000,
    yearsToGoal: 12,
    expectedReturnRate: 8,
  },
];

const multipleResult = calculateMultipleGoals(multipleGoals, 80000); // NPR 80,000 monthly income
console.log('Multiple Goals Result:');
console.log(JSON.stringify(multipleResult, null, 2));

console.log('\nMultiple Goals Summary:');
console.log(`• Total Monthly Investment Required: NPR ${multipleResult.data.summary.totalMonthlyInvestment.toLocaleString()}`);
console.log(`• Investment to Income Ratio: ${(multipleResult.data.summary.investmentToIncomeRatio * 100).toFixed(1)}%`);
console.log(`• Affordable: ${multipleResult.data.summary.affordable ? 'Yes' : 'No'}`);
console.log(`• Remaining Capacity: NPR ${multipleResult.data.summary.remainingCapacity.toLocaleString()}`);

console.log('\nGoal Priorities:');
multipleResult.data.priority.forEach((priority, index) => {
  console.log(`${index + 1}. ${priority.goal}: Priority ${priority.priority}, Urgency ${priority.urgency}`);
});

// Example 7: Inflation-Adjusted Planning
console.log('\n📊 Example 7: Inflation-Adjusted Planning');
console.log('=' .repeat(60));

const inflationAdjustedGoal = {
  goalAmount: 10000000,      // NPR 1 crore target
  currentSavings: 1000000,    // NPR 10 lakh saved
  yearsToGoal: 20,           // 20 years to goal
  expectedReturnRate: 12,      // 12% nominal return
};

const inflationResult = calculateInflationAdjustedGoal(inflationAdjustedGoal, 6); // 6% inflation
console.log('Inflation-Adjusted Result:');
console.log(JSON.stringify(inflationResult, null, 2));

if (inflationResult.success) {
  console.log('\nInflation Analysis:');
  console.log(`• Original Goal: NPR ${inflationResult.data.inflationAnalysis.originalGoal.toLocaleString()}`);
  console.log(`• Inflation-Adjusted Goal: NPR ${inflationResult.data.inflationAnalysis.inflationAdjustedGoal.toLocaleString()}`);
  console.log(`• Inflation Impact: NPR ${inflationResult.data.inflationAnalysis.inflationImpact.toLocaleString()}`);
  console.log(`• Real Return Rate: ${inflationResult.data.inflationAnalysis.realReturnRate}%`);
  console.log(`• Nominal Return Rate: ${inflationResult.data.inflationAnalysis.nominalReturnRate}%`);
}

// Example 8: Risk Comparison Analysis
console.log('\n📊 Example 8: Risk Comparison Analysis');
console.log('=' .repeat(60));

const riskComparisonGoals = [
  {
    name: 'Conservative Plan',
    goalAmount: 10000000,
    currentSavings: 1000000,
    yearsToGoal: 20,
    expectedReturnRate: 6,  // Conservative
  },
  {
    name: 'Moderate Plan',
    goalAmount: 10000000,
    currentSavings: 1000000,
    yearsToGoal: 20,
    expectedReturnRate: 10, // Moderate
  },
  {
    name: 'Aggressive Plan',
    goalAmount: 10000000,
    currentSavings: 1000000,
    yearsToGoal: 20,
    expectedReturnRate: 15, // Aggressive
  },
];

console.log('Risk Comparison:');
riskComparisonGoals.forEach(goal => {
  const result = calculateMonthlyInvestment(goal);
  if (result.success) {
    console.log(`\n${goal.name}:`);
    console.log(`  Expected Return: ${goal.expectedReturnRate}%`);
    console.log(`  Monthly Investment: NPR ${result.data.monthlyInvestment.required.toLocaleString()}`);
    console.log(`  Risk Level: ${result.data.riskMetrics.overallRiskLevel}`);
    console.log(`  Total Interest: NPR ${result.data.projections.totalInterestEarned.toLocaleString()}`);
  }
});

// Example 9: Investment Schedule Analysis
console.log('\n📊 Example 9: Investment Schedule Analysis');
console.log('=' .repeat(60));

const scheduleGoal = {
  goalAmount: 5000000,       // NPR 50 lakh
  currentSavings: 500000,     // NPR 5 lakh
  yearsToGoal: 10,           // 10 years
  expectedReturnRate: 12,      // 12% annual return
};

const scheduleResult = calculateMonthlyInvestment(scheduleGoal);
if (scheduleResult.success) {
  console.log('Investment Schedule:');
  scheduleResult.data.schedule.forEach((year, index) => {
    console.log(`\nYear ${year.year}:`);
    console.log(`  Start Balance: NPR ${year.startBalance.toLocaleString()}`);
    console.log(`  End Balance: NPR ${year.endBalance.toLocaleString()}`);
    console.log(`  Monthly Investment: NPR ${year.monthlyInvestment.toLocaleString()}`);
    console.log(`  Interest Earned: NPR ${year.interestEarned.toLocaleString()}`);
    console.log(`  Annual Return: ${year.annualReturn}%`);
    console.log(`  Goal Completion: ${year.percentageOfGoal}%`);
  });
}

// Example 10: Alternative Scenarios Analysis
console.log('\n📊 Example 10: Alternative Scenarios Analysis');
console.log('=' .repeat(60));

const scenarioGoal = {
  goalAmount: 10000000,      // NPR 1 crore
  currentSavings: 1000000,    // NPR 10 lakh
  yearsToGoal: 15,           // 15 years
  expectedReturnRate: 10,      // 10% annual return
};

const scenarioResult = calculateMonthlyInvestment(scenarioGoal);
if (scenarioResult.success) {
  console.log('Alternative Scenarios:');
  scenarioResult.data.scenarios.forEach(scenario => {
    if (scenario.result) {
      console.log(`\n${scenario.name}:`);
      console.log(`  Description: ${scenario.description}`);
      console.log(`  Monthly Investment: NPR ${scenario.result.monthlyInvestment.required.toLocaleString()}`);
      console.log(`  Time to Goal: ${scenario.result.goalAnalysis.yearsToGoal} years`);
      console.log(`  Expected Return: ${scenario.result.goalAnalysis.expectedReturnRate}%`);
    }
  });
}

// Example 11: Affordability Analysis
console.log('\n📊 Example 11: Affordability Analysis');
console.log('=' .repeat(60));

const affordabilityGoals = [
  {
    name: 'Low Income Goal',
    monthlyIncome: 30000,
    goalAmount: 2000000,
    currentSavings: 100000,
    yearsToGoal: 10,
    expectedReturnRate: 8,
  },
  {
    name: 'Medium Income Goal',
    monthlyIncome: 80000,
    goalAmount: 5000000,
    currentSavings: 500000,
    yearsToGoal: 10,
    expectedReturnRate: 10,
  },
  {
    name: 'High Income Goal',
    monthlyIncome: 200000,
    goalAmount: 20000000,
    currentSavings: 2000000,
    yearsToGoal: 15,
    expectedReturnRate: 12,
  },
];

console.log('Affordability Analysis:');
affordabilityGoals.forEach(goal => {
  const result = calculateMonthlyInvestment(goal);
  if (result.success) {
    console.log(`\n${goal.name} (Income: NPR ${goal.monthlyIncome.toLocaleString()}):`);
    console.log(`  Monthly Investment: NPR ${result.data.monthlyInvestment.required.toLocaleString()}`);
    console.log(`  Investment Ratio: ${(result.data.affordability.investmentToIncomeRatio * 100).toFixed(1)}%`);
    console.log(`  Affordability: ${result.data.affordability.affordabilityLevel}`);
    console.log(`  Score: ${result.data.affordability.affordabilityScore}/100`);
    console.log(`  Recommended Max: NPR ${result.data.affordability.recommendedMaximum.toLocaleString()}`);
  }
});

// Example 12: Edge Cases and Validation
console.log('\n📊 Example 12: Edge Cases and Validation');
console.log('=' .repeat(60));

const edgeCases = [
  {
    name: 'Zero Current Savings',
    inputs: { goalAmount: 5000000, currentSavings: 0, yearsToGoal: 10, expectedReturnRate: 10 },
  },
  {
    name: 'Zero Return Rate',
    inputs: { goalAmount: 5000000, currentSavings: 500000, yearsToGoal: 10, expectedReturnRate: 0 },
  },
  {
    name: 'Very Short Horizon',
    inputs: { goalAmount: 1000000, currentSavings: 500000, yearsToGoal: 1, expectedReturnRate: 8 },
  },
  {
    name: 'Very Long Horizon',
    inputs: { goalAmount: 50000000, currentSavings: 1000000, yearsToGoal: 40, expectedReturnRate: 12 },
  },
  {
    name: 'Goal Already Met',
    inputs: { goalAmount: 1000000, currentSavings: 1500000, yearsToGoal: 10, expectedReturnRate: 10 },
  },
  {
    name: 'Negative Return Rate',
    inputs: { goalAmount: 5000000, currentSavings: 500000, yearsToGoal: 10, expectedReturnRate: -5 },
  },
];

console.log('Edge Cases Analysis:');
edgeCases.forEach(testCase => {
  const result = calculateMonthlyInvestment(testCase.inputs);
  console.log(`\n${testCase.name}:`);
  console.log(`  Success: ${result.success}`);
  if (result.success) {
    console.log(`  Monthly Investment: NPR ${result.data.monthlyInvestment.required.toLocaleString()}`);
    console.log(`  Risk Level: ${result.data.riskMetrics.overallRiskLevel}`);
  } else {
    console.log(`  Error: ${result.error}`);
  }
});

// Example 13: Real-World NEPSE Context
console.log('\n📊 Example 13: Real-World NEPSE Context');
console.log('=' .repeat(60));

const nepseGoals = [
  {
    name: 'NEPSE Index Fund',
    goalAmount: 3000000,      // NPR 30 lakh
    currentSavings: 300000,    // NPR 3 lakh
    yearsToGoal: 8,           // 8 years
    expectedReturnRate: 14,      // NEPSE historical average
  },
  {
    name: 'Banking Sector Fund',
    goalAmount: 2000000,      // NPR 20 lakh
    currentSavings: 200000,    // NPR 2 lakh
    yearsToGoal: 6,           // 6 years
    expectedReturnRate: 11,      // Banking sector average
  },
  {
    name: 'Hybrid Fund',
    goalAmount: 2500000,      // NPR 25 lakh
    currentSavings: 250000,    // NPR 2.5 lakh
    yearsToGoal: 7,           // 7 years
    expectedReturnRate: 12,      // Hybrid fund average
  },
];

console.log('NEPSE Investment Context:');
nepseGoals.forEach(goal => {
  const result = calculateMonthlyInvestment(goal);
  if (result.success) {
    console.log(`\n${goal.name}:`);
    console.log(`  Expected Return: ${goal.expectedReturnRate}% (NEPSE context)`);
    console.log(`  Monthly Investment: NPR ${result.data.monthlyInvestment.required.toLocaleString()}`);
    console.log(`  Risk Level: ${result.data.riskMetrics.overallRiskLevel}`);
    console.log(`  Total Interest: NPR ${result.data.projections.totalInterestEarned.toLocaleString()}`);
    console.log(`  Recommendation: ${result.data.recommendations[0]?.title || 'Standard investment approach'}`);
  }
});

console.log('\n✅ Goal-Based Investment Planner Examples Complete!');
console.log('\n🎯 Key Features Demonstrated:');
console.log('• Comprehensive monthly investment calculation');
console.log('• Future value of annuity formula implementation');
console.log('• Detailed investment schedule generation');
console.log('• Risk assessment and metrics');
console.log('• Personalized recommendations');
console.log('• Multiple goals simultaneous planning');
console.log('• Inflation-adjusted calculations');
console.log('• Alternative scenario analysis');
console.log('• Affordability analysis');
console.log('• Edge case handling');
console.log('• Real-world NEPSE context');
console.log('• Comprehensive validation');
console.log('• Production-ready error handling');
