/**
 * FinSathi AI - Portfolio Optimization Engine
 * AI-powered portfolio optimization using Modern Portfolio Theory
 */

const { PrismaClient } = require('@prisma/client');

class PortfolioOptimizer {
  constructor() {
    this.prisma = new PrismaClient();
  }

  // ============================================
  // MAIN OPTIMIZATION
  // ============================================

  /**
   * Optimize portfolio based on user profile
   */
  async optimizePortfolio(config) {
    const {
      userId,
      riskProfile, // CONSERVATIVE, MODERATE, AGGRESSIVE
      symbols,
      predictionService,
      constraints = {}
    } = config;

    // Get stock data
    const stocks = await this.getStockData(symbols);

    // Calculate expected returns and covariance
    const { expectedReturns, covarianceMatrix } = this.calculateRiskMetrics(stocks);

    // Incorporate AI predictions
    let adjustedReturns = expectedReturns;
    if (predictionService) {
      adjustedReturns = await this.incorporatePredictions(
        symbols, 
        expectedReturns, 
        predictionService
      );
    }

    // Select optimization method based on risk profile
    const optimizationMethod = this.selectOptimizationMethod(riskProfile);
    
    // Run optimization
    let allocation;
    switch (optimizationMethod) {
      case 'MARKOWITZ':
        allocation = this.markowitzOptimization(adjustedReturns, covarianceMatrix, riskProfile);
        break;
      case 'RISK_PARITY':
        allocation = this.riskParityOptimization(covarianceMatrix, riskProfile);
        break;
      case 'BLACK_LITTERMAN':
        allocation = this.blackLittermanOptimization(adjustedReturns, covarianceMatrix, stocks);
        break;
      case 'MAXIMUM_SHARPE':
        allocation = this.maximumSharpeOptimization(adjustedReturns, covarianceMatrix);
        break;
      default:
        allocation = this.markowitzOptimization(adjustedReturns, covarianceMatrix, riskProfile);
    }

    // Apply constraints
    allocation = this.applyConstraints(allocation, constraints);

    // Calculate portfolio metrics
    const metrics = this.calculatePortfolioMetrics(allocation, adjustedReturns, covarianceMatrix);

    return {
      allocation: allocation.map(a => ({
        symbol: a.symbol,
        weight: Math.round(a.weight * 10000) / 100,
        shares: Math.floor(a.investmentAmount / a.price),
        investment: a.investmentAmount
      })),
      metrics,
      methodology: optimizationMethod,
      riskProfile,
      timestamp: new Date().toISOString()
    };
  }

  // ============================================
  // RISK METRICS CALCULATION
  // ============================================

  /**
   * Calculate expected returns and covariance matrix
   */
  calculateRiskMetrics(stocks) {
    const returns = {};
    const prices = {};

    // Calculate daily returns for each stock
    stocks.forEach(stock => {
      const stockReturns = [];
      for (let i = 1; i < stock.prices.length; i++) {
        const dailyReturn = (stock.prices[i].close - stock.prices[i - 1].close) / stock.prices[i - 1].close;
        stockReturns.push(dailyReturn);
      }
      returns[stock.symbol] = stockReturns;
      prices[stock.symbol] = stock.prices[stock.prices.length - 1]?.close || 0;
    });

    // Calculate expected returns (annualized)
    const expectedReturns = {};
    const symbols = Object.keys(returns);
    
    symbols.forEach(symbol => {
      const avgReturn = returns[symbol].reduce((a, b) => a + b, 0) / returns[symbol].length;
      expectedReturns[symbol] = avgReturn * 252; // Annualized
    });

    // Calculate covariance matrix
    const covarianceMatrix = {};
    symbols.forEach(s1 => {
      covarianceMatrix[s1] = {};
      symbols.forEach(s2 => {
        if (s1 === s2) {
          // Variance
          const variance = returns[s1].reduce((sum, r) => 
            sum + Math.pow(r - expectedReturns[s1] / 252, 2), 0) / returns[s1].length;
          covarianceMatrix[s1][s2] = variance * 252;
        } else {
          // Covariance
          const avg1 = returns[s1].reduce((a, b) => a + b, 0) / returns[s1].length;
          const avg2 = returns[s2].reduce((a, b) => a + b, 0) / returns[s2].length;
          
          const covariance = returns[s1].reduce((sum, r, i) => 
            sum + (r - avg1) * (returns[s2][i] - avg2), 0) / returns[s1].length;
          
          covarianceMatrix[s1][s2] = covariance * 252;
        }
      });
    });

    return { expectedReturns, covarianceMatrix, prices };
  }

