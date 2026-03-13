/**
 * FinSathi AI - Risk Profiling Algorithm Examples
 * Practical examples and usage demonstrations
 */

const { calculateRiskProfile, getRiskProfileOptions } = require('./riskProfilingAlgorithm');

console.log('🎯 FinSathi AI - Investment Risk Profiling Examples\n');

// Example 1: Young Professional with Moderate Income
console.log('📊 Example 1: Young Professional (Age 28, Medium Income)');
console.log('=' .repeat(60));

const youngProfessional = {
  age: 28,
  monthlyIncome: 80000,  // NPR 80,000/month
  monthlyExpenses: 50000, // NPR 50,000/month
  currentSavings: 400000,  // NPR 400,000 saved
  investmentHorizonYears: 12,
  questionnaireScore: 65, // Moderate risk attitude
};

const result1 = calculateRiskProfile(youngProfessional);
console.log('Result:', JSON.stringify(result1, null, 2));
console.log('\nExplanation:');
console.log(result1.data.explanation);

// Example 2: Middle-Aged High-Income Individual
console.log('\n📊 Example 2: Middle-Aged High-Income Individual');
console.log('=' .repeat(60));

const highIncomeMiddleAged = {
  age: 45,
  monthlyIncome: 250000,  // NPR 250,000/month
  monthlyExpenses: 120000, // NPR 120,000/month
  currentSavings: 3000000, // NPR 3,000,000 saved
  investmentHorizonYears: 15,
  questionnaireScore: 75, // Aggressive risk attitude
};

const result2 = calculateRiskProfile(highIncomeMiddleAged);
console.log('Result:', JSON.stringify(result2, null, 2));
console.log('\nExplanation:');
console.log(result2.data.explanation);

// Example 3: Retiree with Conservative Profile
console.log('\n📊 Example 3: Retiree (Age 65, Conservative)');
console.log('=' .repeat(60));

const retiree = {
  age: 65,
  monthlyIncome: 50000,   // NPR 50,000/month (pension)
  monthlyExpenses: 35000, // NPR 35,000/month
  currentSavings: 2000000, // NPR 2,000,000 saved
  investmentHorizonYears: 5,
  questionnaireScore: 25, // Conservative risk attitude
};

const result3 = calculateRiskProfile(retiree);
console.log('Result:', JSON.stringify(result3, null, 2));
console.log('\nExplanation:');
console.log(result3.data.explanation);

// Example 4: Young Aggressive Investor
console.log('\n📊 Example 4: Young Aggressive Investor');
console.log('=' .repeat(60));

const youngAggressive = {
  age: 25,
  monthlyIncome: 150000,  // NPR 150,000/month
  monthlyExpenses: 80000,  // NPR 80,000/month
  currentSavings: 600000,  // NPR 600,000 saved
  investmentHorizonYears: 20,
  questionnaireScore: 85, // Very aggressive risk attitude
};

const result4 = calculateRiskProfile(youngAggressive);
console.log('Result:', JSON.stringify(result4, null, 2));
console.log('\nExplanation:');
console.log(result4.data.explanation);

// Example 5: Edge Case - Low Savings
console.log('\n📊 Example 5: Edge Case - Low Savings');
console.log('=' .repeat(60));

const lowSavings = {
  age: 35,
  monthlyIncome: 60000,   // NPR 60,000/month
  monthlyExpenses: 55000,  // NPR 55,000/month
  currentSavings: 50000,   // NPR 50,000 saved (only 1 month expenses)
  investmentHorizonYears: 10,
  questionnaireScore: 45, // Moderate risk attitude
};

const result5 = calculateRiskProfile(lowSavings);
console.log('Result:', JSON.stringify(result5, null, 2));
console.log('\nExplanation:');
console.log(result5.data.explanation);

// Example 6: Validation Error Cases
console.log('\n📊 Example 6: Validation Error Cases');
console.log('=' .repeat(60));

const invalidInputs = {
  age: 17,  // Below minimum age
  monthlyIncome: -1000,  // Negative income
  monthlyExpenses: 0,  // Zero expenses
  currentSavings: -500,  // Negative savings
  investmentHorizonYears: 60,  // Above maximum
  questionnaireScore: 150,  // Above maximum
};

const invalidResult = calculateRiskProfile(invalidInputs);
console.log('Invalid Result:', JSON.stringify(invalidResult, null, 2));

// Example 7: Risk Profile Options for UI
console.log('\n📊 Example 7: Risk Profile Options for UI');
console.log('=' .repeat(60));

const options = getRiskProfileOptions();
console.log('Available Risk Profiles:');
Object.entries(options.profiles).forEach(([key, profile]) => {
  console.log(`\n${key}:`);
  console.log(`  Name: ${profile.name}`);
  console.log(`  Description: ${profile.description}`);
  console.log(`  Expected Returns: ${profile.expectedReturns}`);
  console.log(`  Risk Level: ${profile.riskLevel}`);
  console.log(`  Characteristics:`);
  profile.characteristics.forEach(char => {
    console.log(`    - ${char}`);
  });
  console.log(`  Recommended Allocation:`);
  Object.entries(profile.recommendedAllocation).forEach(([asset, percentage]) => {
    console.log(`    ${asset}: ${percentage}%`);
  });
});

