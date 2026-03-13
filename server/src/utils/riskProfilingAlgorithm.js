/**
 * FinSathi AI - Investment Risk Profiling Algorithm
 * Comprehensive algorithm to determine user's investment risk tolerance
 */

/**
 * Risk profile constants and thresholds
 */
const RISK_THRESHOLDS = {
  AGE: {
    YOUNG: 35,      // Below 35 = higher risk capacity
    MIDDLE: 50,      // 35-50 = moderate risk capacity
    SENIOR: 65,      // 50-65 = lower risk capacity
    ELDERLY: 65,     // Above 65 = lowest risk capacity
  },
  INCOME: {
    LOW: 50000,        // Below 50K NPR/month = conservative
    MEDIUM: 150000,    // 50K-150K NPR/month = moderate
    HIGH: 300000,      // 150K-300K NPR/month = growth-oriented
    VERY_HIGH: 300000,  // Above 300K NPR/month = aggressive
  },
  SAVINGS: {
    LOW_MONTHS: 3,     // Below 3 months expenses = conservative
    MEDIUM_MONTHS: 6,   // 3-6 months expenses = moderate
    HIGH_MONTHS: 12,    // 6-12 months expenses = growth-oriented
    VERY_HIGH_MONTHS: 12, // Above 12 months expenses = aggressive
  },
  HORIZON: {
    SHORT: 3,          // Below 3 years = conservative
    MEDIUM: 7,         // 3-7 years = moderate
    LONG: 15,          // 7-15 years = growth-oriented
    VERY_LONG: 15,      // Above 15 years = aggressive
  },
  QUESTIONNAIRE: {
    VERY_CONSERVATIVE: 20,  // 0-20 points = very conservative
    CONSERVATIVE: 40,        // 21-40 points = conservative
    MODERATE: 60,            // 41-60 points = moderate
    AGGRESSIVE: 80,            // 61-80 points = aggressive
    VERY_AGGRESSIVE: 100,     // 81-100 points = very aggressive
  },
};

/**
 * Risk profile types
 */
const RISK_PROFILES = {
  CONSERVATIVE: {
    name: 'Conservative',
    description: 'Low risk tolerance with focus on capital preservation',
    characteristics: [
      'Prioritizes safety over returns',
      'Prefers fixed deposits and government bonds',
      'Accepts lower returns for stability',
      'Risk-averse investment approach',
    ],
    recommendedAllocation: {
      equity: 10,
      debt: 60,
      gold: 15,
      realEstate: 5,
      cash: 10,
    },
    expectedReturns: '6-8%',
    riskLevel: 'LOW',
    suitableInvestments: [
      'Fixed Deposits',
      'Government Bonds',
      'Debt Mutual Funds',
      'Savings Accounts',
      'Post Office Schemes',
    ],
  },
  MODERATE: {
    name: 'Moderate',
    description: 'Balanced risk tolerance with mix of safety and growth',
    characteristics: [
      'Willing to take calculated risks',
      'Balanced approach to risk and returns',
      'Diversified investment strategy',
      'Medium-term investment horizon',
    ],
    recommendedAllocation: {
      equity: 35,
      debt: 35,
      gold: 10,
      realEstate: 10,
      cash: 10,
    },
    expectedReturns: '8-12%',
    riskLevel: 'MEDIUM',
    suitableInvestments: [
      'Balanced Mutual Funds',
      'Index Funds',
      'Corporate Bonds',
      'Hybrid Funds',
      'Systematic Investment Plans',
    ],
  },
  AGGRESSIVE: {
    name: 'Aggressive',
    description: 'High risk tolerance with focus on wealth creation',
    characteristics: [
      'Comfortable with market volatility',
      'Focus on long-term wealth creation',
      'Willing to take significant risks',
      'Growth-oriented investment approach',
    ],
    recommendedAllocation: {
      equity: 60,
      debt: 20,
      gold: 5,
      realEstate: 10,
      cash: 5,
    },
    expectedReturns: '12-18%',
    riskLevel: 'HIGH',
    suitableInvestments: [
      'Equity Mutual Funds',
      'Direct Stocks',
      'Sectoral Funds',
      'Small-Cap Funds',
      'International Funds',
    ],
  },
};

