/**
 * FinSathi AI - Risk Scoring System (CommonJS Version)
 * Comprehensive loan risk assessment engine
 */

/**
 * Validate basic inputs
 */
function validateInputs(emi, monthlyIncome) {
  if (typeof emi !== 'number' || isNaN(emi) || emi <= 0) {
    throw new Error('EMI must be a positive number');
  }
  if (typeof monthlyIncome !== 'number' || isNaN(monthlyIncome) || monthlyIncome <= 0) {
    throw new Error('Monthly income must be a positive number');
  }
  if (emi > monthlyIncome) {
    throw new Error('EMI cannot exceed monthly income');
  }
}

/**
 * Assess credit risk from credit score
 */
function assessCreditRisk(creditScore) {
  if (creditScore === null || creditScore === undefined) return 'UNKNOWN';
  if (creditScore >= 750) return 'EXCELLENT';
  if (creditScore >= 700) return 'GOOD';
  if (creditScore >= 650) return 'FAIR';
  if (creditScore >= 600) return 'POOR';
  return 'VERY_POOR';
}

/**
 * Assess employment risk
 */
function assessEmploymentRisk(employmentStability) {
  if (!employmentStability) return 'UNKNOWN';
  const map = { STABLE: 'LOW', SEMI_STABLE: 'MEDIUM', UNSTABLE: 'HIGH' };
  return map[employmentStability] || 'UNKNOWN';
}

/**
 * Assess age risk
 */
function assessAgeRisk(age) {
  if (!age) return 'UNKNOWN';
  if (age >= 25 && age <= 55) return 'LOW';
  if (age < 25 || (age > 55 && age <= 60)) return 'MEDIUM';
  return 'HIGH';
}

/**
 * Assess dependency risk
 */
function assessDependencyRisk(dependents) {
  if (dependents <= 1) return 'LOW';
  if (dependents <= 3) return 'MEDIUM';
  return 'HIGH';
}

/**
 * Assess tenure risk
 */
function assessTenureRisk(tenureYears) {
  if (!tenureYears) return 'UNKNOWN';
  if (tenureYears <= 5) return 'LOW';
  if (tenureYears <= 15) return 'MEDIUM';
  return 'HIGH';
}

/**
 * Calculate risk score from debt burden and risk factors
 */
function calculateRiskScore(debtBurdenRatio, riskFactors) {
  let score = debtBurdenRatio; // Base score from debt burden (1:1 mapping)

  // Add bonus for high debt burden
  if (debtBurdenRatio > 35) score += 15;

  if (riskFactors.creditRisk === 'POOR') score += 15;
  if (riskFactors.creditRisk === 'VERY_POOR') score += 25;
  if (riskFactors.employmentRisk === 'HIGH') score += 10;
  if (riskFactors.ageRisk === 'HIGH') score += 5;
  if (riskFactors.dependencyRisk === 'HIGH') score += 5;

  return Math.min(100, Math.round(score));
}

/**
 * Determine base risk level from debt burden ratio
 */
function determineBaseRiskLevel(debtBurdenRatio) {
  if (debtBurdenRatio < 20) {
    return { level: 'LOW', color: 'GREEN', priority: 'LOW', description: 'Low risk: Debt burden within safe limits' };
  } else if (debtBurdenRatio <= 35) {
    return { level: 'MODERATE', color: 'YELLOW', priority: 'MEDIUM', description: 'Moderate risk: Debt burden requires monitoring' };
  } else {
    return { level: 'HIGH', color: 'RED', priority: 'HIGH', description: 'High risk: Debt burden exceeds recommended limits' };
  }
}

/**
 * Adjust risk level based on risk factors
 */