console.log('\nQuestionnaire Options:');
options.questionnaire.forEach((q, index) => {
  console.log(`\nQuestion ${index + 1}: ${q.question}`);
  q.options.forEach(option => {
    console.log(`  ${option.value}: ${option.text}`);
  });
});

// Example 8: Batch Processing for Multiple Users
console.log('\n📊 Example 8: Batch Processing for Multiple Users');
console.log('=' .repeat(60));

const users = [
  {
    id: 'user1',
    name: 'Ramesh Sharma',
    ...youngProfessional,
  },
  {
    id: 'user2',
    name: 'Priya Patel',
    ...highIncomeMiddleAged,
  },
  {
    id: 'user3',
    name: 'Krishna Singh',
    ...retiree,
  },
  {
    id: 'user4',
    name: 'Anita Kumari',
    ...youngAggressive,
  },
];

console.log('Processing multiple users...\n');
users.forEach(user => {
  const result = calculateRiskProfile({
    age: user.age,
    monthlyIncome: user.monthlyIncome,
    monthlyExpenses: user.monthlyExpenses,
    currentSavings: user.currentSavings,
    investmentHorizonYears: user.investmentHorizonYears,
    questionnaireScore: user.questionnaireScore,
  });
  
  console.log(`${user.name} (${user.id}):`);
  console.log(`  Risk Profile: ${result.data.profile.name}`);
  console.log(`  Risk Score: ${result.data.scoring.finalScore}/35`);
  console.log(`  Confidence: ${result.data.profile.confidence}`);
  console.log(`  Expected Returns: ${result.data.profile.expectedReturns}`);
  console.log('');
});

// Example 9: Risk Profile Comparison
console.log('\n📊 Example 9: Risk Profile Comparison Analysis');
console.log('=' .repeat(60));

const comparisonData = [
  { name: 'Conservative Investor', score: 12 },
  { name: 'Moderate Investor', score: 22 },
  { name: 'Aggressive Investor', score: 30 },
];

console.log('Risk Profile Comparison:');
comparisonData.forEach(profile => {
  const result = calculateRiskProfile({
    age: 35,
    monthlyIncome: 100000,
    monthlyExpenses: 60000,
    currentSavings: 1000000,
    investmentHorizonYears: 10,
    questionnaireScore: profile.score * 2.5, // Convert to 0-100 scale
  });
  
  console.log(`\n${profile.name} (Score: ${profile.score}):`);
  console.log(`  Final Risk Score: ${result.data.scoring.finalScore}`);
  console.log(`  Risk Category: ${result.data.profile.name}`);
  console.log(`  Expected Returns: ${result.data.profile.expectedReturns}`);
  console.log(`  Recommended Equity Allocation: ${result.data.profile.recommendedAllocation.equity}%`);
});

// Example 10: Dynamic Risk Adjustment
console.log('\n📊 Example 10: Dynamic Risk Adjustment Based on Market Conditions');
console.log('=' .repeat(60));

const baseProfile = youngProfessional;
const marketConditions = {
  bullish: { adjustment: 0.1, reason: 'Bullish market allows for slightly higher risk' },
  bearish: { adjustment: -0.1, reason: 'Bearish market suggests reducing risk' },
  volatile: { adjustment: -0.05, reason: 'High volatility suggests moderate risk' },
  stable: { adjustment: 0, reason: 'Stable market maintains current risk level' },
};

console.log('Dynamic Risk Adjustment Analysis:');
Object.entries(marketConditions).forEach(([condition, adjustment]) => {
  const adjustedScore = baseProfile.questionnaireScore + (adjustment.adjustment * 100);
  const adjustedProfile = calculateRiskProfile({
    ...baseProfile,
    questionnaireScore: Math.max(0, Math.min(100, adjustedScore)),
  });
  
  console.log(`\n${condition.toUpperCase()} Market:`);
  console.log(`  Adjustment: ${adjustment.adjustment * 100}%`);
  console.log(`  Reason: ${adjustment.reason}`);
  console.log(`  Original Score: ${baseProfile.questionnaireScore}`);
  console.log(`  Adjusted Score: ${Math.max(0, Math.min(100, adjustedScore))}`);
  console.log(`  Risk Profile: ${adjustedProfile.data.profile.name}`);
  console.log(`  Expected Returns: ${adjustedProfile.data.profile.expectedReturns}`);
});

// Example 11: Risk Profile Evolution Over Time
console.log('\n📊 Example 11: Risk Profile Evolution Over Time');
console.log('=' .repeat(60));

const userEvolution = {
  name: 'Suresh Kumar',
  age: 25,
  initialProfile: {
    monthlyIncome: 50000,
    monthlyExpenses: 35000,
    currentSavings: 200000,
    investmentHorizonYears: 15,
    questionnaireScore: 60,
  },
};

console.log(`Risk Profile Evolution for ${userEvolution.name}:`);

