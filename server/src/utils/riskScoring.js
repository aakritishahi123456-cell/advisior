/**
 * FinSathi AI - Loan Risk Scoring System
 * Comprehensive risk assessment and scoring for loan applications
 */

/**
 * Calculate debt burden ratio and assess loan risk
 * @param {Object} params - Risk assessment parameters
 * @param {number} params.emi - Monthly EMI amount
 * @param {number} params.monthlyIncome - Monthly income
 * @param {Object} options - Additional assessment options
 * @returns {Object} Risk assessment result
 */
export function calculateLoanRisk(params, options = {}) {
  try {
    const {
      emi,
      monthlyIncome,
      existingEMIs = 0,
      loanAmount,
      interestRate,
      tenureYears,
      loanType = 'PERSONAL',
      creditScore = null,
      employmentStability = null,
      age = null,
      dependents = 0,
      otherMonthlyExpenses = 0,
    } = params;

    const {
      currency = 'NPR',
      locale = 'ne-NP',
      includeRecommendations = true,
      includeDetailedAnalysis = true,
    } = options;

    // Validate inputs
    validateRiskInputs({ emi, monthlyIncome });

    // Calculate debt burden ratio
    const totalMonthlyEMIs = emi + existingEMIs;
    const debtBurdenRatio = (totalMonthlyEMIs / monthlyIncome) * 100;

    // Calculate additional risk factors
    const riskFactors = calculateRiskFactors({
      emi,
      monthlyIncome,
      existingEMIs,
      loanAmount,
      interestRate,
      tenureYears,
      loanType,
      creditScore,
      employmentStability,
      age,
      dependents,
      otherMonthlyExpenses,
    });

    // Determine risk level
    const riskLevel = determineRiskLevel(debtBurdenRatio, riskFactors);

    // Generate risk score (0-100, lower is better)
    const riskScore = calculateRiskScore(debtBurdenRatio, riskFactors);

    // Create detailed analysis
    const analysis = createRiskAnalysis({
      debtBurdenRatio,
      totalMonthlyEMIs,
      monthlyIncome,
      riskFactors,
      riskLevel,
      riskScore,
    });

    // Generate recommendations
    const recommendations = includeRecommendations 
      ? generateRecommendations(riskLevel, debtBurdenRatio, riskFactors)
      : [];

    return {
      riskLevel,
      riskScore,
      debtBurdenRatio: Math.round(debtBurdenRatio * 100) / 100,
      totalMonthlyEMIs: Math.round(totalMonthlyEMIs * 100) / 100,
      monthlyIncome,
      riskFactors,
      analysis: includeDetailedAnalysis ? analysis : null,
      recommendations,
      assessment: {
        timestamp: new Date().toISOString(),
        currency,
        locale,
        methodology: 'Debt Burden Ratio Analysis',
        version: '1.0',
      },
    };
  } catch (error) {
    throw new Error(`Risk assessment failed: ${error.message}`);
  }
}

/**
 * Validate risk assessment inputs
 * @param {Object} inputs - Input parameters
 */
function validateRiskInputs(inputs) {
  const { emi, monthlyIncome } = inputs;

  if (typeof emi !== 'number' || emi <= 0) {
    throw new Error('EMI must be a positive number');
  }

  if (typeof monthlyIncome !== 'number' || monthlyIncome <= 0) {
    throw new Error('Monthly income must be a positive number');
  }

  if (emi > monthlyIncome) {
    throw new Error('EMI cannot exceed monthly income');
  }

  // Nepali market specific validations
  if (monthlyIncome < 10000) {
    throw new Error('Monthly income seems too low for Nepali market context');
  }

  if (emi > monthlyIncome * 0.7) {
    throw new Error('EMI seems unusually high relative to income');
  }
}

/**
 * Calculate additional risk factors
 * @param {Object} params - Risk parameters
 * @returns {Object} Risk factors
 */
