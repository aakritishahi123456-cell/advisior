/**
 * FinSathi AI - Financial Ratio Calculation Engine
 * Comprehensive financial ratio calculations for company analysis
 */

/**
 * Calculate Return on Equity (ROE)
 * ROE = (Net Profit / Shareholders' Equity) × 100
 * 
 * @param {number} netProfit - Net profit after tax
 * @param {number} totalEquity - Total shareholders' equity
 * @returns {number|null} ROE percentage or null if invalid
 */
function calculateROE(netProfit, totalEquity) {
  if (!isValidNumber(netProfit) || !isValidNumber(totalEquity)) {
    return null;
  }

  if (totalEquity === 0) {
    return null; // Avoid division by zero
  }

  const roe = (netProfit / totalEquity) * 100;
  return round(roe, 2);
}

/**
 * Calculate Debt to Equity Ratio
 * D/E = Total Debt / Shareholders' Equity
 * 
 * @param {number} totalDebt - Total debt
 * @param {number} totalEquity - Total shareholders' equity
 * @returns {number|null} Debt-to-equity ratio or null if invalid
 */
function calculateDebtToEquity(totalDebt, totalEquity) {
  if (!isValidNumber(totalDebt) || !isValidNumber(totalEquity)) {
    return null;
  }

  if (totalEquity === 0) {
    return totalDebt > 0 ? Infinity : 0; // Handle zero equity case
  }

  const debtToEquity = totalDebt / totalEquity;
  return round(debtToEquity, 2);
}

/**
 * Calculate Net Profit Margin
 * Net Profit Margin = (Net Profit / Revenue) × 100
 * 
 * @param {number} netProfit - Net profit after tax
 * @param {number} revenue - Total revenue
 * @returns {number|null} Net profit margin percentage or null if invalid
 */
function calculateNetProfitMargin(netProfit, revenue) {
  if (!isValidNumber(netProfit) || !isValidNumber(revenue)) {
    return null;
  }

  if (revenue === 0) {
    return netProfit > 0 ? Infinity : (netProfit < 0 ? -Infinity : 0);
  }

  const margin = (netProfit / revenue) * 100;
  return round(margin, 2);
}

/**
 * Calculate Asset Turnover Ratio
 * Asset Turnover = Revenue / Total Assets
 * 
 * @param {number} revenue - Total revenue
 * @param {number} totalAssets - Total assets
 * @returns {number|null} Asset turnover ratio or null if invalid
 */
function calculateAssetTurnover(revenue, totalAssets) {
  if (!isValidNumber(revenue) || !isValidNumber(totalAssets)) {
    return null;
  }

  if (totalAssets === 0) {
    return revenue > 0 ? Infinity : 0;
  }

  const turnover = revenue / totalAssets;
  return round(turnover, 2);
}

/**
 * Calculate Earnings Per Share (EPS)
 * EPS = Net Profit / Weighted Average Shares Outstanding
 * 
 * @param {number} netProfit - Net profit after tax
 * @param {number} sharesOutstanding - Number of shares outstanding
 * @returns {number|null} EPS value or null if invalid
 */
function calculateEPS(netProfit, sharesOutstanding) {
  if (!isValidNumber(netProfit) || !isValidNumber(sharesOutstanding)) {
    return null;
  }

  if (sharesOutstanding === 0) {
    return null; // Avoid division by zero
  }

  const eps = netProfit / sharesOutstanding;
  return round(eps, 2);
}

/**
 * Calculate comprehensive financial ratios from FinancialReport data
 * 
 * @param {Object} financialReport - Financial report data
 * @param {Object} options - Calculation options
 * @returns {Object} Structured ratio calculations
 */
function calculateFinancialRatios(financialReport, options = {}) {
  const {
    includeAdvancedRatios = false,
    sharesOutstanding = null,
    industry = null,
    year = null,
  } = options;

  // Extract basic financial data
  const {
    revenue = null,
    netProfit = null,
    totalAssets = null,
    totalEquity = null,
    totalDebt = null,
  } = financialReport;

  // Calculate basic ratios
  const ratios = {
    // Profitability Ratios
    returnOnEquity: calculateROE(netProfit, totalEquity),
    netProfitMargin: calculateNetProfitMargin(netProfit, revenue),
    
    // Leverage Ratios
    debtToEquity: calculateDebtToEquity(totalDebt, totalEquity),
    
    // Efficiency Ratios
    assetTurnover: calculateAssetTurnover(revenue, totalAssets),
    
    // Per Share Ratios
    earningsPerShare: calculateEPS(netProfit, sharesOutstanding),
  };

  // Add metadata
  const metadata = {
    calculationDate: new Date().toISOString(),
    dataQuality: assessDataQuality(financialReport),
    industry,
    year,
    currency: 'NPR',
  };

  // Add advanced ratios if requested
  if (includeAdvancedRatios) {
    ratios.advanced = calculateAdvancedRatios(financialReport, sharesOutstanding);
  }

  // Add ratio analysis and interpretations
  const analysis = analyzeRatios(ratios, industry);

  return {
    company: financialReport.companyId || 'Unknown',
    period: {
      year,
      fiscalYear: year,
    },
    financialData: {
      revenue,
      netProfit,
      totalAssets,
      totalEquity,
      totalDebt,
      sharesOutstanding,
    },
    ratios,
    analysis,
    metadata,
  };
}

