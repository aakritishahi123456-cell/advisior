/**
 * FinSathi AI - Risk Scoring System (CommonJS Version)
 * Comprehensive loan risk assessment engine
 */

/**
 * Calculate loan risk assessment
 */
function calculateLoanRisk(params, options = {}) {
  const {
    emi,
    monthlyIncome,
    existingEMIs = 0,
    loanAmount,
    interestRate,
    tenureYears,
    creditScore,
    age,
    employmentStability,
    dependents = 0,
    otherMonthlyExpenses = 0,
    loanType,
  } = params;

  // Input validation
  if (typeof emi !== 'number' || emi <= 0) {
    throw new Error('EMI must be a positive number');
  }

  if (typeof monthlyIncome !== 'number' || monthlyIncome <= 0) {
    throw new Error('Monthly income must be a positive number');
  }

  if (emi > monthlyIncome) {
    throw new Error('EMI cannot exceed monthly income');
  }

  if (monthlyIncome < 10000) {
    throw new Error('Monthly income seems too low for Nepali market context');
  }

  if (emi > monthlyIncome * 0.7) {
    throw new Error('EMI seems unusually high relative to income');
  }

  // Calculate debt burden ratio
  const totalMonthlyEMIs = emi + existingEMIs;
  const debtBurdenRatio = (totalMonthlyEMIs / monthlyIncome) * 100;

  // Determine base risk level
  let riskLevel;
  if (debtBurdenRatio < 20) {
    riskLevel = {
      level: 'LOW',
      color: 'GREEN',
      priority: 'LOW',
      description: 'Low risk: Debt burden within safe limits',
    };
  } else if (debtBurdenRatio <= 35) {
    riskLevel = {
      level: 'MODERATE',
      color: 'YELLOW',
      priority: 'MEDIUM',
      description: 'Moderate risk: Debt burden requires monitoring',
    };
  } else {
    riskLevel = {
      level: 'HIGH',
      color: 'RED',
      priority: 'HIGH',
      description: 'High risk: Debt burden exceeds recommended limits',
    };
  }

  // Calculate risk factors
  const riskFactors = calculateRiskFactors({
    emi,
    monthlyIncome,
    existingEMIs,
    loanAmount,
    interestRate,
    tenureYears,
    creditScore,
    age,
    employmentStability,
    dependents,
    otherMonthlyExpenses,
    loanType,
  });

  // Calculate risk score
  const riskScore = calculateRiskScore(debtBurdenRatio, riskFactors);

  // Adjust risk level based on other factors
  const adjustingFactors = [];
  let adjustedRiskLevel = { ...riskLevel };

  if (creditScore && creditScore < 600) {
    adjustingFactors.push('Poor credit history');
    if (riskLevel.level === 'LOW') adjustedRiskLevel.level = 'MODERATE';
    if (riskLevel.level === 'MODERATE') adjustedRiskLevel.level = 'HIGH';
  }

  if (employmentStability === 'UNSTABLE') {
    adjustingFactors.push('Unstable employment');
    if (riskLevel.level === 'LOW') adjustedRiskLevel.level = 'MODERATE';
    if (riskLevel.level === 'MODERATE') adjustedRiskLevel.level = 'HIGH';
  }

  if (dependents > 4) {
    adjustingFactors.push('High dependency burden');
    if (riskLevel.level === 'LOW') adjustedRiskLevel.level = 'MODERATE';
    if (riskLevel.level === 'MODERATE') adjustedRiskLevel.level = 'HIGH';
  }

  if (loanType && interestRate && tenureYears) {
    const loanTypeRisk = assessLoanTypeRisk(loanType, interestRate, tenureYears);
    if (loanTypeRisk === 'HIGH' && riskLevel.level === 'LOW') {
      adjustingFactors.push('High-risk loan type');
      adjustedRiskLevel.level = 'MODERATE';
    }
  }

  adjustedRiskLevel.adjustingFactors = adjustingFactors;

  // Generate detailed analysis if requested
  let analysis = null;
  if (options.includeDetailedAnalysis) {
    analysis = generateDetailedAnalysis(debtBurdenRatio, riskFactors, riskScore);
  }

  // Generate recommendations if requested
  let recommendations = null;
  if (options.includeRecommendations) {
    recommendations = generateRecommendations(adjustedRiskLevel, debtBurdenRatio, riskFactors);
  }

  return {
    riskLevel: adjustedRiskLevel,
    riskScore,
    debtBurdenRatio,
    totalMonthlyEMIs,
    riskFactors,
    analysis,
    recommendations,
    assessment: {
      timestamp: new Date().toISOString(),
      currency: options.currency || 'NPR',
      locale: options.locale || 'ne-NP',
    },
  };
}

