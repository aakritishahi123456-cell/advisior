/**
 * FinSathi AI - Stock Selection Engine
 * Advanced NEPSE company ranking based on financial quality metrics
 */

/**
 * Financial quality thresholds and weights
 */
const FINANCIAL_THRESHOLDS = {
  ROE: {
    EXCELLENT: 20,    // >20% ROE
    GOOD: 15,        // 15-20% ROE
    AVERAGE: 10,     // 10-15% ROE
    POOR: 5,         // 5-10% ROE
    VERY_POOR: 0,    // <5% ROE
  },
  DEBT_RATIO: {
    EXCELLENT: 0.5,  // <0.5 debt ratio
    GOOD: 1.0,       // 0.5-1.0 debt ratio
    AVERAGE: 1.5,    // 1.0-1.5 debt ratio
    POOR: 2.0,       // 1.5-2.0 debt ratio
    VERY_POOR: 3.0,  // >2.0 debt ratio
  },
  REVENUE_GROWTH: {
    EXCELLENT: 25,   // >25% growth
    GOOD: 15,        // 15-25% growth
    AVERAGE: 5,      // 5-15% growth
    POOR: 0,         // 0-5% growth
    VERY_POOR: -10,  // <0% growth
  },
  HEALTH_SCORE: {
    EXCELLENT: 85,   // 85-100 score
    GOOD: 70,        // 70-85 score
    AVERAGE: 55,     // 55-70 score
    POOR: 40,        // 40-55 score
    VERY_POOR: 0,    // <40 score
  },
};

/**
 * Default scoring weights
 */
const DEFAULT_WEIGHTS = {
  roe: 0.30,           // 30% weight for Return on Equity
  debtRatio: 0.25,    // 25% weight for Debt Ratio (inverted)
  revenueGrowth: 0.25, // 25% weight for Revenue Growth
  healthScore: 0.20,   // 20% weight for Health Score
};

/**
 * NEPSE sector classifications
 */
const NEPSE_SECTORS = {
  BANKING: 'Banking',
  INSURANCE: 'Insurance',
  HYDROPOWER: 'Hydropower',
  MANUFACTURING: 'Manufacturing',
  TRADING: 'Trading',
  HOTELS: 'Hotels & Tourism',
  DEVELOPMENT_BANKS: 'Development Banks',
  FINANCE: 'Finance',
  MICROFINANCE: 'Microfinance',
  TELECOMMUNICATION: 'Telecommunication',
  NONLIFE_INSURANCE: 'Non-Life Insurance',
  LIFE_INSURANCE: 'Life Insurance',
  MUTUAL_FUNDS: 'Mutual Funds',
  OTHERS: 'Others',
};

/**
 * Select top performing NEPSE companies based on financial quality
 * @param {Object} options - Selection criteria and options
 * @returns {Object} Ranked companies with detailed analysis
 */