function calculateRiskFactors(params) {
  const {
    emi,
    monthlyIncome,
    existingEMIs,
    loanAmount,
    interestRate,
    tenureYears,
    loanType,
    creditScore,
    employmentStability,
    age,
    dependents,
    otherMonthlyExpenses,
  } = params;

  const factors = {
    // Primary factors
    debtBurdenRatio: ((emi + existingEMIs) / monthlyIncome) * 100,
    existingDebtRatio: (existingEMIs / monthlyIncome) * 100,
    
    // Loan-specific factors
    loanToIncomeRatio: (emi * 12) / monthlyIncome,
    interestBurden: interestRate,
    tenureRisk: tenureYears > 10 ? 'HIGH' : tenureYears > 5 ? 'MEDIUM' : 'LOW',
    
    // Credit factors
    creditScore: creditScore || 'UNKNOWN',
    creditRisk: assessCreditRisk(creditScore),
    
    // Personal factors
    ageRisk: assessAgeRisk(age),
    employmentRisk: assessEmploymentRisk(employmentStability),
    dependencyRisk: assessDependencyRisk(dependents, monthlyIncome),
    
    // Financial factors
    expenseRatio: otherMonthlyExpenses > 0 ? (otherMonthlyExpenses / monthlyIncome) * 100 : 0,
    disposableIncome: monthlyIncome - (emi + existingEMIs + otherMonthlyExpenses),
    
    // Loan type specific risks
    loanTypeRisk: assessLoanTypeRisk(loanType, interestRate, tenureYears),
  };

  // Calculate overall risk factor score
  factors.overallRiskScore = calculateFactorRiskScore(factors);

  return factors;
}

/**
 * Assess credit risk based on credit score
 * @param {number|null} creditScore - Credit score
 * @returns {string} Risk level
 */
function assessCreditRisk(creditScore) {
  if (!creditScore) return 'UNKNOWN';
  if (creditScore >= 750) return 'EXCELLENT';
  if (creditScore >= 700) return 'GOOD';
  if (creditScore >= 650) return 'FAIR';
  if (creditScore >= 600) return 'POOR';
  return 'VERY_POOR';
}

/**
 * Assess age-related risk
 * @param {number|null} age - Age of applicant
 * @returns {string} Risk level
 */
function assessAgeRisk(age) {
  if (!age) return 'UNKNOWN';
  if (age < 21 || age > 65) return 'HIGH';
  if (age < 25 || age > 60) return 'MEDIUM';
  return 'LOW';
}

/**
 * Assess employment-related risk
 * @param {string|null} employmentStability - Employment stability
 * @returns {string} Risk level
 */
function assessEmploymentRisk(employmentStability) {
  if (!employmentStability) return 'UNKNOWN';
  switch (employmentStability.toUpperCase()) {
    case 'STABLE': return 'LOW';
    case 'SEMI_STABLE': return 'MEDIUM';
    case 'UNSTABLE': return 'HIGH';
    default: return 'UNKNOWN';
  }
}

/**
 * Assess dependency-related risk
 * @param {number} dependents - Number of dependents
 * @param {number} monthlyIncome - Monthly income
 * @returns {string} Risk level
 */
function assessDependencyRisk(dependents, monthlyIncome) {
  if (dependents === 0) return 'LOW';
  if (dependents <= 2 && monthlyIncome > 50000) return 'MEDIUM';
  return 'HIGH';
}

/**
 * Assess loan type specific risks
 * @param {string} loanType - Type of loan
 * @param {number} interestRate - Interest rate
 * @param {number} tenureYears - Loan tenure
 * @returns {Object} Risk assessment
 */