/**
 * Calculate age-based risk score
 * @param {number} age - User's age
 * @returns {Object} Age risk analysis
 */
function calculateAgeRisk(age) {
  let score = 0;
  let riskCapacity = 'MEDIUM';
  let explanation = '';

  if (age < RISK_THRESHOLDS.AGE.YOUNG) {
    score = 30; // Higher risk capacity
    riskCapacity = 'HIGH';
    explanation = `At ${age} years, you have a long investment horizon and can recover from market downturns. This allows for higher risk tolerance and potential for greater long-term returns.`;
  } else if (age < RISK_THRESHOLDS.AGE.MIDDLE) {
    score = 20;
    riskCapacity = 'MEDIUM';
    explanation = `At ${age} years, you have a moderate investment horizon. You can take some risk but should maintain a balanced approach with adequate diversification.`;
  } else if (age < RISK_THRESHOLDS.AGE.SENIOR) {
    score = 10;
    riskCapacity = 'LOW';
    explanation = `At ${age} years, you have a shorter investment horizon and may be approaching retirement. A more conservative approach is recommended to preserve capital.`;
  } else {
    score = 5;
    riskCapacity = 'VERY_LOW';
    explanation = `At ${age} years, you have a limited investment horizon and may be retired. Capital preservation should be your primary focus with minimal exposure to volatility.`;
  }

  return { score, riskCapacity, explanation };
}

/**
 * Calculate income-based risk score
 * @param {number} monthlyIncome - Monthly income in NPR
 * @returns {Object} Income risk analysis
 */
function calculateIncomeRisk(monthlyIncome) {
  let score = 0;
  let incomeLevel = 'MEDIUM';
  let explanation = '';

  if (monthlyIncome < RISK_THRESHOLDS.INCOME.LOW) {
    score = 5;
    incomeLevel = 'LOW';
    explanation = `With a monthly income of NPR ${monthlyIncome.toLocaleString()}, you have limited capacity for investment risk. Focus on capital preservation and steady returns.`;
  } else if (monthlyIncome < RISK_THRESHOLDS.INCOME.MEDIUM) {
    score = 15;
    incomeLevel = 'MEDIUM';
    explanation = `With a monthly income of NPR ${monthlyIncome.toLocaleString()}, you have moderate capacity for investment risk. A balanced approach with some growth exposure is appropriate.`;
  } else if (monthlyIncome < RISK_THRESHOLDS.INCOME.HIGH) {
    score = 25;
    incomeLevel = 'HIGH';
    explanation = `With a monthly income of NPR ${monthlyIncome.toLocaleString()}, you have good capacity for investment risk. You can consider growth-oriented investments while maintaining diversification.`;
  } else {
    score = 30;
    incomeLevel = 'VERY_HIGH';
    explanation = `With a monthly income of NPR ${monthlyIncome.toLocaleString()}, you have high capacity for investment risk. You can pursue aggressive growth strategies while managing overall portfolio risk.`;
  }

  return { score, incomeLevel, explanation };
}

/**
 * Calculate savings-based risk score
 * @param {number} monthlyExpenses - Monthly expenses in NPR
 * @param {number} currentSavings - Current total savings in NPR
 * @returns {Object} Savings risk analysis
 */
function calculateSavingsRisk(monthlyExpenses, currentSavings) {
  const emergencyFundMonths = monthlyExpenses > 0 ? currentSavings / monthlyExpenses : 0;
  let score = 0;
  let savingsLevel = 'MEDIUM';
  let explanation = '';

  if (emergencyFundMonths < RISK_THRESHOLDS.SAVINGS.LOW_MONTHS) {
    score = 5;
    savingsLevel = 'LOW';
    explanation = `Your savings of NPR ${currentSavings.toLocaleString()} cover only ${emergencyFundMonths.toFixed(1)} months of expenses. This indicates limited financial cushion, suggesting a more conservative approach until emergency fund is established.`;
  } else if (emergencyFundMonths < RISK_THRESHOLDS.SAVINGS.MEDIUM_MONTHS) {
    score = 15;
    savingsLevel = 'MEDIUM';
    explanation = `Your savings of NPR ${currentSavings.toLocaleString()} cover ${emergencyFundMonths.toFixed(1)} months of expenses. You have a basic emergency fund, allowing for moderate investment risk.`;
  } else if (emergencyFundMonths < RISK_THRESHOLDS.SAVINGS.HIGH_MONTHS) {
    score = 25;
    savingsLevel = 'HIGH';
    explanation = `Your savings of NPR ${currentSavings.toLocaleString()} cover ${emergencyFundMonths.toFixed(1)} months of expenses. You have a solid emergency fund, enabling you to take calculated investment risks.`;
  } else {
    score = 30;
    savingsLevel = 'VERY_HIGH';
    explanation = `Your savings of NPR ${currentSavings.toLocaleString()} cover ${emergencyFundMonths.toFixed(1)} months of expenses. You have excellent financial security, allowing you to pursue aggressive investment strategies.`;
  }

  return { score, savingsLevel, emergencyFundMonths, explanation };
}

