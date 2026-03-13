/**
 * FinSathi AI - Financial Health Scoring System
 * Comprehensive company health scoring based on financial ratios
 */

/**
 * Calculate financial health score based on key financial metrics
 * 
 * @param {Object} financialMetrics - Financial metrics object
 * @param {number} financialMetrics.roe - Return on Equity percentage
 * @param {number} financialMetrics.debtRatio - Debt to Equity ratio
 * @param {number} financialMetrics.profitMargin - Net Profit Margin percentage
 * @param {number} financialMetrics.revenueGrowth - Revenue growth percentage
 * @param {Object} options - Scoring options
 * @returns {Object} Financial health score with details
 */
function calculateFinancialHealthScore(financialMetrics, options = {}) {
  const {
    industry = null,
    companySize = 'MEDIUM',
    weighting = 'BALANCED',
    includeDetails = true,
  } = options;

  // Validate input metrics
  const validation = validateFinancialMetrics(financialMetrics);
  if (!validation.isValid) {
    return {
      score: 0,
      category: 'INVALID_DATA',
      valid: false,
      errors: validation.errors,
      details: null,
    };
  }

  // Get industry weights if specified
  const weights = getIndustryWeights(industry, weighting);
  
  // Calculate individual component scores
  const componentScores = {
    roe: calculateROEScore(financialMetrics.roe, weights.roe),
    debtRatio: calculateDebtRatioScore(financialMetrics.debtRatio, weights.debtRatio),
    profitMargin: calculateProfitMarginScore(financialMetrics.profitMargin, weights.profitMargin),
    revenueGrowth: calculateRevenueGrowthScore(financialMetrics.revenueGrowth, weights.revenueGrowth),
  };

  // Calculate weighted final score
  const finalScore = calculateWeightedScore(componentScores, weights);

  // Determine category
  const category = getScoreCategory(finalScore);

  // Generate insights and recommendations
  const insights = generateInsights(componentScores, financialMetrics, industry);
  const recommendations = generateRecommendations(componentScores, category);

  // Calculate confidence level
  const confidence = calculateConfidence(financialMetrics, componentScores);

  const result = {
    score: Math.round(finalScore),
    category,
    valid: true,
    confidence,
    componentScores,
    weights,
    insights,
    recommendations,
    metadata: {
      calculationDate: new Date().toISOString(),
      industry,
      companySize,
      weighting,
      dataQuality: assessDataQuality(financialMetrics),
    },
  };

  // Include detailed breakdown if requested
  if (includeDetails) {
    result.details = generateDetailedBreakdown(componentScores, weights, financialMetrics);
  }

  return result;
}

/**
 * Calculate ROE (Return on Equity) component score
 * 
 * @param {number} roe - ROE percentage
 * @param {number} weight - ROE weight in final score
 * @returns {Object} ROE score details
 */
function calculateROEScore(roe, weight) {
  if (roe === null || roe === undefined) {
    return { score: 0, weight, grade: 'F', description: 'No data available' };
  }

  let score, grade, description;

  if (roe >= 20) {
    score = 100;
    grade = 'A+';
    description = 'Exceptional return on equity';
  } else if (roe >= 15) {
    score = 90;
    grade = 'A';
    description = 'Excellent return on equity';
  } else if (roe >= 12) {
    score = 80;
    grade = 'B+';
    description = 'Very good return on equity';
  } else if (roe >= 8) {
    score = 70;
    grade = 'B';
    description = 'Good return on equity';
  } else if (roe >= 5) {
    score = 60;
    grade = 'C+';
    description = 'Average return on equity';
  } else if (roe >= 0) {
    score = 40;
    grade = 'C';
    description = 'Poor return on equity';
  } else {
    score = 20;
    grade = 'F';
    description = 'Negative return on equity';
  }

  return { score, weight, grade, description, value: roe };
}

/**
 * Calculate Debt Ratio component score
 * 
 * @param {number} debtRatio - Debt to Equity ratio
 * @param {number} weight - Debt ratio weight in final score
 * @returns {Object} Debt ratio score details
 */
function calculateDebtRatioScore(debtRatio, weight) {
  if (debtRatio === null || debtRatio === undefined) {
    return { score: 0, weight, grade: 'F', description: 'No data available' };
  }

  let score, grade, description;

  if (debtRatio <= 0.3) {
    score = 100;
    grade = 'A+';
    description = 'Very conservative debt level';
  } else if (debtRatio <= 0.5) {
    score = 90;
    grade = 'A';
    description = 'Conservative debt level';
  } else if (debtRatio <= 0.8) {
    score = 80;
    grade = 'B+';
    description = 'Moderate debt level';
  } else if (debtRatio <= 1.2) {
    score = 65;
    grade = 'B';
    description = 'Elevated debt level';
  } else if (debtRatio <= 2.0) {
    score = 45;
    grade = 'C';
    description = 'High debt level';
  } else {
    score = 20;
    grade = 'F';
    description = 'Very high debt level';
  }

  return { score, weight, grade, description, value: debtRatio };
}