function assessLoanTypeRisk(loanType, interestRate, tenureYears) {
  const risks = {
    HOME: { baseRisk: 'LOW', maxRate: 15, maxTenure: 25 },
    PERSONAL: { baseRisk: 'MEDIUM', maxRate: 25, maxTenure: 7 },
    BUSINESS: { baseRisk: 'HIGH', maxRate: 20, maxTenure: 15 },
    EDUCATION: { baseRisk: 'LOW', maxRate: 12, maxTenure: 10 },
    VEHICLE: { baseRisk: 'MEDIUM', maxRate: 18, maxTenure: 7 },
  };

  const riskConfig = risks[loanType] || risks.PERSONAL;
  
  let riskLevel = riskConfig.baseRisk;
  
  // Adjust risk based on interest rate
  if (interestRate > riskConfig.maxRate) {
    riskLevel = 'HIGH';
  } else if (interestRate > riskConfig.maxRate * 0.8) {
    riskLevel = 'MEDIUM';
  }
  
  // Adjust risk based on tenure
  if (tenureYears > riskConfig.maxTenure) {
    riskLevel = 'HIGH';
  } else if (tenureYears > riskConfig.maxTenure * 0.7) {
    riskLevel = 'MEDIUM';
  }

  return {
    baseRisk: riskConfig.baseRisk,
    adjustedRisk: riskLevel,
    withinLimits: interestRate <= riskConfig.maxRate && tenureYears <= riskConfig.maxTenure,
  };
}

/**
 * Calculate overall risk factor score
 * @param {Object} factors - Risk factors
 * @returns {number} Risk score (0-100)
 */
function calculateFactorRiskScore(factors) {
  let score = 0;
  
  // Debt burden ratio impact (40% weight)
  score += Math.min(factors.debtBurdenRatio * 2, 40);
  
  // Credit score impact (20% weight)
  const creditScoreMap = { EXCELLENT: 0, GOOD: 5, FAIR: 10, POOR: 15, VERY_POOR: 20, UNKNOWN: 10 };
  score += creditScoreMap[factors.creditRisk] || 10;
  
  // Employment risk impact (15% weight)
  const employmentScoreMap = { LOW: 0, MEDIUM: 7.5, HIGH: 15, UNKNOWN: 7.5 };
  score += employmentScoreMap[factors.employmentRisk] || 7.5;
  
  // Age risk impact (10% weight)
  const ageScoreMap = { LOW: 0, MEDIUM: 5, HIGH: 10, UNKNOWN: 5 };
  score += ageScoreMap[factors.ageRisk] || 5;
  
  // Loan type risk impact (10% weight)
  const loanTypeScoreMap = { LOW: 0, MEDIUM: 5, HIGH: 10 };
  score += loanTypeScoreMap[factors.loanTypeRisk?.adjustedRisk] || 5;
  
  // Dependency risk impact (5% weight)
  const dependencyScoreMap = { LOW: 0, MEDIUM: 2.5, HIGH: 5 };
  score += dependencyScoreMap[factors.dependencyRisk] || 2.5;
  
  return Math.min(score, 100);
}

/**
 * Determine risk level based on debt burden ratio and factors
 * @param {number} debtBurdenRatio - Debt burden ratio percentage
 * @param {Object} riskFactors - Additional risk factors
 * @returns {Object} Risk level assessment
 */
function determineRiskLevel(debtBurdenRatio, riskFactors) {
  let baseLevel;
  let explanation;
  let color;
  let priority;

  // Primary assessment based on debt burden ratio
  if (debtBurdenRatio < 20) {
    baseLevel = 'LOW';
    explanation = 'Debt burden is within safe limits';
    color = 'GREEN';
    priority = 'LOW';
  } else if (debtBurdenRatio <= 35) {
    baseLevel = 'MODERATE';
    explanation = 'Debt burden is moderate, requires monitoring';
    color = 'YELLOW';
    priority = 'MEDIUM';
  } else {
    baseLevel = 'HIGH';
    explanation = 'Debt burden is high, significant risk';
    color = 'RED';
    priority = 'HIGH';
  }

  // Adjust based on additional risk factors
  const adjustedLevel = adjustRiskLevel(baseLevel, riskFactors);
  
  return {
    level: adjustedLevel.level,
    baseLevel,
    explanation: adjustedLevel.explanation || explanation,
    color: adjustedLevel.color || color,
    priority: adjustedLevel.priority || priority,
    factors: adjustedLevel.adjustingFactors || [],
  };
}