  /**
   * Incorporate AI predictions into returns
   */
  async incorporatePredictions(symbols, baseReturns, predictionService) {
    const adjustedReturns = { ...baseReturns };

    for (const symbol of symbols) {
      try {
        const prediction = await predictionService.predict(symbol);
        const predProbability = prediction.prediction.probability;
        
        // Adjust return based on prediction confidence
        const confidence = prediction.prediction.confidence;
        const adjustment = (predProbability - 0.5) * confidence * 0.3; // 30% weight to predictions
        
        adjustedReturns[symbol] = adjustedReturns[symbol] * (1 + adjustment);
      } catch (error) {
        // Use base return if prediction fails
      }
    }

    return adjustedReturns;
  }

  // ============================================
  // OPTIMIZATION ALGORITHMS
  // ============================================

  /**
   * Markowitz Mean-Variance Optimization
   */
  markowitzOptimization(expectedReturns, covarianceMatrix, riskProfile) {
    const symbols = Object.keys(expectedReturns);
    const n = symbols.length;
    
    // Risk tolerance based on profile
    const riskTolerance = {
      CONSERVATIVE: 0.2,
      MODERATE: 0.5,
      AGGRESSIVE: 0.8
    }[riskProfile] || 0.5;

    // Simple quadratic optimization (simplified)
    // In production, use a proper quadratic programming library
    let weights = this.gradientDescentOptimization(
      expectedReturns, 
      covarianceMatrix, 
      symbols,
      riskTolerance,
      1000
    );

    // Normalize and create allocation
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    
    return symbols.map((symbol, i) => ({
      symbol,
      weight: weights[i] / totalWeight,
      expectedReturn: expectedReturns[symbol],
      risk: Math.sqrt(covarianceMatrix[symbol][symbol])
    }));
  }

  /**
   * Gradient descent optimization
   */
  gradientDescentOptimization(expectedReturns, covarianceMatrix, symbols, riskTolerance, iterations) {
    const n = symbols.length;
    let weights = new Array(n).fill(1 / n);
    const learningRate = 0.001;

    for (let iter = 0; iter < iterations; iter++) {
      // Calculate portfolio return and risk
      const portReturn = this.calculatePortfolioReturn(weights, expectedReturns, symbols);
      const portRisk = this.calculatePortfolioRisk(weights, covarianceMatrix, symbols);
      
      // Objective: maximize return - risk * lambda
      const objective = portReturn - riskTolerance * portRisk * portRisk;
      
      // Simple gradient (approximation)
      for (let i = 0; i < n; i++) {
        const originalWeight = weights[i];
        weights[i] += learningRate;
        
        const newReturn = this.calculatePortfolioReturn(weights, expectedReturns, symbols);
        const newRisk = this.calculatePortfolioRisk(weights, covarianceMatrix, symbols);
        const newObjective = newReturn - riskTolerance * newRisk * newRisk;
        
        // Gradient direction
        const gradient = (newObjective - objective) / learningRate;
        
        weights[i] = originalWeight + gradient * learningRate;
        
        // Clamp
        weights[i] = Math.max(0, Math.min(weights[i], 0.5));
      }
    }

    return weights;
  }