/**
 * Calculate Profit Margin component score
 * 
 * @param {number} profitMargin - Net Profit Margin percentage
 * @param {number} weight - Profit margin weight in final score
 * @returns {Object} Profit margin score details
 */
function calculateProfitMarginScore(profitMargin, weight) {
  if (profitMargin === null || profitMargin === undefined) {
    return { score: 0, weight, grade: 'F', description: 'No data available' };
  }

  let score, grade, description;

  if (profitMargin >= 20) {
    score = 100;
    grade = 'A+';
    description = 'Exceptional profit margins';
  } else if (profitMargin >= 15) {
    score = 90;
    grade = 'A';
    description = 'Excellent profit margins';
  } else if (profitMargin >= 10) {
    score = 80;
    grade = 'B+';
    description = 'Very good profit margins';
  } else if (profitMargin >= 5) {
    score = 70;
    grade = 'B';
    description = 'Good profit margins';
  } else if (profitMargin >= 0) {
    score = 50;
    grade = 'C';
    description = 'Low profit margins';
  } else {
    score = 20;
    grade = 'F';
    description = 'Negative profit margins';
  }

  return { score, weight, grade, description, value: profitMargin };
}

/**
 * Calculate Revenue Growth component score
 * 
 * @param {number} revenueGrowth - Revenue growth percentage
 * @param {number} weight - Revenue growth weight in final score
 * @returns {Object} Revenue growth score details
 */
function calculateRevenueGrowthScore(revenueGrowth, weight) {
  if (revenueGrowth === null || revenueGrowth === undefined) {
    return { score: 50, weight, grade: 'C', description: 'No growth data available' };
  }

  let score, grade, description;

  if (revenueGrowth >= 25) {
    score = 100;
    grade = 'A+';
    description = 'Exceptional revenue growth';
  } else if (revenueGrowth >= 15) {
    score = 90;
    grade = 'A';
    description = 'Excellent revenue growth';
  } else if (revenueGrowth >= 10) {
    score = 85;
    grade = 'B+';
    description = 'Very good revenue growth';
  } else if (revenueGrowth >= 5) {
    score = 75;
    grade = 'B';
    description = 'Good revenue growth';
  } else if (revenueGrowth >= 0) {
    score = 65;
    grade = 'C+';
    description = 'Modest revenue growth';
  } else if (revenueGrowth >= -10) {
    score = 40;
    grade = 'C';
    description = 'Declining revenue';
  } else {
    score = 15;
    grade = 'F';
    description = 'Severe revenue decline';
  }

  return { score, weight, grade, description, value: revenueGrowth };
}

/**
 * Calculate weighted final score from component scores
 * 
 * @param {Object} componentScores - Individual component scores
 * @param {Object} weights - Weight configuration
 * @returns {number} Final weighted score
 */
function calculateWeightedScore(componentScores, weights) {
  const totalWeight = weights.roe + weights.debtRatio + weights.profitMargin + weights.revenueGrowth;
  
  const weightedSum = 
    (componentScores.roe.score * weights.roe) +
    (componentScores.debtRatio.score * weights.debtRatio) +
    (componentScores.profitMargin.score * weights.profitMargin) +
    (componentScores.revenueGrowth.score * weights.revenueGrowth);

  return weightedSum / totalWeight;
}

/**
 * Get score category based on final score
 * 
 * @param {number} score - Final score (0-100)
 * @returns {string} Category name
 */
function getScoreCategory(score) {
  if (score >= 80) return 'STRONG';
  if (score >= 60) return 'MODERATE';
  return 'RISKY';
}

/**
 * Get industry-specific weights for scoring
 * 
 * @param {string} industry - Industry name
 * @param {string} weighting - Weighting strategy
 * @returns {Object} Industry-specific weights
 */