/**
 * Quick risk assessment
 */
function quickRiskAssessment(emi, monthlyIncome) {
  const debtBurdenRatio = (emi / monthlyIncome) * 100;
  
  let riskLevel, explanation, recommendation;

  if (debtBurdenRatio < 20) {
    riskLevel = 'LOW';
    explanation = `Low risk: Debt burden ratio is ${debtBurdenRatio.toFixed(1)}%, which is within safe limits`;
    recommendation = 'Proceed with confidence - debt burden is manageable';
  } else if (debtBurdenRatio <= 35) {
    riskLevel = 'MODERATE';
    explanation = `Moderate risk: Debt burden ratio is ${debtBurdenRatio.toFixed(1)}%, which requires monitoring`;
    recommendation = 'Proceed with caution - ensure adequate emergency funds';
  } else {
    riskLevel = 'HIGH';
    explanation = `High risk: Debt burden ratio is ${debtBurdenRatio.toFixed(1)}%, which exceeds recommended limits`;
    recommendation = 'Reconsider loan amount or increase income';
  }

  return {
    riskLevel,
    debtBurdenRatio,
    explanation,
    recommendation,
  };
}

/**
 * Batch risk assessment
 */
function batchRiskAssessment(applications) {
  if (!Array.isArray(applications)) {
    throw new Error('Loan applications must be an array');
  }

  if (applications.length === 0) {
    throw new Error('At least one loan application is required');
  }

  if (applications.length > 10) {
    throw new Error('Maximum 10 loan applications can be assessed at once');
  }

  const results = applications.map((app, index) => {
    try {
      const result = calculateLoanRisk(app);
      return {
        applicationIndex: index,
        ...result,
        status: 'SUCCESS',
      };
    } catch (error) {
      return {
        applicationIndex: index,
        error: error.message,
        riskLevel: 'ERROR',
        status: 'FAILED',
      };
    }
  });

  return results;
}

/**
 * Analyze risk trend
 */
function analyzeRiskTrend(historicalData) {
  if (!Array.isArray(historicalData)) {
    throw new Error('Historical data must be an array');
  }

  if (historicalData.length < 2) {
    throw new Error('At least 2 historical assessments are required for trend analysis');
  }

  // Sort by timestamp
  const sortedData = [...historicalData].sort((a, b) => 
    new Date(a.assessment?.timestamp || 0) - new Date(b.assessment?.timestamp || 0)
  );

  // Calculate trends
  const debtBurdenTrend = calculateTrend(sortedData.map(d => d.debtBurdenRatio));
  const riskScoreTrend = calculateTrend(sortedData.map(d => d.riskScore));
  const riskLevelTrend = calculateRiskLevelTrend(sortedData.map(d => d.riskLevel?.level));

  // Generate summary and recommendation
  const summary = generateTrendSummary(debtBurdenTrend, riskScoreTrend, riskLevelTrend);
  const recommendation = generateTrendRecommendation(riskLevelTrend);

  return {
    trends: {
      debtBurdenTrend,
      riskScoreTrend,
      riskLevelTrend,
    },
    summary,
    recommendation,
    analysisDate: new Date().toISOString(),
  };
}

// Helper functions
function calculateRiskFactors(params) {
  const {
    emi,
    monthlyIncome,
    existingEMIs,
    loanAmount,
    interestRate,
    tenureYears,
    creditScore,
    age,
    employmentStability,
    dependents,
    otherMonthlyExpenses,
    loanType,
  } = params;

  const debtBurdenRatio = ((emi + existingEMIs) / monthlyIncome) * 100;
  const existingDebtRatio = (existingEMIs / monthlyIncome) * 100;
  const loanToIncomeRatio = loanAmount ? (loanAmount / (monthlyIncome * 12)) * 100 : null;
  const interestBurden = interestRate || 0;
  const disposableIncome = monthlyIncome - emi - existingEMIs - otherMonthlyExpenses;
  const expenseRatio = otherMonthlyExpenses > 0 ? (otherMonthlyExpenses / monthlyIncome) * 100 : 0;

  return {
    debtBurdenRatio,
    existingDebtRatio,
    loanToIncomeRatio,
    interestBurden,
    tenureRisk: tenureYears ? (tenureYears > 15 ? 'HIGH' : tenureYears > 7 ? 'MEDIUM' : 'LOW') : null,
    creditRisk: creditScore ? assessCreditRisk(creditScore) : null,
    employmentRisk: employmentStability ? assessEmploymentRisk(employmentStability) : null,
    ageRisk: age ? assessAgeRisk(age) : null,
    dependencyRisk: dependents ? assessDependencyRisk(dependents) : null,
    disposableIncome,
    expenseRatio,
    overallRiskScore: calculateOverallRiskScore(debtBurdenRatio, creditScore, employmentStability, age, dependents),
  };
}

