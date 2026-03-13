/**
 * FinSathi AI - Stock Selection Engine Examples
 * Practical examples and usage demonstrations
 */

const { 
  selectTopCompanies, 
  getCompanyRanking,
  FINANCIAL_THRESHOLDS,
  DEFAULT_WEIGHTS,
  NEPSE_SECTORS
} = require('./stockSelectionEngine');

console.log('🎯 FinSathi AI - Stock Selection Engine Examples\n');

// Example 1: Basic Top 10 Companies Selection
console.log('📊 Example 1: Basic Top 10 Companies Selection');
console.log('=' .repeat(60));

const basicSelection = selectTopCompanies();
console.log('Basic Selection Result:');
console.log(JSON.stringify(basicSelection, null, 2));

console.log('\nKey Insights:');
console.log(`• Total Companies Analyzed: ${basicSelection.data.statistics.totalCompanies}`);
console.log(`• Companies Meeting Criteria: ${basicSelection.data.statistics.filteredCompanies}`);
console.log(`• Top Companies Selected: ${basicSelection.data.statistics.selectedCompanies}`);
console.log(`• Average ROE: ${basicSelection.data.statistics.averageROE}%`);
console.log(`• Average Debt Ratio: ${basicSelection.data.statistics.averageDebtRatio}`);
console.log(`• Average Revenue Growth: ${basicSelection.data.statistics.averageRevenueGrowth}%`);
console.log(`• Average Health Score: ${basicSelection.data.statistics.averageHealthScore}`);

// Example 2: Conservative Investment Criteria
console.log('\n📊 Example 2: Conservative Investment Criteria');
console.log('=' .repeat(60));

const conservativeSelection = selectTopCompanies({
  limit: 8,
  minROE: 15,        // Higher ROE requirement
  maxDebtRatio: 1.0,  // Lower debt tolerance
  minRevenueGrowth: 5, // Minimum growth requirement
  minHealthScore: 70,  // Higher health score requirement
});

console.log('Conservative Selection Result:');
console.log(JSON.stringify(conservativeSelection, null, 2));

console.log('\nConservative Portfolio Analysis:');
console.log(`• Risk Level: ${conservativeSelection.data.analysis.riskProfile.riskLevel}`);
console.log(`• Expected Return: ${conservativeSelection.data.analysis.performance.expectedReturn}%`);
console.log(`• Portfolio Quality: ${conservativeSelection.data.analysis.quality.overallGrade}`);
console.log(`• Diversification Score: ${conservativeSelection.data.analysis.diversification.diversificationScore}`);

// Example 3: Growth-Oriented Selection
console.log('\n📊 Example 3: Growth-Oriented Selection');
console.log('=' .repeat(60));

const growthSelection = selectTopCompanies({
  limit: 10,
  minROE: 12,        // Moderate ROE
  maxDebtRatio: 2.0,  // Higher debt tolerance for growth
  minRevenueGrowth: 15, // Higher growth requirement
  minHealthScore: 60,  // Moderate health score
  sortBy: 'revenueGrowth',
  sortOrder: 'desc',
});

console.log('Growth Selection Result:');
console.log(JSON.stringify(growthSelection, null, 2));

console.log('\nGrowth Portfolio Insights:');
console.log(`• Top Growth Company: ${growthSelection.data.companies[0].name}`);
console.log(`• Highest Revenue Growth: ${growthSelection.data.companies[0].metrics.revenueGrowth}%`);
console.log(`• Portfolio Growth Potential: ${growthSelection.data.analysis.performance.growthPotential}%`);

// Example 4: Sector-Specific Selection (Banking)
console.log('\n📊 Example 4: Sector-Specific Selection (Banking)');
console.log('=' .repeat(60));

const bankingSelection = selectTopCompanies({
  limit: 5,
  sector: 'Banking',
  minROE: 10,
  maxDebtRatio: 1.5,
  minRevenueGrowth: 5,
  minHealthScore: 65,
});

console.log('Banking Sector Selection Result:');
console.log(JSON.stringify(bankingSelection, null, 2));

