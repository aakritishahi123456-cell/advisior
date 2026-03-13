/**
 * FinSathi AI - Financial Health Scoring System
 * Calculate comprehensive financial health score for users
 */

/**
 * Financial health scoring thresholds and weights
 */
const FINANCIAL_HEALTH_THRESHOLDS = {
  SAVINGS_RATE: {
    EXCELLENT: 30,    // >30% savings rate
    GOOD: 20,         // 20-30% savings rate
    AVERAGE: 10,      // 10-20% savings rate
    POOR: 5,          // 5-10% savings rate
    VERY_POOR: 0,     // <5% savings rate
  },
  DEBT_RATIO: {
    EXCELLENT: 0.3,   // <30% debt ratio
    GOOD: 0.5,        // 30-50% debt ratio
    AVERAGE: 0.7,    // 50-70% debt ratio
    POOR: 1.0,        // 70-100% debt ratio
    VERY_POOR: 1.0,   // >100% debt ratio
  },
  INCOME_STABILITY: {
    EXCELLENT: 0.95,  // >95% stable income
    GOOD: 0.85,       // 85-95% stable income
    AVERAGE: 0.7,     // 70-85% stable income
    POOR: 0.5,        // 50-70% stable income
    VERY_POOR: 0.5,   // <50% stable income
  },
  EMERGENCY_FUND: {
    EXCELLENT: 12,    // >12 months coverage
    GOOD: 6,          // 6-12 months coverage
    AVERAGE: 3,      // 3-6 months coverage
    POOR: 1,          // 1-3 months coverage
    VERY_POOR: 0,     // <1 month coverage
  },
};

/**
 * Scoring weights for different financial health components
 */
const SCORING_WEIGHTS = {
  savingsRate: 0.30,      // 30% weight for savings rate
  debtRatio: 0.25,        // 25% weight for debt ratio
  incomeStability: 0.20,  // 20% weight for income stability
  emergencyFund: 0.25,    // 25% weight for emergency fund
};

/**
 * Financial health categories
 */
const HEALTH_CATEGORIES = {
  EXCELLENT: {
    min: 80,
    max: 100,
    label: 'Excellent',
    description: 'Outstanding financial health with strong savings and low debt',
    color: '#10B981', // Green
    recommendations: [
      'Maintain current excellent financial habits',
      'Consider increasing investments for wealth growth',
      'Review and optimize tax strategies',
      'Explore additional income streams',
    ],
  },
  GOOD: {
    min: 60,
    max: 79,
    label: 'Good',
    description: 'Solid financial health with room for improvement',
    color: '#3B82F6', // Blue
    recommendations: [
      'Continue building emergency fund',
      'Focus on debt reduction',
      'Increase savings rate gradually',
      'Diversify investment portfolio',
    ],
  },
  NEEDS_IMPROVEMENT: {
    min: 40,
    max: 59,
    label: 'Needs Improvement',
    description: 'Financial health requires attention and improvement',
    color: '#F59E0B', // Yellow
    recommendations: [
      'Create and stick to a budget',
      'Build emergency fund priority',
      'Reduce high-interest debt',
      'Increase income through side hustles',
    ],
  },
  RISKY: {
    min: 0,
    max: 39,
    label: 'Risky',
    description: 'Financial health is at risk, immediate action needed',
    color: '#EF4444', // Red
    recommendations: [
      'Seek professional financial advice',
      'Cut non-essential expenses immediately',
      'Focus on debt consolidation',
      'Build basic emergency fund',
    ],
  },
};

/**
 * Calculate comprehensive financial health score
 * @param {Object} financialData - User's financial data
 * @param {Object} options - Additional options
 * @returns {Object} Comprehensive financial health analysis
 */
