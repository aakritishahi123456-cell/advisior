/**
 * FinSathi AI - Portfolio Allocation System
 * Recommend portfolio allocation based on risk profile
 */

/**
 * Portfolio allocation templates for different risk profiles
 */
const PORTFOLIO_TEMPLATES = {
  CONSERVATIVE: {
    name: 'Conservative Portfolio',
    description: 'Low-risk portfolio focused on capital preservation and steady income',
    riskLevel: 'LOW',
    expectedReturn: '6-8%',
    volatility: 'LOW',
    timeHorizon: 'SHORT_TO_MEDIUM',
    allocation: {
      bonds: 60,        // Government and corporate bonds
      blueChipStocks: 30, // Large-cap stable stocks
      cash: 10,          // Cash and equivalents
      growthStocks: 0,    // No growth stocks
      alternatives: 0,     // No alternatives
    },
    suitableFor: 'Retirees, risk-averse investors, short-term goals',
    characteristics: [
      'Focus on capital preservation',
      'Stable returns with minimal volatility',
      'Regular income generation',
      'High credit quality bonds',
      'Large-cap blue-chip stocks',
    ],
    investmentOptions: [
      'Government Securities',
      'Corporate Bonds',
      'Fixed Deposits',
      'Blue-Chip Stocks',
      'Money Market Funds',
      'Savings Accounts',
    ],
    rebalancingFrequency: 'ANNUALLY',
    taxEfficiency: 'HIGH',
  },
  
  MODERATE: {
    name: 'Moderate Portfolio',
    description: 'Balanced portfolio with mix of growth and stability',
    riskLevel: 'MEDIUM',
    expectedReturn: '8-12%',
    volatility: 'MEDIUM',
    timeHorizon: 'MEDIUM_TO_LONG',
    allocation: {
      bonds: 30,        // Corporate and government bonds
      blueChipStocks: 50, // Mix of large and mid-cap stocks
      cash: 0,          // No cash allocation
      growthStocks: 20,    // Some growth exposure
      alternatives: 0,     // Limited alternatives
    },
    suitableFor: 'Most investors, balanced approach, medium-term goals',
    characteristics: [
      'Balanced risk-return profile',
      'Mix of growth and value',
      'Diversified across sectors',
      'Moderate volatility',
      'Regular portfolio rebalancing',
    ],
    investmentOptions: [
      'Balanced Mutual Funds',
      'Index Funds',
      'Corporate Bonds',
      'Large-Cap Stocks',
      'Mid-Cap Stocks',
      'Systematic Investment Plans',
    ],
    rebalancingFrequency: 'SEMI-ANNUALLY',
    taxEfficiency: 'MEDIUM',
  },
  
  AGGRESSIVE: {
    name: 'Aggressive Portfolio',
    description: 'Growth-oriented portfolio with high return potential',
    riskLevel: 'HIGH',
    expectedReturn: '12-18%',
    volatility: 'HIGH',
    timeHorizon: 'LONG',
    allocation: {
      bonds: 10,        // Minimal bond allocation
      blueChipStocks: 20, // Some blue-chip exposure
      cash: 0,          // No cash allocation
      growthStocks: 70,    // Heavy growth focus
      alternatives: 0,     // Limited alternatives
    },
    suitableFor: 'Young investors, long-term goals, high risk tolerance',
    characteristics: [
      'High growth potential',
      'Higher volatility tolerance',
      'Focus on capital appreciation',
      'Emerging market exposure',
      'Small-cap and mid-cap stocks',
    ],
    investmentOptions: [
      'Growth Mutual Funds',
      'Small-Cap Funds',
      'Mid-Cap Stocks',
      'Sectoral Funds',
      'International Funds',
      'Direct Equities',
    ],
    rebalancingFrequency: 'QUARTERLY',
    taxEfficiency: 'LOW',
  },
};

/**
 * Asset class definitions with NEPSE context
 */