/**
 * Calculate investment horizon-based risk score
 * @param {number} investmentHorizonYears - Investment horizon in years
 * @returns {Object} Horizon risk analysis
 */
function calculateHorizonRisk(investmentHorizonYears) {
  let score = 0;
  let horizonLevel = 'MEDIUM';
  let explanation = '';

  if (investmentHorizonYears < RISK_THRESHOLDS.HORIZON.SHORT) {
    score = 5;
    horizonLevel = 'SHORT';
    explanation = `With an investment horizon of ${investmentHorizonYears} years, you have limited time to recover from market downturns. Conservative investments with capital preservation focus are recommended.`;
  } else if (investmentHorizonYears < RISK_THRESHOLDS.HORIZON.MEDIUM) {
    score = 15;
    horizonLevel = 'MEDIUM';
    explanation = `With an investment horizon of ${investmentHorizonYears} years, you have moderate time to ride market cycles. A balanced approach with some growth exposure is appropriate.`;
  } else if (investmentHorizonYears < RISK_THRESHOLDS.HORIZON.LONG) {
    score = 25;
    horizonLevel = 'LONG';
    explanation = `With an investment horizon of ${investmentHorizonYears} years, you have good time to benefit from compounding and recover from market volatility. Growth-oriented investments can be considered.`;
  } else {
    score = 30;
    horizonLevel = 'VERY_LONG';
    explanation = `With an investment horizon of ${investmentHorizonYears} years, you have excellent time to benefit from long-term compounding. You can pursue aggressive growth strategies to maximize returns.`;
  }

  return { score, horizonLevel, explanation };
}

/**
 * Calculate questionnaire-based risk score
 * @param {number} questionnaireScore - Risk questionnaire score (0-100)
 * @returns {Object} Questionnaire risk analysis
 */
function calculateQuestionnaireRisk(questionnaireScore) {
  let score = 0;
  let riskAttitude = 'MODERATE';
  let explanation = '';

  if (questionnaireScore <= RISK_THRESHOLDS.QUESTIONNAIRE.VERY_CONSERVATIVE) {
    score = 5;
    riskAttitude = 'VERY_CONSERVATIVE';
    explanation = `Your questionnaire responses indicate a very conservative risk attitude. You strongly prefer safety and stability over higher returns, suggesting a focus on capital preservation.`;
  } else if (questionnaireScore <= RISK_THRESHOLDS.QUESTIONNAIRE.CONSERVATIVE) {
    score = 10;
    riskAttitude = 'CONSERVATIVE';
    explanation = `Your questionnaire responses indicate a conservative risk attitude. You prefer stable returns with minimal volatility, suggesting a focus on income generation and capital preservation.`;
  } else if (questionnaireScore <= RISK_THRESHOLDS.QUESTIONNAIRE.MODERATE) {
    score = 20;
    riskAttitude = 'MODERATE';
    explanation = `Your questionnaire responses indicate a moderate risk attitude. You're willing to take calculated risks for better returns, suggesting a balanced investment approach.`;
  } else if (questionnaireScore <= RISK_THRESHOLDS.QUESTIONNAIRE.AGGRESSIVE) {
    score = 30;
    riskAttitude = 'AGGRESSIVE';
    explanation = `Your questionnaire responses indicate an aggressive risk attitude. You're comfortable with market volatility and seeking high returns, suggesting a growth-oriented investment strategy.`;
  } else {
    score = 35;
    riskAttitude = 'VERY_AGGRESSIVE';
    explanation = `Your questionnaire responses indicate a very aggressive risk attitude. You're highly comfortable with risk and seeking maximum returns, suggesting an aggressive growth strategy.`;
  }

  return { score, riskAttitude, explanation };
}

