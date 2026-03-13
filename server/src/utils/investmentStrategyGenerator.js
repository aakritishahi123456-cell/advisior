/**
 * FinSathi AI - Investment Strategy Generator
 * Generate personalized investment strategies using AI prompts
 */

/**
 * Investment strategy prompt template
 */
const INVESTMENT_STRATEGY_PROMPT = `
You are an expert AI investment strategist for FinSathi AI, Nepal's leading financial advisory platform. 

Generate a comprehensive, personalized investment strategy based on the following user information:

## USER PROFILE
{userProfile}

## RISK PROFILE
{riskProfile}

## PORTFOLIO ALLOCATION
{portfolioAllocation}

## MARKET CONTEXT
Current NEPSE market conditions: {marketContext}
Available investment instruments in Nepal: {availableInstruments}

## REQUIREMENTS
Generate a detailed investment strategy that includes:

### 1. PORTFOLIO BREAKDOWN
- Detailed asset allocation by percentage
- Specific investment categories and instruments
- Rationale for each allocation decision
- Expected returns and risk levels for each category

### 2. RECOMMENDED COMPANIES
- Top 5-8 NEPSE companies matching the strategy
- Brief analysis of each recommended company
- Investment thesis for each recommendation
- Entry and exit considerations

### 3. RISK EXPLANATION
- Detailed risk assessment of the recommended strategy
- Risk mitigation strategies
- Market risk factors specific to Nepal
- Sector concentration risks

### 4. INVESTMENT TIMELINE
- Short-term actions (0-6 months)
- Medium-term goals (6-24 months)
- Long-term objectives (2-5+ years)
- Rebalancing schedule and triggers

### 5. IMPLEMENTATION GUIDE
- Step-by-step investment process
- Required documentation and procedures
- Tax considerations in Nepal
- Monitoring and review process

## GUIDELINES
- Provide specific, actionable advice tailored to the Nepalese market
- Include realistic return expectations based on historical NEPSE performance
- Consider regulatory environment and market constraints in Nepal
- Address currency risk and inflation concerns
- Provide clear explanations for all recommendations
- Include disclaimers about market risks

## OUTPUT FORMAT
Use clear headings, bullet points, and tables where appropriate. 
Be comprehensive yet concise, focusing on practical implementation.
Include specific company symbols and current market context where relevant.
`;

/**
 * Market context template
 */
const MARKET_CONTEXT_TEMPLATE = `
NEPSE Index: {nepseIndex} ({nepseChange}%)
Market Sentiment: {marketSentiment}
Key Economic Indicators:
- GDP Growth: {gdpGrowth}%
- Inflation Rate: {inflationRate}%
- Interest Rate: {interestRate}%
- Exchange Rate: {exchangeRate} NPR/USD
Sector Performance: {sectorPerformance}
Market Outlook: {marketOutlook}
`;

/**
 * Available investment instruments in Nepal
 */
const AVAILABLE_INSTRUMENTS = `
EQUITY INSTRUMENTS:
- NEPSE Listed Stocks (Commercial Banks, Insurance, Hydropower, Manufacturing)
- Initial Public Offerings (IPOs)
- Right Shares
- Bonus Shares

DEBT INSTRUMENTS:
- Government Bonds (Treasury Bills, Development Bonds)
- Corporate Bonds and Debentures
- Fixed Deposits (Banking Institutions)
- Savings Certificates

MUTUAL FUNDS:
- Open-Ended Mutual Funds
- Close-Ended Mutual Funds
- Sector-Specific Funds

ALTERNATIVE INVESTMENTS:
- Real Estate (Direct and REITs)
- Gold and Precious Metals
- Commodities
- International Investments (subject to regulations)

BANKING PRODUCTS:
- High-Yield Savings Accounts
- Recurring Deposits
- Call Deposits
- Foreign Exchange Services
`;

/**
 * Generate personalized investment strategy
 * @param {Object} userProfile - User's financial profile
 * @param {Object} riskProfile - User's risk profile
 * @param {Object} portfolioAllocation - Recommended portfolio allocation
 * @param {Object} options - Additional options
 * @returns {Object} Complete investment strategy
 */