const ASSET_CLASSES = {
  bonds: {
    name: 'Bonds',
    description: 'Fixed income securities with regular interest payments',
    subcategories: {
      government: 'Government Bonds & Treasury Bills',
      corporate: 'Corporate Bonds & Debentures',
      banking: 'Bank Fixed Deposits & CDs',
    },
    riskLevel: 'LOW_TO_MEDIUM',
    expectedReturn: '6-10%',
    liquidity: 'MEDIUM',
    nePSEExamples: ['Government Securities', 'Corporate Debentures', 'Bank Fixed Deposits'],
  },
  
  blueChipStocks: {
    name: 'Blue-Chip Stocks',
    description: 'Large-cap, financially strong companies',
    subcategories: {
      banking: 'Commercial & Development Banks',
      insurance: 'Insurance Companies',
      telecom: 'Telecommunication Companies',
      manufacturing: 'Large Manufacturing Companies',
    },
    riskLevel: 'MEDIUM',
    expectedReturn: '10-15%',
    liquidity: 'HIGH',
    nePSEExamples: ['NABIL', 'NICA', 'SCB', 'EBL', 'NBL'],
  },
  
  growthStocks: {
    name: 'Growth Stocks',
    description: 'High-growth potential companies',
    subcategories: {
      technology: 'Technology & Software Companies',
      smallCap: 'Small-Cap Companies',
      midCap: 'Mid-Cap Companies',
      sectoral: 'Sector-Specific Growth Stocks',
    },
    riskLevel: 'HIGH',
    expectedReturn: '15-25%',
    liquidity: 'MEDIUM',
    nePSEExamples: ['Tech Companies', 'Small-Cap Stocks', 'Growth Sectors'],
  },
  
  cash: {
    name: 'Cash & Equivalents',
    description: 'Liquid assets for emergencies and opportunities',
    subcategories: {
      savings: 'Savings Accounts',
      moneyMarket: 'Money Market Funds',
      treasury: 'Treasury Bills',
    },
    riskLevel: 'VERY_LOW',
    expectedReturn: '3-5%',
    liquidity: 'VERY_HIGH',
    nePSEExamples: ['Savings Accounts', 'Money Market Funds'],
  },
  
  alternatives: {
    name: 'Alternative Investments',
    description: 'Non-traditional investment options',
    subcategories: {
      realEstate: 'Real Estate & REITs',
      commodities: 'Gold & Precious Metals',
      international: 'International Equities',
      crypto: 'Cryptocurrencies',
    },
    riskLevel: 'VERY_HIGH',
    expectedReturn: '15-30%',
    liquidity: 'LOW',
    nePSEExamples: ['Real Estate', 'Gold', 'International Funds'],
  },
};

/**
 * Recommend portfolio allocation based on risk profile
 * @param {string} riskProfile - Risk profile (CONSERVATIVE, MODERATE, AGGRESSIVE)
 * @param {Object} options - Additional options for customization
 * @returns {Object} Portfolio recommendation
 */