/**
 * Calculate weighted risk score
 * @param {Object} components - Risk component scores
 * @returns {number} Weighted risk score
 */
function calculateWeightedRiskScore(components) {
  // Weight different factors based on their importance in risk assessment
  const weights = {
    age: 0.20,           // 20% - Age and time horizon
    income: 0.25,         // 25% - Financial capacity
    savings: 0.25,        // 25% - Financial security
    horizon: 0.20,        // 20% - Investment time frame
    questionnaire: 0.10,   // 10% - Risk attitude
  };

  const weightedScore = 
    (components.age.score * weights.age) +
    (components.income.score * weights.income) +
    (components.savings.score * weights.savings) +
    (components.horizon.score * weights.horizon) +
    (components.questionnaire.score * weights.questionnaire);

  return Math.round(weightedScore);
}

/**
 * Determine risk profile based on score
 * @param {number} finalScore - Final weighted risk score
 * @returns {Object} Risk profile
 */
function determineRiskProfile(finalScore) {
  if (finalScore <= 15) {
    return {
      ...RISK_PROFILES.CONSERVATIVE,
      score: finalScore,
      confidence: 'HIGH',
    };
  } else if (finalScore <= 25) {
    return {
      ...RISK_PROFILES.MODERATE,
      score: finalScore,
      confidence: 'MEDIUM',
    };
  } else {
    return {
      ...RISK_PROFILES.AGGRESSIVE,
      score: finalScore,
      confidence: 'HIGH',
    };
  }
}

/**
 * Generate comprehensive risk explanation
 * @param {Object} components - Risk component analyses
 * @param {Object} finalProfile - Final risk profile
 * @returns {string} Comprehensive explanation
 */
function generateRiskExplanation(components, finalProfile) {
  const explanations = [];

  explanations.push(`**Age Analysis**: ${components.age.explanation}`);
  explanations.push(`**Income Analysis**: ${components.income.explanation}`);
  explanations.push(`**Savings Analysis**: ${components.savings.explanation}`);
  explanations.push(`**Horizon Analysis**: ${components.horizon.explanation}`);
  explanations.push(`**Risk Attitude**: ${components.questionnaire.explanation}`);

  explanations.push(`\n**Final Risk Profile**: ${finalProfile.name}`);
  explanations.push(`**Risk Level**: ${finalProfile.riskLevel}`);
  explanations.push(`**Expected Returns**: ${finalProfile.expectedReturns}`);
  explanations.push(`**Confidence**: ${finalProfile.confidence}`);

  explanations.push(`\n**Investment Characteristics**:`);
  finalProfile.characteristics.forEach(char => {
    explanations.push(`• ${char}`);
  });

  explanations.push(`\n**Recommended Asset Allocation**:`);
  Object.entries(finalProfile.recommendedAllocation).forEach(([asset, percentage]) => {
    explanations.push(`• ${asset.charAt(0).toUpperCase() + asset.slice(1).replace(/([A-Z])/g, ' $1')}: ${percentage}%`);
  });

  explanations.push(`\n**Suitable Investment Options**:`);
  finalProfile.suitableInvestments.forEach(investment => {
    explanations.push(`• ${investment}`);
  });

  return explanations.join('\n');
}

/**
 * Main risk profiling algorithm
 * @param {Object} inputs - User financial and risk data
 * @param {number} inputs.age - User's age
 * @param {number} inputs.monthlyIncome - Monthly income in NPR
 * @param {number} inputs.monthlyExpenses - Monthly expenses in NPR
 * @param {number} inputs.currentSavings - Current total savings in NPR
 * @param {number} inputs.investmentHorizonYears - Investment horizon in years
 * @param {number} inputs.questionnaireScore - Risk questionnaire score (0-100)
 * @returns {Object} Comprehensive risk profile
 */