function generateInvestmentStrategy(userProfile, riskProfile, portfolioAllocation, options = {}) {
  try {
    // Validate inputs
    const validation = validateInputs(userProfile, riskProfile, portfolioAllocation);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error,
        code: validation.code,
      };
    }

    // Generate market context
    const marketContext = generateMarketContext(options.marketData || {});
    
    // Format user profile for prompt
    const formattedUserProfile = formatUserProfile(userProfile);
    
    // Format risk profile for prompt
    const formattedRiskProfile = formatRiskProfile(riskProfile);
    
    // Format portfolio allocation for prompt
    const formattedPortfolioAllocation = formatPortfolioAllocation(portfolioAllocation);
    
    // Generate the complete prompt
    const prompt = INVESTMENT_STRATEGY_PROMPT
      .replace('{userProfile}', formattedUserProfile)
      .replace('{riskProfile}', formattedRiskProfile)
      .replace('{portfolioAllocation}', formattedPortfolioAllocation)
      .replace('{marketContext}', marketContext)
      .replace('{availableInstruments}', AVAILABLE_INSTRUMENTS);

    // Generate strategy components
    const strategy = {
      portfolioBreakdown: generatePortfolioBreakdown(portfolioAllocation, riskProfile),
      recommendedCompanies: generateRecommendedCompanies(portfolioAllocation, riskProfile),
      riskExplanation: generateRiskExplanation(riskProfile, portfolioAllocation),
      investmentTimeline: generateInvestmentTimeline(userProfile, riskProfile),
      implementationGuide: generateImplementationGuide(userProfile, portfolioAllocation),
    };

    // Generate complete strategy document
    const strategyDocument = formatStrategyDocument(strategy, userProfile, riskProfile);

    return {
      success: true,
      data: {
        prompt,
        strategy,
        document: strategyDocument,
        metadata: {
          generatedAt: new Date().toISOString(),
          version: '1.0.0',
          userProfile: {
            age: userProfile.age,
            incomeRange: getIncomeRange(userProfile.monthlyIncome),
            riskTolerance: riskProfile.riskTolerance,
            investmentHorizon: userProfile.investmentHorizonYears,
          },
          strategyType: determineStrategyType(riskProfile, portfolioAllocation),
        },
      },
    };

  } catch (error) {
    return {
      success: false,
      error: 'Failed to generate investment strategy',
      code: 'STRATEGY_GENERATION_ERROR',
      details: error.message,
    };
  }
}

/**
 * Validate input parameters
 * @param {Object} userProfile - User financial profile
 * @param {Object} riskProfile - User risk profile
 * @param {Object} portfolioAllocation - Portfolio allocation
 * @returns {Object} Validation result
 */
