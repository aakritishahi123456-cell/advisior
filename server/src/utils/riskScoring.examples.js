/**
 * FinSathi AI - Risk Scoring System Examples
 * Real-world examples and use cases for loan risk assessment
 */

import { 
  calculateLoanRisk, 
  quickRiskAssessment, 
  batchRiskAssessment, 
  analyzeRiskTrend 
} from './riskScoring';

/**
 * Example 1: Basic Risk Assessment
 */
export function basicRiskAssessmentExample() {
  console.log('🔍 Basic Risk Assessment Example');
  console.log('================================');
  
  const scenarios = [
    {
      name: 'Low Risk Scenario',
      params: {
        emi: 15000,
        monthlyIncome: 100000,
        loanAmount: 1000000,
        interestRate: 12,
        tenureYears: 5,
        loanType: 'HOME',
      },
    },
    {
      name: 'Moderate Risk Scenario',
      params: {
        emi: 30000,
        monthlyIncome: 100000,
        existingEMIs: 5000,
        loanAmount: 1500000,
        interestRate: 14,
        tenureYears: 7,
        loanType: 'PERSONAL',
      },
    },
    {
      name: 'High Risk Scenario',
      params: {
        emi: 45000,
        monthlyIncome: 100000,
        existingEMIs: 10000,
        loanAmount: 2000000,
        interestRate: 18,
        tenureYears: 10,
        loanType: 'BUSINESS',
      },
    },
  ];

  scenarios.forEach((scenario, index) => {
    console.log(`\n${index + 1}. ${scenario.name}:`);
    console.log(`   EMI: NPR ${scenario.params.emi.toLocaleString()}`);
    console.log(`   Monthly Income: NPR ${scenario.params.monthlyIncome.toLocaleString()}`);
    
    const result = calculateLoanRisk(scenario.params);
    
    console.log(`   Risk Level: ${result.riskLevel.level}`);
    console.log(`   Debt Burden Ratio: ${result.debtBurdenRatio}%`);
    console.log(`   Risk Score: ${result.riskScore}/100`);
    console.log(`   Explanation: ${result.riskLevel.explanation}`);
    
    if (result.recommendations.length > 0) {
      console.log(`   Recommendation: ${result.recommendations[0].title}`);
      console.log(`   Action: ${result.recommendations[0].action}`);
    }
  });

  console.log('\n');
  
  return scenarios;
}

/**
 * Example 2: Comprehensive Risk Analysis
 */