function assessCreditRisk(creditScore) {
  if (creditScore >= 750) return 'EXCELLENT';
  if (creditScore >= 700) return 'GOOD';
  if (creditScore >= 650) return 'FAIR';
  if (creditScore >= 600) return 'POOR';
  return 'VERY_POOR';
}

function assessEmploymentRisk(employmentStability) {
  switch (employmentStability.toUpperCase()) {
    case 'STABLE': return 'LOW';
    case 'SEMI_STABLE': return 'MEDIUM';
    case 'UNSTABLE': return 'HIGH';
    default: return 'UNKNOWN';
  }
}

function assessAgeRisk(age) {
  if (age >= 25 && age <= 45) return 'LOW';
  if (age >= 22 && age <= 55) return 'MEDIUM';
  return 'HIGH';
}

function assessDependencyRisk(dependents) {
  if (dependents <= 2) return 'LOW';
  if (dependents <= 4) return 'MEDIUM';
  return 'HIGH';
}

function assessLoanTypeRisk(loanType, interestRate, tenureYears) {
  // High-risk loan types with high rates and long tenures
  if (loanType === 'BUSINESS' && interestRate > 15 && tenureYears > 7) return 'HIGH';
  if (loanType === 'PERSONAL' && interestRate > 18 && tenureYears > 5) return 'HIGH';
  return 'MEDIUM';
}

function calculateRiskScore(debtBurdenRatio, riskFactors) {
  let score = debtBurdenRatio * 0.5; // Base score from debt burden

  // Add risk factor scores
  if (riskFactors.creditRisk === 'POOR') score += 15;
  if (riskFactors.creditRisk === 'VERY_POOR') score += 25;
  
  if (riskFactors.employmentRisk === 'HIGH') score += 10;
  
  if (riskFactors.ageRisk === 'HIGH') score += 5;
  
  if (riskFactors.dependencyRisk === 'HIGH') score += 5;

  return Math.min(100, Math.round(score));
}

function calculateOverallRiskScore(debtBurdenRatio, creditScore, employmentStability, age, dependents) {
  let score = debtBurdenRatio * 0.6;

  if (creditScore && creditScore < 600) score += 20;
  if (employmentStability === 'UNSTABLE') score += 10;
  if (age && (age < 22 || age > 55)) score += 5;
  if (dependents && dependents > 4) score += 5;

  return Math.min(100, Math.round(score));
}

function calculateTrend(values) {
  if (values.length < 2) return 'STABLE';

  const first = values[0];
  const last = values[values.length - 1];
  const change = ((last - first) / first) * 100;

  if (Math.abs(change) < 5) return 'STABLE';
  return change > 0 ? 'INCREASING' : 'DECREASING';
}

function calculateRiskLevelTrend(riskLevels) {
  if (riskLevels.length < 2) return 'STABLE';

  const levelOrder = { 'LOW': 1, 'MODERATE': 2, 'HIGH': 3 };
  const firstLevel = levelOrder[riskLevels[0]] || 0;
  const lastLevel = levelOrder[riskLevels[riskLevels.length - 1]] || 0;

  if (lastLevel === firstLevel) return 'STABLE';
  return lastLevel > firstLevel ? 'WORSENING' : 'IMPROVING';
}