function selectTopCompanies(options = {}) {
  try {
    const {
      limit = 10,
      minROE = 10,
      maxDebtRatio = 2.0,
      minRevenueGrowth = 0,
      minHealthScore = 60,
      sector = null,
      marketCapMin = null,
      marketCapMax = null,
      weights = DEFAULT_WEIGHTS,
      sortBy = 'score',
      sortOrder = 'desc',
    } = options;

    // Simulate NEPSE company data (in real implementation, this would come from database)
    const companies = getMockNEPSECompanies();
    
    // Filter companies based on criteria
    const filteredCompanies = companies.filter(company => {
      const metrics = calculateFinancialMetrics(company);
      
      return (
        metrics.roe >= minROE &&
        metrics.debtRatio <= maxDebtRatio &&
        metrics.revenueGrowth >= minRevenueGrowth &&
        metrics.healthScore >= minHealthScore &&
        (!sector || company.sector === sector) &&
        (!marketCapMin || company.marketCap >= marketCapMin) &&
        (!marketCapMax && company.marketCap <= marketCapMax)
      );
    });

    // Calculate scores for filtered companies
    const scoredCompanies = filteredCompanies.map(company => ({
      ...company,
      metrics: calculateFinancialMetrics(company),
      score: calculateCompanyScore(calculateFinancialMetrics(company), weights),
      grade: assignGrade(calculateFinancialMetrics(company)),
    }));

    // Sort companies
    scoredCompanies.sort((a, b) => {
      const comparison = sortBy === 'score' ? b.score - a.score :
                        sortBy === 'roe' ? b.metrics.roe - a.metrics.roe :
                        sortBy === 'debtRatio' ? a.metrics.debtRatio - b.metrics.debtRatio :
                        sortBy === 'revenueGrowth' ? b.metrics.revenueGrowth - a.metrics.revenueGrowth :
                        sortBy === 'healthScore' ? b.metrics.healthScore - a.metrics.healthScore :
                        a.score - b.score;
      return sortOrder === 'desc' ? comparison : -comparison;
    });

    // Generate analysis and recommendations
    const analysis = generatePortfolioAnalysis(scoredCompanies.slice(0, limit));
    const recommendations = generateInvestmentRecommendations(scoredCompanies.slice(0, limit));

    return {
      success: true,
      data: {
        companies: scoredCompanies.slice(0, limit),
        analysis,
        recommendations,
        criteria: {
          minROE,
          maxDebtRatio,
          minRevenueGrowth,
          minHealthScore,
          sector,
          marketCapMin,
          marketCapMax,
        },
        weights,
        statistics: {
          totalCompanies: companies.length,
          filteredCompanies: filteredCompanies.length,
          selectedCompanies: Math.min(limit, scoredCompanies.length),
          averageROE: calculateAverage(scoredCompanies, 'roe'),
          averageDebtRatio: calculateAverage(scoredCompanies, 'debtRatio'),
          averageRevenueGrowth: calculateAverage(scoredCompanies, 'revenueGrowth'),
          averageHealthScore: calculateAverage(scoredCompanies, 'healthScore'),
        },
      },
      meta: {
        generatedAt: new Date().toISOString(),
        version: '1.0.0',
        methodology: 'Multi-factor financial quality scoring',
      },
    };

  } catch (error) {
    return {
      success: false,
      error: 'Failed to select top companies',
      code: 'SELECTION_ERROR',
      details: error.message,
    };
  }
}

/**
 * Calculate comprehensive financial metrics for a company
 * @param {Object} company - Company data
 * @returns {Object} Financial metrics
 */
function calculateFinancialMetrics(company) {
  const { financials } = company;
  
  // Return on Equity (ROE)
  const roe = financials.totalEquity > 0 ? 
    (financials.netProfit / financials.totalEquity) * 100 : 0;

  // Debt Ratio (Debt to Equity)
  const debtRatio = financials.totalEquity > 0 ? 
    financials.totalDebt / financials.totalEquity : 0;

  // Revenue Growth (YoY)
  const revenueGrowth = financials.previousYearRevenue > 0 ?
    ((financials.revenue - financials.previousYearRevenue) / financials.previousYearRevenue) * 100 : 0;

  // Health Score (composite metric)
  const healthScore = calculateHealthScore(company);

  // Additional metrics for comprehensive analysis
  const currentRatio = financials.currentLiabilities > 0 ?
    financials.currentAssets / financials.currentLiabilities : 0;

  const grossMargin = financials.revenue > 0 ?
    ((financials.revenue - financials.costOfGoodsSold) / financials.revenue) * 100 : 0;

  const netMargin = financials.revenue > 0 ?
    (financials.netProfit / financials.revenue) * 100 : 0;

  const assetTurnover = financials.totalAssets > 0 ?
    financials.revenue / financials.totalAssets : 0;

  return {
    roe: Math.round(roe * 100) / 100,
    debtRatio: Math.round(debtRatio * 100) / 100,
    revenueGrowth: Math.round(revenueGrowth * 100) / 100,
    healthScore: Math.round(healthScore * 100) / 100,
    currentRatio: Math.round(currentRatio * 100) / 100,
    grossMargin: Math.round(grossMargin * 100) / 100,
    netMargin: Math.round(netMargin * 100) / 100,
    assetTurnover: Math.round(assetTurnover * 100) / 100,
    netProfit: financials.netProfit,
    revenue: financials.revenue,
    totalEquity: financials.totalEquity,
    totalDebt: financials.totalDebt,
    currentAssets: financials.currentAssets,
    currentLiabilities: financials.currentLiabilities,
  };
}