function calculateRiskProfile(inputs) {
  try {
    // Validate inputs
    const validation = validateInputs(inputs);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error,
        code: validation.code,
      };
    }

    // Calculate individual risk components
    const ageRisk = calculateAgeRisk(inputs.age);
    const incomeRisk = calculateIncomeRisk(inputs.monthlyIncome);
    const savingsRisk = calculateSavingsRisk(inputs.monthlyExpenses, inputs.currentSavings);
    const horizonRisk = calculateHorizonRisk(inputs.investmentHorizonYears);
    const questionnaireRisk = calculateQuestionnaireRisk(inputs.questionnaireScore);

    // Calculate weighted final score
    const finalScore = calculateWeightedRiskScore({
      age: ageRisk,
      income: incomeRisk,
      savings: savingsRisk,
      horizon: horizonRisk,
      questionnaire: questionnaireRisk,
    });

    // Determine final risk profile
    const finalProfile = determineRiskProfile(finalScore);

    // Generate comprehensive explanation
    const explanation = generateRiskExplanation(
      {
        age: ageRisk,
        income: incomeRisk,
        savings: savingsRisk,
        horizon: horizonRisk,
        questionnaire: questionnaireRisk,
      },
      finalProfile
    );

    return {
      success: true,
      data: {
        profile: finalProfile,
        components: {
          age: ageRisk,
          income: incomeRisk,
          savings: savingsRisk,
          horizon: horizonRisk,
          questionnaire: questionnaireRisk,
        },
        scoring: {
          finalScore,
          maxScore: 35,
          percentage: Math.round((finalScore / 35) * 100),
        },
        explanation,
        recommendations: generateRecommendations(finalProfile, inputs),
      },
      meta: {
        calculatedAt: new Date().toISOString(),
        version: '1.0.0',
      },
    };

  } catch (error) {
    return {
      success: false,
      error: 'Failed to calculate risk profile',
      code: 'CALCULATION_ERROR',
      details: error.message,
    };
  }
}

/**
 * Validate input parameters
 * @param {Object} inputs - Input parameters
 * @returns {Object} Validation result
 */
function validateInputs(inputs) {
  const errors = [];

  if (!inputs.age || inputs.age < 18 || inputs.age > 100) {
    errors.push('Age must be between 18 and 100');
  }

  if (!inputs.monthlyIncome || inputs.monthlyIncome < 0) {
    errors.push('Monthly income must be a positive number');
  }

  if (!inputs.monthlyExpenses || inputs.monthlyExpenses < 0) {
    errors.push('Monthly expenses must be a positive number');
  }

  if (!inputs.currentSavings || inputs.currentSavings < 0) {
    errors.push('Current savings must be a positive number');
  }

  if (!inputs.investmentHorizonYears || inputs.investmentHorizonYears < 1 || inputs.investmentHorizonYears > 50) {
    errors.push('Investment horizon must be between 1 and 50 years');
  }

  if (inputs.questionnaireScore === undefined || inputs.questionnaireScore < 0 || inputs.questionnaireScore > 100) {
    errors.push('Questionnaire score must be between 0 and 100');
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      error: errors.join('; '),
      code: 'VALIDATION_ERROR',
    };
  }

  return {
    isValid: true,
  };
}

/**
 * Generate personalized recommendations
 * @param {Object} profile - Risk profile
 * @param {Object} inputs - User inputs
 * @returns {Array} Recommendations
 */