function recommendPortfolioAllocation(riskProfile, options = {}) {
  try {
    // Validate risk profile
    if (!PORTFOLIO_TEMPLATES[riskProfile]) {
      return {
        success: false,
        error: `Invalid risk profile: ${riskProfile}`,
        code: 'INVALID_RISK_PROFILE',
      };
    }

    const template = PORTFOLIO_TEMPLATES[riskProfile];
    
    // Apply customizations
    const customizedAllocation = applyCustomizations(template.allocation, options);
    
    // Generate detailed allocation breakdown
    const detailedAllocation = generateDetailedAllocation(customizedAllocation);
    
    // Calculate portfolio metrics
    const portfolioMetrics = calculatePortfolioMetrics(customizedAllocation, options);
    
    // Generate investment recommendations
    const investmentRecommendations = generateInvestmentRecommendations(template, customizedAllocation, options);
    
    // Create rebalancing strategy
    const rebalancingStrategy = createRebalancingStrategy(template, customizedAllocation);
    
    // Risk assessment
    const riskAssessment = assessPortfolioRisk(customizedAllocation, template);

    return {
      success: true,
      data: {
        riskProfile,
        portfolio: {
          name: template.name,
          description: template.description,
          riskLevel: template.riskLevel,
          expectedReturn: template.expectedReturn,
          volatility: template.volatility,
          timeHorizon: template.timeHorizon,
        },
        allocation: {
          base: template.allocation,
          customized: customizedAllocation,
          detailed: detailedAllocation,
          percentageBreakdown: generatePercentageBreakdown(customizedAllocation),
        },
        metrics: portfolioMetrics,
        recommendations: investmentRecommendations,
        rebalancing: rebalancingStrategy,
        riskAssessment,
        assetClasses: ASSET_CLASSES,
        customization: options,
      },
      meta: {
        generatedAt: new Date().toISOString(),
        version: '1.0.0',
        methodology: 'Risk-based strategic asset allocation',
      },
    };

  } catch (error) {
    return {
      success: false,
      error: 'Failed to generate portfolio recommendation',
      code: 'GENERATION_ERROR',
      details: error.message,
    };
  }
}

/**
 * Apply customizations to base allocation
 * @param {Object} baseAllocation - Base portfolio allocation
 * @param {Object} options - Customization options
 * @returns {Object} Customized allocation
 */
function applyCustomizations(baseAllocation, options) {
  let customized = { ...baseAllocation };

  // Apply age-based adjustments
  if (options.age) {
    if (options.age < 30) {
      // Younger investors can take more risk
      customized.growthStocks = Math.min(80, customized.growthStocks + 10);
      customized.bonds = Math.max(5, customized.bonds - 10);
    } else if (options.age > 50) {
      // Older investors should be more conservative
      customized.growthStocks = Math.max(10, customized.growthStocks - 20);
      customized.bonds = Math.min(80, customized.bonds + 15);
      customized.cash = Math.max(5, customized.cash + 5);
    }
  }

  // Apply income-based adjustments
  if (options.monthlyIncome) {
    const incomeLevel = options.monthlyIncome;
    if (incomeLevel > 200000) {
      // High income can take more risk
      customized.growthStocks = Math.min(85, customized.growthStocks + 5);
    } else if (incomeLevel < 50000) {
      // Low income should be more conservative
      customized.growthStocks = Math.max(5, customized.growthStocks - 15);
      customized.bonds = Math.min(75, customized.bonds + 10);
      customized.cash = Math.max(10, customized.cash + 5);
    }
  }

  // Apply goal-based adjustments
  if (options.goalType) {
    switch (options.goalType) {
      case 'RETIREMENT':
        customized.bonds = Math.max(40, customized.bonds + 10);
        customized.cash = Math.max(5, customized.cash + 5);
        break;
      case 'HOUSE_PURCHASE':
        // Medium-term goal, balanced approach
        break;
      case 'EDUCATION_FUND':
        // Long-term goal, moderate growth
        customized.growthStocks = Math.min(60, customized.growthStocks + 10);
        break;
      case 'WEALTH_GROWTH':
        // Aggressive growth focus
        customized.growthStocks = Math.min(85, customized.growthStocks + 15);
        customized.blueChipStocks = Math.max(15, customized.blueChipStocks - 10);
        break;
    }
  }

  // Apply market condition adjustments
  if (options.marketCondition) {
    switch (options.marketCondition) {
      case 'BULLISH':
        customized.growthStocks = Math.min(85, customized.growthStocks + 10);
        customized.cash = Math.max(0, customized.cash - 5);
        break;
      case 'BEARISH':
        customized.bonds = Math.min(70, customized.bonds + 15);
        customized.cash = Math.max(10, customized.cash + 10);
        customized.growthStocks = Math.max(10, customized.growthStocks - 20);
        break;
      case 'VOLATILE':
        customized.cash = Math.max(15, customized.cash + 10);
        customized.bonds = Math.min(60, customized.bonds + 10);
        break;
    }
  }

  // Normalize allocation to 100%
  const total = Object.values(customized).reduce((sum, val) => sum + val, 0);
  if (total !== 100) {
    Object.keys(customized).forEach(key => {
      customized[key] = (customized[key] / total) * 100;
    });
  }

  return customized;
}