/**
 * Calculate comprehensive health score for a company
 * @param {Object} company - Company data
 * @returns {number} Health score (0-100)
 */
function calculateHealthScore(company) {
  const { financials } = company;
  let score = 0;

  // Profitability (30%)
  const roe = financials.totalEquity > 0 ? 
    (financials.netProfit / financials.totalEquity) * 100 : 0;
  if (roe > 20) score += 30;
  else if (roe > 15) score += 25;
  else if (roe > 10) score += 20;
  else if (roe > 5) score += 10;

  // Liquidity (25%)
  const currentRatio = financials.currentLiabilities > 0 ?
    financials.currentAssets / financials.currentLiabilities : 0;
  if (currentRatio > 2) score += 25;
  else if (currentRatio > 1.5) score += 20;
  else if (currentRatio > 1) score += 15;
  else if (currentRatio > 0.5) score += 10;

  // Solvency (25%)
  const debtRatio = financials.totalEquity > 0 ?
    financials.totalDebt / financials.totalEquity : 0;
  if (debtRatio < 0.5) score += 25;
  else if (debtRatio < 1) score += 20;
  else if (debtRatio < 1.5) score += 15;
  else if (debtRatio < 2) score += 10;

  // Growth (20%)
  const revenueGrowth = financials.previousYearRevenue > 0 ?
    ((financials.revenue - financials.previousYearRevenue) / financials.previousYearRevenue) * 100 : 0;
  if (revenueGrowth > 25) score += 20;
  else if (revenueGrowth > 15) score += 15;
  else if (revenueGrowth > 5) score += 10;
  else if (revenueGrowth > 0) score += 5;

  return Math.min(100, score);
}

/**
 * Calculate weighted score for company ranking
 * @param {Object} metrics - Financial metrics
 * @param {Object} weights - Scoring weights
 * @returns {number} Weighted score (0-100)
 */
function calculateCompanyScore(metrics, weights) {
  // Normalize each metric to 0-100 scale
  const normalizedROE = normalizeScore(metrics.roe, 0, 30);
  const normalizedDebtRatio = normalizeScore(metrics.debtRatio, 0, 3, true); // Inverted
  const normalizedRevenueGrowth = normalizeScore(metrics.revenueGrowth, -20, 30);
  const normalizedHealthScore = normalizeScore(metrics.healthScore, 0, 100);

  // Calculate weighted score
  const weightedScore = 
    normalizedROE * weights.roe +
    normalizedDebtRatio * weights.debtRatio +
    normalizedRevenueGrowth * weights.revenueGrowth +
    normalizedHealthScore * weights.healthScore;

  return Math.round(weightedScore * 100) / 100;
}

/**
 * Normalize score to 0-100 scale
 * @param {number} value - Value to normalize
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {boolean} invert - Whether to invert the score
 * @returns {number} Normalized score (0-100)
 */
function normalizeScore(value, min, max, invert = false) {
  if (max === min) return 50; // Default to middle if range is zero
  
  const normalized = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  return invert ? 100 - normalized : normalized;
}

/**
 * Assign grade based on financial metrics
 * @param {Object} metrics - Financial metrics
 * @returns {string} Grade (A+, A, B+, B, C, D)
 */