console.log('\nBanking Sector Analysis:');
console.log(`• Banks Meeting Criteria: ${bankingSelection.data.companies.length}`);
if (bankingSelection.data.companies.length > 0) {
  console.log(`• Top Bank: ${bankingSelection.data.companies[0].name}`);
  console.log(`• Top Bank ROE: ${bankingSelection.data.companies[0].metrics.roe}%`);
  console.log(`• Top Bank Health Score: ${bankingSelection.data.companies[0].metrics.healthScore}`);
}

// Example 5: Custom Weighting for Value Investing
console.log('\n📊 Example 5: Custom Weighting for Value Investing');
console.log('=' .repeat(60));

const valueWeights = {
  roe: 0.20,           // Lower weight for ROE
  debtRatio: 0.40,     // Higher weight for debt ratio (financial stability)
  revenueGrowth: 0.15,  // Lower weight for growth
  healthScore: 0.25,   // Higher weight for health score
};

const valueSelection = selectTopCompanies({
  limit: 8,
  weights: valueWeights,
  sortBy: 'score',
  sortOrder: 'desc',
});

console.log('Value Investing Selection Result:');
console.log(JSON.stringify(valueSelection, null, 2));

console.log('\nValue Portfolio Characteristics:');
console.log(`• Average Debt Ratio: ${valueSelection.data.statistics.averageDebtRatio} (Lower is better)`);
console.log(`• Average Health Score: ${valueSelection.data.statistics.averageHealthScore} (Higher is better)`);
console.log(`• Risk Profile: ${valueSelection.data.analysis.riskProfile.riskLevel}`);

// Example 6: Market Cap Filtered Selection
console.log('\n📊 Example 6: Market Cap Filtered Selection');
console.log('=' .repeat(60));

const largeCapSelection = selectTopCompanies({
  limit: 10,
  marketCapMin: 100000000000, // NPR 100 crore minimum
  minROE: 10,
  maxDebtRatio: 2.0,
  minRevenueGrowth: 0,
  minHealthScore: 60,
});

console.log('Large Cap Selection Result:');
console.log(JSON.stringify(largeCapSelection, null, 2));

console.log('\nLarge Cap Portfolio:');
console.log(`• Large Cap Companies: ${largeCapSelection.data.companies.length}`);
largeCapSelection.data.companies.forEach((company, index) => {
  console.log(`${index + 1}. ${company.name} - Market Cap: NPR ${(company.marketCap / 100000000).toFixed(2)} crore`);
});

// Example 7: Individual Company Analysis
console.log('\n📊 Example 7: Individual Company Analysis');
console.log('=' .repeat(60));

const companyAnalysis = getCompanyRanking('NABIL');
console.log('NABIL Bank Analysis Result:');
console.log(JSON.stringify(companyAnalysis, null, 2));

if (companyAnalysis.success) {
  console.log('\nNABIL Bank Detailed Analysis:');
  console.log(`• Overall Grade: ${companyAnalysis.data.grade}`);
  console.log(`• Ranking: ${companyAnalysis.data.ranking}/${companyAnalysis.data.totalCompanies}`);
  console.log(`• Percentile: ${companyAnalysis.data.percentile}%`);
  console.log(`• Investment Suitability: ${companyAnalysis.data.assessment.investmentSuitability}`);
  console.log(`• Risk Level: ${companyAnalysis.data.assessment.riskLevel}`);
  
  console.log('\nFinancial Metrics:');
  console.log(`• ROE: ${companyAnalysis.data.metrics.roe}%`);
  console.log(`• Debt Ratio: ${companyAnalysis.data.metrics.debtRatio}`);
  console.log(`• Revenue Growth: ${companyAnalysis.data.metrics.revenueGrowth}%`);
  console.log(`• Health Score: ${companyAnalysis.data.metrics.healthScore}`);
  console.log(`• Current Ratio: ${companyAnalysis.data.metrics.currentRatio}`);
  console.log(`• Net Margin: ${companyAnalysis.data.metrics.netMargin}%`);
  
  console.log('\nStrengths:');
  companyAnalysis.data.assessment.strengths.forEach(strength => {
    console.log(`• ${strength}`);
  });
  
  console.log('\nWeaknesses:');
  companyAnalysis.data.assessment.weaknesses.forEach(weakness => {
    console.log(`• ${weakness}`);
  });
  
  console.log(`\nRecommendation: ${companyAnalysis.data.assessment.recommendation}`);
}