/**
 * Generate detailed allocation breakdown
 * @param {Object} allocation - Portfolio allocation percentages
 * @returns {Object} Detailed allocation breakdown
 */
function generateDetailedAllocation(allocation) {
  return {
    bonds: {
      percentage: allocation.bonds,
      description: ASSET_CLASSES.bonds.description,
      subcategories: ASSET_CLASSES.bonds.subcategories,
      riskLevel: ASSET_CLASSES.bonds.riskLevel,
      expectedReturn: ASSET_CLASSES.bonds.expectedReturn,
      liquidity: ASSET_CLASSES.bonds.liquidity,
      nePSEExamples: ASSET_CLASSES.bonds.nePSEExamples,
    },
    blueChipStocks: {
      percentage: allocation.blueChipStocks,
      description: ASSET_CLASSES.blueChipStocks.description,
      subcategories: ASSET_CLASSES.blueChipStocks.subcategories,
      riskLevel: ASSET_CLASSES.blueChipStocks.riskLevel,
      expectedReturn: ASSET_CLASSES.blueChipStocks.expectedReturn,
      liquidity: ASSET_CLASSES.blueChipStocks.liquidity,
      nePSEExamples: ASSET_CLASSES.blueChipStocks.nePSEExamples,
    },
    growthStocks: {
      percentage: allocation.growthStocks,
      description: ASSET_CLASSES.growthStocks.description,
      subcategories: ASSET_CLASSES.growthStocks.subcategories,
      riskLevel: ASSET_CLASSES.growthStocks.riskLevel,
      expectedReturn: ASSET_CLASSES.growthStocks.expectedReturn,
      liquidity: ASSET_CLASSES.growthStocks.liquidity,
      nePSEExamples: ASSET_CLASSES.growthStocks.nePSEExamples,
    },
    cash: {
      percentage: allocation.cash,
      description: ASSET_CLASSES.cash.description,
      subcategories: ASSET_CLASSES.cash.subcategories,
      riskLevel: ASSET_CLASSES.cash.riskLevel,
      expectedReturn: ASSET_CLASSES.cash.expectedReturn,
      liquidity: ASSET_CLASSES.cash.liquidity,
      nePSEExamples: ASSET_CLASSES.cash.nePSEExamples,
    },
    alternatives: {
      percentage: allocation.alternatives || 0,
      description: ASSET_CLASSES.alternatives.description,
      subcategories: ASSET_CLASSES.alternatives.subcategories,
      riskLevel: ASSET_CLASSES.alternatives.riskLevel,
      expectedReturn: ASSET_CLASSES.alternatives.expectedReturn,
      liquidity: ASSET_CLASSES.alternatives.liquidity,
      nePSEExamples: ASSET_CLASSES.alternatives.nePSEExamples,
    },
  };
}

/**
 * Generate percentage breakdown for display
 * @param {Object} allocation - Portfolio allocation
 * @returns {Array} Percentage breakdown array
 */
function generatePercentageBreakdown(allocation) {
  return Object.entries(allocation)
    .filter(([_, percentage]) => percentage > 0)
    .map(([asset, percentage]) => ({
      asset,
      percentage: Math.round(percentage * 100) / 100,
      displayName: asset.replace(/([A-Z])/g, ' $1').trim(),
    }))
    .sort((a, b) => b.percentage - a.percentage);
}

/**
 * Calculate portfolio metrics
 * @param {Object} allocation - Portfolio allocation
 * @param {Object} options - Additional options
 * @returns {Object} Portfolio metrics
 */