function assignGrade(metrics) {
  const score = calculateCompanyScore(metrics, DEFAULT_WEIGHTS);
  
  if (score >= 85) return 'A+';
  if (score >= 75) return 'A';
  if (score >= 65) return 'B+';
  if (score >= 55) return 'B';
  if (score >= 45) return 'C';
  return 'D';
}

/**
 * Generate portfolio analysis
 * @param {Array} companies - Top companies
 * @returns {Object} Portfolio analysis
 */
function generatePortfolioAnalysis(companies) {
  const analysis = {
    diversification: calculateDiversification(companies),
    sectorDistribution: calculateSectorDistribution(companies),
    riskProfile: assessPortfolioRisk(companies),
    performance: estimatePortfolioPerformance(companies),
    quality: assessPortfolioQuality(companies),
  };

  return analysis;
}

/**
 * Calculate diversification metrics
 * @param {Array} companies - Company list
 * @returns {Object} Diversification analysis
 */
function calculateDiversification(companies) {
  const sectors = [...new Set(companies.map(c => c.sector))];
  const sectorConcentration = {};
  
  companies.forEach(company => {
    sectorConcentration[company.sector] = (sectorConcentration[company.sector] || 0) + 1;
  });

  const maxConcentration = Math.max(...Object.values(sectorConcentration));
  const diversificationScore = Math.max(0, 100 - (maxConcentration / companies.length) * 100);

  return {
    sectors: sectors.length,
    maxConcentration,
    diversificationScore: Math.round(diversificationScore * 100) / 100,
    sectorConcentration,
    recommendation: sectors.length >= 4 ? 'Well diversified' : 'Consider sector diversification',
  };
}

/**
 * Calculate sector distribution
 * @param {Array} companies - Company list
 * @returns {Object} Sector distribution
 */
function calculateSectorDistribution(companies) {
  const distribution = {};
  
  companies.forEach(company => {
    distribution[company.sector] = (distribution[company.sector] || 0) + 1;
  });

  const percentages = {};
  Object.entries(distribution).forEach(([sector, count]) => {
    percentages[sector] = Math.round((count / companies.length) * 100);
  });

  return {
    distribution,
    percentages,
    topSector: Object.entries(distribution).reduce((a, b) => a[1] > b[1] ? a : b)[0],
  };
}

/**
 * Assess portfolio risk
 * @param {Array} companies - Company list
 * @returns {Object} Risk assessment
 */
function assessPortfolioRisk(companies) {
  const avgDebtRatio = companies.reduce((sum, c) => sum + c.metrics.debtRatio, 0) / companies.length;
  const avgROE = companies.reduce((sum, c) => sum + c.metrics.roe, 0) / companies.length;
  const avgHealthScore = companies.reduce((sum, c) => sum + c.metrics.healthScore, 0) / companies.length;

  let riskLevel = 'LOW';
  if (avgDebtRatio > 1.5 || avgROE < 10 || avgHealthScore < 60) {
    riskLevel = 'HIGH';
  } else if (avgDebtRatio > 1.0 || avgROE < 15 || avgHealthScore < 70) {
    riskLevel = 'MEDIUM';
  }

  return {
    riskLevel,
    avgDebtRatio: Math.round(avgDebtRatio * 100) / 100,
    avgROE: Math.round(avgROE * 100) / 100,
    avgHealthScore: Math.round(avgHealthScore * 100) / 100,
    riskScore: Math.round((100 - avgHealthScore + avgDebtRatio * 20 - avgROE) / 2),
  };
}

/**
 * Estimate portfolio performance
 * @param {Array} companies - Company list
 * @returns {Object} Performance estimate
 */