  /**
   * Risk Parity Optimization
   */
  riskParityOptimization(covarianceMatrix, riskProfile) {
    const symbols = Object.keys(covarianceMatrix);
    const n = symbols.length;
    
    // Initial equal weights
    let weights = new Array(n).fill(1 / n);
    
    // Iterate to achieve risk parity
    for (let iter = 0; iter < 100; iter++) {
      const risks = symbols.map(s => {
        let totalRisk = 0;
        symbols.forEach((s2, j) => {
          totalRisk += weights[j] * Math.sqrt(covarianceMatrix[s][s2]);
        });
        return weights[symbols.indexOf(s)] * Math.sqrt(covarianceMatrix[s][s]) / totalRisk;
      });
      
      // Adjust weights
      const targetRisk = risks.reduce((a, b) => a + b, 0) / n;
      weights = risks.map(r => r / targetRisk);
      
      // Clamp
      weights = weights.map(w => Math.max(0.02, Math.min(w, 0.4)));
    }

    // Adjust based on risk profile
    const riskMultiplier = {
      CONSERVATIVE: 0.5,
      MODERATE: 1.0,
      AGGRESSIVE: 1.5
    }[riskProfile] || 1.0;

    return symbols.map((symbol, i) => ({
      symbol,
      weight: weights[i] * riskMultiplier,
      risk: Math.sqrt(covarianceMatrix[symbol][symbol])
    }));
  }

  /**
   * Maximum Sharpe Ratio Optimization
   */
  maximumSharpeOptimization(expectedReturns, covarianceMatrix) {
    const symbols = Object.keys(expectedReturns);
    const n = symbols.length;
    const riskFreeRate = 0.05; // 5% risk-free rate

    // Grid search for best Sharpe ratio
    let bestSharpe = -Infinity;
    let bestWeights = new Array(n).fill(1 / n);

    // Generate random portfolios
    for (let i = 0; i < 1000; i++) {
      // Generate random weights
      let weights = Array.from({ length: n }, () => Math.random());
      const sum = weights.reduce((a, b) => a + b, 0);
      weights = weights.map(w => w / sum);

      // Calculate Sharpe ratio
      const portReturn = this.calculatePortfolioReturn(weights, expectedReturns, symbols);
      const portRisk = this.calculatePortfolioRisk(weights, covarianceMatrix, symbols);
      
      if (portRisk > 0) {
        const sharpe = (portReturn - riskFreeRate) / portRisk;
        
        if (sharpe > bestSharpe) {
          bestSharpe = sharpe;
          bestWeights = weights;
        }
      }
    }

    return symbols.map((symbol, i) => ({
      symbol,
      weight: bestWeights[i],
      expectedReturn: expectedReturns[symbol],
      risk: Math.sqrt(covarianceMatrix[symbol][symbol])
    }));
  }

  /**
   * Black-Litterman Optimization
   */
  blackLittermanOptimization(expectedReturns, covarianceMatrix, stocks) {
    // Start with market equilibrium returns
    const marketWeights = this.estimateMarketWeights(stocks);
    const riskAversion = 2.5;
    
    let adjustedReturns = {};
    const symbols = Object.keys(expectedReturns);
    
    symbols.forEach(symbol => {
      const marketReturn = expectedReturns[symbol];
      const marketWeight = marketWeights[symbol] || (1 / symbols.length);
      
      // Black-Litterman formula
      adjustedReturns[symbol] = riskAversion * marketWeight * marketReturn;
    });

    // Then apply Markowitz
    return this.markowitzOptimization(adjustedReturns, covarianceMatrix, 'MODERATE');
  }

  /**
   * Estimate market weights
   */
  estimateMarketWeights(stocks) {
    const totalCap = stocks.reduce((sum, s) => sum + (s.marketCap || 1000000000), 0);
    const weights = {};
    
    stocks.forEach(stock => {
      weights[stock.symbol] = (stock.marketCap || 1000000000) / totalCap;
    });

    return weights;
  }

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  /**
   * Calculate portfolio return
   */
  calculatePortfolioReturn(weights, expectedReturns, symbols) {
    return symbols.reduce((sum, symbol, i) => 
      sum + weights[i] * expectedReturns[symbol], 0);
  }

  /**
   * Calculate portfolio risk (standard deviation)
   */
  calculatePortfolioRisk(weights, covarianceMatrix, symbols) {
    let variance = 0;
    
    symbols.forEach((s1, i) => {
      symbols.forEach((s2, j) => {
        variance += weights[i] * weights[j] * covarianceMatrix[s1][s2];
      });
    });

    return Math.sqrt(variance);
  }