/**
 * Adjust risk level based on additional factors
 * @param {string} baseLevel - Base risk level
 * @param {Object} riskFactors - Risk factors
 * @returns {Object} Adjusted risk level
 */
function adjustRiskLevel(baseLevel, riskFactors) {
  let adjustedLevel = baseLevel;
  let explanation = '';
  let color = '';
  let priority = '';
  const adjustingFactors = [];

  // Check for significant risk factors
  if (riskFactors.creditRisk === 'VERY_POOR') {
    if (baseLevel === 'LOW') adjustedLevel = 'MODERATE';
    else if (baseLevel === 'MODERATE') adjustedLevel = 'HIGH';
    adjustingFactors.push('Poor credit history');
  }

  if (riskFactors.employmentRisk === 'HIGH') {
    if (baseLevel === 'LOW') adjustedLevel = 'MODERATE';
    else if (baseLevel === 'MODERATE') adjustedLevel = 'HIGH';
    adjustingFactors.push('Unstable employment');
  }

  if (riskFactors.ageRisk === 'HIGH') {
    if (baseLevel === 'LOW') adjustedLevel = 'MODERATE';
    adjustingFactors.push('Age-related risk factors');
  }

  if (riskFactors.dependencyRisk === 'HIGH') {
    if (baseLevel === 'LOW') adjustedLevel = 'MODERATE';
    adjustingFactors.push('High dependency burden');
  }

  if (riskFactors.loanTypeRisk?.adjustedRisk === 'HIGH') {
    if (baseLevel === 'LOW') adjustedLevel = 'MODERATE';
    else if (baseLevel === 'MODERATE') adjustedLevel = 'HIGH';
    adjustingFactors.push('High-risk loan type');
  }

  // Set final properties based on adjusted level
  switch (adjustedLevel) {
    case 'LOW':
      explanation = 'Low risk: All factors within acceptable limits';
      color = 'GREEN';
      priority = 'LOW';
      break;
    case 'MODERATE':
      explanation = `Moderate risk: ${adjustingFactors.join(', ')}`;
      color = 'YELLOW';
      priority = 'MEDIUM';
      break;
    case 'HIGH':
      explanation = `High risk: ${adjustingFactors.join(', ')}`;
      color = 'RED';
      priority = 'HIGH';
      break;
  }

  return {
    level: adjustedLevel,
    explanation,
    color,
    priority,
    adjustingFactors,
  };
}

/**
 * Calculate overall risk score (0-100, lower is better)
 * @param {number} debtBurdenRatio - Debt burden ratio
 * @param {Object} riskFactors - Risk factors
 * @returns {number} Risk score
 */
function calculateRiskScore(debtBurdenRatio, riskFactors) {
  let score = 0;

  // Debt burden ratio score (0-50 points)
  if (debtBurdenRatio < 10) score += 0;
  else if (debtBurdenRatio < 20) score += 10;
  else if (debtBurdenRatio < 30) score += 25;
  else if (debtBurdenRatio < 40) score += 40;
  else score += 50;

  // Additional risk factors score (0-50 points)
  score += riskFactors.overallRiskScore;

  return Math.min(score, 100);
}

/**
 * Create detailed risk analysis
 * @param {Object} params - Analysis parameters
 * @returns {Object} Detailed analysis
 */