function estimatePortfolioPerformance(companies) {
  const avgROE = companies.reduce((sum, c) => sum + c.metrics.roe, 0) / companies.length;
  const avgRevenueGrowth = companies.reduce((sum, c) => sum + c.metrics.revenueGrowth, 0) / companies.length;
  const avgHealthScore = companies.reduce((sum, c) => sum + c.metrics.healthScore, 0) / companies.length;

  // Expected return based on ROE and growth
  const expectedReturn = (avgROE * 0.6 + avgRevenueGrowth * 0.4);
  
  // Confidence based on health score
  const confidence = avgHealthScore / 100;

  return {
    expectedReturn: Math.round(expectedReturn * 100) / 100,
    confidence: Math.round(confidence * 100) / 100,
    qualityScore: Math.round((avgROE + avgHealthScore) / 2),
    growthPotential: Math.round(avgRevenueGrowth * 100) / 100,
  };
}

/**
 * Assess portfolio quality
 * @param {Array} companies - Company list
 * @returns {Object} Quality assessment
 */
function assessPortfolioQuality(companies) {
  const gradeDistribution = {};
  companies.forEach(company => {
    gradeDistribution[company.grade] = (gradeDistribution[company.grade] || 0) + 1;
  });

  const qualityScore = companies.reduce((sum, c) => {
    const gradeScore = c.grade === 'A+' ? 95 :
                     c.grade === 'A' ? 85 :
                     c.grade === 'B+' ? 75 :
                     c.grade === 'B' ? 65 :
                     c.grade === 'C' ? 55 : 45;
    return sum + gradeScore;
  }, 0) / companies.length;

  return {
    overallGrade: qualityScore >= 85 ? 'A+' :
                  qualityScore >= 75 ? 'A' :
                  qualityScore >= 65 ? 'B+' :
                  qualityScore >= 55 ? 'B' :
                  qualityScore >= 45 ? 'C' : 'D',
    qualityScore: Math.round(qualityScore * 100) / 100,
    gradeDistribution,
    highQualityStocks: (gradeDistribution['A+'] || 0) + (gradeDistribution['A'] || 0),
  };
}

/**
 * Generate investment recommendations
 * @param {Array} companies - Top companies
 * @returns {Array} Investment recommendations
 */
function generateInvestmentRecommendations(companies) {
  const recommendations = [];

  // Top performer recommendation
  if (companies.length > 0) {
    const topCompany = companies[0];
    recommendations.push({
      type: 'TOP_PICK',
      priority: 'HIGH',
      title: 'Top Performer',
      description: `${topCompany.name} shows exceptional financial quality with ROE of ${topCompany.metrics.roe}% and health score of ${topCompany.metrics.healthScore}`,
      company: topCompany.symbol,
      reasoning: 'Highest combined score across all metrics',
    });
  }

  // Growth recommendation
  const growthCompany = companies.reduce((best, current) => 
    current.metrics.revenueGrowth > best.metrics.revenueGrowth ? current : best
  );
  recommendations.push({
    type: 'GROWTH',
    priority: 'MEDIUM',
    title: 'Growth Leader',
    description: `${growthCompany.name} shows strong revenue growth of ${growthCompany.metrics.revenueGrowth}%`,
    company: growthCompany.symbol,
    reasoning: 'Highest revenue growth among selected companies',
  });

  // Value recommendation
  const valueCompany = companies.reduce((best, current) => 
    current.metrics.debtRatio < best.metrics.debtRatio ? current : best
  );
  recommendations.push({
    type: 'VALUE',
    priority: 'MEDIUM',
    title: 'Value Pick',
    description: `${valueCompany.name} has low debt ratio of ${valueCompany.metrics.debtRatio} indicating strong financial stability`,
    company: valueCompany.symbol,
    reasoning: 'Lowest debt ratio indicating financial stability',
  });

  // Diversification recommendation
  const sectors = [...new Set(companies.map(c => c.sector))];
  if (sectors.length < 3) {
    recommendations.push({
      type: 'DIVERSIFICATION',
      priority: 'LOW',
      title: 'Sector Diversification',
      description: `Consider adding companies from different sectors to reduce concentration risk`,
      reasoning: 'Current portfolio has limited sector diversification',
    });
  }

  return recommendations;
}