  /**
   * Select optimization method based on risk profile
   */
  selectOptimizationMethod(riskProfile) {
    const methods = {
      CONSERVATIVE: 'RISK_PARITY',
      MODERATE: 'BLACK_LITTERMAN',
      AGGRESSIVE: 'MAXIMUM_SHARPE'
    };
    return methods[riskProfile] || 'MARKOWITZ';
  }

  /**
   * Apply constraints to allocation
   */
  applyConstraints(allocation, constraints) {
    const {
      maxWeight = 0.4,
      minWeight = 0.02,
      excludeSymbols = [],
      includeOnly = [],
      maxRisk = 1.0
    } = constraints;

    let filtered = allocation;

    // Filter excluded symbols
    if (excludeSymbols.length > 0) {
      filtered = filtered.filter(a => !excludeSymbols.includes(a.symbol));
    }

    // Filter to only include symbols
    if (includeOnly.length > 0) {
      filtered = filtered.filter(a => includeOnly.includes(a.symbol));
    }

    // Apply weight constraints
    filtered = filtered.map(a => ({
      ...a,
      weight: Math.max(minWeight, Math.min(maxWeight, a.weight))
    }));

    // Normalize weights
    const total = filtered.reduce((sum, a) => sum + a.weight, 0);
    filtered = filtered.map(a => ({
      ...a,
      weight: a.weight / total
    }));

    // Filter by risk constraint
    if (maxRisk < 1.0) {
      filtered = filtered.filter(a => a.risk <= maxRisk);
      const total = filtered.reduce((sum, a) => sum + a.weight, 0);
      filtered = filtered.map(a => ({
        ...a,
        weight: a.weight / total
      }));
    }

    return filtered;
  }

  /**
   * Calculate portfolio metrics
   */
  calculatePortfolioMetrics(allocation, expectedReturns, covarianceMatrix) {
    const symbols = allocation.map(a => a.symbol);
    const weights = allocation.map(a => a.weight);

    // Portfolio return
    const expectedReturn = this.calculatePortfolioReturn(weights, expectedReturns, symbols);
    
    // Portfolio risk
    const volatility = this.calculatePortfolioRisk(weights, covarianceMatrix, symbols);
    
    // Sharpe ratio (assuming 5% risk-free rate)
    const riskFreeRate = 0.05;
    const sharpeRatio = (expectedReturn - riskFreeRate) / volatility;
    
    // Diversification ratio
    const weightedAvgVol = allocation.reduce((sum, a) => 
      sum + a.weight * a.risk, 0);
    const diversificationRatio = volatility > 0 ? weightedAvgVol / volatility : 0;

    // Max drawdown (simplified - use historical data in production)
    const maxDrawdown = volatility * 2; // Approximation

    return {
      expectedReturn: Math.round(expectedReturn * 10000) / 100,
      volatility: Math.round(volatility * 10000) / 100,
      sharpeRatio: Math.round(sharpeRatio * 100) / 100,
      diversificationRatio: Math.round(diversificationRatio * 100) / 100,
      maxDrawdown: Math.round(maxDrawdown * 100) / 100,
      beta: 1.0, // Would calculate vs market
      alpha: Math.round((expectedReturn - riskFreeRate - volatility * 1) * 100) / 100
    };
  }

  // ============================================
  // DATA RETRIEVAL
  // ============================================

  /**
   * Get stock data for optimization
   */
  async getStockData(symbols) {
    const stocks = [];

    for (const symbol of symbols) {
      try {
        const company = await this.prisma.company.findUnique({
          where: { symbol },
          include: {
            stockPrices: {
              orderBy: { date: 'desc' },
              take: 252 // 1 year of daily data
            }
          }
        });

        if (company && company.stockPrices.length > 30) {
          stocks.push({
            symbol: company.symbol,
            name: company.name,
            prices: company.stockPrices.reverse(),
            marketCap: 1000000000 // Would fetch from data provider
          });
        }
      } catch (error) {
        console.error(`Error fetching ${symbol}:`, error.message);
      }
    }

    return stocks;
  }
}

module.exports = PortfolioOptimizer;