/**
 * Calculate advanced financial ratios
 * 
 * @param {Object} financialReport - Financial report data
 * @param {number} sharesOutstanding - Number of shares outstanding
 * @returns {Object} Advanced ratio calculations
 */
function calculateAdvancedRatios(financialReport, sharesOutstanding) {
  const {
    revenue = null,
    netProfit = null,
    totalAssets = null,
    totalEquity = null,
    totalDebt = null,
  } = financialReport;

  const advanced = {};

  // Liquidity Ratios
  if (totalAssets && totalDebt) {
    advanced.debtToAssets = round((totalDebt / totalAssets) * 100, 2);
  }

  // Return on Assets (ROA)
  if (netProfit && totalAssets) {
    advanced.returnOnAssets = round((netProfit / totalAssets) * 100, 2);
  }

  // Equity Multiplier
  if (totalAssets && totalEquity) {
    advanced.equityMultiplier = round(totalAssets / totalEquity, 2);
  }

  // Book Value per Share
  if (totalEquity && sharesOutstanding) {
    advanced.bookValuePerShare = round(totalEquity / sharesOutstanding, 2);
  }

  // Price to Book Value (P/B) - if market price available
  if (advanced.bookValuePerShare && financialReport.marketPrice) {
    advanced.priceToBook = round(financialReport.marketPrice / advanced.bookValuePerShare, 2);
  }

  return advanced;
}

/**
 * Analyze calculated ratios and provide interpretations
 * 
 * @param {Object} ratios - Calculated ratios
 * @param {string} industry - Industry context (optional)
 * @returns {Object} Ratio analysis and interpretations
 */
function analyzeRatios(ratios, industry = null) {
  const analysis = {
    overall: 'NEUTRAL',
    strengths: [],
    concerns: [],
    recommendations: [],
  };

  // Analyze ROE
  if (ratios.returnOnEquity !== null) {
    if (ratios.returnOnEquity > 15) {
      analysis.strengths.push('Excellent return on equity');
      analysis.overall = 'STRONG';
    } else if (ratios.returnOnEquity > 10) {
      analysis.strengths.push('Good return on equity');
    } else if (ratios.returnOnEquity < 5) {
      analysis.concerns.push('Low return on equity');
      analysis.recommendations.push('Improve profitability through operational efficiency');
    }
  }

  // Analyze Debt to Equity
  if (ratios.debtToEquity !== null) {
    if (ratios.debtToEquity < 0.5) {
      analysis.strengths.push('Conservative debt level');
    } else if (ratios.debtToEquity > 2) {
      analysis.concerns.push('High debt burden');
      analysis.recommendations.push('Consider debt reduction strategies');
    }
  }

  // Analyze Net Profit Margin
  if (ratios.netProfitMargin !== null) {
    if (ratios.netProfitMargin > 15) {
      analysis.strengths.push('Strong profit margins');
    } else if (ratios.netProfitMargin < 5) {
      analysis.concerns.push('Low profit margins');
      analysis.recommendations.push('Focus on cost optimization and pricing strategy');
    }
  }

  // Analyze Asset Turnover
  if (ratios.assetTurnover !== null) {
    if (ratios.assetTurnover > 1.5) {
      analysis.strengths.push('Efficient asset utilization');
    } else if (ratios.assetTurnover < 0.5) {
      analysis.concerns.push('Low asset efficiency');
      analysis.recommendations.push('Improve asset productivity');
    }
  }

  // Industry-specific analysis
  if (industry) {
    const industryAnalysis = analyzeAgainstIndustryBenchmarks(ratios, industry);
    analysis.industryComparison = industryAnalysis;
  }

  return analysis;
}

/**
 * Analyze ratios against industry benchmarks
 * 
 * @param {Object} ratios - Calculated ratios
 * @param {string} industry - Industry name
 * @returns {Object} Industry comparison analysis
 */
function analyzeAgainstIndustryBenchmarks(ratios, industry) {
  const benchmarks = getIndustryBenchmarks(industry);
  
  if (!benchmarks) {
    return { message: 'Industry benchmarks not available' };
  }

  const comparison = {};

  Object.entries(benchmarks).forEach(([ratio, benchmark]) => {
    if (ratios[ratio] !== null && benchmark !== null) {
      const variance = ((ratios[ratio] - benchmark) / benchmark) * 100;
      comparison[ratio] = {
        company: ratios[ratio],
        benchmark,
        variance: round(variance, 1),
        performance: variance > 10 ? 'ABOVE_AVERAGE' : variance < -10 ? 'BELOW_AVERAGE' : 'AVERAGE',
      };
    }
  });

  return comparison;
}