function calculateFinancialHealthScore(financialData, options = {}) {
  try {
    // Validate input data
    const validation = validateFinancialData(financialData);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error,
        code: validation.code,
      };
    }

    // Calculate individual component scores
    const componentScores = calculateComponentScores(financialData);
    
    // Calculate weighted overall score
    const overallScore = calculateWeightedScore(componentScores, options.weights || SCORING_WEIGHTS);
    
    // Determine health category
    const healthCategory = determineHealthCategory(overallScore);
    
    // Generate detailed analysis
    const analysis = generateFinancialAnalysis(componentScores, overallScore, healthCategory);
    
    // Create action plan
    const actionPlan = createActionPlan(componentScores, healthCategory, financialData);
    
    // Calculate improvement potential
    const improvementPotential = calculateImprovementPotential(componentScores, financialData);

    return {
      success: true,
      data: {
        overallScore: Math.round(overallScore * 100) / 100,
        category: healthCategory,
        componentScores,
        analysis,
        actionPlan,
        improvementPotential,
        recommendations: generateRecommendations(healthCategory, componentScores),
        trends: calculateFinancialTrends(financialData),
      },
      meta: {
        calculatedAt: new Date().toISOString(),
        version: '1.0.0',
        methodology: 'Multi-factor financial health assessment',
        weights: options.weights || SCORING_WEIGHTS,
      },
    };

  } catch (error) {
    return {
      success: false,
      error: 'Failed to calculate financial health score',
      code: 'CALCULATION_ERROR',
      details: error.message,
    };
  }
}

/**
 * Validate financial input data
 * @param {Object} financialData - Financial data to validate
 * @returns {Object} Validation result
 */
