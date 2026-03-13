/**
 * FinSathi AI - Trading Signal Generation System
 * Advanced algorithm for generating buy/sell/hold signals with reasoning
 */

class TradingSignalGenerator {
  constructor() {
    this.signalWeights = {
      trend: 0.35,        // 35% weight to price trends
      financial: 0.25,    // 25% weight to financial ratios
      health: 0.20,       // 20% weight to company health
      technical: 0.15,    // 15% weight to technical indicators
      risk: 0.05          // 5% weight to risk assessment
    };
    
    this.thresholds = {
      strongBuy: 0.8,
      buy: 0.6,
      hold: 0.4,
      sell: 0.2,
      strongSell: 0.0
    };
  }

  /**
   * Generate comprehensive trading signal
   */
  generateSignal(data) {
    const {
      symbol,
      priceData,
      financialData,
      healthScore,
      technicalIndicators,
      riskMetrics
    } = data;

    // Validate input data
    if (!priceData || !financialData || healthScore === undefined) {
      return {
        signal: 'HOLD',
        confidence: 'low',
        score: 0.5,
        reasoning: ['Insufficient data for signal generation'],
        components: {},
        timestamp: new Date().toISOString()
      };
    }

    // Analyze each component
    const trendAnalysis = this.analyzePriceTrends(priceData);
    const financialAnalysis = this.analyzeFinancialRatios(financialData);
    const healthAnalysis = this.analyzeCompanyHealth(healthScore);
    const technicalAnalysis = this.analyzeTechnicalIndicators(technicalIndicators);
    const riskAnalysis = this.analyzeRiskMetrics(riskMetrics);

    // Calculate weighted scores
    const components = {
      trend: {
        score: trendAnalysis.score,
        weight: this.signalWeights.trend,
        weightedScore: trendAnalysis.score * this.signalWeights.trend,
        reasoning: trendAnalysis.reasoning
      },
      financial: {
        score: financialAnalysis.score,
        weight: this.signalWeights.financial,
        weightedScore: financialAnalysis.score * this.signalWeights.financial,
        reasoning: financialAnalysis.reasoning
      },
      health: {
        score: healthAnalysis.score,
        weight: this.signalWeights.health,
        weightedScore: healthAnalysis.score * this.signalWeights.health,
        reasoning: healthAnalysis.reasoning
      },
      technical: {
        score: technicalAnalysis.score,
        weight: this.signalWeights.technical,
        weightedScore: technicalAnalysis.score * this.signalWeights.technical,
        reasoning: technicalAnalysis.reasoning
      },
      risk: {
        score: riskAnalysis.score,
        weight: this.signalWeights.risk,
        weightedScore: riskAnalysis.score * this.signalWeights.risk,
        reasoning: riskAnalysis.reasoning
      }
    };

    // Calculate total score
    const totalScore = Object.values(components).reduce((sum, comp) => sum + comp.weightedScore, 0);

    // Determine signal and confidence
    const signal = this.determineSignal(totalScore);
    const confidence = this.calculateConfidence(components, totalScore);

    // Generate comprehensive reasoning
    const reasoning = this.generateReasoning(components, signal, confidence);

    return {
      symbol,
      signal,
      confidence,
      score: totalScore,
      reasoning,
      components,
      timestamp: new Date().toISOString(),
      metadata: {
        priceDataPoints: priceData.prices ? priceData.prices.length : 0,
        lastUpdated: new Date().toISOString(),
        analysisVersion: '1.0'
      }
    };
  }