/**
 * Get industry benchmark ratios
 * 
 * @param {string} industry - Industry name
 * @returns {Object|null} Industry benchmarks or null
 */
function getIndustryBenchmarks(industry) {
  const benchmarks = {
    'Banking': {
      returnOnEquity: 12,
      netProfitMargin: 15,
      debtToEquity: 8,
      assetTurnover: 0.08,
    },
    'Insurance': {
      returnOnEquity: 10,
      netProfitMargin: 12,
      debtToEquity: 2,
      assetTurnover: 0.3,
    },
    'Manufacturing': {
      returnOnEquity: 15,
      netProfitMargin: 8,
      debtToEquity: 1.5,
      assetTurnover: 1.2,
    },
    'Technology': {
      returnOnEquity: 18,
      netProfitMargin: 20,
      debtToEquity: 0.8,
      assetTurnover: 0.9,
    },
    'Telecommunications': {
      returnOnEquity: 14,
      netProfitMargin: 18,
      debtToEquity: 1.8,
      assetTurnover: 0.6,
    },
  };

  return benchmarks[industry.toUpperCase()] || null;
}

/**
 * Assess data quality for ratio calculations
 * 
 * @param {Object} financialReport - Financial report data
 * @returns {Object} Data quality assessment
 */
function assessDataQuality(financialReport) {
  const requiredFields = ['revenue', 'netProfit', 'totalAssets', 'totalEquity', 'totalDebt'];
  const quality = {
    completeness: 0,
    validity: 'GOOD',
    issues: [],
  };

  let validFields = 0;
  requiredFields.forEach(field => {
    if (financialReport[field] !== null && financialReport[field] !== undefined) {
      validFields++;
      if (typeof financialReport[field] !== 'number' || isNaN(financialReport[field])) {
        quality.issues.push(`Invalid data type for ${field}`);
      }
    } else {
      quality.issues.push(`Missing required field: ${field}`);
    }
  });

  quality.completeness = (validFields / requiredFields.length) * 100;

  if (quality.completeness < 80) {
    quality.validity = 'POOR';
  } else if (quality.completeness < 100) {
    quality.validity = 'FAIR';
  }

  return quality;
}

/**
 * Calculate ratios for multiple companies/years
 * 
 * @param {Array} financialReports - Array of financial reports
 * @param {Object} options - Calculation options
 * @returns {Object} Batch ratio calculations
 */
function calculateBatchRatios(financialReports, options = {}) {
  const results = {
    calculations: [],
    summary: {
      total: financialReports.length,
      successful: 0,
      failed: 0,
    },
    errors: [],
  };

  financialReports.forEach((report, index) => {
    try {
      const ratios = calculateFinancialRatios(report, options);
      results.calculations.push(ratios);
      results.summary.successful++;
    } catch (error) {
      results.errors.push({
        index,
        report,
        error: error.message,
      });
      results.summary.failed++;
    }
  });

  return results;
}

/**
 * Utility function to validate if value is a valid number
 * 
 * @param {*} value - Value to validate
 * @returns {boolean} True if valid number
 */
function isValidNumber(value) {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Utility function to round numbers to specified decimal places
 * 
 * @param {number} value - Value to round
 * @param {number} decimals - Decimal places
 * @returns {number} Rounded value
 */
function round(value, decimals) {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

// Export all functions
module.exports = {
  // Core ratio calculations
  calculateROE,
  calculateDebtToEquity,
  calculateNetProfitMargin,
  calculateAssetTurnover,
  calculateEPS,
  
  // Comprehensive calculation engine
  calculateFinancialRatios,
  calculateBatchRatios,
  
  // Advanced calculations
  calculateAdvancedRatios,
  
  // Analysis functions
  analyzeRatios,
  analyzeAgainstIndustryBenchmarks,
  assessDataQuality,
  
  // Utilities
  isValidNumber,
  round,
  getIndustryBenchmarks,
  
  // Constants
  RATIO_TYPES: {
    PROFITABILITY: ['returnOnEquity', 'netProfitMargin'],
    LEVERAGE: ['debtToEquity', 'debtToAssets'],
    EFFICIENCY: ['assetTurnover', 'returnOnAssets'],
    PER_SHARE: ['earningsPerShare', 'bookValuePerShare'],
    MARKET: ['priceToBook', 'priceToEarnings'],
  },
  
  INDUSTRY_BENCHMARKS: {
    BANKING: { returnOnEquity: 12, netProfitMargin: 15, debtToEquity: 8 },
    INSURANCE: { returnOnEquity: 10, netProfitMargin: 12, debtToEquity: 2 },
    MANUFACTURING: { returnOnEquity: 15, netProfitMargin: 8, debtToEquity: 1.5 },
    TECHNOLOGY: { returnOnEquity: 18, netProfitMargin: 20, debtToEquity: 0.8 },
  },
};