function createRiskAnalysis(params) {
  const { debtBurdenRatio, totalMonthlyEMIs, monthlyIncome, riskFactors, riskLevel, riskScore } = params;

  return {
    debtBurdenAnalysis: {
      ratio: debtBurdenRatio,
      category: categorizeDebtBurden(debtBurdenRatio),
      description: getDebtBurdenDescription(debtBurdenRatio),
    },
    
    cashFlowAnalysis: {
      totalEMIs: totalMonthlyEMIs,
      monthlyIncome,
      disposableIncome: monthlyIncome - totalMonthlyEMIs,
      disposableRatio: ((monthlyIncome - totalMonthlyEMIs) / monthlyIncome) * 100,
      description: getCashFlowDescription(monthlyIncome - totalMonthlyEMIs, monthlyIncome),
    },
    
    riskFactorAnalysis: {
      primaryFactors: getPrimaryRiskFactors(riskFactors),
      secondaryFactors: getSecondaryRiskFactors(riskFactors),
      mitigatingFactors: getMitigatingFactors(riskFactors),
    },
    
    scoreAnalysis: {
      overallScore: riskScore,
      category: categorizeScore(riskScore),
      description: getScoreDescription(riskScore),
    },
    
    marketContext: {
      nepaliMarketAverage: 25, // Average debt burden ratio in Nepali market
      marketPosition: debtBurdenRatio < 25 ? 'BELOW_AVERAGE' : 'ABOVE_AVERAGE',
      recommendation: getMarketRecommendation(debtBurdenRatio, riskLevel.level),
    },
  };
}

/**
 * Categorize debt burden ratio
 * @param {number} ratio - Debt burden ratio
 * @returns {string} Category
 */
function categorizeDebtBurden(ratio) {
  if (ratio < 10) return 'EXCELLENT';
  if (ratio < 20) return 'GOOD';
  if (ratio < 30) return 'ACCEPTABLE';
  if (ratio < 40) return 'CONCERNING';
  return 'HIGH';
}

/**
 * Get debt burden description
 * @param {number} ratio - Debt burden ratio
 * @returns {string} Description
 */
function getDebtBurdenDescription(ratio) {
  if (ratio < 10) return 'Excellent debt management with very low burden';
  if (ratio < 20) return 'Good debt management within safe limits';
  if (ratio < 30) return 'Acceptable debt burden with some room for expenses';
  if (ratio < 40) return 'Concerning debt burden requiring careful budgeting';
  return 'High debt burden with significant financial risk';
}

/**
 * Get cash flow description
 * @param {number} disposableIncome - Disposable income
 * @param {number} monthlyIncome - Monthly income
 * @returns {string} Description
 */
function getCashFlowDescription(disposableIncome, monthlyIncome) {
  const disposableRatio = (disposableIncome / monthlyIncome) * 100;
  
  if (disposableRatio > 50) return 'Excellent cash flow with significant disposable income';
  if (disposableRatio > 30) return 'Good cash flow with adequate disposable income';
  if (disposableRatio > 20) return 'Moderate cash flow with limited disposable income';
  if (disposableRatio > 10) return 'Tight cash flow with very limited disposable income';
  return 'Very tight cash flow with no disposable income';
}

/**
 * Get primary risk factors
 * @param {Object} factors - Risk factors
 * @returns {Array} Primary factors
 */
function getPrimaryRiskFactors(factors) {
  const primary = [];
  
  if (factors.debtBurdenRatio > 35) primary.push('High debt burden ratio');
  if (factors.creditRisk === 'VERY_POOR') primary.push('Poor credit history');
  if (factors.employmentRisk === 'HIGH') primary.push('Unstable employment');
  if (factors.ageRisk === 'HIGH') primary.push('Age-related risk');
  
  return primary;
}

/**
 * Get secondary risk factors
 * @param {Object} factors - Risk factors
 * @returns {Array} Secondary factors
 */
function getSecondaryRiskFactors(factors) {
  const secondary = [];
  
  if (factors.dependencyRisk === 'HIGH') secondary.push('High dependency burden');
  if (factors.loanTypeRisk?.adjustedRisk === 'HIGH') secondary.push('High-risk loan type');
  if (factors.tenureRisk === 'HIGH') secondary.push('Long loan tenure');
  if (factors.interestBurden > 15) secondary.push('High interest rate');
  
  return secondary;
}

/**
 * Get mitigating factors
 * @param {Object} factors - Risk factors
 * @returns {Array} Mitigating factors
 */