  /**
   * Analyze price trends
   */
  analyzePriceTrends(priceData) {
    const { prices, volumes, dates } = priceData;
    
    if (!prices || prices.length < 20) {
      return {
        score: 0.5,
        reasoning: ['Insufficient price data for trend analysis']
      };
    }

    const reasoning = [];
    let score = 0.5;

    // Short-term trend (10 periods)
    const shortTermTrend = this.calculateTrend(prices.slice(-10));
    if (shortTermTrend > 0.05) {
      score += 0.15;
      reasoning.push('Strong short-term uptrend detected');
    } else if (shortTermTrend > 0.02) {
      score += 0.10;
      reasoning.push('Moderate short-term uptrend detected');
    } else if (shortTermTrend < -0.05) {
      score -= 0.15;
      reasoning.push('Strong short-term downtrend detected');
    } else if (shortTermTrend < -0.02) {
      score -= 0.10;
      reasoning.push('Moderate short-term downtrend detected');
    }

    // Long-term trend (50 periods)
    const longTermTrend = this.calculateTrend(prices.slice(-50));
    if (longTermTrend > 0.10) {
      score += 0.20;
      reasoning.push('Strong long-term uptrend established');
    } else if (longTermTrend > 0.05) {
      score += 0.15;
      reasoning.push('Moderate long-term uptrend established');
    } else if (longTermTrend < -0.10) {
      score -= 0.20;
      reasoning.push('Strong long-term downtrend established');
    } else if (longTermTrend < -0.05) {
      score -= 0.15;
      reasoning.push('Moderate long-term downtrend established');
    }

    // Volume confirmation
    if (volumes && volumes.length > 0) {
      const recentVolume = volumes.slice(-5).reduce((sum, vol) => sum + vol, 0) / 5;
      const avgVolume = volumes.slice(-20).reduce((sum, vol) => sum + vol, 0) / 20;
      const volumeRatio = recentVolume / avgVolume;

      if (shortTermTrend > 0 && volumeRatio > 1.5) {
        score += 0.10;
        reasoning.push('Uptrend confirmed by high volume');
      } else if (shortTermTrend < 0 && volumeRatio > 1.5) {
        score -= 0.10;
        reasoning.push('Downtrend confirmed by high volume');
      }
    }

    // Price momentum
    const momentum = this.calculateMomentum(prices, 10);
    if (momentum > 0.08) {
      score += 0.15;
      reasoning.push('Strong positive price momentum');
    } else if (momentum > 0.03) {
      score += 0.08;
      reasoning.push('Moderate positive price momentum');
    } else if (momentum < -0.08) {
      score -= 0.15;
      reasoning.push('Strong negative price momentum');
    } else if (momentum < -0.03) {
      score -= 0.08;
      reasoning.push('Moderate negative price momentum');
    }

    // Support/Resistance levels
    const currentPrice = prices[prices.length - 1];
    const recentHigh = Math.max(...prices.slice(-20));
    const recentLow = Math.min(...prices.slice(-20));
    
    if (currentPrice > recentHigh * 0.98) {
      score += 0.10;
      reasoning.push('Price breaking above recent resistance');
    } else if (currentPrice < recentLow * 1.02) {
      score -= 0.10;
      reasoning.push('Price breaking below recent support');
    }

    return {
      score: Math.max(0, Math.min(1, score)),
      reasoning
    };
  }