// Year 0 (Starting point)
const year0 = calculateRiskProfile({
  ...userEvolution.initialProfile,
  age: userEvolution.age,
});
console.log(`\nAge ${userEvolution.age} (Year 0):`);
console.log(`  Risk Profile: ${year0.data.profile.name}`);
console.log(`  Score: ${year0.data.scoring.finalScore}`);

// Year 5 (Progression)
const year5 = calculateRiskProfile({
  ...userEvolution.initialProfile,
  age: userEvolution.age + 5,
  monthlyIncome: 80000,  // Income increased
  currentSavings: 1500000,  // Savings grew
  questionnaireScore: 70,  // More confident
});
console.log(`\nAge ${userEvolution.age + 5} (Year 5):`);
console.log(`  Risk Profile: ${year5.data.profile.name}`);
console.log(`  Score: ${year5.data.scoring.finalScore}`);

// Year 10 (Further progression)
const year10 = calculateRiskProfile({
  ...userEvolution.initialProfile,
  age: userEvolution.age + 10,
  monthlyIncome: 120000,  // Higher income
  currentSavings: 5000000,  // Significant savings
  questionnaireScore: 65,  // More moderate with age
});
console.log(`\nAge ${userEvolution.age + 10} (Year 10):`);
console.log(`  Risk Profile: ${year10.data.profile.name}`);
console.log(`  Score: ${year10.data.scoring.finalScore}`);

// Example 12: Integration with Financial Goals
console.log('\n📊 Example 12: Integration with Financial Goals');
console.log('=' .repeat(60));

const goals = [
  { type: 'RETIREMENT', horizon: 25, targetAmount: 20000000 },
  { type: 'HOUSE_PURCHASE', horizon: 8, targetAmount: 8000000 },
  { type: 'EDUCATION_FUND', horizon: 15, targetAmount: 5000000 },
];

goals.forEach(goal => {
  const goalBasedProfile = calculateRiskProfile({
    age: 30,
    monthlyIncome: 100000,
    monthlyExpenses: 60000,
    currentSavings: 1000000,
    investmentHorizonYears: goal.horizon,
    questionnaireScore: 55,
  });
  
  console.log(`\nGoal: ${goal.type}`);
  console.log(`  Horizon: ${goal.horizon} years`);
  console.log(`  Target: NPR ${goal.targetAmount.toLocaleString()}`);
  console.log(`  Recommended Risk Profile: ${goalBasedProfile.data.profile.name}`);
  console.log(`  Expected Returns: ${goalBasedProfile.data.profile.expectedReturns}`);
  console.log(`  Monthly Required: NPR ${(goal.targetAmount / (goal.horizon * 12)).toLocaleString()}`);
});

// Example 13: Risk Profile Validation Test Cases
console.log('\n📊 Example 13: Risk Profile Validation Test Cases');
console.log('=' .repeat(60));

const testCases = [
  {
    name: 'Minimum Values',
    inputs: { age: 18, monthlyIncome: 1, monthlyExpenses: 1, currentSavings: 1, investmentHorizonYears: 1, questionnaireScore: 0 },
  },
  {
    name: 'Maximum Values',
    inputs: { age: 100, monthlyIncome: 1000000, monthlyExpenses: 500000, currentSavings: 10000000, investmentHorizonYears: 50, questionnaireScore: 100 },
  },
  {
    name: 'Zero Expenses',
    inputs: { age: 30, monthlyIncome: 100000, monthlyExpenses: 0, currentSavings: 1000000, investmentHorizonYears: 10, questionnaireScore: 50 },
  },
  {
    name: 'High Savings Ratio',
    inputs: { age: 35, monthlyIncome: 100000, monthlyExpenses: 20000, currentSavings: 5000000, investmentHorizonYears: 15, questionnaireScore: 60 },
  },
];

testCases.forEach(testCase => {
  const result = calculateRiskProfile(testCase.inputs);
  console.log(`\n${testCase.name}:`);
  console.log(`  Success: ${result.success}`);
  if (result.success) {
    console.log(`  Risk Profile: ${result.data.profile.name}`);
    console.log(`  Score: ${result.data.scoring.finalScore}`);
    console.log(`  Emergency Fund Months: ${result.data.components.savings.emergencyFundMonths.toFixed(1)}`);
  } else {
    console.log(`  Error: ${result.error}`);
  }
});

console.log('\n✅ Risk Profiling Algorithm Examples Complete!');
console.log('\n🎯 Key Features Demonstrated:');
console.log('• Comprehensive risk assessment with multiple factors');
console.log('• Age-based risk capacity calculation');
console.log('• Income and savings analysis');
console.log('• Investment horizon consideration');
console.log('• Questionnaire-based risk attitude');
console.log('• Weighted scoring algorithm');
console.log('• Detailed explanations and recommendations');
console.log('• Asset allocation suggestions');
console.log('• Validation and error handling');
console.log('• Batch processing capabilities');
console.log('• Dynamic risk adjustment');
console.log('• Integration with financial goals');
console.log('• Evolution tracking over time');
console.log('• Comprehensive test coverage');