function getMitigatingFactors(factors) {
  const mitigating = [];
  
  if (factors.creditRisk === 'EXCELLENT') mitigating.push('Excellent credit history');
  if (factors.employmentRisk === 'LOW') mitigating.push('Stable employment');
  if (factors.ageRisk === 'LOW') mitigating.push('Prime age group');
  if (factors.dependencyRisk === 'LOW') mitigating.push('Low dependency burden');
  if (factors.disposableIncome > factors.monthlyIncome * 0.3) mitigating.push('High disposable income');
  
  return mitigating;
}

/**
 * Categorize risk score
 * @param {number} score - Risk score
 * @returns {string} Category
 */
function categorizeScore(score) {
  if (score < 20) return 'EXCELLENT';
  if (score < 40) return 'GOOD';
  if (score < 60) return 'MODERATE';
  if (score < 80) return 'CONCERNING';
  return 'HIGH';
}

/**
 * Get score description
 * @param {number} score - Risk score
 * @returns {string} Description
 */
function getScoreDescription(score) {
  if (score < 20) return 'Very low risk with excellent financial profile';
  if (score < 40) return 'Low risk with good financial profile';
  if (score < 60) return 'Moderate risk requiring some attention';
  if (score < 80) return 'High risk requiring careful consideration';
  return 'Very high risk with significant concerns';
}

/**
 * Get market recommendation
 * @param {number} debtBurdenRatio - Debt burden ratio
 * @param {string} riskLevel - Risk level
 * @returns {string} Recommendation
 */
function getMarketRecommendation(debtBurdenRatio, riskLevel) {
  if (riskLevel === 'LOW') {
    return 'Favorable position compared to Nepali market average';
  } else if (riskLevel === 'MODERATE') {
    return 'Similar to Nepali market average, proceed with caution';
  } else {
    return 'Above Nepali market average, reconsider loan terms';
  }
}

/**
 * Generate recommendations based on risk assessment
 * @param {string} riskLevel - Risk level
 * @param {number} debtBurdenRatio - Debt burden ratio
 * @param {Object} riskFactors - Risk factors
 * @returns {Array} Recommendations
 */
function generateRecommendations(riskLevel, debtBurdenRatio, riskFactors) {
  const recommendations = [];

  // Base recommendations by risk level
  switch (riskLevel) {
    case 'LOW':
      recommendations.push({
        type: 'APPROVAL',
        title: 'Proceed with Loan Application',
        description: 'Your debt burden is within safe limits. Consider proceeding with the loan application.',
        priority: 'HIGH',
        action: 'APPLY',
      });
      
      if (debtBurdenRatio < 15) {
        recommendations.push({
          type: 'OPTIMIZATION',
          title: 'Consider Larger Loan Amount',
          description: 'You have room for a slightly larger loan if needed for your goals.',
          priority: 'MEDIUM',
          action: 'CONSIDER',
        });
      }
      break;

    case 'MODERATE':
      recommendations.push({
        type: 'CAUTION',
        title: 'Proceed with Caution',
        description: 'Your debt burden is moderate. Ensure you have adequate emergency funds.',
        priority: 'HIGH',
        action: 'REVIEW',
      });
      
      recommendations.push({
        type: 'IMPROVEMENT',
        title: 'Consider Reducing Loan Amount',
        description: 'A smaller loan amount would improve your debt-to-income ratio.',
        priority: 'MEDIUM',
        action: 'ADJUST',
      });
      
      if (riskFactors.creditRisk === 'POOR' || riskFactors.creditRisk === 'VERY_POOR') {
        recommendations.push({
          type: 'CREDIT_IMPROVEMENT',
          title: 'Improve Credit Score',
          description: 'Work on improving your credit score before applying for larger loans.',
          priority: 'MEDIUM',
          action: 'IMPROVE',
        });
      }
      break;

    case 'HIGH':
      recommendations.push({
        type: 'REJECTION',
        title: 'Reconsider Loan Application',
        description: 'Your debt burden is high. Consider reducing the loan amount or improving your financial situation.',
        priority: 'HIGH',
        action: 'POSTPONE',
      });
      
      recommendations.push({
        type: 'ALTERNATIVE',
        title: 'Explore Alternative Options',
        description: 'Consider smaller loan amounts, longer tenure, or alternative financing options.',
        priority: 'HIGH',
        action: 'EXPLORE',
      });
      
      recommendations.push({
        type: 'FINANCIAL_PLANNING',
        title: 'Create Financial Plan',
        description: 'Develop a comprehensive financial plan to improve your debt-to-income ratio.',
        priority: 'MEDIUM',
        action: 'PLAN',
      });
      break;
  }

  // Additional specific recommendations
  if (riskFactors.existingDebtRatio > 20) {
    recommendations.push({
      type: 'DEBT_CONSOLIDATION',
      title: 'Consider Debt Consolidation',
      description: 'Consolidating existing debts might reduce your overall monthly payments.',
      priority: 'MEDIUM',
      action: 'CONSOLIDATE',
    });
  }

  if (riskFactors.disposableIncome < 10000) {
    recommendations.push({
      type: 'EMERGENCY_FUND',
      title: 'Build Emergency Fund',
      description: 'Build an emergency fund before taking on additional debt.',
      priority: 'HIGH',
      action: 'SAVE',
    });
  }

  if (riskFactors.tenureRisk === 'HIGH') {
    recommendations.push({
      type: 'TENURE_REDUCTION',
      title: 'Consider Shorter Tenure',
      description: 'A shorter loan tenure would reduce total interest paid.',
      priority: 'MEDIUM',
      action: 'REDUCE',
    });
  }

  return recommendations;
}