  /**
   * Analyze financial ratios
   */
  analyzeFinancialRatios(financialData) {
    const reasoning = [];
    let score = 0.5;

    // P/E Ratio analysis
    if (financialData.peRatio !== undefined) {
      if (financialData.peRatio < 15) {
        score += 0.15;
        reasoning.push('Attractive P/E ratio indicates undervaluation');
      } else if (financialData.peRatio < 25) {
        score += 0.08;
        reasoning.push('Reasonable P/E ratio');
      } else if (financialData.peRatio > 40) {
        score -= 0.15;
        reasoning.push('High P/E ratio suggests overvaluation');
      }
    }

    // P/B Ratio analysis
    if (financialData.pbRatio !== undefined) {
      if (financialData.pbRatio < 1.5) {
        score += 0.10;
        reasoning.push('Low P/B ratio indicates value opportunity');
      } else if (financialData.pbRatio < 3) {
        score += 0.05;
        reasoning.push('Moderate P/B ratio');
      } else if (financialData.pbRatio > 5) {
        score -= 0.10;
        reasoning.push('High P/B ratio suggests overvaluation');
      }
    }

    // ROE analysis
    if (financialData.roe !== undefined) {
      if (financialData.roe > 0.20) {
        score += 0.15;
        reasoning.push('Excellent ROE indicates strong profitability');
      } else if (financialData.roe > 0.15) {
        score += 0.10;
        reasoning.push('Good ROE indicates solid profitability');
      } else if (financialData.roe < 0.05) {
        score -= 0.15;
        reasoning.push('Low ROE indicates poor profitability');
      }
    }

    // Debt-to-Equity analysis
    if (financialData.debtToEquity !== undefined) {
      if (financialData.debtToEquity < 0.3) {
        score += 0.10;
        reasoning.push('Low debt-to-equity ratio indicates financial stability');
      } else if (financialData.debtToEquity < 0.7) {
        score += 0.05;
        reasoning.push('Moderate debt-to-equity ratio');
      } else if (financialData.debtToEquity > 1.5) {
        score -= 0.15;
        reasoning.push('High debt-to-equity ratio indicates financial risk');
      }
    }

    // Current Ratio analysis
    if (financialData.currentRatio !== undefined) {
      if (financialData.currentRatio > 2) {
        score += 0.10;
        reasoning.push('Strong current ratio indicates good liquidity');
      } else if (financialData.currentRatio > 1.5) {
        score += 0.05;
        reasoning.push('Adequate current ratio');
      } else if (financialData.currentRatio < 1) {
        score -= 0.15;
        reasoning.push('Low current ratio indicates liquidity concerns');
      }
    }

    // Revenue Growth analysis
    if (financialData.revenueGrowth !== undefined) {
      if (financialData.revenueGrowth > 0.20) {
        score += 0.15;
        reasoning.push('Strong revenue growth indicates business expansion');
      } else if (financialData.revenueGrowth > 0.10) {
        score += 0.08;
        reasoning.push('Moderate revenue growth');
      } else if (financialData.revenueGrowth < 0) {
        score -= 0.15;
        reasoning.push('Negative revenue growth indicates business decline');
      }
    }

    // Profit Margin analysis
    if (financialData.profitMargin !== undefined) {
      if (financialData.profitMargin > 0.20) {
        score += 0.10;
        reasoning.push('High profit margin indicates operational efficiency');
      } else if (financialData.profitMargin > 0.10) {
        score += 0.05;
        reasoning.push('Adequate profit margin');
      } else if (financialData.profitMargin < 0.05) {
        score -= 0.10;
        reasoning.push('Low profit margin indicates operational challenges');
      }
    }

    return {
      score: Math.max(0, Math.min(1, score)),
      reasoning
    };
  }

  /**
   * Analyze company health score
   */
  analyzeCompanyHealth(healthScore) {
    const reasoning = [];
    let score = 0.5;

    if (typeof healthScore === 'number') {
      if (healthScore >= 80) {
        score = 0.9;
        reasoning.push('Excellent company health score indicates strong fundamentals');
      } else if (healthScore >= 70) {
        score = 0.8;
        reasoning.push('Good company health score indicates solid fundamentals');
      } else if (healthScore >= 60) {
        score = 0.6;
        reasoning.push('Average company health score indicates moderate fundamentals');
      } else if (healthScore >= 50) {
        score = 0.4;
        reasoning.push('Below-average company health score indicates weak fundamentals');
      } else {
        score = 0.2;
        reasoning.push('Poor company health score indicates significant risks');
      }
    } else {
      score = 0.5;
      reasoning.push('Company health score not available');
    }

    return {
      score,
      reasoning
    };
  }

