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
  if (emi > monthlyIncome) {
    throw new Error('EMI cannot exceed monthly income');
  }

  if (monthlyIncome < 10000) {
    throw new Error('Monthly income seems too low for Nepali market context');
  }

  if (emi > monthlyIncome * 0.9) {
    throw new Error('EMI seems unusually high relative to income');
  }

  // Calculate debt burden ratio
  const totalMonthlyEMIs = emi + existingEMIs;

  if (totalMonthlyEMIs > monthlyIncome) {
    throw new Error('EMI cannot exceed monthly income');
  }

  const debtBurdenRatio = (totalMonthlyEMIs / monthlyIncome) * 100;  // Determine base risk level
  let riskLevel;
  if (debtBurdenRatio < 20) {
    riskLevel = {
      level: 'LOW',
      color: 'GREEN',
      priority: 'LOW',
      description: 'Low risk: Debt burden within safe limits',
    };
  } else if (debtBurdenRatio <= 50) {
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
  }  // Generate recommendations if requested
  let recommendations;
  if (options.includeRecommendations) {
    recommendations = generateRecommendations(adjustedRiskLevel, debtBurdenRatio, riskFactors);
  }  const debtBurdenRatio = (emi / monthlyIncome) * 100;
  const existingDebtRatio = (existingEMIs / monthlyIncome) * 100;function assessDependencyRisk(dependents) {
  if (dependents <= 1) return 'LOW';
  if (dependents <= 3) return 'MEDIUM';
  return 'HIGH';
}function calculateRiskScore(debtBurdenRatio, riskFactors) {
  let score = debtBurdenRatio; // Base score from debt burden (1:1 mapping)

  // Add risk factor scores
  if (riskFactors.creditRisk === 'POOR') score += 15;
  if (riskFactors.creditRisk === 'VERY_POOR') score += 25;
  
  if (riskFactors.employmentRisk === 'HIGH') score += 10;
  
  if (riskFactors.ageRisk === 'HIGH') score += 5;
  
  if (riskFactors.dependencyRisk === 'HIGH') score += 5;

  return Math.min(100, Math.round(score));
}    cashFlowAnalysis: {
      disposableIncome: riskFactors.disposableIncome,
      disposableRatio: riskFactors.disposableIncome > 0 ? Math.round((riskFactors.disposableIncome / (riskFactors.disposableIncome + debtBurdenRatio)) * 100) : 0,      disposableRatio: riskFactors.disposableIncome > 0 ? Math.round((riskFactors.disposableIncome / (riskFactors.disposableIncome + riskFactors.debtBurdenRatio)) * 100) : 0,