function adjustRiskLevel(baseRiskLevel, riskFactors) {
  const adjustingFactors = [];

  if (riskFactors.creditRisk === 'POOR' || riskFactors.creditRisk === 'VERY_POOR') {
    adjustingFactors.push('Poor credit history');
  }
  if (riskFactors.employmentRisk === 'HIGH') {
    adjustingFactors.push('Unstable employment');
  }
  if (riskFactors.dependencyRisk === 'HIGH') {
    adjustingFactors.push('High dependency burden');
  }
  if (riskFactors.loanTypeRisk === 'HIGH') {
    adjustingFactors.push('High-risk loan type');
  }

  const levels = [
    { level: 'LOW', color: 'GREEN', priority: 'LOW', description: 'Low risk: Debt burden within safe limits' },
    { level: 'MODERATE', color: 'YELLOW', priority: 'MEDIUM', description: 'Moderate risk: Debt burden requires monitoring' },
    { level: 'HIGH', color: 'RED', priority: 'HIGH', description: 'High risk: Debt burden exceeds recommended limits' },
  ];

  let levelIndex = ['LOW', 'MODERATE', 'HIGH'].indexOf(baseRiskLevel.level);

  if (baseRiskLevel.level === 'LOW') {
    if (adjustingFactors.length >= 3) {
      levelIndex = 2; // LOW → HIGH for 3+ factors
    } else if (adjustingFactors.length >= 1) {
      levelIndex = 1; // LOW → MODERATE for 1-2 factors
    }
  } else if (baseRiskLevel.level === 'MODERATE' && adjustingFactors.length >= 2) {
    levelIndex = 2; // MODERATE → HIGH for 2+ factors
  }

  return { ...levels[levelIndex], adjustingFactors };
}

/**
 * Assess loan type risk
 */
function assessLoanTypeRisk(loanType, interestRate, tenureYears) {
  if (!loanType) return 'LOW';
  const highRiskTypes = ['BUSINESS', 'PERSONAL'];
  if (highRiskTypes.includes(loanType) && interestRate > 15 && tenureYears > 7) return 'HIGH';
  if (highRiskTypes.includes(loanType)) return 'MEDIUM';
  return 'LOW';
}

/**
 * Generate recommendations based on risk level and factors
 */
function generateRecommendations(riskLevel, debtBurdenRatio, riskFactors) {
  const recommendations = [];

  if (riskLevel.level === 'LOW') {
    recommendations.push({ type: 'APPROVAL', action: 'APPLY', message: 'Low risk profile. Proceed with loan application.' });
  } else if (riskLevel.level === 'MODERATE') {
    recommendations.push({ type: 'CAUTION', action: 'REVIEW', message: 'Moderate risk. Review terms carefully before proceeding.' });
  } else {
    recommendations.push({ type: 'REJECTION', action: 'POSTPONE', message: 'High risk profile. Consider postponing the loan.' });
  }

  if (riskFactors.existingDebtRatio >= 20) {
    recommendations.push({ type: 'DEBT_CONSOLIDATION', action: 'CONSOLIDATE', message: 'Consider consolidating existing debts.' });
  }

  if (riskFactors.disposableIncome < riskFactors.monthlyIncome * 0.3) {
    recommendations.push({ type: 'EMERGENCY_FUND', action: 'SAVE', message: 'Build an emergency fund before taking on more debt.' });
  }

  return recommendations;
}

/**
 * Generate detailed analysis
 */
function generateDetailedAnalysis(debtBurdenRatio, riskFactors, riskLevel, monthlyIncome) {
  const debtBurdenCategory = debtBurdenRatio < 20 ? 'GOOD' : debtBurdenRatio <= 35 ? 'MODERATE' : 'POOR';
  const debtBurdenDescription = debtBurdenRatio < 20
    ? 'Debt burden within safe limits'
    : debtBurdenRatio <= 35
    ? 'Debt burden requires monitoring'
    : 'Debt burden exceeds recommended limits';

  const disposableRatio = monthlyIncome > 0
    ? Math.round((riskFactors.disposableIncome / monthlyIncome) * 100)
    : 0;

  return {
    debtBurdenAnalysis: {
      ratio: debtBurdenRatio,
      category: debtBurdenCategory,
      description: debtBurdenDescription,
    },
    cashFlowAnalysis: {
      disposableIncome: riskFactors.disposableIncome,
      disposableRatio,
    },
    riskFactorAnalysis: riskFactors,
    scoreAnalysis: {
      score: riskFactors.overallRiskScore,
      level: riskLevel.level,
    },
    marketContext: {
      nepaliMarketAverage: 25,
      marketPosition: debtBurdenRatio < 25 ? 'BELOW_AVERAGE' : debtBurdenRatio > 25 ? 'ABOVE_AVERAGE' : 'AVERAGE',
      recommendation: debtBurdenRatio < 25 ? 'Your debt burden is below the Nepali market average.' : 'Your debt burden is above the Nepali market average.',
    },
  };
}