  /**
   * Analyze technical indicators
   */
  analyzeTechnicalIndicators(technicalIndicators) {
    const reasoning = [];
    let score = 0.5;

    if (!technicalIndicators) {
      return {
        score: 0.5,
        reasoning: ['Technical indicators not available']
      };
    }

    // RSI analysis
    if (technicalIndicators.rsi !== undefined) {
      if (technicalIndicators.rsi < 30) {
        score += 0.15;
        reasoning.push('RSI indicates oversold condition - buying opportunity');
      } else if (technicalIndicators.rsi < 40) {
        score += 0.08;
        reasoning.push('RSI approaching oversold levels');
      } else if (technicalIndicators.rsi > 70) {
        score -= 0.15;
        reasoning.push('RSI indicates overbought condition - selling pressure');
      } else if (technicalIndicators.rsi > 60) {
        score -= 0.08;
        reasoning.push('RSI approaching overbought levels');
      }
    }

    // MACD analysis
    if (technicalIndicators.macd) {
      const { macd, signal, histogram } = technicalIndicators.macd;
      if (histogram && histogram.length > 0) {
        const latestHistogram = histogram[histogram.length - 1];
        if (latestHistogram > 0) {
          score += 0.10;
          reasoning.push('MACD histogram positive indicates bullish momentum');
        } else {
          score -= 0.10;
          reasoning.push('MACD histogram negative indicates bearish momentum');
        }
      }
    }

    // Moving averages analysis
    if (technicalIndicators.maCross) {
      const { shortMA, longMA, cross } = technicalIndicators.maCross;
      if (cross === 'golden') {
        score += 0.15;
        reasoning.push('Golden cross detected - bullish signal');
      } else if (cross === 'death') {
        score -= 0.15;
        reasoning.push('Death cross detected - bearish signal');
      } else if (shortMA > longMA) {
        score += 0.08;
        reasoning.push('Price above long-term moving average - bullish');
      } else {
        score -= 0.08;
        reasoning.push('Price below long-term moving average - bearish');
      }
    }

    // Bollinger Bands analysis
    if (technicalIndicators.bollinger) {
      const { position } = technicalIndicators.bollinger;
      if (position === 'above_upper') {
        score += 0.10;
        reasoning.push('Price above Bollinger Bands - strong momentum');
      } else if (position === 'below_lower') {
        score += 0.10;
        reasoning.push('Price below Bollinger Bands - potential reversal');
      } else if (position === 'middle') {
        score += 0.05;
        reasoning.push('Price in middle of Bollinger Bands - neutral');
      }
    }

    return {
      score: Math.max(0, Math.min(1, score)),
      reasoning
    };
  }

  /**
   * Analyze risk metrics
   */
  analyzeRiskMetrics(riskMetrics) {
    const reasoning = [];
    let score = 0.5;

    if (!riskMetrics) {
      return {
        score: 0.5,
        reasoning: ['Risk metrics not available']
      };
    }

    // Volatility analysis
    if (riskMetrics.volatility !== undefined) {
      if (riskMetrics.volatility < 0.15) {
        score += 0.10;
        reasoning.push('Low volatility indicates stable price movements');
      } else if (riskMetrics.volatility < 0.25) {
        score += 0.05;
        reasoning.push('Moderate volatility');
      } else if (riskMetrics.volatility > 0.40) {
        score -= 0.15;
        reasoning.push('High volatility indicates significant price risk');
      }
    }

    // Beta analysis
    if (riskMetrics.beta !== undefined) {
      if (riskMetrics.beta < 0.8) {
        score += 0.08;
        reasoning.push('Low beta indicates lower systematic risk');
      } else if (riskMetrics.beta > 1.2) {
        score -= 0.08;
        reasoning.push('High beta indicates higher systematic risk');
      }
    }

    // Maximum drawdown analysis
    if (riskMetrics.maxDrawdown !== undefined) {
      if (riskMetrics.maxDrawdown > -0.10) {
        score += 0.08;
        reasoning.push('Low maximum drawdown indicates good risk management');
      } else if (riskMetrics.maxDrawdown < -0.30) {
        score -= 0.15;
        reasoning.push('High maximum drawdown indicates significant risk');
      }
    }

    // Sharpe ratio analysis
    if (riskMetrics.sharpeRatio !== undefined) {
      if (riskMetrics.sharpeRatio > 1.5) {
        score += 0.12;
        reasoning.push('High Sharpe ratio indicates good risk-adjusted returns');
      } else if (riskMetrics.sharpeRatio < 0.5) {
        score -= 0.12;
        reasoning.push('Low Sharpe ratio indicates poor risk-adjusted returns');
      }
    }

    return {
      score: Math.max(0, Math.min(1, score)),
      reasoning
    };
  }