function calculatePortfolioMetrics(allocation, options) {
  // Expected returns based on asset class returns
  const assetReturns = {
    bonds: 8,           // Average bond return
    blueChipStocks: 12,  // Average blue-chip return
    growthStocks: 18,    // Average growth stock return
    cash: 4,            // Average cash return
    alternatives: 15,     // Average alternative return
  };

  const expectedPortfolioReturn = 
    (allocation.bonds * assetReturns.bonds +
     allocation.blueChipStocks * assetReturns.blueChipStocks +
     allocation.growthStocks * assetReturns.growthStocks +
     allocation.cash * assetReturns.cash +
     (allocation.alternatives || 0) * assetReturns.alternatives) / 100;

  // Calculate risk score (weighted by asset risk)
  const riskScores = {
    bonds: 2,           // Low risk
    blueChipStocks: 5,  // Medium risk
    growthStocks: 8,    // High risk
    cash: 1,            // Very low risk
    alternatives: 9,     // Very high risk
  };

  const portfolioRiskScore = 
    (allocation.bonds * riskScores.bonds +
     allocation.blueChipStocks * riskScores.blueChipStocks +
     allocation.growthStocks * riskScores.growthStocks +
     allocation.cash * riskScores.cash +
     (allocation.alternatives || 0) * riskScores.alternatives) / 100;

  // Calculate diversification score
  const nonZeroAllocations = Object.values(allocation).filter(val => val > 0).length;
  const maxAllocation = Math.max(...Object.values(allocation));
  const concentrationScore = maxAllocation > 50 ? 2 : maxAllocation > 30 ? 1 : 0;
  const diversificationScore = Math.max(0, 5 - concentrationScore) + (nonZeroAllocations >= 4 ? 1 : 0);

  return {
    expectedReturn: Math.round(expectedPortfolioReturn * 100) / 100,
    riskScore: Math.round(portfolioRiskScore * 100) / 100,
    riskLevel: portfolioRiskScore <= 3 ? 'LOW' : portfolioRiskScore <= 6 ? 'MEDIUM' : 'HIGH',
    diversificationScore: Math.min(10, diversificationScore),
    diversificationLevel: diversificationScore >= 7 ? 'HIGH' : diversificationScore >= 4 ? 'MEDIUM' : 'LOW',
    assetAllocation: allocation,
    assetReturns,
    assetRiskScores: riskScores,
  };
}

/**
 * Generate investment recommendations
 * @param {Object} template - Portfolio template
 * @param {Object} allocation - Customized allocation
 * @param {Object} options - Additional options
 * @returns {Array} Investment recommendations
 */
function generateInvestmentRecommendations(template, allocation, options) {
  const recommendations = [];

  // Core strategy recommendations
  recommendations.push({
    type: 'STRATEGY',
    priority: 'HIGH',
    title: `${template.name} Strategy`,
    description: template.description,
    details: `Follow a ${template.name.toLowerCase()} approach with ${template.expectedReturn} expected returns and ${template.volatility.toLowerCase()} volatility.`,
  });

  // Asset allocation recommendations
  Object.entries(allocation).forEach(([asset, percentage]) => {
    if (percentage > 0) {
      const assetClass = ASSET_CLASSES[asset];
      recommendations.push({
        type: 'ASSET_ALLOCATION',
        priority: 'MEDIUM',
        title: `${assetClass.name} Allocation (${percentage}%)`,
        description: `Allocate ${percentage}% to ${assetClass.description.toLowerCase()}`,
        details: assetClass.description,
        riskLevel: assetClass.riskLevel,
        expectedReturn: assetClass.expectedReturn,
        examples: assetClass.nePSEExamples,
      });
    }
  });

  // Rebalancing recommendations
  recommendations.push({
    type: 'REBALANCING',
    priority: 'MEDIUM',
    title: `${template.rebalancingFrequency} Rebalancing`,
    description: `Rebalance your portfolio ${template.rebalancingFrequency.toLowerCase()} to maintain target allocation`,
    details: 'Regular rebalancing helps maintain risk profile and capture gains',
  });

  // Risk management recommendations
  if (template.riskLevel === 'HIGH') {
    recommendations.push({
      type: 'RISK_MANAGEMENT',
      priority: 'HIGH',
      title: 'Active Risk Management',
      description: 'Monitor portfolio closely and be prepared for volatility',
      details: 'Consider stop-loss orders and regular performance review',
    });
  }

  // Tax efficiency recommendations
  recommendations.push({
    type: 'TAX_EFFICIENCY',
    priority: 'LOW',
    title: `${template.taxEfficiency} Tax Efficiency`,
    description: `Consider tax implications of your investment choices`,
    details: template.taxEfficiency === 'HIGH' ? 'Focus on tax-efficient investments' : 'Monitor tax impact',
  });

  return recommendations;
}