function generateRecommendations(profile, inputs) {
  const recommendations = [];

  // General recommendations based on risk profile
  if (profile.name === 'CONSERVATIVE') {
    recommendations.push({
      type: 'STRATEGY',
      priority: 'HIGH',
      title: 'Focus on Capital Preservation',
      description: 'Prioritize investments that protect your capital while providing steady returns. Consider fixed deposits and government bonds.',
    });
    recommendations.push({
      type: 'EMERGENCY_FUND',
      priority: 'HIGH',
      title: 'Build Emergency Fund',
      description: 'Aim to save at least 6 months of expenses in liquid funds before increasing investment risk.',
    });
  } else if (profile.name === 'MODERATE') {
    recommendations.push({
      type: 'DIVERSIFICATION',
      priority: 'MEDIUM',
      title: 'Maintain Balanced Portfolio',
      description: 'Keep a mix of equity and debt investments. Regular portfolio rebalancing is recommended.',
    });
    recommendations.push({
      type: 'SYSTEMATIC_INVESTMENT',
      priority: 'MEDIUM',
      title: 'Use Systematic Investment Plans',
      description: 'Consider SIPs to average out market volatility and build wealth systematically.',
    });
  } else if (profile.name === 'AGGRESSIVE') {
    recommendations.push({
      type: 'RISK_MANAGEMENT',
      priority: 'HIGH',
      title: 'Monitor Risk Exposure',
      description: 'Regularly review your portfolio risk level. Consider stop-loss and profit-booking strategies.',
    });
    recommendations.push({
      type: 'DIVERSIFICATION',
      priority: 'MEDIUM',
      title: 'Diversify Across Sectors',
      description: 'Spread investments across different sectors to reduce concentration risk.',
    });
  }

  // Age-specific recommendations
  if (inputs.age > 50) {
    recommendations.push({
      type: 'RETIREMENT',
      priority: 'HIGH',
      title: 'Focus on Retirement Planning',
      description: 'Consider increasing allocation to retirement funds and debt instruments as you approach retirement age.',
    });
  }

  // Income-specific recommendations
  if (inputs.monthlyIncome > 200000) {
    recommendations.push({
      type: 'TAX_PLANNING',
      priority: 'MEDIUM',
      title: 'Optimize Tax Efficiency',
      description: 'Consider tax-saving investment options like ELSS funds and NPS for better post-tax returns.',
    });
  }

  // Savings-specific recommendations
  if (inputs.currentSavings < inputs.monthlyExpenses * 3) {
    recommendations.push({
      type: 'EMERGENCY_FUND',
      priority: 'HIGH',
      title: 'Build Emergency Fund First',
      description: 'Before aggressive investing, establish an emergency fund covering at least 3 months of expenses.',
    });
  }

  return recommendations;
}

/**
 * Get risk profile options for UI display
 * @returns {Object} Risk profile options
 */
function getRiskProfileOptions() {
  return {
    profiles: RISK_PROFILES,
    thresholds: RISK_THRESHOLDS,
    questionnaire: [
      {
        id: 'market_volatility',
        question: 'How would you react if your investment portfolio dropped 20% in a month?',
        options: [
          { value: 1, text: 'Sell all investments immediately' },
          { value: 2, text: 'Sell some investments' },
          { value: 3, text: 'Hold investments and wait' },
          { value: 4, text: 'Buy more investments' },
        ],
      },
      {
        id: 'investment_knowledge',
        question: 'How would you rate your investment knowledge?',
        options: [
          { value: 1, text: 'Beginner - Just starting' },
          { value: 2, text: 'Basic - Some understanding' },
          { value: 3, text: 'Intermediate - Comfortable with basics' },
          { value: 4, text: 'Advanced - Deep understanding' },
        ],
      },
      {
        id: 'risk_capacity',
        question: 'What percentage of your portfolio are you willing to lose in a year?',
        options: [
          { value: 1, text: '0% - Cannot afford any loss' },
          { value: 2, text: '0-5% - Minimal loss acceptable' },
          { value: 3, text: '5-15% - Moderate loss acceptable' },
          { value: 4, text: '15%+ - High loss acceptable' },
        ],
      },
      {
        id: 'investment_goal',
        question: 'What is your primary investment goal?',
        options: [
          { value: 1, text: 'Capital preservation' },
          { value: 2, text: 'Regular income' },
          { value: 3, text: 'Balanced growth' },
          { value: 4, text: 'Aggressive growth' },
        ],
      },
      {
        id: 'time_horizon',
        question: 'How long do you plan to stay invested?',
        options: [
          { value: 1, text: 'Less than 1 year' },
          { value: 2, text: '1-3 years' },
          { value: 3, text: '3-7 years' },
          { value: 4, text: 'More than 7 years' },
        ],
      },
    ],
  };
}

// Export the main function and utilities
module.exports = {
  calculateRiskProfile,
  getRiskProfileOptions,
  RISK_PROFILES,
  RISK_THRESHOLDS,
};