function getIndustryWeights(industry, weighting = 'BALANCED') {
  const baseWeights = {
    roe: 30,
    debtRatio: 25,
    profitMargin: 25,
    revenueGrowth: 20,
  };

  // Industry-specific adjustments
  const industryAdjustments = {
    'BANKING': { roe: 35, debtRatio: 30, profitMargin: 20, revenueGrowth: 15 },
    'INSURANCE': { roe: 30, debtRatio: 35, profitMargin: 25, revenueGrowth: 10 },
    'TECHNOLOGY': { roe: 25, debtRatio: 20, profitMargin: 30, revenueGrowth: 25 },
    'MANUFACTURING': { roe: 30, debtRatio: 25, profitMargin: 30, revenueGrowth: 15 },
    'RETAIL': { roe: 25, debtRatio: 20, profitMargin: 35, revenueGrowth: 20 },
    'TELECOMMUNICATIONS': { roe: 30, debtRatio: 30, profitMargin: 25, revenueGrowth: 15 },
  };

  // Weighting strategy adjustments
  const weightingAdjustments = {
    'GROWTH_FOCUSED': { roe: 20, debtRatio: 20, profitMargin: 20, revenueGrowth: 40 },
    'PROFITABILITY_FOCUSED': { roe: 35, debtRatio: 20, profitMargin: 35, revenueGrowth: 10 },
    'STABILITY_FOCUSED': { roe: 25, debtRatio: 40, profitMargin: 25, revenueGrowth: 10 },
    'BALANCED': baseWeights,
  };

  let finalWeights = { ...baseWeights };
  
  // Apply industry adjustments
  if (industry && industryAdjustments[industry.toUpperCase()]) {
    finalWeights = { ...finalWeights, ...industryAdjustments[industry.toUpperCase()] };
  }
  
  // Apply weighting strategy
  if (weightingAdjustments[weighting]) {
    finalWeights = { ...finalWeights, ...weightingAdjustments[weighting] };
  }

  return finalWeights;
}

/**
 * Generate insights based on component scores
 * 
 * @param {Object} componentScores - Individual component scores
 * @param {Object} metrics - Original financial metrics
 * @param {string} industry - Industry context
 * @returns {Array} Array of insights
 */
function generateInsights(componentScores, metrics, industry) {
  const insights = [];

  // ROE Insights
  if (componentScores.roe.score >= 80) {
    insights.push('Strong shareholder returns indicate effective management');
  } else if (componentScores.roe.score < 50) {
    insights.push('Low ROE suggests operational inefficiencies or poor capital allocation');
  }

  // Debt Ratio Insights
  if (componentScores.debtRatio.score >= 80) {
    insights.push('Conservative debt structure provides financial flexibility');
  } else if (componentScores.debtRatio.score < 50) {
    insights.push('High debt burden may limit growth opportunities');
  }

  // Profit Margin Insights
  if (componentScores.profitMargin.score >= 80) {
    insights.push('Strong pricing power and operational efficiency');
  } else if (componentScores.profitMargin.score < 60) {
    insights.push('Low margins suggest competitive pressure or cost inefficiencies');
  }

  // Revenue Growth Insights
  if (componentScores.revenueGrowth.score >= 80) {
    insights.push('Strong growth indicates market expansion or product success');
  } else if (componentScores.revenueGrowth.score < 40) {
    insights.push('Declining revenue requires strategic intervention');
  }

  // Combined Insights
  if (componentScores.roe.score >= 80 && componentScores.debtRatio.score >= 80) {
    insights.push('Optimal balance of profitability and financial stability');
  }

  if (componentScores.roe.score < 50 && componentScores.debtRatio.score < 50) {
    insights.push('Concerning combination of low profitability and high debt');
  }

  return insights;
}

/**
 * Generate recommendations based on scores and category
 * 
 * @param {Object} componentScores - Individual component scores
 * @param {string} category - Score category
 * @returns {Array} Array of recommendations
 */
function generateRecommendations(componentScores, category) {
  const recommendations = [];

  if (category === 'STRONG') {
    recommendations.push('Maintain current operational strategies');
    recommendations.push('Consider strategic investments for growth');
  } else if (category === 'MODERATE') {
    // Specific recommendations based on weak areas
    if (componentScores.roe.score < 70) {
      recommendations.push('Improve operational efficiency to boost ROE');
    }
    if (componentScores.debtRatio.score < 60) {
      recommendations.push('Implement debt reduction strategies');
    }
    if (componentScores.profitMargin.score < 70) {
      recommendations.push('Review pricing strategy and cost structure');
    }
    if (componentScores.revenueGrowth.score < 60) {
      recommendations.push('Explore new markets or product innovations');
    }
  } else if (category === 'RISKY') {
    recommendations.push('Immediate operational review required');
    recommendations.push('Consider cost restructuring');
    recommendations.push('Evaluate debt refinancing options');
    recommendations.push('Assess market position and competitive threats');
  }

  return recommendations;
}

/**
 * Validate input financial metrics
 * 
 * @param {Object} metrics - Financial metrics to validate
 * @returns {Object} Validation result
 */