// Example 8: Multiple Company Comparison
console.log('\n📊 Example 8: Multiple Company Comparison');
console.log('=' .repeat(60));

const comparisonSymbols = ['NABIL', 'NICA', 'SCB', 'EBL'];
console.log('Banking Sector Comparison:');

comparisonSymbols.forEach(symbol => {
  const analysis = getCompanyRanking(symbol);
  if (analysis.success) {
    console.log(`\n${symbol}:`);
    console.log(`  Name: ${analysis.data.company.name}`);
    console.log(`  Grade: ${analysis.data.grade}`);
    console.log(`  Ranking: ${analysis.data.ranking}/${analysis.data.totalCompanies}`);
    console.log(`  Score: ${analysis.data.score}`);
    console.log(`  ROE: ${analysis.data.metrics.roe}%`);
    console.log(`  Debt Ratio: ${analysis.data.metrics.debtRatio}`);
    console.log(`  Health Score: ${analysis.data.metrics.healthScore}`);
    console.log(`  Suitability: ${analysis.data.assessment.investmentSuitability}`);
  }
});

// Example 9: Portfolio Diversification Analysis
console.log('\n📊 Example 9: Portfolio Diversification Analysis');
console.log('=' .repeat(60));

const diversifiedSelection = selectTopCompanies({
  limit: 12,
  minROE: 10,
  maxDebtRatio: 2.0,
  minRevenueGrowth: 0,
  minHealthScore: 60,
});

console.log('Diversification Analysis:');
console.log(JSON.stringify(diversifiedSelection.data.analysis.diversification, null, 2));

console.log('\nSector Distribution:');
Object.entries(diversifiedSelection.data.analysis.sectorDistribution.percentages).forEach(([sector, percentage]) => {
  console.log(`• ${sector}: ${percentage}%`);
});

console.log(`\nDiversification Recommendation: ${diversifiedSelection.data.analysis.diversification.recommendation}`);

// Example 10: Risk Assessment
console.log('\n📊 Example 10: Risk Assessment');
console.log('=' .repeat(60));

const riskAnalysis = diversifiedSelection.data.analysis.riskProfile;
console.log('Portfolio Risk Assessment:');
console.log(`• Risk Level: ${riskAnalysis.riskLevel}`);
console.log(`• Average Debt Ratio: ${riskAnalysis.avgDebtRatio}`);
console.log(`• Average ROE: ${riskAnalysis.avgROE}%`);
console.log(`• Average Health Score: ${riskAnalysis.avgHealthScore}`);
console.log(`• Risk Score: ${riskAnalysis.riskScore}/100`);

// Example 11: Investment Recommendations
console.log('\n📊 Example 11: Investment Recommendations');
console.log('=' .repeat(60));

const recommendations = diversifiedSelection.data.recommendations;
console.log('Investment Recommendations:');

recommendations.forEach((rec, index) => {
  console.log(`\n${index + 1}. ${rec.title} (${rec.priority})`);
  console.log(`   Type: ${rec.type}`);
  console.log(`   Description: ${rec.description}`);
  console.log(`   Reasoning: ${rec.reasoning}`);
  if (rec.company) {
    console.log(`   Company: ${rec.company}`);
  }
});

// Example 12: Performance Estimation
console.log('\n📊 Example 12: Performance Estimation');
console.log('=' .repeat(60));

const performance = diversifiedSelection.data.analysis.performance;
console.log('Portfolio Performance Estimate:');
console.log(`• Expected Return: ${performance.expectedReturn}%`);
console.log(`• Confidence Level: ${performance.confidence * 100}%`);
console.log(`• Quality Score: ${performance.qualityScore}`);
console.log(`• Growth Potential: ${performance.growthPotential}%`);