/**
 * Calculate average metric for companies
 * @param {Array} companies - Company list
 * @param {string} metric - Metric name
 * @returns {number} Average value
 */
function calculateAverage(companies, metric) {
  if (companies.length === 0) return 0;
  const sum = companies.reduce((total, company) => total + company.metrics[metric], 0);
  return Math.round((sum / companies.length) * 100) / 100;
}

/**
 * Get mock NEPSE company data
 * @returns {Array} Mock company data
 */
function getMockNEPSECompanies() {
  return [
    {
      symbol: 'NABIL',
      name: 'Nabil Bank Limited',
      sector: 'Banking',
      marketCap: 150000000000,
      financials: {
        revenue: 25000000000,
        previousYearRevenue: 22000000000,
        netProfit: 3500000000,
        totalEquity: 20000000000,
        totalDebt: 15000000000,
        currentAssets: 30000000000,
        currentLiabilities: 20000000000,
        totalAssets: 40000000000,
        costOfGoodsSold: 15000000000,
      },
    },
    {
      symbol: 'NICA',
      name: 'NIC Asia Bank',
      sector: 'Banking',
      marketCap: 120000000000,
      financials: {
        revenue: 20000000000,
        previousYearRevenue: 18000000000,
        netProfit: 2800000000,
        totalEquity: 18000000000,
        totalDebt: 14000000000,
        currentAssets: 25000000000,
        currentLiabilities: 18000000000,
        totalAssets: 35000000000,
        costOfGoodsSold: 12000000000,
      },
    },
    {
      symbol: 'SCB',
      name: 'Standard Chartered Bank Nepal',
      sector: 'Banking',
      marketCap: 80000000000,
      financials: {
        revenue: 15000000000,
        previousYearRevenue: 14000000000,
        netProfit: 2200000000,
        totalEquity: 15000000000,
        totalDebt: 10000000000,
        currentAssets: 20000000000,
        currentLiabilities: 15000000000,
        totalAssets: 28000000000,
        costOfGoodsSold: 9000000000,
      },
    },
    {
      symbol: 'EBL',
      name: 'Everest Bank Limited',
      sector: 'Banking',
      marketCap: 70000000000,
      financials: {
        revenue: 12000000000,
        previousYearRevenue: 11000000000,
        netProfit: 1800000000,
        totalEquity: 12000000000,
        totalDebt: 9000000000,
        currentAssets: 18000000000,
        currentLiabilities: 12000000000,
        totalAssets: 25000000000,
        costOfGoodsSold: 8000000000,
      },
    },
    {
      symbol: 'SIC',
      name: 'Siddhartha Insurance',
      sector: 'Insurance',
      marketCap: 60000000000,
      financials: {
        revenue: 8000000000,
        previousYearRevenue: 7000000000,
        netProfit: 1200000000,
        totalEquity: 8000000000,
        totalDebt: 6000000000,
        currentAssets: 12000000000,
        currentLiabilities: 8000000000,
        totalAssets: 18000000000,
        costOfGoodsSold: 5000000000,
      },
    },
    {
      symbol: 'NLIC',
      name: 'National Life Insurance',
      sector: 'Insurance',
      marketCap: 55000000000,
      financials: {
        revenue: 7000000000,
        previousYearRevenue: 6500000000,
        netProfit: 1000000000,
        totalEquity: 7000000000,
        totalDebt: 5000000000,
        currentAssets: 10000000000,
        currentLiabilities: 7000000000,
        totalAssets: 15000000000,
        costOfGoodsSold: 4500000000,
      },
    },
    {
      symbol: 'UPPER',
      name: 'Upper Tamakoshi Hydropower',
      sector: 'Hydropower',
      marketCap: 90000000000,
      financials: {
        revenue: 6000000000,
        previousYearRevenue: 5000000000,
        netProfit: 1500000000,
        totalEquity: 10000000000,
        totalDebt: 8000000000,
        currentAssets: 8000000000,
        currentLiabilities: 6000000000,
        totalAssets: 20000000000,
        costOfGoodsSold: 3000000000,
      },
    },
    {
      symbol: 'NHPC',
      name: 'Nepal Hydropower Company',
      sector: 'Hydropower',
      marketCap: 50000000000,
      financials: {
        revenue: 4000000000,
        previousYearRevenue: 3500000000,
        netProfit: 800000000,
        totalEquity: 6000000000,
        totalDebt: 4000000000,
        currentAssets: 7000000000,
        currentLiabilities: 5000000000,
        totalAssets: 12000000000,
        costOfGoodsSold: 2000000000,
      },
    },
    {
      symbol: 'UNILEVER',
      name: 'Unilever Nepal',
      sector: 'Manufacturing',
      marketCap: 45000000000,
      financials: {
        revenue: 5000000000,
        previousYearRevenue: 4800000000,
        netProfit: 600000000,
        totalEquity: 4000000000,
        totalDebt: 2000000000,
        currentAssets: 6000000000,
        currentLiabilities: 3000000000,
        totalAssets: 8000000000,
        costOfGoodsSold: 3000000000,
      },
    },
    {
      symbol: 'NTC',
      name: 'Nepal Telecom',
      sector: 'Telecommunication',
      marketCap: 200000000000,
      financials: {
        revenue: 30000000000,
        previousYearRevenue: 28000000000,
        netProfit: 4000000000,
        totalEquity: 25000000000,
        totalDebt: 10000000000,
        currentAssets: 35000000000,
        currentLiabilities: 20000000000,
        totalAssets: 50000000000,
        costOfGoodsSold: 18000000000,
      },
    },
  ];
}