  /**
   * Determine signal based on total score
   */
  determineSignal(score) {
    if (score >= this.thresholds.strongBuy) return 'STRONG_BUY';
    if (score >= this.thresholds.buy) return 'BUY';
    if (score >= this.thresholds.hold) return 'HOLD';
    if (score >= this.thresholds.sell) return 'SELL';
    return 'STRONG_SELL';
  }

  /**
   * Calculate confidence level
   */
  calculateConfidence(components, totalScore) {
    const componentCount = Object.keys(components).length;
    const validComponents = Object.values(components).filter(comp => comp.reasoning.length > 0).length;
    
    // Base confidence on data availability
    let dataConfidence = validComponents / componentCount;
    
    // Adjust based on signal strength
    let signalStrength = 0.5;
    if (totalScore > 0.7 || totalScore < 0.3) {
      signalStrength = 0.8;
    } else if (totalScore > 0.6 || totalScore < 0.4) {
      signalStrength = 0.6;
    }
    
    const overallConfidence = (dataConfidence + signalStrength) / 2;
    
    if (overallConfidence > 0.7) return 'high';
    if (overallConfidence > 0.5) return 'medium';
    return 'low';
  }

  /**
   * Generate comprehensive reasoning
   */
  generateReasoning(components, signal, confidence) {
    const reasoning = [];
    
    // Add component-specific reasoning
    Object.entries(components).forEach(([component, analysis]) => {
      if (analysis.reasoning.length > 0) {
        reasoning.push(...analysis.reasoning);
      }
    });
    
    // Add signal-specific summary
    switch (signal) {
      case 'STRONG_BUY':
        reasoning.push('Strong buy signal based on comprehensive analysis of multiple factors');
        break;
      case 'BUY':
        reasoning.push('Buy signal supported by positive indicators across multiple dimensions');
        break;
      case 'HOLD':
        reasoning.push('Hold signal as indicators are mixed or neutral');
        break;
      case 'SELL':
        reasoning.push('Sell signal based on negative indicators and risk factors');
        break;
      case 'STRONG_SELL':
        reasoning.push('Strong sell signal due to significant negative factors');
        break;
    }
    
    // Add confidence note
    reasoning.push(`Signal confidence: ${confidence}`);
    
    return reasoning;
  }

  /**
   * Calculate trend direction
   */
  calculateTrend(prices) {
    if (prices.length < 2) return 0;
    
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    return (lastPrice - firstPrice) / firstPrice;
  }

  /**
   * Calculate momentum
   */
  calculateMomentum(prices, period) {
    if (prices.length < period + 1) return 0;
    
    const currentPrice = prices[prices.length - 1];
    const pastPrice = prices[prices.length - 1 - period];
    return (currentPrice - pastPrice) / pastPrice;
  }

  /**
   * Batch signal generation for multiple stocks
   */
  generateBatchSignals(stockDataArray) {
    const signals = [];
    
    stockDataArray.forEach(stockData => {
      try {
        const signal = this.generateSignal(stockData);
        signals.push(signal);
      } catch (error) {
        signals.push({
          symbol: stockData.symbol || 'UNKNOWN',
          signal: 'HOLD',
          confidence: 'low',
          score: 0.5,
          reasoning: [`Error generating signal: ${error.message}`],
          timestamp: new Date().toISOString()
        });
      }
    });
    
    return signals;
  }

  /**
   * Update signal weights (for customization)
   */
  updateWeights(newWeights) {
    this.signalWeights = { ...this.signalWeights, ...newWeights };
    
    // Ensure weights sum to 1
    const totalWeight = Object.values(this.signalWeights).reduce((sum, weight) => sum + weight, 0);
    if (totalWeight !== 1) {
      Object.keys(this.signalWeights).forEach(key => {
        this.signalWeights[key] = this.signalWeights[key] / totalWeight;
      });
    }
  }

  /**
   * Update thresholds (for customization)
   */
  updateThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }
}

module.exports = TradingSignalGenerator;