/**
 * Calculate loan risk assessment
 */
function calculateLoanRisk(params, options = {}) {
  if (!params || typeof params !== 'object') {
    throw new Error('Invalid parameters');
  }

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

  const {
    includeRecommendations = false,
    includeDetailedAnalysis = false,
    currency = 'NPR',
    locale = 'ne-NP',
  } = options;

  // Input validation
  if (typeof emi !== 'number' || isNaN(emi) || emi <= 0) {
    throw new Error('EMI must be a positive number');
  }
  if (typeof monthlyIncome !== 'number' || isNaN(monthlyIncome) || monthlyIncome <= 0) {
    throw new Error('Monthly income must be a positive number');
  }
  if (emi > monthlyIncome) {
    throw new Error('EMI cannot exceed monthly income');
  }
  if (monthlyIncome < 10000) {
    throw new Error('Monthly income seems too low for Nepali market context');
  }
  if (emi > monthlyIncome * 0.9) {
    throw new Error('EMI seems unusually high relative to income');
  }

  const totalMonthlyEMIs = emi + existingEMIs;
  if (totalMonthlyEMIs > monthlyIncome) {
    throw new Error('EMI cannot exceed monthly income');
  }

  // Calculate ratios
  const debtBurdenRatio = Math.round((totalMonthlyEMIs / monthlyIncome) * 100);
  const existingDebtRatio = Math.round((existingEMIs / monthlyIncome) * 100);
  const loanToIncomeRatio = loanAmount ? Math.round((loanAmount / (monthlyIncome * 12)) * 100) / 100 : null;
  const disposableIncome = monthlyIncome - totalMonthlyEMIs - otherMonthlyExpenses;

  // Calculate risk factors
  const riskFactors = {
    debtBurdenRatio: Math.round((totalMonthlyEMIs / monthlyIncome) * 100),
    existingDebtRatio,
    loanToIncomeRatio,
    interestBurden: interestRate || 0,
    tenureRisk: assessTenureRisk(tenureYears),
    creditRisk: assessCreditRisk(creditScore),
    employmentRisk: assessEmploymentRisk(employmentStability),
    ageRisk: assessAgeRisk(age),
    dependencyRisk: assessDependencyRisk(dependents),
    loanTypeRisk: assessLoanTypeRisk(loanType, interestRate, tenureYears),
    disposableIncome,
    expenseRatio: Math.round((otherMonthlyExpenses / monthlyIncome) * 100),
    monthlyIncome,
  };

  riskFactors.overallRiskScore = calculateRiskScore(debtBurdenRatio, riskFactors);

  // Determine risk level
  const baseRiskLevel = determineBaseRiskLevel(debtBurdenRatio);
  const adjustedRiskLevel = adjustRiskLevel(baseRiskLevel, riskFactors);

  const riskScore = calculateRiskScore(debtBurdenRatio, riskFactors);

  // Generate recommendations if requested
  let recommendations;
  if (includeRecommendations) {
    recommendations = generateRecommendations(adjustedRiskLevel, debtBurdenRatio, riskFactors);
  }

  // Generate detailed analysis if requested
  const analysis = includeDetailedAnalysis
    ? generateDetailedAnalysis(debtBurdenRatio, riskFactors, adjustedRiskLevel, monthlyIncome)
    : null;

  return {
    riskLevel: adjustedRiskLevel,
    riskScore,
    debtBurdenRatio,
    totalMonthlyEMIs,
    riskFactors,
    recommendations,
    analysis,
    assessment: {
      timestamp: new Date().toISOString(),
      currency,
      locale,
    },
  };
}

/**
 * Quick risk assessment (simplified)
 */