/**
 * Get company ranking by symbol
 * @param {string} symbol - Company symbol
 * @returns {Object} Company ranking and analysis
 */
function getCompanyRanking(symbol) {
  try {
    const companies = getMockNEPSECompanies();
    const company = companies.find(c => c.symbol.toUpperCase() === symbol.toUpperCase());
    
    if (!company) {
      return {
        success: false,
        error: 'Company not found',
        code: 'COMPANY_NOT_FOUND',
      };
    }

    const metrics = calculateFinancialMetrics(company);
    const score = calculateCompanyScore(metrics, DEFAULT_WEIGHTS);
    const grade = assignGrade(metrics);

    // Calculate ranking among all companies
    const allScores = companies.map(c => ({
      symbol: c.symbol,
      score: calculateCompanyScore(calculateFinancialMetrics(c), DEFAULT_WEIGHTS),
    }));
    
    allScores.sort((a, b) => b.score - a.score);
    const ranking = allScores.findIndex(c => c.symbol === symbol) + 1;

    return {
      success: true,
      data: {
        company: {
          symbol: company.symbol,
          name: company.name,
          sector: company.sector,
          marketCap: company.marketCap,
        },
        metrics,
        score,
        grade,
        ranking,
        totalCompanies: companies.length,
        percentile: Math.round(((companies.length - ranking + 1) / companies.length) * 100),
        assessment: generateCompanyAssessment(metrics, grade, ranking),
      },
      meta: {
        generatedAt: new Date().toISOString(),
      },
    };

  } catch (error) {
    return {
      success: false,
      error: 'Failed to get company ranking',
      code: 'RANKING_ERROR',
      details: error.message,
    };
  }
}

/**
 * Generate company assessment
 * @param {Object} metrics - Financial metrics
 * @param {string} grade - Company grade
 * @param {number} ranking - Company ranking
 * @returns {Object} Company assessment
 */
function generateCompanyAssessment(metrics, grade, ranking) {
  return {
    overallRating: grade,
    strengths: identifyStrengths(metrics),
    weaknesses: identifyWeaknesses(metrics),
    investmentSuitability: getInvestmentSuitability(grade, ranking),
    riskLevel: getRiskLevel(metrics),
    recommendation: generateCompanyRecommendation(metrics, grade, ranking),
  };
}