/**
 * Quick risk assessment (simplified version)
 * @param {number} emi - Monthly EMI
 * @param {number} monthlyIncome - Monthly income
 * @returns {Object} Quick risk assessment
 */
export function quickRiskAssessment(emi, monthlyIncome) {
  try {
    const debtBurdenRatio = (emi / monthlyIncome) * 100;
    
    let riskLevel;
    let explanation;
    
    if (debtBurdenRatio < 20) {
      riskLevel = 'LOW';
      explanation = 'Low risk: Debt burden is within safe limits';
    } else if (debtBurdenRatio <= 35) {
      riskLevel = 'MODERATE';
      explanation = 'Moderate risk: Debt burden requires monitoring';
    } else {
      riskLevel = 'HIGH';
      explanation = 'High risk: Debt burden is concerning';
    }

    return {
      riskLevel,
      debtBurdenRatio: Math.round(debtBurdenRatio * 100) / 100,
      explanation,
      recommendation: getQuickRecommendation(riskLevel),
    };
  } catch (error) {
    throw new Error(`Quick risk assessment failed: ${error.message}`);
  }
}

/**
 * Get quick recommendation
 * @param {string} riskLevel - Risk level
 * @returns {string} Recommendation
 */
function getQuickRecommendation(riskLevel) {
  switch (riskLevel) {
    case 'LOW':
      return 'Proceed with confidence';
    case 'MODERATE':
      return 'Proceed with caution';
    case 'HIGH':
      return 'Reconsider or reduce loan amount';
    default:
      return 'Review financial situation';
  }
}

/**
 * Batch risk assessment for multiple loans
 * @param {Array} loanApplications - Array of loan applications
 * @returns {Array} Risk assessments
 */
export function batchRiskAssessment(loanApplications) {
  try {
    if (!Array.isArray(loanApplications)) {
      throw new Error('Loan applications must be an array');
    }

    if (loanApplications.length === 0) {
      throw new Error('At least one loan application is required');
    }

    if (loanApplications.length > 10) {
      throw new Error('Maximum 10 loan applications can be assessed at once');
    }

    return loanApplications.map((application, index) => {
      try {
        const assessment = calculateLoanRisk(application);
        return {
          ...assessment,
          applicationIndex: index,
        };
      } catch (error) {
        return {
          error: error.message,
          applicationIndex: index,
          riskLevel: 'ERROR',
        };
      }
    });
  } catch (error) {
    throw new Error(`Batch risk assessment failed: ${error.message}`);
  }
}