/**
 * Create rebalancing strategy
 * @param {Object} template - Portfolio template
 * @param {Object} allocation - Current allocation
 * @returns {Object} Rebalancing strategy
 */
function createRebalancingStrategy(template, allocation) {
  return {
    frequency: template.rebalancingFrequency,
    description: `Rebalance portfolio ${template.rebalancingFrequency.toLowerCase()} to maintain target allocation`,
    triggers: [
      'Allocation drifts more than 5%',
      'Quarterly review',
      'Significant market movements',
      'Life changes (marriage, retirement, etc.)',
    ],
    method: 'Sell overperformers and buy underperformers to return to target allocation',
    taxConsiderations: 'Consider tax implications of selling and buying investments',
    monitoring: 'Review portfolio monthly and rebalance when allocation drifts significantly',
  };
}

/**
 * Assess portfolio risk
 * @param {Object} allocation - Portfolio allocation
 * @param {Object} template - Portfolio template
 * @returns {Object} Risk assessment
 */
function assessPortfolioRisk(allocation, template) {
  const riskFactors = [];
  
  // Concentration risk
  const maxAllocation = Math.max(...Object.values(allocation));
  if (maxAllocation > 60) {
    riskFactors.push({
      type: 'CONCENTRATION',
      level: 'HIGH',
      description: `High concentration in single asset class (${maxAllocation}%)`,
      recommendation: 'Consider diversifying across more asset classes',
    });
  }

  // Volatility risk
  if (template.riskLevel === 'HIGH') {
    riskFactors.push({
      type: 'VOLATILITY',
      level: 'HIGH',
      description: 'High volatility expected with aggressive allocation',
      recommendation: 'Ensure emotional readiness for market fluctuations',
    });
  }

  // Liquidity risk
  if (allocation.cash < 5) {
    riskFactors.push({
      type: 'LIQUIDITY',
      level: 'MEDIUM',
      description: 'Low cash allocation may limit flexibility',
      recommendation: 'Maintain adequate emergency fund separate from investments',
    });
  }

  return {
    overallRiskLevel: template.riskLevel,
    riskFactors,
    riskScore: riskFactors.length,
    recommendations: riskFactors.map(factor => factor.recommendation),
  };
}

/**
 * Get portfolio recommendations for multiple risk profiles
 * @returns {Object} All portfolio templates
 */
function getAllPortfolioRecommendations() {
  return {
    templates: PORTFOLIO_TEMPLATES,
    assetClasses: ASSET_CLASSES,
    riskProfiles: Object.keys(PORTFOLIO_TEMPLATES),
    customizationOptions: {
      age: 'Adjust allocation based on investor age',
      monthlyIncome: 'Adjust allocation based on monthly income',
      goalType: 'Adjust allocation based on financial goal type',
      marketCondition: 'Adjust allocation based on market conditions',
    },
  };
}

// Export the main function and utilities
module.exports = {
  recommendPortfolioAllocation,
  getAllPortfolioRecommendations,
  PORTFOLIO_TEMPLATES,
  ASSET_CLASSES,
  // Utility functions for advanced usage
  applyCustomizations,
  generateDetailedAllocation,
  calculatePortfolioMetrics,
  generateInvestmentRecommendations,
  createRebalancingStrategy,
  assessPortfolioRisk,
};