/**
 * Identify company strengths
 * @param {Object} metrics - Financial metrics
 * @returns {Array} List of strengths
 */
function identifyStrengths(metrics) {
  const strengths = [];
  
  if (metrics.roe > 15) strengths.push('High Return on Equity');
  if (metrics.debtRatio < 1) strengths.push('Low Debt Ratio');
  if (metrics.revenueGrowth > 10) strengths.push('Strong Revenue Growth');
  if (metrics.healthScore > 70) strengths.push('Excellent Financial Health');
  if (metrics.currentRatio > 1.5) strengths.push('Strong Liquidity');
  if (metrics.grossMargin > 30) strengths.push('High Gross Margin');
  if (metrics.netMargin > 15) stocks.push('High Net Margin');
  
  return strengths;
}

/**
 * Identify company weaknesses
 * @param {Object} metrics - Financial metrics
 * @returns {Array} List of weaknesses
 */
function identifyWeaknesses(metrics) {
  const weaknesses = [];
  
  if (metrics.roe < 10) weaknesses.push('Low Return on Equity');
  if (metrics.debtRatio > 2) weaknesses.push('High Debt Ratio');
  if (metrics.revenueGrowth < 5) weaknesses.push('Low Revenue Growth');
  if (metrics.healthScore < 60) weaknesses.push('Poor Financial Health');
  if (metrics.currentRatio < 1) weaknesses.push('Weak Liquidity');
  if (metrics.grossMargin < 20) weaknesses.push('Low Gross Margin');
  if (metrics.netMargin < 5) weaknesses.push('Low Net Margin');
  
  return weaknesses;
}

/**
 * Get investment suitability
 * @param {string} grade - Company grade
 * @param {number} ranking - Company ranking
 * @returns {string} Investment suitability
 */
function getInvestmentSuitability(grade, ranking) {
  if (grade === 'A+' && ranking <= 5) return 'Excellent - Strong Buy';
  if (grade === 'A' && ranking <= 10) return 'Very Good - Buy';
  if (grade === 'B+' && ranking <= 15) return 'Good - Accumulate';
  if (grade === 'B' && ranking <= 20) return 'Fair - Hold';
  return 'Poor - Avoid';
}

/**
 * Get risk level
 * @param {Object} metrics - Financial metrics
 * @returns {string} Risk level
 */
function getRiskLevel(metrics) {
  const riskScore = (metrics.debtRatio * 20) + (100 - metrics.healthScore) + (100 - metrics.roe);
  
  if (riskScore < 30) return 'LOW';
  if (riskScore < 60) return 'MEDIUM';
  return 'HIGH';
}

/**
 * Generate company recommendation
 * @param {Object} metrics - Financial metrics
 * @param {string} grade - Company grade
 * @param {number} ranking - Company ranking
 * @returns {string} Recommendation
 */
function generateCompanyRecommendation(metrics, grade, ranking) {
  if (grade === 'A+') {
    return 'Exceptional financial quality with strong profitability and low risk. Highly recommended for long-term investment.';
  } else if (grade === 'A') {
    return 'Strong financial performance with good profitability metrics. Suitable for growth-oriented portfolios.';
  } else if (grade === 'B+') {
    return 'Decent financial metrics with moderate growth potential. Consider for balanced portfolios.';
  } else if (grade === 'B') {
    return 'Average financial performance with some concerns. Monitor closely before investing.';
  } else {
    return 'Poor financial metrics with significant risks. Not recommended for investment.';
  }
}

// Export the main functions
module.exports = {
  selectTopCompanies,
  getCompanyRanking,
  FINANCIAL_THRESHOLDS,
  DEFAULT_WEIGHTS,
  NEPSE_SECTORS,
  // Utility functions for advanced usage
  calculateFinancialMetrics,
  calculateCompanyScore,
  assignGrade,
  generatePortfolioAnalysis,
  generateInvestmentRecommendations,
};