function validateInputs(userProfile, riskProfile, portfolioAllocation) {
  const errors = [];

  // Validate user profile
  if (!userProfile.age || userProfile.age < 18 || userProfile.age > 100) {
    errors.push('User age must be between 18 and 100');
  }

  if (!userProfile.monthlyIncome || userProfile.monthlyIncome < 0) {
    errors.push('Monthly income must be a positive number');
  }

  if (!userProfile.investmentHorizonYears || userProfile.investmentHorizonYears < 1) {
    errors.push('Investment horizon must be at least 1 year');
  }

  // Validate risk profile
  if (!riskProfile.riskTolerance || !['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE'].includes(riskProfile.riskTolerance)) {
    errors.push('Risk tolerance must be CONSERVATIVE, MODERATE, or AGGRESSIVE');
  }

  // Validate portfolio allocation
  const totalAllocation = Object.values(portfolioAllocation).reduce((sum, val) => sum + val, 0);
  if (Math.abs(totalAllocation - 100) > 1) {
    errors.push('Portfolio allocation must sum to 100%');
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
 * Format user profile for prompt
 * @param {Object} userProfile - User financial profile
 * @returns {string} Formatted user profile
 */
function formatUserProfile(userProfile) {
  return `
Personal Information:
- Age: ${userProfile.age} years
- Monthly Income: NPR ${userProfile.monthlyIncome.toLocaleString()}
- Monthly Expenses: NPR ${userProfile.monthlyExpenses.toLocaleString()}
- Current Savings: NPR ${userProfile.currentSavings.toLocaleString()}
- Investment Horizon: ${userProfile.investmentHorizonYears} years
- Financial Goals: ${userProfile.financialGoals ? userProfile.financialGoals.join(', ') : 'Wealth creation'}

Financial Summary:
- Savings Rate: ${userProfile.monthlyIncome > 0 ? ((userProfile.monthlyIncome - userProfile.monthlyExpenses) / userProfile.monthlyIncome * 100).toFixed(1) : 0}%
- Emergency Fund Coverage: ${userProfile.monthlyExpenses > 0 ? (userProfile.currentSavings / userProfile.monthlyExpenses).toFixed(1) : 0} months
- Investment Capacity: NPR ${(userProfile.monthlyIncome - userProfile.monthlyExpenses).toLocaleString()} per month
  `.trim();
}

/**
 * Format risk profile for prompt
 * @param {Object} riskProfile - User risk profile
 * @returns {string} Formatted risk profile
 */
function formatRiskProfile(riskProfile) {
  return `
Risk Assessment:
- Risk Tolerance: ${riskProfile.riskTolerance}
- Risk Capacity: ${riskProfile.riskCapacity || 'MODERATE'}
- Investment Experience: ${riskProfile.investmentExperience || 'BEGINNER'}
- Time Horizon: ${riskProfile.timeHorizon || 'MEDIUM_TERM'}
- Volatility Comfort: ${riskProfile.volatilityComfort || 'MODERATE'}
- Maximum Acceptable Loss: ${riskProfile.maxAcceptableLoss || '10%'} of portfolio

Risk Preferences:
- Preferred Investment Types: ${riskProfile.preferredInvestmentTypes ? riskProfile.preferredInvestmentTypes.join(', ') : 'Balanced approach'}
- Liquidity Preference: ${riskProfile.liquidityPreference || 'MODERATE'}
- Tax Considerations: ${riskProfile.taxConsiderations || 'MODERATE'}
  `.trim();
}

/**
 * Format portfolio allocation for prompt
 * @param {Object} portfolioAllocation - Portfolio allocation
 * @returns {string} Formatted portfolio allocation
 */
function formatPortfolioAllocation(portfolioAllocation) {
  const allocationText = Object.entries(portfolioAllocation)
    .map(([asset, percentage]) => {
      const assetName = asset.replace(/([A-Z])/g, ' $1').trim();
      return `- ${assetName}: ${percentage}%`;
    })
    .join('\n');

  return `
Target Asset Allocation:
${allocationText}

Allocation Strategy:
- Conservative Instruments: ${(portfolioAllocation.bonds || 0) + (portfolioAllocation.cash || 0)}%
- Growth Instruments: ${(portfolioAllocation.blueChipStocks || 0) + (portfolioAllocation.growthStocks || 0)}%
- Alternative Investments: ${portfolioAllocation.alternatives || 0}%
  `.trim();
}

/**
 * Generate market context
 * @param {Object} marketData - Market data
 * @returns {string} Market context
 */
function generateMarketContext(marketData) {
  const defaultData = {
    nepseIndex: 2100,
    nepseChange: 2.5,
    marketSentiment: 'BULLISH',
    gdpGrowth: 5.8,
    inflationRate: 6.2,
    interestRate: 8.5,
    exchangeRate: 132.5,
    sectorPerformance: 'Banking and Hydropower sectors leading gains',
    marketOutlook: 'Positive with moderate growth expected',
  };

  const data = { ...defaultData, ...marketData };

  return MARKET_CONTEXT_TEMPLATE
    .replace('{nepseIndex}', data.nepseIndex)
    .replace('{nepseChange}', data.nepseChange)
    .replace('{marketSentiment}', data.marketSentiment)
    .replace('{gdpGrowth}', data.gdpGrowth)
    .replace('{inflationRate}', data.inflationRate)
    .replace('{interestRate}', data.interestRate)
    .replace('{exchangeRate}', data.exchangeRate)
    .replace('{sectorPerformance}', data.sectorPerformance)
    .replace('{marketOutlook}', data.marketOutlook);
}

/**
 * Generate portfolio breakdown
 * @param {Object} portfolioAllocation - Portfolio allocation
 * @param {Object} riskProfile - Risk profile
 * @returns {Object} Portfolio breakdown
 */
function generatePortfolioBreakdown(portfolioAllocation, riskProfile) {
  const breakdown = {
    overview: {
      strategy: determineStrategyType(riskProfile, portfolioAllocation),
      expectedReturn: calculateExpectedReturn(portfolioAllocation),
      riskLevel: riskProfile.riskTolerance,
      timeHorizon: riskProfile.timeHorizon || 'MEDIUM_TERM',
    },
    assetClasses: {},
    nepseRecommendations: {},
  };

  // Generate detailed breakdown for each asset class
  Object.entries(portfolioAllocation).forEach(([asset, percentage]) => {
    if (percentage > 0) {
      breakdown.assetClasses[asset] = generateAssetClassDetails(asset, percentage, riskProfile);
    }
  });

  return breakdown;
}

/**
 * Generate asset class details
 * @param {string} assetClass - Asset class name
 * @param {number} percentage - Allocation percentage
 * @param {Object} riskProfile - Risk profile
 * @returns {Object} Asset class details
 */
function generateAssetClassDetails(assetClass, percentage, riskProfile) {
  const assetDetails = {
    bonds: {
      instruments: ['Government Bonds', 'Corporate Debentures', 'Bank Fixed Deposits'],
      expectedReturn: '8-10%',
      riskLevel: 'LOW',
      liquidity: 'MEDIUM',
      taxEfficiency: 'HIGH',
      recommendedAllocation: percentage,
    },
    blueChipStocks: {
      instruments: ['Commercial Banks', 'Insurance Companies', 'Large-cap NEPSE Companies'],
      expectedReturn: '12-15%',
      riskLevel: 'MEDIUM',
      liquidity: 'HIGH',
      taxEfficiency: 'MEDIUM',
      recommendedAllocation: percentage,
    },
    growthStocks: {
      instruments: ['Mid-cap Stocks', 'Growth Sectors', 'Emerging Companies'],
      expectedReturn: '15-20%',
      riskLevel: 'HIGH',
      liquidity: 'MEDIUM',
      taxEfficiency: 'LOW',
      recommendedAllocation: percentage,
    },
    cash: {
      instruments: ['Savings Accounts', 'Money Market Funds', 'Treasury Bills'],
      expectedReturn: '4-6%',
      riskLevel: 'VERY_LOW',
      liquidity: 'VERY_HIGH',
      taxEfficiency: 'HIGH',
      recommendedAllocation: percentage,
    },
    alternatives: {
      instruments: ['Real Estate', 'Gold', 'International Funds'],
      expectedReturn: '12-18%',
      riskLevel: 'HIGH',
      liquidity: 'LOW',
      taxEfficiency: 'LOW',
      recommendedAllocation: percentage,
    },
  };

  return assetDetails[assetClass] || {
    instruments: ['Various instruments'],
    expectedReturn: '8-12%',
    riskLevel: 'MEDIUM',
    liquidity: 'MEDIUM',
    taxEfficiency: 'MEDIUM',
    recommendedAllocation: percentage,
  };
}

/**
 * Generate recommended companies
 * @param {Object} portfolioAllocation - Portfolio allocation
 * @param {Object} riskProfile - Risk profile
 * @returns {Array} Recommended companies
 */
function generateRecommendedCompanies(portfolioAllocation, riskProfile) {
  const recommendations = [];

  // Banking sector recommendations
  if ((portfolioAllocation.blueChipStocks || 0) > 20) {
    recommendations.push(
      {
        symbol: 'NABIL',
        name: 'Nabil Bank Limited',
        sector: 'Banking',
        recommendation: 'STRONG BUY',
        thesis: 'Largest commercial bank with consistent profitability and strong balance sheet',
        entryPrice: 'Current market price with 5-10% dips for better entry',
        targetReturn: '15-18% annually',
        holdingPeriod: '3-5 years',
        riskLevel: 'MEDIUM',
      },
      {
        symbol: 'NICA',
        name: 'NIC Asia Bank',
        sector: 'Banking',
        recommendation: 'BUY',
        thesis: 'Fast-growing bank with expanding branch network and digital banking initiatives',
        entryPrice: 'Accumulate on market corrections below 10% from current levels',
        targetReturn: '18-22% annually',
        holdingPeriod: '2-4 years',
        riskLevel: 'MEDIUM',
      }
    );
  }

  // Insurance sector recommendations
  if ((portfolioAllocation.blueChipStocks || 0) > 15) {
    recommendations.push(
      {
        symbol: 'SIC',
        name: 'Siddhartha Insurance',
        sector: 'Insurance',
        recommendation: 'BUY',
        thesis: 'Leading non-life insurer with strong underwriting performance and diversified portfolio',
        entryPrice: 'Current levels with gradual accumulation',
        targetReturn: '16-20% annually',
        holdingPeriod: '3-5 years',
        riskLevel: 'MEDIUM',
      }
    );
  }

  // Hydropower sector recommendations
  if ((portfolioAllocation.growthStocks || 0) > 10) {
    recommendations.push(
      {
        symbol: 'UPPER',
        name: 'Upper Tamakoshi Hydropower',
        sector: 'Hydropower',
        recommendation: 'BUY',
        thesis: 'Largest hydropower company with stable cash flows and expansion potential',
        entryPrice: 'Market price with focus on dividend yield',
        targetReturn: '12-15% annually plus dividends',
        holdingPeriod: '5+ years',
        riskLevel: 'LOW-MEDIUM',
      }
    );
  }

  // Growth stock recommendations for aggressive profiles
  if (riskProfile.riskTolerance === 'AGGRESSIVE' && (portfolioAllocation.growthStocks || 0) > 20) {
    recommendations.push(
      {
        symbol: 'NHPC',
        name: 'Nepal Hydropower Company',
        sector: 'Hydropower',
        recommendation: 'ACCUMULATE',
        thesis: 'Growth-oriented hydropower company with development pipeline',
        entryPrice: 'Gradual accumulation over 6-12 months',
        targetReturn: '20-25% annually',
        holdingPeriod: '3-5 years',
        riskLevel: 'HIGH',
      }
    );
  }

  return recommendations.slice(0, 8); // Limit to top 8 recommendations
}

/**
 * Generate risk explanation
 * @param {Object} riskProfile - Risk profile
 * @param {Object} portfolioAllocation - Portfolio allocation
 * @returns {Object} Risk explanation
 */
function generateRiskExplanation(riskProfile, portfolioAllocation) {
  const riskLevels = {
    CONSERVATIVE: 'LOW',
    MODERATE: 'MEDIUM',
    AGGRESSIVE: 'HIGH',
  };

  const portfolioRisk = calculatePortfolioRisk(portfolioAllocation);

  return {
    overallRiskLevel: riskLevels[riskProfile.riskTolerance],
    portfolioRiskScore: portfolioRisk.score,
    riskFactors: identifyRiskFactors(portfolioAllocation, riskProfile),
    mitigationStrategies: generateRiskMitigationStrategies(portfolioAllocation, riskProfile),
    marketRisks: {
      nepseVolatility: 'NEPSE historical volatility of 15-20% annually',
      currencyRisk: 'NPR/USD exchange rate fluctuations affecting import-dependent companies',
      regulatoryRisk: 'Changes in banking, insurance, and securities regulations',
      liquidityRisk: 'Limited market depth in certain sectors',
      concentrationRisk: 'High concentration in banking and hydropower sectors',
    },
    worstCaseScenario: 'Potential 25-40% portfolio decline in severe market downturn',
    recoveryTimeline: '12-24 months for portfolio recovery from major corrections',
  };
}

/**
 * Calculate portfolio risk
 * @param {Object} portfolioAllocation - Portfolio allocation
 * @returns {Object} Portfolio risk metrics
 */
function calculatePortfolioRisk(portfolioAllocation) {
  const riskScores = {
    bonds: 1,
    blueChipStocks: 3,
    growthStocks: 5,
    cash: 0,
    alternatives: 4,
  };

  const weightedRisk = Object.entries(portfolioAllocation).reduce((sum, [asset, percentage]) => {
    return sum + (riskScores[asset] || 3) * (percentage / 100);
  }, 0);

  return {
    score: Math.round(weightedRisk * 10) / 10,
    level: weightedRisk <= 2 ? 'LOW' : weightedRisk <= 3.5 ? 'MEDIUM' : 'HIGH',
  };
}

/**
 * Identify risk factors
 * @param {Object} portfolioAllocation - Portfolio allocation
 * @param {Object} riskProfile - Risk profile
 * @returns {Array} Risk factors
 */
function identifyRiskFactors(portfolioAllocation, riskProfile) {
  const factors = [];

  // Equity concentration risk
  const equityAllocation = (portfolioAllocation.blueChipStocks || 0) + (portfolioAllocation.growthStocks || 0);
  if (equityAllocation > 70) {
    factors.push('High equity concentration increases market volatility exposure');
  }

  // Sector concentration risk
  if (portfolioAllocation.growthStocks > 30) {
    factors.push('Growth stocks may have sector concentration in hydropower and finance');
  }

  // Liquidity risk
  if (portfolioAllocation.alternatives > 15) {
    factors.push('Alternative investments have lower liquidity and longer lock-in periods');
  }

  // Time horizon risk
  if (riskProfile.investmentHorizonYears < 3) {
    factors.push('Short investment horizon limits recovery time from market downturns');
  }

  // Market risk
  factors.push('NEPSE market volatility and limited depth compared to developed markets');
  factors.push('Currency risk affecting companies with foreign currency exposure');

  return factors;
}

/**
 * Generate risk mitigation strategies
 * @param {Object} portfolioAllocation - Portfolio allocation
 * @param {Object} riskProfile - Risk profile
 * @returns {Array} Risk mitigation strategies
 */
function generateRiskMitigationStrategies(portfolioAllocation, riskProfile) {
  const strategies = [];

  strategies.push('Regular portfolio rebalancing to maintain target allocation');
  strategies.push('Diversification across multiple sectors to reduce concentration risk');
  strategies.push('Systematic Investment Plan (SIP) approach to average out market volatility');

  if (riskProfile.riskTolerance === 'CONSERVATIVE') {
    strategies.push('Maintain higher allocation to government bonds and fixed deposits');
    strategies.push('Focus on dividend-paying blue-chip stocks for regular income');
  } else if (riskProfile.riskTolerance === 'AGGRESSIVE') {
    strategies.push('Use stop-loss orders to limit downside risk');
    strategies.push('Maintain emergency fund separate from investment portfolio');
  }

  strategies.push('Regular monitoring of regulatory changes and macroeconomic indicators');
  strategies.push('Consider international diversification when regulations permit');

  return strategies;
}

/**
 * Generate investment timeline
 * @param {Object} userProfile - User profile
 * @param {Object} riskProfile - Risk profile
 * @returns {Object} Investment timeline
 */
function generateInvestmentTimeline(userProfile, riskProfile) {
  return {
    shortTerm: {
      period: '0-6 months',
      actions: [
        'Complete KYC and open demat account',
        'Build emergency fund if not already established',
        'Start systematic investment in recommended instruments',
        'Initial portfolio setup with core holdings',
      ],
      expectedProgress: 'Portfolio establishment and initial investments',
    },
    mediumTerm: {
      period: '6-24 months',
      actions: [
        'Regular portfolio rebalancing quarterly',
        'Add new positions as opportunities arise',
        'Review and adjust strategy based on performance',
        'Increase investment capacity as income grows',
      ],
      expectedProgress: 'Portfolio growth and optimization',
    },
    longTerm: {
      period: '2-5+ years',
      actions: [
        'Strategic portfolio reallocation based on life changes',
        'Tax optimization and loss harvesting',
        'Gradual shift to more conservative allocation as goals approach',
        'Estate planning and wealth preservation strategies',
      ],
      expectedProgress: 'Wealth accumulation and goal achievement',
    },
    rebalancing: {
      frequency: riskProfile.riskTolerance === 'CONSERVATIVE' ? 'Quarterly' : 'Semi-annually',
      triggers: [
        'Allocation drifts more than 5% from targets',
        'Significant market movements (±15%)',
        'Changes in personal financial situation',
        'Major economic or regulatory changes',
      ],
    },
  };
}

/**
 * Generate implementation guide
 * @param {Object} userProfile - User profile
 * @param {Object} portfolioAllocation - Portfolio allocation
 * @returns {Object} Implementation guide
 */
function generateImplementationGuide(userProfile, portfolioAllocation) {
  return {
    stepByStep: [
      {
        step: 1,
        title: 'Account Setup',
        actions: [
          'Open demat account with licensed broker',
          'Complete KYC verification',
          'Link bank account for seamless transactions',
          'Set up online trading platform access',
        ],
        timeframe: '1-2 weeks',
      },
      {
        step: 2,
        title: 'Initial Investment',
        actions: [
          'Transfer initial investment amount',
          'Purchase recommended core holdings',
          'Set up systematic investment plans',
          'Establish emergency fund in liquid instruments',
        ],
        timeframe: '2-4 weeks',
      },
      {
        step: 3,
        title: 'Portfolio Construction',
        actions: [
          'Build positions in recommended companies',
          'Diversify across sectors as per allocation',
          'Monitor portfolio performance regularly',
          'Adjust positions based on market conditions',
        ],
        timeframe: '1-3 months',
      },
      {
        step: 4,
        title: 'Ongoing Management',
        actions: [
          'Regular portfolio review and rebalancing',
          'Tax planning and optimization',
          'Performance tracking against benchmarks',
          'Strategy adjustments as needed',
        ],
        timeframe: 'Ongoing',
      },
    ],
    documentation: [
      'PAN card and citizenship certificate',
      'Bank account details and statements',
      'Demat account opening form',
      'Risk disclosure acknowledgment',
      'Investment objectives declaration',
    ],
    taxConsiderations: [
      'Capital gains tax on stock profits (as per current regulations)',
      'Dividend income taxation',
      'Tax deduction opportunities under Section X',
      'Annual tax filing requirements',
      'Documentation for tax loss harvesting',
    ],
    monitoring: {
      frequency: 'Weekly portfolio review, monthly detailed analysis',
      keyMetrics: [
        'Portfolio return vs NEPSE index',
        'Individual stock performance',
        'Sector allocation percentages',
        'Dividend income tracking',
        'Risk metrics and volatility',
      ],
      alerts: [
        'Price movements exceeding 10%',
        'Company-specific news and announcements',
        'Regulatory changes affecting holdings',
        'Macroeconomic indicator shifts',
      ],
    },
  };
}

/**
 * Format strategy document
 * @param {Object} strategy - Generated strategy
 * @param {Object} userProfile - User profile
 * @param {Object} riskProfile - Risk profile
 * @returns {string} Formatted strategy document
 */
function formatStrategyDocument(strategy, userProfile, riskProfile) {
  return `
# PERSONALIZED INVESTMENT STRATEGY

## EXECUTIVE SUMMARY
This investment strategy is designed for ${userProfile.age}-year-old investor with ${riskProfile.riskTolerance.toLowerCase()} risk tolerance and ${userProfile.investmentHorizonYears}-year investment horizon. The strategy targets ${strategy.portfolioBreakdown.overview.expectedReturn} annual returns with ${strategy.portfolioBreakdown.overview.riskLevel} risk level.

## 1. PORTFOLIO BREAKDOWN

### Strategy Overview
- **Investment Strategy**: ${strategy.portfolioBreakdown.overview.strategy}
- **Expected Return**: ${strategy.portfolioBreakdown.overview.expectedReturn}
- **Risk Level**: ${strategy.portfolioBreakdown.overview.riskLevel}
- **Time Horizon**: ${strategy.portfolioBreakdown.overview.timeHorizon}

### Asset Allocation Details
${Object.entries(strategy.portfolioBreakdown.assetClasses).map(([asset, details]) => `
#### ${asset.replace(/([A-Z])/g, ' $1').trim()}
- **Allocation**: ${details.recommendedAllocation}%
- **Instruments**: ${details.instruments.join(', ')}
- **Expected Return**: ${details.expectedReturn}
- **Risk Level**: ${details.riskLevel}
- **Liquidity**: ${details.liquidity}
- **Tax Efficiency**: ${details.taxEfficiency}
`).join('')}

## 2. RECOMMENDED COMPANIES

${strategy.recommendedCompanies.map((company, index) => `
### ${index + 1}. ${company.name} (${company.symbol})
- **Sector**: ${company.sector}
- **Recommendation**: ${company.recommendation}
- **Investment Thesis**: ${company.thesis}
- **Entry Strategy**: ${company.entryPrice}
- **Target Return**: ${company.targetReturn}
- **Holding Period**: ${company.holdingPeriod}
- **Risk Level**: ${company.riskLevel}
`).join('')}

## 3. RISK EXPLANATION

### Overall Risk Assessment
- **Risk Level**: ${strategy.riskExplanation.overallRiskLevel}
- **Portfolio Risk Score**: ${strategy.riskExplanation.portfolioRiskScore}/10
- **Worst Case Scenario**: ${strategy.riskExplanation.worstCaseScenario}
- **Recovery Timeline**: ${strategy.riskExplanation.recoveryTimeline}

### Key Risk Factors
${strategy.riskExplanation.riskFactors.map(factor => `- ${factor}`).join('\n')}

### Risk Mitigation Strategies
${strategy.riskExplanation.mitigationStrategies.map(strategy => `- ${strategy}`).join('\n')}

### Market Risks
${Object.entries(strategy.riskExplanation.marketRisks).map(([risk, description]) => `- **${risk.replace(/([A-Z])/g, ' $1').trim()}**: ${description}`).join('\n')}

## 4. INVESTMENT TIMELINE

### Short Term (0-6 months)
${strategy.investmentTimeline.shortTerm.actions.map(action => `- ${action}`).join('\n')}
**Expected Progress**: ${strategy.investmentTimeline.shortTerm.expectedProgress}

### Medium Term (6-24 months)
${strategy.investmentTimeline.mediumTerm.actions.map(action => `- ${action}`).join('\n')}
**Expected Progress**: ${strategy.investmentTimeline.mediumTerm.expectedProgress}

### Long Term (2-5+ years)
${strategy.investmentTimeline.longTerm.actions.map(action => `- ${action}`).join('\n')}
**Expected Progress**: ${strategy.investmentTimeline.longTerm.expectedProgress}

### Rebalancing Schedule
- **Frequency**: ${strategy.investmentTimeline.rebalancing.frequency}
- **Triggers**: ${strategy.investmentTimeline.rebalancing.triggers.map(trigger => `- ${trigger}`).join('\n')}

## 5. IMPLEMENTATION GUIDE

### Step-by-Step Process
${strategy.implementationGuide.stepByStep.map(step => `
#### Step ${step.step}: ${step.title}
**Timeframe**: ${step.timeframe}
${step.actions.map(action => `- ${action}`).join('\n')}
`).join('')}

### Required Documentation
${strategy.implementationGuide.documentation.map(doc => `- ${doc}`).join('\n')}

### Tax Considerations
${strategy.implementationGuide.taxConsiderations.map(tax => `- ${tax}`).join('\n')}

### Monitoring and Review
- **Frequency**: ${strategy.implementationGuide.monitoring.frequency}
- **Key Metrics**: ${strategy.implementationGuide.monitoring.keyMetrics.join(', ')}
- **Alerts**: ${strategy.implementationGuide.monitoring.alerts.join(', ')}

## DISCLAIMER
This investment strategy is generated based on the provided information and current market conditions. All investments carry risks, and past performance does not guarantee future results. Please consult with a qualified financial advisor before making investment decisions. The strategy should be reviewed periodically and adjusted based on changing personal circumstances and market conditions.

---

**Strategy Generated**: ${new Date().toLocaleDateString()}
**Valid Until**: Review recommended every 6 months or upon major life changes
  `.trim();
}

/**
 * Determine strategy type
 * @param {Object} riskProfile - Risk profile
 * @param {Object} portfolioAllocation - Portfolio allocation
 * @returns {string} Strategy type
 */
function determineStrategyType(riskProfile, portfolioAllocation) {
  const equityAllocation = (portfolioAllocation.blueChipStocks || 0) + (portfolioAllocation.growthStocks || 0);
  
  if (riskProfile.riskTolerance === 'CONSERVATIVE' && equityAllocation < 40) {
    return 'CONSERVATIVE GROWTH';
  } else if (riskProfile.riskTolerance === 'AGGRESSIVE' && equityAllocation > 60) {
    return 'AGGRESSIVE GROWTH';
  } else if (equityAllocation >= 40 && equityAllocation <= 60) {
    return 'BALANCED GROWTH';
  } else {
    return 'MODERATE GROWTH';
  }
}

/**
 * Calculate expected return
 * @param {Object} portfolioAllocation - Portfolio allocation
 * @returns {string} Expected return range
 */
function calculateExpectedReturn(portfolioAllocation) {
  const returns = {
    bonds: 8,
    blueChipStocks: 14,
    growthStocks: 18,
    cash: 4,
    alternatives: 15,
  };

  const weightedReturn = Object.entries(portfolioAllocation).reduce((sum, [asset, percentage]) => {
    return sum + (returns[asset] || 10) * (percentage / 100);
  }, 0);

  return `${Math.round(weightedReturn - 2)}-${Math.round(weightedReturn + 2)}%`;
}

/**
 * Get income range
 * @param {number} income - Monthly income
 * @returns {string} Income range
 */
function getIncomeRange(income) {
  if (income < 50000) return 'LOW';
  if (income < 150000) return 'MEDIUM';
  if (income < 300000) return 'HIGH';
  return 'VERY_HIGH';
}

// Export the main function and utilities
module.exports = {
  generateInvestmentStrategy,
  INVESTMENT_STRATEGY_PROMPT,
  AVAILABLE_INSTRUMENTS,
  // Utility functions for advanced usage
  validateInputs,
  formatUserProfile,
  formatRiskProfile,
  formatPortfolioAllocation,
  generateMarketContext,
  generatePortfolioBreakdown,
  generateRecommendedCompanies,
  generateRiskExplanation,
  generateInvestmentTimeline,
  generateImplementationGuide,
};