export function comprehensiveRiskAnalysisExample() {
  console.log('📊 Comprehensive Risk Analysis');
  console.log('===============================');
  
  const comprehensiveParams = {
    emi: 35000,
    monthlyIncome: 100000,
    existingEMIs: 8000,
    loanAmount: 2000000,
    interestRate: 14,
    tenureYears: 7,
    loanType: 'PERSONAL',
    creditScore: 650,
    employmentStability: 'STABLE',
    age: 30,
    dependents: 2,
    otherMonthlyExpenses: 15000,
  };

  const result = calculateLoanRisk(comprehensiveParams, {
    includeRecommendations: true,
    includeDetailedAnalysis: true,
  });

  console.log('Risk Assessment Results:');
  console.log(`========================`);
  console.log(`Risk Level: ${result.riskLevel.level} (${result.riskLevel.color})`);
  console.log(`Risk Score: ${result.riskScore}/100`);
  console.log(`Debt Burden Ratio: ${result.debtBurdenRatio}%`);
  console.log(`Total Monthly EMIs: NPR ${result.totalMonthlyEMIs.toLocaleString()}`);
  console.log(`Explanation: ${result.riskLevel.explanation}`);
  
  console.log('\nRisk Factors:');
  console.log('-------------');
  console.log(`Debt Burden Ratio: ${result.riskFactors.debtBurdenRatio.toFixed(1)}%`);
  console.log(`Existing Debt Ratio: ${result.riskFactors.existingDebtRatio.toFixed(1)}%`);
  console.log(`Credit Risk: ${result.riskFactors.creditRisk}`);
  console.log(`Employment Risk: ${result.riskFactors.employmentRisk}`);
  console.log(`Age Risk: ${result.riskFactors.ageRisk}`);
  console.log(`Dependency Risk: ${result.riskFactors.dependencyRisk}`);
  console.log(`Disposable Income: NPR ${result.riskFactors.disposableIncome.toLocaleString()}`);
  
  if (result.analysis) {
    console.log('\nDetailed Analysis:');
    console.log('----------------');
    
    console.log(`Debt Burden: ${result.analysis.debtBurdenAnalysis.description}`);
    console.log(`Cash Flow: ${result.analysis.cashFlowAnalysis.description}`);
    console.log(`Risk Score: ${result.analysis.scoreAnalysis.description}`);
    
    console.log('\nMarket Context:');
    console.log('---------------');
    console.log(`Nepali Market Average: ${result.analysis.marketContext.nepaliMarketAverage}%`);
    console.log(`Market Position: ${result.analysis.marketContext.marketPosition}`);
    console.log(`Recommendation: ${result.analysis.marketContext.recommendation}`);
  }
  
  if (result.recommendations.length > 0) {
    console.log('\nRecommendations:');
    console.log('----------------');
    result.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec.title}`);
      console.log(`   ${rec.description}`);
      console.log(`   Priority: ${rec.priority} | Action: ${rec.action}`);
    });
  }

  console.log('\n');
  
  return result;
}

/**
 * Example 3: Quick Risk Comparison
 */
export function quickRiskComparisonExample() {
  console.log('⚡ Quick Risk Comparison');
  console.log('=========================');
  
  const quickScenarios = [
    { emi: 15000, income: 100000, description: 'Home loan - Low income ratio' },
    { emi: 30000, income: 100000, description: 'Personal loan - Moderate ratio' },
    { emi: 45000, income: 100000, description: 'Business loan - High ratio' },
  ];

  console.log('Quick Risk Assessments:');
  console.log('----------------------');
  
  quickScenarios.forEach((scenario, index) => {
    const result = quickRiskAssessment(scenario.emi, scenario.income);
    
    console.log(`${index + 1}. ${scenario.description}:`);
    console.log(`   EMI: NPR ${scenario.emi.toLocaleString()}`);
    console.log(`   Income: NPR ${scenario.income.toLocaleString()}`);
    console.log(`   Risk Level: ${result.riskLevel}`);
    console.log(`   Debt Burden: ${result.debtBurdenRatio}%`);
    console.log(`   Explanation: ${result.explanation}`);
    console.log(`   Recommendation: ${result.recommendation}`);
    console.log('');
  });

  return quickScenarios;
}

/**
 * Example 4: Nepali Market Context
 */
export function nepaliMarketContextExample() {
  console.log('🇳🇵 Nepali Market Context Examples');
  console.log('==================================');
  
  const nepaliScenarios = [
    {
      name: 'Average Nepali Salaried Employee',
      params: {
        emi: 25000,
        monthlyIncome: 50000,
        loanType: 'HOME',
        loanAmount: 1500000,
        interestRate: 11,
        tenureYears: 20,
        age: 35,
        employmentStability: 'STABLE',
      },
    },
    {
      name: 'Young Professional',
      params: {
        emi: 20000,
        monthlyIncome: 80000,
        loanType: 'PERSONAL',
        loanAmount: 1000000,
        interestRate: 13,
        tenureYears: 5,
        age: 25,
        employmentStability: 'SEMI_STABLE',
      },
    },
    {
      name: 'Senior Professional',
      params: {
        emi: 15000,
        monthlyIncome: 120000,
        loanType: 'VEHICLE',
        loanAmount: 800000,
        interestRate: 15,
        tenureYears: 5,
        age: 55,
        employmentStability: 'STABLE',
      },
    },
  ];

  nepaliScenarios.forEach((scenario, index) => {
    console.log(`\n${index + 1}. ${scenario.name}:`);
    console.log(`   Monthly Income: NPR ${scenario.params.monthlyIncome.toLocaleString()}`);
    console.log(`   EMI: NPR ${scenario.params.emi.toLocaleString()}`);
    
    const result = calculateLoanRisk(scenario.params);
    
    console.log(`   Risk Level: ${result.riskLevel.level}`);
    console.log(`   Debt Burden: ${result.debtBurdenRatio}%`);
    
    if (result.analysis?.marketContext) {
      console.log(`   Market Position: ${result.analysis.marketContext.marketPosition}`);
      console.log(`   Market Recommendation: ${result.analysis.marketContext.recommendation}`);
    }
    
    // Nepali market specific insights
    const isAboveAverage = result.debtBurdenRatio > 25;
    console.log(`   ${isAboveAverage ? '⚠️' : '✅'} ${isAboveAverage ? 'Above' : 'Below'} Nepali market average (25%)`);
  });

  console.log('\n');
  
  return nepaliScenarios;
}

/**
 * Example 5: Batch Risk Assessment
 */
export function batchRiskAssessmentExample() {
  console.log('📋 Batch Risk Assessment');
  console.log('========================');
  
  const applications = [
    {
      applicant: 'John Doe',
      emi: 15000,
      monthlyIncome: 100000,
      loanType: 'HOME',
      creditScore: 750,
    },
    {
      applicant: 'Jane Smith',
      emi: 35000,
      monthlyIncome: 100000,
      loanType: 'PERSONAL',
      creditScore: 650,
    },
    {
      applicant: 'Mike Johnson',
      emi: 45000,
      monthlyIncome: 100000,
      loanType: 'BUSINESS',
      creditScore: 550,
    },
    {
      applicant: 'Sarah Williams',
      emi: 20000,
      monthlyIncome: 80000,
      loanType: 'EDUCATION',
      creditScore: 700,
    },
  ];

  const batchResult = batchRiskAssessment(applications);
  
  console.log('Batch Assessment Results:');
  console.log('------------------------');
  
  batchResult.forEach((result, index) => {
    if (result.error) {
      console.log(`${index + 1}. ${applications[index].applicant}: ERROR - ${result.error}`);
    } else {
      console.log(`${index + 1}. ${applications[index].applicant}:`);
      console.log(`   Risk Level: ${result.riskLevel.level}`);
      console.log(`   Debt Burden: ${result.debtBurdenRatio}%`);
      console.log(`   Risk Score: ${result.riskScore}/100`);
      console.log(`   Loan Type: ${applications[index].loanType}`);
      console.log(`   Credit Score: ${applications[index].creditScore}`);
    }
    console.log('');
  });

  // Summary statistics
  const validResults = batchResult.filter(r => !r.error);
  const riskLevelCounts = validResults.reduce((acc, result) => {
    acc[result.riskLevel.level] = (acc[result.riskLevel.level] || 0) + 1;
    return acc;
  }, {});

  console.log('Summary Statistics:');
  console.log('------------------');
  console.log(`Total Applications: ${applications.length}`);
  console.log(`Valid Assessments: ${validResults.length}`);
  console.log(`Low Risk: ${riskLevelCounts.LOW || 0}`);
  console.log(`Moderate Risk: ${riskLevelCounts.MODERATE || 0}`);
  console.log(`High Risk: ${riskLevelCounts.HIGH || 0}`);

  console.log('\n');
  
  return batchResult;
}

/**
 * Example 6: Risk Trend Analysis
 */
export function riskTrendAnalysisExample() {
  console.log('📈 Risk Trend Analysis');
  console.log('=====================');
  
  // Simulate historical data over 6 months
  const historicalData = [
    {
      month: 'January',
      riskLevel: { level: 'LOW' },
      debtBurdenRatio: 15,
      riskScore: 20,
      assessment: { timestamp: '2024-01-01T00:00:00Z' },
    },
    {
      month: 'February',
      riskLevel: { level: 'LOW' },
      debtBurdenRatio: 18,
      riskScore: 25,
      assessment: { timestamp: '2024-02-01T00:00:00Z' },
    },
    {
      month: 'March',
      riskLevel: { level: 'MODERATE' },
      debtBurdenRatio: 28,
      riskScore: 45,
      assessment: { timestamp: '2024-03-01T00:00:00Z' },
    },
    {
      month: 'April',
      riskLevel: { level: 'MODERATE' },
      debtBurdenRatio: 32,
      riskScore: 55,
      assessment: { timestamp: '2024-04-01T00:00:00Z' },
    },
    {
      month: 'May',
      riskLevel: { level: 'HIGH' },
      debtBurdenRatio: 40,
      riskScore: 75,
      assessment: { timestamp: '2024-05-01T00:00:00Z' },
    },
    {
      month: 'June',
      riskLevel: { level: 'HIGH' },
      debtBurdenRatio: 42,
      riskScore: 80,
      assessment: { timestamp: '2024-06-01T00:00:00Z' },
    },
  ];

  const trendResult = analyzeRiskTrend(historicalData);
  
  console.log('Historical Risk Data:');
  console.log('---------------------');
  historicalData.forEach((data, index) => {
    console.log(`${index + 1}. ${data.month}:`);
    console.log(`   Risk Level: ${data.riskLevel.level}`);
    console.log(`   Debt Burden: ${data.debtBurdenRatio}%`);
    console.log(`   Risk Score: ${data.riskScore}/100`);
  });

  console.log('\nTrend Analysis:');
  console.log('---------------');
  console.log(`Debt Burden Trend: ${trendResult.trends.debtBurdenTrend}`);
  console.log(`Risk Score Trend: ${trendResult.trends.riskScoreTrend}`);
  console.log(`Risk Level Trend: ${trendResult.trends.riskLevelTrend}`);
  
  console.log('\nSummary:');
  console.log('--------');
  console.log(`${trendResult.summary}`);
  
  console.log('\nRecommendation:');
  console.log('-------------');
  console.log(trendResult.recommendation);

  console.log('\n');
  
  return trendResult;
}

/**
 * Example 7: Different Loan Types Risk Analysis
 */
export function loanTypeRiskAnalysisExample() {
  console.log('🏦 Loan Type Risk Analysis');
  console.log('==========================');
  
  const loanTypes = [
    {
      type: 'HOME',
      params: {
        emi: 25000,
        monthlyIncome: 100000,
        loanAmount: 2000000,
        interestRate: 10.5,
        tenureYears: 20,
        loanType: 'HOME',
        age: 35,
        employmentStability: 'STABLE',
      },
    },
    {
      type: 'PERSONAL',
      params: {
        emi: 25000,
        monthlyIncome: 100000,
        loanAmount: 1000000,
        interestRate: 14,
        tenureYears: 5,
        loanType: 'PERSONAL',
        age: 30,
        employmentStability: 'SEMI_STABLE',
      },
    },
    {
      type: 'BUSINESS',
      params: {
        emi: 25000,
        monthlyIncome: 100000,
        loanAmount: 1500000,
        interestRate: 16,
        tenureYears: 7,
        loanType: 'BUSINESS',
        age: 40,
        employmentStability: 'UNSTABLE',
      },
    },
    {
      type: 'EDUCATION',
      params: {
        emi: 25000,
        monthlyIncome: 100000,
        loanAmount: 800000,
        interestRate: 8,
        tenureYears: 3,
        loanType: 'EDUCATION',
        age: 22,
        employmentStability: 'SEMI_STABLE',
      },
    },
    {
      type: 'VEHICLE',
      params: {
        emi: 25000,
        monthlyIncome: 100000,
        loanAmount: 1200000,
        interestRate: 15,
        tenureYears: 5,
        loanType: 'VEHICLE',
        age: 28,
        employmentStability: 'STABLE',
      },
    },
  ];

  console.log('Risk Analysis by Loan Type:');
  console.log('---------------------------');
  
  loanTypes.forEach((loan, index) => {
    const result = calculateLoanRisk(loan.params);
    
    console.log(`${index + 1}. ${loan.type} Loan:`);
    console.log(`   EMI: NPR ${loan.params.emi.toLocaleString()}`);
    console.log(`   Amount: NPR ${loan.params.loanAmount.toLocaleString()}`);
    console.log(`   Rate: ${loan.params.interestRate}%`);
    console.log(`   Tenure: ${loan.params.tenureYears} years`);
    console.log(`   Risk Level: ${result.riskLevel.level}`);
    console.log(`   Risk Score: ${result.riskScore}/100`);
    console.log(`   Loan Type Risk: ${result.riskFactors.loanTypeRisk?.adjustedRisk || 'UNKNOWN'}`);
    console.log('');
  });

  console.log('\n');
  
  return loanTypes;
}

/**
 * Example 8: Age-Based Risk Analysis
 */
export function ageBasedRiskAnalysisExample() {
  console.log('👤 Age-Based Risk Analysis');
  console.log('=========================');
  
  const ageGroups = [
    {
      age: 22,
      description: 'Young Professional',
      params: {
        emi: 20000,
        monthlyIncome: 60000,
        loanType: 'PERSONAL',
        age: 22,
        employmentStability: 'SEMI_STABLE',
      },
    },
    {
      age: 30,
      description: 'Prime Working Age',
      params: {
        emi: 25000,
        monthlyIncome: 100000,
        loanType: 'HOME',
        age: 30,
        employmentStability: 'STABLE',
      },
    },
    {
      age: 45,
      description: 'Mid-Career Professional',
      params: {
        emi: 30000,
        monthlyIncome: 120000,
        loanType: 'PERSONAL',
        age: 45,
        employmentStability: 'STABLE',
      },
    },
    {
      age: 60,
      description: 'Senior Professional',
      params: {
        emi: 20000,
        monthlyIncome: 80000,
        loanType: 'VEHICLE',
        age: 60,
        employmentStability: 'SEMI_STABLE',
      },
    },
  ];

  console.log('Risk Analysis by Age Group:');
  console.log('--------------------------');
  
  ageGroups.forEach((group, index) => {
    const result = calculateLoanRisk(group.params);
    
    console.log(`${index + 1}. ${group.description} (Age ${group.age}):`);
    console.log(`   Monthly Income: NPR ${group.params.monthlyIncome.toLocaleString()}`);
    console.log(`   EMI: NPR ${group.params.emi.toLocaleString()}`);
    console.log(`   Risk Level: ${result.riskLevel.level}`);
    console.log(`   Age Risk: ${result.riskFactors.ageRisk}`);
    console.log(`   Risk Score: ${result.riskScore}/100`);
    
    // Age-specific insights
    const ageInsight = getAgeRiskInsight(group.age, result.riskFactors.ageRisk);
    console.log(`   Insight: ${ageInsight}`);
    console.log('');
  });

  console.log('\n');
  
  return ageGroups;
}

/**
 * Get age-specific risk insight
 * @param {number} age - Age
 * @param {string} ageRisk - Age risk level
 * @returns {string} Insight
 */
function getAgeRiskInsight(age, ageRisk) {
  if (age < 25) {
    return ageRisk === 'HIGH' ? 'Young age with high debt burden - consider career stability' : 'Good start with manageable debt';
  } else if (age < 35) {
    return ageRisk === 'LOW' ? 'Prime age with good financial management' : 'Prime age but watch debt levels';
  } else if (age < 50) {
    return ageRisk === 'LOW' ? 'Established career with stable finances' : 'Mid-career with some financial pressure';
  } else {
    return ageRisk === 'HIGH' ? 'Near retirement with high debt - reconsider' : 'Retirement planning with manageable debt';
  }
}

/**
 * Example 9: Income Level Risk Analysis
 */
export function incomeLevelRiskAnalysisExample() {
  console.log('💰 Income Level Risk Analysis');
  console.log('===========================');
  
  const incomeLevels = [
    {
      level: 'Low Income',
      monthlyIncome: 30000,
      emi: 8000,
      description: 'Entry-level salary',
    },
    {
      level: 'Average Income',
      monthlyIncome: 50000,
      emi: 15000,
      description: 'Average Nepali salary',
    },
    {
      level: 'Good Income',
      monthlyIncome: 100000,
      emi: 25000,
      description: 'Professional salary',
    },
    {
      level: 'High Income',
      monthlyIncome: 200000,
      emi: 40000,
      description: 'Senior professional salary',
    },
  ];

  console.log('Risk Analysis by Income Level:');
  console.log('-----------------------------');
  
  incomeLevels.forEach((level, index) => {
    const result = calculateLoanRisk({
      emi: level.emi,
      monthlyIncome: level.monthlyIncome,
      loanType: 'PERSONAL',
    });
    
    console.log(`${index + 1}. ${level.level} (${level.description}):`);
    console.log(`   Monthly Income: NPR ${level.monthlyIncome.toLocaleString()}`);
    console.log(`   EMI: NPR ${level.emi.toLocaleString()}`);
    console.log(`   Debt Burden: ${result.debtBurdenRatio}%`);
    console.log(`   Risk Level: ${result.riskLevel.level}`);
    console.log(`   Disposable Income: NPR ${result.riskFactors.disposableIncome.toLocaleString()}`);
    
    // Income-specific insights
    const incomeInsight = getIncomeInsight(level.monthlyIncome, result.debtBurdenRatio);
    console.log(`   Insight: ${incomeInsight}`);
    console.log('');
  });

  console.log('\n');
  
  return incomeLevels;
}

/**
 * Get income-specific insight
 * @param {number} income - Monthly income
 * @param {number} debtBurden - Debt burden ratio
 * @returns {string} Insight
 */
function getIncomeInsight(income, debtBurden) {
  if (income < 40000) {
    return debtBurden > 20 ? 'Low income with high debt burden - high risk' : 'Low income with manageable debt';
  } else if (income < 80000) {
    return debtBurden > 25 ? 'Average income with moderate debt burden' : 'Average income with good debt management';
  } else if (income < 150000) {
    return debtBurden > 30 ? 'Good income but high debt levels' : 'Good income with reasonable debt';
  } else {
    return debtBurden > 35 ? 'High income but excessive debt' : 'High income with manageable debt';
  }
}

/**
 * Example 10: Comprehensive Risk Report
 */
export function comprehensiveRiskReportExample() {
  console.log('📊 Comprehensive Risk Report');
  console.log('==========================');
  
  const reportParams = {
    emi: 35000,
    monthlyIncome: 100000,
    existingEMIs: 8000,
    loanAmount: 2500000,
    interestRate: 13.5,
    tenureYears: 8,
    loanType: 'HOME',
    creditScore: 680,
    employmentStability: 'STABLE',
    age: 32,
    dependents: 2,
    otherMonthlyExpenses: 18000,
  };

  const result = calculateLoanRisk(reportParams, {
    includeRecommendations: true,
    includeDetailedAnalysis: true,
  });

  console.log('COMPREHENSIVE RISK ASSESSMENT REPORT');
  console.log('=====================================');
  console.log(`Assessment Date: ${new Date().toLocaleDateString()}`);
  console.log(`Applicant Profile: ${reportParams.age} years old, ${reportParams.loanType} loan`);
  console.log('');

  // Executive Summary
  console.log('EXECUTIVE SUMMARY');
  console.log('------------------');
  console.log(`Risk Level: ${result.riskLevel.level} (${result.riskLevel.color})`);
  console.log(`Risk Score: ${result.riskScore}/100`);
  console.log(`Debt Burden Ratio: ${result.debtBurdenRatio}%`);
  console.log(`Total Monthly EMIs: NPR ${result.totalMonthlyEMIs.toLocaleString()}`);
  console.log(`Monthly Income: NPR ${reportParams.monthlyIncome.toLocaleString()}`);
  console.log(`Disposable Income: NPR ${result.riskFactors.disposableIncome.toLocaleString()}`);
  console.log(`Primary Recommendation: ${result.recommendations[0]?.title || 'N/A'}`);
  console.log('');

  // Detailed Analysis
  console.log('DETAILED ANALYSIS');
  console.log('-----------------');
  
  if (result.analysis) {
    console.log('Debt Burden Analysis:');
    console.log(`- Category: ${result.analysis.debtBurdenAnalysis.category}`);
    console.log(`- Description: ${result.analysis.debtBurdenAnalysis.description}`);
    console.log('');
    
    console.log('Cash Flow Analysis:');
    console.log(`- Disposable Income: NPR ${result.analysis.cashFlowAnalysis.disposableIncome.toLocaleString()}`);
    console.log(`- Disposable Ratio: ${result.analysis.cashFlowAnalysis.disposableRatio.toFixed(1)}%`);
    console.log(`- Description: ${result.analysis.cashFlowAnalysis.description}`);
    console.log('');
    
    console.log('Risk Factor Analysis:');
    console.log(`- Primary Factors: ${result.analysis.riskFactorAnalysis.primaryFactors.join(', ') || 'None'}`);
    console.log(`- Secondary Factors: ${result.analysis.riskFactorAnalysis.secondaryFactors.join(', ') || 'None'}`);
    console.log(`- Mitigating Factors: ${result.analysis.riskFactorAnalysis.mitigatingFactors.join(', ') || 'None'}`);
    console.log('');
    
    console.log('Score Analysis:');
    console.log(`- Category: ${result.analysis.scoreAnalysis.category}`);
    console.log(`- Description: ${result.analysis.scoreAnalysis.description}`);
    console.log('');
    
    console.log('Market Context:');
    console.log(`- Nepali Market Average: ${result.analysis.marketContext.nepaliMarketAverage}%`);
    console.log(`- Market Position: ${result.analysis.marketContext.marketPosition}`);
    console.log(`- Recommendation: ${result.analysis.marketContext.recommendation}`);
  }

  // Risk Factors Breakdown
  console.log('RISK FACTORS BREAKDOWN');
  console.log('----------------------');
  console.log(`Debt Burden Ratio: ${result.riskFactors.debtBurdenRatio.toFixed(1)}%`);
  console.log(`Existing Debt Ratio: ${result.riskFactors.existingDebtRatio.toFixed(1)}%`);
  console.log(`Loan-to-Income Ratio: ${result.riskFactors.loanToIncomeRatio.toFixed(1)}`);
  console.log(`Interest Burden: ${result.riskFactors.interestBurden}%`);
  console.log(`Tenure Risk: ${result.riskFactors.tenureRisk}`);
  console.log(`Credit Risk: ${result.riskFactors.creditRisk}`);
  console.log(`Employment Risk: ${result.riskFactors.employmentRisk}`);
  console.log(`Age Risk: ${result.riskFactors.ageRisk}`);
  console.log(`Dependency Risk: ${result.riskFactors.dependencyRisk}`);
  console.log(`Expense Ratio: ${result.riskFactors.expenseRatio.toFixed(1)}%`);
  console.log(`Overall Risk Score: ${result.riskFactors.overallRiskScore}/100`);
  console.log('');

  // Recommendations
  console.log('RECOMMENDATIONS');
  console.log('---------------');
  result.recommendations.forEach((rec, index) => {
    console.log(`${index + 1}. ${rec.title}`);
    console.log(`   Type: ${rec.type}`);
    console.log(`   Priority: ${rec.priority}`);
    console.log(`   Action: ${rec.action}`);
    console.log(`   Description: ${rec.description}`);
    console.log('');
  });

  // Risk Mitigation Strategies
  console.log('RISK MITIGATION STRATEGIES');
  console.log('-------------------------');
  const strategies = generateRiskMitigationStrategies(result);
  strategies.forEach((strategy, index) => {
    console.log(`${index + 1}. ${strategy}`);
  });

  console.log('\n');
  
  return result;
}

/**
 * Generate risk mitigation strategies
 * @param {Object} riskResult - Risk assessment result
 * @returns {Array} Mitigation strategies
 */
function generateRiskMitigationStrategies(riskResult) {
  const strategies = [];

  if (riskResult.riskLevel.level === 'HIGH') {
    strategies.push('Reduce loan amount or increase down payment');
    strategies.push('Extend loan tenure to reduce monthly payments');
    strategies.push('Improve credit score before applying');
    strategies.push('Increase monthly income through additional sources');
  } else if (riskResult.riskLevel.level === 'MODERATE') {
    strategies.push('Build emergency fund before taking loan');
    strategies.push('Consider debt consolidation for existing loans');
    strategies.push('Reduce other monthly expenses');
    strategies.push('Monitor debt-to-income ratio regularly');
  } else {
    strategies.push('Maintain current debt management practices');
    strategies.push('Consider investment opportunities with surplus income');
    strategies.push('Regularly review and optimize loan terms');
  }

  return strategies;
}

/**
 * Run all examples
 */
export function runAllExamples() {
  console.log('🏦 FinSathi AI - Risk Scoring System Examples');
  console.log('==========================================');
  console.log('Real-world examples for loan risk assessment');
  console.log('');
  
  basicRiskAssessmentExample();
  comprehensiveRiskAnalysisExample();
  quickRiskComparisonExample();
  nepaliMarketContextExample();
  batchRiskAssessmentExample();
  riskTrendAnalysisExample();
  loanTypeRiskAnalysisExample();
  ageBasedRiskAnalysisExample();
  incomeLevelRiskAnalysisExample();
  comprehensiveRiskReportExample();
  
  console.log('📊 Examples completed! Use these as reference for risk assessment.');
}

// Export all example functions
export {
  basicRiskAssessmentExample,
  comprehensiveRiskAnalysisExample,
  quickRiskComparisonExample,
  nepaliMarketContextExample,
  batchRiskAssessmentExample,
  riskTrendAnalysisExample,
  loanTypeRiskAnalysisExample,
  ageBasedRiskAnalysisExample,
  incomeLevelRiskAnalysisExample,
  comprehensiveRiskReportExample,
};

// Auto-run examples if this file is executed directly
if (typeof window === 'undefined' && typeof process !== 'undefined' && process.argv) {
  runAllExamples();
}