function validateFinancialMetrics(metrics) {
  const errors = [];
  const requiredFields = ['roe', 'debtRatio', 'profitMargin', 'revenueGrowth'];

  requiredFields.forEach(field => {
    if (metrics[field] === null || metrics[field] === undefined) {
      errors.push(`Missing required field: ${field}`);
    } else if (typeof metrics[field] !== 'number' || isNaN(metrics[field])) {
      errors.push(`Invalid data type for ${field}: must be a number`);
    }
  });

  // Range validation
  if (metrics.roe !== undefined && (metrics.roe < -100 || metrics.roe > 100)) {
    errors.push('ROE outside reasonable range (-100% to 100%)');
  }

  if (metrics.debtRatio !== undefined && (metrics.debtRatio < 0 || metrics.debtRatio > 10)) {
    errors.push('Debt ratio outside reasonable range (0 to 10)');
  }

  if (metrics.profitMargin !== undefined && (metrics.profitMargin < -100 || metrics.profitMargin > 100)) {
    errors.push('Profit margin outside reasonable range (-100% to 100%)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Assess overall data quality
 * 
 * @param {Object} metrics - Financial metrics
 * @returns {Object} Data quality assessment
 */
function assessDataQuality(metrics) {
  const totalFields = 4;
  const validFields = Object.values(metrics).filter(value => 
    value !== null && value !== undefined && !isNaN(value)
  ).length;

  const completeness = (validFields / totalFields) * 100;
  
  let quality = 'EXCELLENT';
  if (completeness < 80) quality = 'POOR';
  else if (completeness < 100) quality = 'FAIR';

  return { completeness, quality };
}

/**
 * Calculate confidence level in the score
 * 
 * @param {Object} metrics - Original financial metrics
 * @param {Object} componentScores - Calculated component scores
 * @returns {string} Confidence level
 */
function calculateConfidence(metrics, componentScores) {
  const dataQuality = assessDataQuality(metrics);
  
  // Check for extreme values that might indicate data issues
  const hasExtremeValues = Object.values(componentScores).some(score => 
    score.grade === 'F' || score.grade === 'A+'
  );

  if (dataQuality.completeness < 80 || hasExtremeValues) {
    return 'LOW';
  } else if (dataQuality.completeness < 100) {
    return 'MEDIUM';
  } else {
    return 'HIGH';
  }
}

/**
 * Generate detailed breakdown for analysis
 * 
 * @param {Object} componentScores - Individual component scores
 * @param {Object} weights - Applied weights
 * @param {Object} metrics - Original metrics
 * @returns {Object} Detailed breakdown
 */
function generateDetailedBreakdown(componentScores, weights, metrics) {
  return {
    components: componentScores,
    weighting: {
      strategy: 'BALANCED',
      industry: null,
      weights,
    },
    calculations: {
      weightedScores: Object.entries(componentScores).map(([key, score]) => ({
        metric: key,
        score: score.score,
        weight: score.weight,
        weightedContribution: (score.score * score.weight) / 100,
      })),
      totalWeight: Object.values(weights).reduce((sum, weight) => sum + weight, 0),
    },
    rawData: metrics,
  };
}

// Export all functions
module.exports = {
  // Main scoring function
  calculateFinancialHealthScore,
  
  // Component scoring functions
  calculateROEScore,
  calculateDebtRatioScore,
  calculateProfitMarginScore,
  calculateRevenueGrowthScore,
  
  // Utility functions
  getScoreCategory,
  getIndustryWeights,
  generateInsights,
  generateRecommendations,
  validateFinancialMetrics,
  assessDataQuality,
  calculateConfidence,
  
  // Constants
  SCORE_CATEGORIES: {
    STRONG: { min: 80, max: 100, description: 'Strong financial health' },
    MODERATE: { min: 60, max: 79, description: 'Moderate financial health' },
    RISKY: { min: 0, max: 59, description: 'Risky financial position' },
  },
  
  INDUSTRY_WEIGHTS: {
    BALANCED: { roe: 30, debtRatio: 25, profitMargin: 25, revenueGrowth: 20 },
    GROWTH_FOCUSED: { roe: 20, debtRatio: 20, profitMargin: 20, revenueGrowth: 40 },
    PROFITABILITY_FOCUSED: { roe: 35, debtRatio: 20, profitMargin: 35, revenueGrowth: 10 },
    STABILITY_FOCUSED: { roe: 25, debtRatio: 40, profitMargin: 25, revenueGrowth: 10 },
  },
  
  GRADE_MAPPING: {
    'A+': { min: 95, max: 100, description: 'Exceptional' },
    'A': { min: 90, max: 94, description: 'Excellent' },
    'B+': { min: 80, max: 89, description: 'Very Good' },
    'B': { min: 70, max: 79, description: 'Good' },
    'C+': { min: 60, max: 69, description: 'Average' },
    'C': { min: 40, max: 59, description: 'Poor' },
    'F': { min: 0, max: 39, description: 'Failing' },
  },
};