function validateFinancialData(financialData) {
  const errors = [];

  // Validate required fields
  if (financialData.savingsRate === undefined || financialData.savingsRate < 0 || financialData.savingsRate > 100) {
    errors.push('Savings rate must be between 0 and 100');
  }

  if (financialData.debtRatio === undefined || financialData.debtRatio < 0 || financialData.debtRatio > 10) {
    errors.push('Debt ratio must be between 0 and 10');
  }

  if (financialData.incomeStability === undefined || financialData.incomeStability < 0 || financialData.incomeStability > 1) {
    errors.push('Income stability must be between 0 and 1');
  }

  if (financialData.emergencyFundMonths === undefined || financialData.emergencyFundMonths < 0 || financialData.emergencyFundMonths > 60) {
    errors.push('Emergency fund months must be between 0 and 60');
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
 * Calculate individual component scores
 * @param {Object} financialData - Financial data
 * @returns {Object} Component scores
 */
function calculateComponentScores(financialData) {
  const { savingsRate, debtRatio, incomeStability, emergencyFundMonths } = financialData;

  // Calculate savings rate score
  const savingsScore = calculateSavingsRateScore(savingsRate);
  
  // Calculate debt ratio score (inverted - lower is better)
  const debtScore = calculateDebtRatioScore(debtRatio);
  
  // Calculate income stability score
  const incomeScore = calculateIncomeStabilityScore(incomeStability);
  
  // Calculate emergency fund score
  const emergencyScore = calculateEmergencyFundScore(emergencyFundMonths);

  return {
    savingsRate: {
      value: savingsRate,
      score: savingsScore,
      category: getComponentCategory(savingsScore, 'savingsRate'),
      weight: SCORING_WEIGHTS.savingsRate,
      description: `Savings rate of ${savingsRate.toFixed(1)}%`,
    },
    debtRatio: {
      value: debtRatio,
      score: debtScore,
      category: getComponentCategory(debtScore, 'debtRatio'),
      weight: SCORING_WEIGHTS.debtRatio,
      description: `Debt-to-income ratio of ${debtRatio.toFixed(2)}`,
    },
    incomeStability: {
      value: incomeStability,
      score: incomeScore,
      category: getComponentCategory(incomeScore, 'incomeStability'),
      weight: SCORING_WEIGHTS.incomeStability,
      description: `Income stability of ${(incomeStability * 100).toFixed(1)}%`,
    },
    emergencyFund: {
      value: emergencyFundMonths,
      score: emergencyScore,
      category: getComponentCategory(emergencyScore, 'emergencyFund'),
      weight: SCORING_WEIGHTS.emergencyFund,
      description: `Emergency fund covering ${emergencyFundMonths.toFixed(1)} months`,
    },
  };
}

/**
 * Calculate savings rate score
 * @param {number} savingsRate - Savings rate percentage
 * @returns {number} Score (0-100)
 */
function calculateSavingsRateScore(savingsRate) {
  const thresholds = FINANCIAL_HEALTH_THRESHOLDS.SAVINGS_RATE;
  
  if (savingsRate >= thresholds.EXCELLENT) return 100;
  if (savingsRate >= thresholds.GOOD) return 80 + ((savingsRate - thresholds.GOOD) / (thresholds.EXCELLENT - thresholds.GOOD)) * 20;
  if (savingsRate >= thresholds.AVERAGE) return 60 + ((savingsRate - thresholds.AVERAGE) / (thresholds.GOOD - thresholds.AVERAGE)) * 20;
  if (savingsRate >= thresholds.POOR) return 40 + ((savingsRate - thresholds.POOR) / (thresholds.AVERAGE - thresholds.POOR)) * 20;
  if (savingsRate >= thresholds.VERY_POOR) return 20 + ((savingsRate - thresholds.VERY_POOR) / (thresholds.POOR - thresholds.VERY_POOR)) * 20;
  return Math.max(0, (savingsRate / thresholds.VERY_POOR) * 20);
}

/**
 * Calculate debt ratio score (inverted - lower debt is better)
 * @param {number} debtRatio - Debt-to-income ratio
 * @returns {number} Score (0-100)
 */
function calculateDebtRatioScore(debtRatio) {
  const thresholds = FINANCIAL_HEALTH_THRESHOLDS.DEBT_RATIO;
  
  if (debtRatio <= thresholds.EXCELLENT) return 100;
  if (debtRatio <= thresholds.GOOD) return 80 - ((debtRatio - thresholds.EXCELLENT) / (thresholds.GOOD - thresholds.EXCELLENT)) * 20;
  if (debtRatio <= thresholds.AVERAGE) return 60 - ((debtRatio - thresholds.GOOD) / (thresholds.AVERAGE - thresholds.GOOD)) * 20;
  if (debtRatio <= thresholds.POOR) return 40 - ((debtRatio - thresholds.AVERAGE) / (thresholds.POOR - thresholds.AVERAGE)) * 20;
  if (debtRatio <= thresholds.VERY_POOR) return 20 - ((debtRatio - thresholds.POOR) / (thresholds.VERY_POOR - thresholds.POOR)) * 20;
  return Math.max(0, 20 - ((debtRatio - thresholds.VERY_POOR) / 2) * 20);
}

/**
 * Calculate income stability score
 * @param {number} incomeStability - Income stability (0-1)
 * @returns {number} Score (0-100)
 */
function calculateIncomeStabilityScore(incomeStability) {
  const thresholds = FINANCIAL_HEALTH_THRESHOLDS.INCOME_STABILITY;
  
  if (incomeStability >= thresholds.EXCELLENT) return 100;
  if (incomeStability >= thresholds.GOOD) return 80 + ((incomeStability - thresholds.GOOD) / (thresholds.EXCELLENT - thresholds.GOOD)) * 20;
  if (incomeStability >= thresholds.AVERAGE) return 60 + ((incomeStability - thresholds.AVERAGE) / (thresholds.GOOD - thresholds.AVERAGE)) * 20;
  if (incomeStability >= thresholds.POOR) return 40 + ((incomeStability - thresholds.POOR) / (thresholds.AVERAGE - thresholds.POOR)) * 20;
  if (incomeStability >= thresholds.VERY_POOR) return 20 + ((incomeStability - thresholds.VERY_POOR) / (thresholds.POOR - thresholds.VERY_POOR)) * 20;
  return Math.max(0, (incomeStability / thresholds.VERY_POOR) * 20);
}

/**
 * Calculate emergency fund score
 * @param {number} emergencyFundMonths - Emergency fund coverage in months
 * @returns {number} Score (0-100)
 */
function calculateEmergencyFundScore(emergencyFundMonths) {
  const thresholds = FINANCIAL_HEALTH_THRESHOLDS.EMERGENCY_FUND;
  
  if (emergencyFundMonths >= thresholds.EXCELLENT) return 100;
  if (emergencyFundMonths >= thresholds.GOOD) return 80 + ((emergencyFundMonths - thresholds.GOOD) / (thresholds.EXCELLENT - thresholds.GOOD)) * 20;
  if (emergencyFundMonths >= thresholds.AVERAGE) return 60 + ((emergencyFundMonths - thresholds.AVERAGE) / (thresholds.GOOD - thresholds.AVERAGE)) * 20;
  if (emergencyFundMonths >= thresholds.POOR) return 40 + ((emergencyFundMonths - thresholds.POOR) / (thresholds.AVERAGE - thresholds.POOR)) * 20;
  if (emergencyFundMonths >= thresholds.VERY_POOR) return 20 + ((emergencyFundMonths - thresholds.VERY_POOR) / (thresholds.POOR - thresholds.VERY_POOR)) * 20;
  return Math.max(0, (emergencyFundMonths / thresholds.VERY_POOR) * 20);
}

/**
 * Get component category based on score
 * @param {number} score - Component score
 * @param {string} componentType - Component type
 * @returns {string} Category
 */
function getComponentCategory(score, componentType) {
  if (score >= 80) return 'EXCELLENT';
  if (score >= 60) return 'GOOD';
  if (score >= 40) return 'AVERAGE';
  return 'POOR';
}

/**
 * Calculate weighted overall score
 * @param {Object} componentScores - Component scores
 * @param {Object} weights - Scoring weights
 * @returns {number} Weighted score (0-100)
 */
function calculateWeightedScore(componentScores, weights) {
  const weightedScore = 
    componentScores.savingsRate.score * weights.savingsRate +
    componentScores.debtRatio.score * weights.debtRatio +
    componentScores.incomeStability.score * weights.incomeStability +
    componentScores.emergencyFund.score * weights.emergencyFund;

  return Math.min(100, Math.max(0, weightedScore));
}

/**
 * Determine health category based on score
 * @param {number} score - Overall score
 * @returns {Object} Health category
 */
function determineHealthCategory(score) {
  for (const [key, category] of Object.entries(HEALTH_CATEGORIES)) {
    if (score >= category.min && score <= category.max) {
      return {
        key,
        ...category,
      };
    }
  }
  return HEALTH_CATEGORIES.RISKY;
}

/**
 * Generate detailed financial analysis
 * @param {Object} componentScores - Component scores
 * @param {number} overallScore - Overall score
 * @param {Object} healthCategory - Health category
 * @returns {Object} Financial analysis
 */
function generateFinancialAnalysis(componentScores, overallScore, healthCategory) {
  const strengths = [];
  const weaknesses = [];
  const opportunities = [];
  const threats = [];

  // Analyze strengths
  Object.entries(componentScores).forEach(([component, data]) => {
    if (data.score >= 70) {
      strengths.push({
        component,
        description: `${component.replace(/([A-Z])/g, ' $1').trim()} is strong (${data.score.toFixed(1)}/100)`,
        impact: data.weight * 100,
      });
    } else if (data.score < 50) {
      weaknesses.push({
        component,
        description: `${component.replace(/([A-Z])/g, ' $1').trim()} needs improvement (${data.score.toFixed(1)}/100)`,
        impact: data.weight * 100,
      });
    } else {
      opportunities.push({
        component,
        description: `${component.replace(/([A-Z])/g, ' $1').trim()} has room for improvement (${data.score.toFixed(1)}/100)`,
        impact: data.weight * 100,
      });
    }
  });

  // Identify threats based on overall score
  if (overallScore < 40) {
    threats.push({
      description: 'Overall financial health is at risk',
      impact: 'HIGH',
    });
    threats.push({
      description: 'Vulnerable to financial emergencies',
      impact: 'HIGH',
    });
  } else if (overallScore < 60) {
    threats.push({
      description: 'Limited financial flexibility',
      impact: 'MEDIUM',
    });
  }

  return {
    strengths,
    weaknesses,
    opportunities,
    threats,
    summary: generateAnalysisSummary(strengths, weaknesses, opportunities, threats, overallScore),
  };
}

/**
 * Generate analysis summary
 * @param {Array} strengths - Strengths
 * @param {Array} weaknesses - Weaknesses
 * @param {Array} opportunities - Opportunities
 * @param {Array} threats - Threats
 * @param {number} overallScore - Overall score
 * @returns {string} Analysis summary
 */
function generateAnalysisSummary(strengths, weaknesses, opportunities, threats, overallScore) {
  let summary = '';

  if (strengths.length > 0) {
    summary += `Your financial health shows ${strengths.length} key strength${strengths.length > 1 ? 's' : ''}. `;
  }

  if (weaknesses.length > 0) {
    summary += `Areas needing attention include ${weaknesses.map(w => w.description.split(' ')[0]).join(' and ')}. `;
  }

  if (opportunities.length > 0) {
    summary += `There are ${opportunities.length} area${opportunities.length > 1 ? 's' : ''} for improvement. `;
  }

  if (threats.length > 0) {
    summary += `Key risks to monitor include ${threats.map(t => t.description).join(' and ')}. `;
  }

  summary += `Overall financial health score is ${overallScore.toFixed(1)}/100, indicating ${overallScore >= 80 ? 'excellent' : overallScore >= 60 ? 'good' : overallScore >= 40 ? 'moderate' : 'risky'} financial condition.`;

  return summary;
}

/**
 * Create action plan for improvement
 * @param {Object} componentScores - Component scores
 * @param {Object} healthCategory - Health category
 * @param {Object} financialData - Financial data
 * @returns {Object} Action plan
 */
function createActionPlan(componentScores, healthCategory, financialData) {
  const actions = [];
  const priorities = [];

  // Generate actions based on component scores
  Object.entries(componentScores).forEach(([component, data]) => {
    if (data.score < 50) {
      const componentActions = generateComponentActions(component, data, financialData);
      actions.push(...componentActions);
      priorities.push({
        component,
        priority: 'HIGH',
        score: data.score,
        weight: data.weight,
      });
    } else if (data.score < 70) {
      const componentActions = generateComponentActions(component, data, financialData);
      actions.push(...componentActions);
      priorities.push({
        component,
        priority: 'MEDIUM',
        score: data.score,
        weight: data.weight,
      });
    }
  });

  // Sort priorities by impact (score * weight)
  priorities.sort((a, b) => (b.score * b.weight) - (a.score * a.weight));

  return {
    immediate: actions.filter(action => action.priority === 'IMMEDIATE'),
    shortTerm: actions.filter(action => action.priority === 'SHORT_TERM'),
    longTerm: actions.filter(action => action.priority === 'LONG_TERM'),
    priorities,
    estimatedTimeframe: calculateImprovementTimeframe(componentScores, healthCategory),
  };
}

/**
 * Generate actions for specific component
 * @param {string} component - Component name
 * @param {Object} data - Component data
 * @param {Object} financialData - Financial data
 * @returns {Array} Component actions
 */
function generateComponentActions(component, data, financialData) {
  const actions = [];

  switch (component) {
    case 'savingsRate':
      if (data.value < 10) {
        actions.push({
          priority: 'IMMEDIATE',
          title: 'Increase Savings Rate',
          description: 'Reduce non-essential expenses and automate savings',
          timeframe: '1-3 months',
          impact: 'HIGH',
          difficulty: 'MEDIUM',
        });
      } else if (data.value < 20) {
        actions.push({
          priority: 'SHORT_TERM',
          title: 'Optimize Savings',
          description: 'Review budget and find additional savings opportunities',
          timeframe: '3-6 months',
          impact: 'MEDIUM',
          difficulty: 'LOW',
        });
      }
      break;

    case 'debtRatio':
      if (data.value > 1.0) {
        actions.push({
          priority: 'IMMEDIATE',
          title: 'Reduce High-Interest Debt',
          description: 'Focus on paying off debt with highest interest rates first',
          timeframe: '6-12 months',
          impact: 'HIGH',
          difficulty: 'HIGH',
        });
      } else if (data.value > 0.5) {
        actions.push({
          priority: 'SHORT_TERM',
          title: 'Debt Consolidation',
          description: 'Consider consolidating debts to lower interest rates',
          timeframe: '3-6 months',
          impact: 'MEDIUM',
          difficulty: 'MEDIUM',
        });
      }
      break;

    case 'emergencyFund':
      if (data.value < 3) {
        actions.push({
          priority: 'IMMEDIATE',
          title: 'Build Emergency Fund',
          description: 'Save 3-6 months of expenses in liquid account',
          timeframe: '6-12 months',
          impact: 'HIGH',
          difficulty: 'MEDIUM',
        });
      } else if (data.value < 6) {
        actions.push({
          priority: 'SHORT_TERM',
          title: 'Strengthen Emergency Fund',
          description: 'Increase emergency fund to 6 months of expenses',
          timeframe: '6-12 months',
          impact: 'MEDIUM',
          difficulty: 'LOW',
        });
      }
      break;

    case 'incomeStability':
      if (data.value < 0.7) {
        actions.push({
          priority: 'SHORT_TERM',
          title: 'Improve Income Stability',
          description: 'Develop additional income streams and skills',
          timeframe: '6-12 months',
          impact: 'MEDIUM',
          difficulty: 'HIGH',
        });
      }
      break;
  }

  return actions;
}

/**
 * Calculate improvement timeframe
 * @param {Object} componentScores - Component scores
 * @param {Object} healthCategory - Health category
 * @returns {string} Timeframe
 */
function calculateImprovementTimeframe(componentScores, healthCategory) {
  const avgScore = Object.values(componentScores).reduce((sum, comp) => sum + comp.score, 0) / Object.keys(componentScores).length;

  if (avgScore < 30) return '12-18 months';
  if (avgScore < 50) return '6-12 months';
  if (avgScore < 70) return '3-6 months';
  return '1-3 months';
}

/**
 * Calculate improvement potential
 * @param {Object} componentScores - Component scores
 * @param {Object} financialData - Financial data
 * @returns {Object} Improvement potential
 */
function calculateImprovementPotential(componentScores, financialData) {
  const currentScore = Object.values(componentScores).reduce((sum, comp) => sum + (comp.score * comp.weight), 0);
  const maxPossibleScore = 100;
  
  // Calculate potential improvements for each component
  const componentImprovements = {};
  
  Object.entries(componentScores).forEach(([component, data]) => {
    const currentComponentScore = data.score;
    const maxComponentScore = 100;
    const improvementPotential = maxComponentScore - currentComponentScore;
    const weightedImpact = improvementPotential * data.weight;
    
    componentImprovements[component] = {
      currentScore: currentComponentScore,
      potentialScore: maxComponentScore,
      improvementPotential,
      weightedImpact,
      priority: weightedImpact > 20 ? 'HIGH' : weightedImpact > 10 ? 'MEDIUM' : 'LOW',
    };
  });

  // Sort components by improvement potential
  const sortedComponents = Object.entries(componentImprovements)
    .sort(([, a], [, b]) => b.weightedImpact - a.weightedImpact)
    .map(([component, data]) => ({ component, ...data }));

  return {
    currentOverallScore: currentScore,
    maxPossibleScore,
    totalImprovementPotential: maxPossibleScore - currentScore,
    componentImprovements: sortedComponents,
    quickWins: sortedComponents.filter(comp => comp.improvementPotential > 30 && comp.priority === 'HIGH'),
    longTermGoals: sortedComponents.filter(comp => comp.improvementPotential > 20 && comp.priority === 'MEDIUM'),
  };
}

/**
 * Generate personalized recommendations
 * @param {Object} healthCategory - Health category
 * @param {Object} componentScores - Component scores
 * @returns {Array} Recommendations
 */
function generateRecommendations(healthCategory, componentScores) {
  const recommendations = [...healthCategory.recommendations];

  // Add component-specific recommendations
  Object.entries(componentScores).forEach(([component, data]) => {
    if (data.score < 50) {
      recommendations.push(...getComponentRecommendations(component, data));
    }
  });

  // Remove duplicates and limit to top recommendations
  const uniqueRecommendations = [...new Set(recommendations)];
  return uniqueRecommendations.slice(0, 8);
}

/**
 * Get component-specific recommendations
 * @param {string} component - Component name
 * @param {Object} data - Component data
 * @returns {Array} Recommendations
 */
function getComponentRecommendations(component, data) {
  const recommendations = [];

  switch (component) {
    case 'savingsRate':
      recommendations.push('Automate savings through direct deposit');
      recommendations.push('Track expenses using budgeting apps');
      recommendations.push('Set specific savings goals');
      break;
    case 'debtRatio':
      recommendations.push('Create debt repayment plan');
      recommendations.push('Negotiate lower interest rates with lenders');
      recommendations.push('Avoid taking on new debt');
      break;
    case 'emergencyFund':
      recommendations.push('Open high-yield savings account for emergency fund');
      recommendations.push('Keep emergency fund separate from other accounts');
      recommendations.push('Review and adjust emergency fund size annually');
      break;
    case 'incomeStability':
      recommendations.push('Develop marketable skills');
      recommendations.push('Create passive income streams');
      recommendations.push('Build professional network');
      break;
  }

  return recommendations;
}

/**
 * Calculate financial trends (placeholder for future enhancement)
 * @param {Object} financialData - Financial data
 * @returns {Object} Financial trends
 */
function calculateFinancialTrends(financialData) {
  // This would typically use historical data
  // For now, return placeholder trends
  return {
    savingsTrend: 'STABLE',
    debtTrend: 'DECREASING',
    incomeTrend: 'STABLE',
    emergencyFundTrend: 'INCREASING',
    overallTrend: 'IMPROVING',
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Get financial health category by score
 * @param {number} score - Financial health score
 * @returns {Object} Health category
 */
function getHealthCategory(score) {
  return determineHealthCategory(score);
}

/**
 * Quick score calculation for simple use cases
 * @param {Object} financialData - Basic financial data
 * @returns {number} Quick score (0-100)
 */
function quickFinancialHealthScore(financialData) {
  const result = calculateFinancialHealthScore(financialData);
  return result.success ? result.data.overallScore : 0;
}

// Export the main functions and utilities
module.exports = {
  calculateFinancialHealthScore,
  quickFinancialHealthScore,
  getHealthCategory,
  FINANCIAL_HEALTH_THRESHOLDS,
  SCORING_WEIGHTS,
  HEALTH_CATEGORIES,
  // Utility functions for advanced usage
  validateFinancialData,
  calculateComponentScores,
  calculateWeightedScore,
  determineHealthCategory,
  generateFinancialAnalysis,
  createActionPlan,
  calculateImprovementPotential,
};