// Example 13: Quality Assessment
console.log('\n📊 Example 13: Quality Assessment');
console.log('=' .repeat(60));

const quality = diversifiedSelection.data.analysis.quality;
console.log('Portfolio Quality Assessment:');
console.log(`• Overall Grade: ${quality.overallGrade}`);
console.log(`• Quality Score: ${quality.qualityScore}`);
console.log(`• High Quality Stocks: ${quality.highQualityStocks}`);

console.log('\nGrade Distribution:');
Object.entries(quality.gradeDistribution).forEach(([grade, count]) => {
  console.log(`• Grade ${grade}: ${count} companies`);
});

// Example 14: Custom Scenarios
console.log('\n📊 Example 14: Custom Scenarios');
console.log('=' .repeat(60));

const scenarios = [
  {
    name: 'Ultra-Conservative',
    options: {
      limit: 5,
      minROE: 20,
      maxDebtRatio: 0.8,
      minRevenueGrowth: 10,
      minHealthScore: 80,
    },
  },
  {
    name: 'Balanced',
    options: {
      limit: 8,
      minROE: 12,
      maxDebtRatio: 1.5,
      minRevenueGrowth: 8,
      minHealthScore: 65,
    },
  },
  {
    name: 'Aggressive Growth',
    options: {
      limit: 10,
      minROE: 8,
      maxDebtRatio: 2.5,
      minRevenueGrowth: 20,
      minHealthScore: 50,
    },
  },
];

console.log('Scenario Analysis:');
scenarios.forEach(scenario => {
  const result = selectTopCompanies(scenario.options);
  console.log(`\n${scenario.name}:`);
  console.log(`  Companies Selected: ${result.data.statistics.selectedCompanies}`);
  console.log(`  Average ROE: ${result.data.statistics.averageROE}%`);
  console.log(`  Average Debt Ratio: ${result.data.statistics.averageDebtRatio}`);
  console.log(`  Risk Level: ${result.data.analysis.riskProfile.riskLevel}`);
  console.log(`  Expected Return: ${result.data.analysis.performance.expectedReturn}%`);
});

// Example 15: Threshold Analysis
console.log('\n📊 Example 15: Threshold Analysis');
console.log('=' .repeat(60));

console.log('Financial Quality Thresholds:');
console.log('\nROE Thresholds:');
Object.entries(FINANCIAL_THRESHOLDS.ROE).forEach(([level, threshold]) => {
  console.log(`  ${level}: >${threshold}%`);
});

console.log('\nDebt Ratio Thresholds:');
Object.entries(FINANCIAL_THRESHOLDS.DEBT_RATIO).forEach(([level, threshold]) => {
  console.log(`  ${level}: <${threshold}`);
});

console.log('\nRevenue Growth Thresholds:');
Object.entries(FINANCIAL_THRESHOLDS.REVENUE_GROWTH).forEach(([level, threshold]) => {
  console.log(`  ${level}: >${threshold}%`);
});

console.log('\nHealth Score Thresholds:');
Object.entries(FINANCIAL_THRESHOLDS.HEALTH_SCORE).forEach(([level, threshold]) => {
  console.log(`  ${level}: ${threshold}+`);
});

// Example 16: Weight Analysis
console.log('\n📊 Example 16: Weight Analysis');
console.log('=' .repeat(60));

console.log('Default Scoring Weights:');
Object.entries(DEFAULT_WEIGHTS).forEach(([metric, weight]) => {
  console.log(`  ${metric}: ${(weight * 100).toFixed(0)}%`);
});

console.log('\nCustom Weight Examples:');