function generateDetailedAnalysis(debtBurdenRatio, riskFactors, riskScore) {
  return {
    debtBurdenAnalysis: {
      ratio: debtBurdenRatio,
      category: debtBurdenRatio < 20 ? 'GOOD' : debtBurdenRatio <= 35 ? 'MODERATE' : 'HIGH',
      description: `Debt burden ratio of ${debtBurdenRatio.toFixed(1)}% ${debtBurdenRatio < 20 ? 'is within safe limits' : 'requires attention'}`,
    },
    cashFlowAnalysis: {
      disposableIncome: riskFactors.disposableIncome,
      disposableRatio: riskFactors.disposableIncome > 0 ? ((riskFactors.disposableIncome / (riskFactors.disposableIncome + (riskFactors.disposableIncome * 0.3))) * 100) : 0,
      description: riskFactors.disposableIncome > 0 ? 'Positive cash flow after loan payments' : 'Negative cash flow - high risk',
    },
    riskFactorAnalysis: {
      creditRisk: riskFactors.creditRisk,
      employmentRisk: riskFactors.employmentRisk,
      ageRisk: riskFactors.ageRisk,
      dependencyRisk: riskFactors.dependencyRisk,
    },
    scoreAnalysis: {
      score: riskScore,
      category: riskScore < 30 ? 'LOW' : riskScore < 60 ? 'MODERATE' : 'HIGH',
      description: `Overall risk score of ${riskScore} indicates ${riskScore < 30 ? 'low' : riskScore < 60 ? 'moderate' : 'high'} risk`,
    },
    marketContext: {
      nepaliMarketAverage: 25,
      marketPosition: debtBurdenRatio < 25 ? 'BELOW_AVERAGE' : debtBurdenRatio <= 35 ? 'ABOVE_AVERAGE' : 'HIGH',
      recommendation: debtBurdenRatio < 25 ? 'Favorable position in Nepali market' : 'Consider improving financial position',
    },
  };
}

function generateRecommendations(riskLevel, debtBurdenRatio, riskFactors) {
  const recommendations = [];

  // Base recommendations based on risk level
  if (riskLevel.level === 'LOW') {
    recommendations.push({
      type: 'APPROVAL',
      title: 'Proceed with Confidence',
      description: 'Your debt burden is within safe limits',
      action: 'APPLY',
    });
  } else if (riskLevel.level === 'MODERATE') {
    recommendations.push({
      type: 'CAUTION',
      title: 'Proceed with Caution',
      description: 'Your debt burden requires monitoring',
      action: 'REVIEW',
    });
  } else {
    recommendations.push({
      type: 'REJECTION',
      title: 'Reconsider Loan',
      description: 'Your debt burden exceeds recommended limits',
      action: 'POSTPONE',
    });
  }

  // Specific recommendations based on factors
  if (riskFactors.existingDebtRatio > 20) {
    recommendations.push({
      type: 'DEBT_CONSOLIDATION',
      title: 'Consider Debt Consolidation',
      description: 'High existing debt burden - consider consolidating existing loans',
      action: 'CONSOLIDATE',
    });
  }

  if (riskFactors.disposableIncome < 10000) {
    recommendations.push({
      type: 'EMERGENCY_FUND',
      title: 'Build Emergency Fund',
      description: 'Low disposable income - build emergency fund before taking new loan',
      action: 'SAVE',
    });
  }

  if (riskFactors.creditRisk === 'POOR' || riskFactors.creditRisk === 'VERY_POOR') {
    recommendations.push({
      type: 'CREDIT_IMPROVEMENT',
      title: 'Improve Credit Score',
      description: 'Poor credit history - work on improving credit score',
      action: 'IMPROVE_CREDIT',
    });
  }

  return recommendations;
}

function generateTrendSummary(debtBurdenTrend, riskScoreTrend, riskLevelTrend) {
  const trends = [];
  
  if (debtBurdenTrend !== 'STABLE') {
    trends.push(`Debt burden is ${debtBurdenTrend.toLowerCase()}`);
  }
  
  if (riskScoreTrend !== 'STABLE') {
    trends.push(`Risk score is ${riskScoreTrend.toLowerCase()}`);
  }
  
  if (riskLevelTrend !== 'STABLE') {
    trends.push(`Risk level is ${riskLevelTrend.toLowerCase()}`);
  }

  return trends.length > 0 ? trends.join('; ') : 'Risk metrics are stable';
}

function generateTrendRecommendation(riskLevelTrend) {
  switch (riskLevelTrend) {
    case 'IMPROVING':
      return 'Risk profile is improving - continue current financial practices';
    case 'WORSENING':
      return 'Risk profile is deteriorating - take immediate action to reduce debt burden';
    default:
      return 'Risk profile is stable - maintain current financial discipline';
  }
}

// Export all functions
module.exports = {
  calculateLoanRisk,
  quickRiskAssessment,
  batchRiskAssessment,
  analyzeRiskTrend,
};