function quickRiskAssessment(emi, monthlyIncome) {
  if (typeof emi !== 'number' || isNaN(emi) || emi <= 0) {
    throw new Error('EMI must be a positive number');
  }
  if (typeof monthlyIncome !== 'number' || isNaN(monthlyIncome) || monthlyIncome <= 0) {
    throw new Error('Monthly income must be a positive number');
  }
  if (emi > monthlyIncome) {
    throw new Error('EMI cannot exceed monthly income');
  }

  const debtBurdenRatio = (emi / monthlyIncome) * 100;

  let riskLevel, explanation, recommendation;

  if (debtBurdenRatio <= 20) {
    riskLevel = 'LOW';
    explanation = 'Low risk: Debt burden is within safe limits.';
    recommendation = 'Proceed with confidence. Your debt burden is manageable.';
  } else if (debtBurdenRatio <= 35) {
    riskLevel = 'MODERATE';
    explanation = 'Moderate risk: Debt burden requires careful monitoring.';
    recommendation = 'Proceed with caution. Review your budget carefully.';
  } else {
    riskLevel = 'HIGH';
    explanation = 'High risk: Debt burden exceeds recommended limits.';
    recommendation = 'Reconsider the loan. Your debt burden is too high.';
  }

  return { riskLevel, debtBurdenRatio, explanation, recommendation };
}

/**
 * Batch risk assessment for multiple applications
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

  return applications.map((app, index) => {
    try {
      const result = calculateLoanRisk(app);
      return {
        applicationIndex: index,
        riskLevel: result.riskLevel.level,
        debtBurdenRatio: result.debtBurdenRatio,
        riskScore: result.riskScore,
      };
    } catch (error) {
      return {
        applicationIndex: index,
        riskLevel: 'ERROR',
        error: error.message,
      };
    }
  });
}

/**
 * Analyze risk trend from historical assessments
 */
function analyzeRiskTrend(historicalData) {
  if (!Array.isArray(historicalData) || historicalData.length < 2) {
    throw new Error('At least 2 historical assessments are required for trend analysis');
  }

  // Sort by timestamp if available
  const sorted = [...historicalData].sort((a, b) => {
    const ta = a.assessment && a.assessment.timestamp ? new Date(a.assessment.timestamp).getTime() : 0;
    const tb = b.assessment && b.assessment.timestamp ? new Date(b.assessment.timestamp).getTime() : 0;
    return ta - tb;
  });

  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  // Debt burden trend
  const debtBurdenDiff = (last.debtBurdenRatio || 0) - (first.debtBurdenRatio || 0);
  const debtBurdenTrend = debtBurdenDiff > 0 ? 'INCREASING' : debtBurdenDiff < 0 ? 'DECREASING' : 'STABLE';

  // Risk score trend
  const riskScoreDiff = (last.riskScore || 0) - (first.riskScore || 0);
  const riskScoreTrend = riskScoreDiff > 0 ? 'INCREASING' : riskScoreDiff < 0 ? 'DECREASING' : 'STABLE';

  // Risk level trend
  const levelOrder = { LOW: 0, MODERATE: 1, HIGH: 2 };
  const firstLevel = first.riskLevel && first.riskLevel.level ? first.riskLevel.level : 'LOW';
  const lastLevel = last.riskLevel && last.riskLevel.level ? last.riskLevel.level : 'LOW';
  const levelDiff = (levelOrder[lastLevel] || 0) - (levelOrder[firstLevel] || 0);
  const riskLevelTrend = levelDiff > 0 ? 'WORSENING' : levelDiff < 0 ? 'IMPROVING' : 'STABLE';

  // Summary
  const trendWord = debtBurdenTrend === 'INCREASING' ? 'increasing' : debtBurdenTrend === 'DECREASING' ? 'decreasing' : 'stable';
  const summary = `Risk profile shows ${trendWord} debt burden over the analyzed period.`;

  // Recommendation
  let recommendation;
  if (riskLevelTrend === 'WORSENING') {
    recommendation = 'Risk is deteriorating. Take immediate action to reduce debt burden.';
  } else if (riskLevelTrend === 'IMPROVING') {
    recommendation = 'Risk is improving. Continue current financial management strategies.';
  } else {
    recommendation = 'Risk is stable. Monitor regularly and maintain current strategies.';
  }

  return {
    trends: { debtBurdenTrend, riskScoreTrend, riskLevelTrend },
    summary,
    recommendation,
    analysisDate: new Date().toISOString(),
    dataPoints: sorted.length,
  };
}

module.exports = {
  calculateLoanRisk,
  quickRiskAssessment,
  batchRiskAssessment,
  analyzeRiskTrend,
  assessCreditRisk,
  assessEmploymentRisk,
  assessAgeRisk,
  assessDependencyRisk,
  calculateRiskScore,
  determineBaseRiskLevel,
  adjustRiskLevel,
  generateRecommendations,
  generateDetailedAnalysis,
};