/**
 * Risk trend analysis over time
 * @param {Array} historicalAssessments - Array of historical risk assessments
 * @returns {Object} Trend analysis
 */
export function analyzeRiskTrend(historicalAssessments) {
  try {
    if (!Array.isArray(historicalAssessments) || historicalAssessments.length < 2) {
      throw new Error('At least 2 historical assessments are required for trend analysis');
    }

    const sortedAssessments = historicalAssessments.sort((a, b) => 
      new Date(a.assessment.timestamp) - new Date(b.assessment.timestamp)
    );

    const trends = {
      debtBurdenTrend: calculateTrend(sortedAssessments.map(a => a.debtBurdenRatio)),
      riskScoreTrend: calculateTrend(sortedAssessments.map(a => a.riskScore)),
      riskLevelTrend: calculateRiskLevelTrend(sortedAssessments.map(a => a.riskLevel.level)),
    };

    return {
      trends,
      summary: generateTrendSummary(trends),
      recommendation: generateTrendRecommendation(trends),
      analysisDate: new Date().toISOString(),
    };
  } catch (error) {
    throw new Error(`Risk trend analysis failed: ${error.message}`);
  }
}

/**
 * Calculate trend direction
 * @param {Array} values - Array of numeric values
 * @returns {string} Trend direction
 */
function calculateTrend(values) {
  if (values.length < 2) return 'INSUFFICIENT_DATA';
  
  const first = values[0];
  const last = values[values.length - 1];
  const change = ((last - first) / first) * 100;
  
  if (Math.abs(change) < 5) return 'STABLE';
  return change > 0 ? 'INCREASING' : 'DECREASING';
}

/**
 * Calculate risk level trend
 * @param {Array} riskLevels - Array of risk levels
 * @returns {string} Trend direction
 */
function calculateRiskLevelTrend(riskLevels) {
  if (riskLevels.length < 2) return 'INSUFFICIENT_DATA';
  
  const levelOrder = { LOW: 1, MODERATE: 2, HIGH: 3 };
  const firstLevel = levelOrder[riskLevels[0]] || 2;
  const lastLevel = levelOrder[riskLevels[riskLevels.length - 1]] || 2;
  
  if (firstLevel === lastLevel) return 'STABLE';
  return lastLevel > firstLevel ? 'WORSENING' : 'IMPROVING';
}

/**
 * Generate trend summary
 * @param {Object} trends - Trend analysis
 * @returns {string} Summary
 */
function generateTrendSummary(trends) {
  const summaries = [];
  
  if (trends.debtBurdenTrend !== 'STABLE') {
    summaries.push(`Debt burden is ${trends.debtBurdenTrend.toLowerCase()}`);
  }
  
  if (trends.riskScoreTrend !== 'STABLE') {
    summaries.push(`Risk score is ${trends.riskScoreTrend.toLowerCase()}`);
  }
  
  if (trends.riskLevelTrend !== 'STABLE') {
    summaries.push(`Risk level is ${trends.riskLevelTrend.toLowerCase()}`);
  }
  
  return summaries.length > 0 ? summaries.join(', ') : 'All metrics are stable';
}

/**
 * Generate trend recommendation
 * @param {Object} trends - Trend analysis
 * @returns {string} Recommendation
 */
function generateTrendRecommendation(trends) {
  if (trends.riskLevelTrend === 'WORSENING') {
    return 'Financial situation is deteriorating. Take immediate action to improve debt management.';
  } else if (trends.riskLevelTrend === 'IMPROVING') {
    return 'Financial situation is improving. Continue current debt management strategies.';
  } else {
    return 'Financial situation is stable. Maintain current debt management practices.';
  }
}

export default calculateLoanRisk;