const weightExamples = [
  {
    name: 'Growth Focus',
    weights: { roe: 0.25, debtRatio: 0.15, revenueGrowth: 0.40, healthScore: 0.20 },
  },
  {
    name: 'Value Focus',
    weights: { roe: 0.20, debtRatio: 0.40, revenueGrowth: 0.15, healthScore: 0.25 },
  },
  {
    name: 'Quality Focus',
    weights: { roe: 0.25, debtRatio: 0.25, revenueGrowth: 0.20, healthScore: 0.30 },
  },
];

weightExamples.forEach(example => {
  console.log(`\n${example.name}:`);
  Object.entries(example.weights).forEach(([metric, weight]) => {
    console.log(`  ${metric}: ${(weight * 100).toFixed(0)}%`);
  });
});

// Example 17: NEPSE Sector Analysis
console.log('\n📊 Example 17: NEPSE Sector Analysis');
console.log('=' .repeat(60));

console.log('NEPSE Sector Classifications:');
Object.entries(NEPSE_SECTORS).forEach(([key, sector]) => {
  console.log(`  ${key}: ${sector}`);
});

console.log('\nSector-wise Top Companies:');
Object.values(NEPSE_SECTORS).forEach(sector => {
  const sectorResult = selectTopCompanies({
    limit: 3,
    sector,
    minROE: 8,
    maxDebtRatio: 2.0,
    minRevenueGrowth: 0,
    minHealthScore: 55,
  });
  
  if (sectorResult.data.companies.length > 0) {
    console.log(`\n${sector}:`);
    sectorResult.data.companies.forEach((company, index) => {
      console.log(`  ${index + 1}. ${company.name} (${company.symbol}) - Score: ${company.score}`);
    });
  }
});

// Example 18: Error Handling
console.log('\n📊 Example 18: Error Handling');
console.log('=' .repeat(60));

// Test invalid company symbol
const invalidCompany = getCompanyRanking('INVALID');
console.log('Invalid Company Symbol:');
console.log(JSON.stringify(invalidCompany, null, 2));

// Test invalid criteria
const invalidCriteria = selectTopCompanies({
  minROE: 50,  // Unrealistically high
  maxDebtRatio: 0.1,  // Unrealistically low
});
console.log('\nInvalid Criteria Result:');
console.log(JSON.stringify(invalidCriteria, null, 2));

// Example 19: Performance Comparison
console.log('\n📊 Example 19: Performance Comparison');
console.log('=' .repeat(60));

const comparisonCriteria = [
  { name: 'Conservative', minROE: 15, maxDebtRatio: 1.0, minRevenueGrowth: 5, minHealthScore: 70 },
  { name: 'Moderate', minROE: 12, maxDebtRatio: 1.5, minRevenueGrowth: 8, minHealthScore: 65 },
  { name: 'Aggressive', minROE: 10, maxDebtRatio: 2.0, minRevenueGrowth: 15, minHealthScore: 60 },
];

console.log('Performance Comparison:');
comparisonCriteria.forEach(criteria => {
  const result = selectTopCompanies(criteria);
  console.log(`\n${criteria.name} Strategy:`);
  console.log(`  Companies: ${result.data.statistics.selectedCompanies}`);
  console.log(`  Expected Return: ${result.data.analysis.performance.expectedReturn}%`);
  console.log(`  Risk Level: ${result.data.analysis.riskProfile.riskLevel}`);
  console.log(`  Quality Grade: ${result.data.analysis.quality.overallGrade}`);
  console.log(`  Diversification: ${result.data.analysis.diversification.diversificationScore}`);
});

console.log('\n✅ Stock Selection Engine Examples Complete!');
console.log('\n🎯 Key Features Demonstrated:');
console.log('• Multi-factor financial quality scoring');
console.log('• Customizable selection criteria');
console.log('• Sector-specific analysis');
console.log('• Individual company ranking');
console.log('• Portfolio diversification analysis');
console.log('• Risk assessment and management');
console.log('• Performance estimation');
console.log('• Quality grading system');
console.log('• Investment recommendations');
console.log('• NEPSE sector integration');
console.log('• Custom weighting schemes');
console.log('• Error handling and validation');
console.log('• Comprehensive financial metrics');
console.log('• Production-ready implementation');
