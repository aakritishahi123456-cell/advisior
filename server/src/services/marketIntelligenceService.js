/**
 * FinSathi AI - Market Intelligence Service
 * High-performance real-time market data APIs
 */

const { PrismaClient } = require('@prisma/client');

class MarketIntelligenceService {
  constructor() {
    this.prisma = new PrismaClient();
    this.cache = new Map();
    this.cacheTTL = 60 * 1000; // 1 minute cache
  }

  // ============================================
  // CACHING
  // ============================================

  /**
   * Get cached data or fetch fresh
   */
  async getCached(key, fetchFn, ttl = this.cacheTTL) {
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }

    const data = await fetchFn();
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    return data;
  }

  /**
   * Clear cache
   */
  clearCache(pattern = null) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  // ============================================
  // MARKET TRENDS
  // ============================================

  /**
   * Get comprehensive market trends
   */
  async getMarketTrends(params = {}) {
    const { sector, days = 7 } = params;
    
    return this.getCached(
      `trends_${sector}_${days}`,
      async () => {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Get market indices
        const indices = await this.prisma.marketIndex.findMany({
          where: { isActive: true },
          include: {
            indexValues: {
              where: { date: { gte: startDate } },
              orderBy: { date: 'desc' }
            }
          }
        });

        // Get sector performance
        const sectorPerformance = await this.getSectorPerformance(days);

        // Get top movers
        const topMovers = await this.getTopMovers(days);

        // Get market breadth
        const breadth = await this.getMarketBreadth(days);

        return {
          indices: indices.map(i => ({
            code: i.code,
            name: i.name,
            value: i.indexValues[0]?.close || 0,
            change: i.indexValues[0]?.changePercent || 0,
            volume: i.indexValues[0]?.volume || 0
          })),
          sectors: sectorPerformance,
          topMovers,
          breadth,
          timestamp: new Date().toISOString()
        };
      },
      60000 // 1 minute cache
    );
  }

  /**
   * Get sector performance
   */
  async getSectorPerformance(days) {
    const sectors = ['BANKING', 'HYDRO', 'MUTUAL_FUND', 'HOTEL'];
    const performance = [];

    for (const sector of sectors) {
      const companies = await this.prisma.company.findMany({
        where: { sector, isActive: true },
        include: {
          stockPrices: {
            orderBy: { date: 'desc' },
            take: 2
          }
        }
      });

      if (companies.length > 0) {
        let totalChange = 0;
        let validCount = 0;

        companies.forEach(c => {
          if (c.stockPrices.length >= 2) {
            const change = ((c.stockPrices[0].close - c.stockPrices[1].close) / c.stockPrices[1].close) * 100;
            totalChange += change;
            validCount++;
          }
        });

        performance.push({
          sector,
          change: validCount > 0 ? (totalChange / validCount) : 0,
          companies: companies.length
        });
      }
    }

    return performance;
  }

  /**
   * Get top gainers and losers
   */
  async getTopMovers(days) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const companies = await this.prisma.company.findMany({
      where: { isActive: true },
      include: {
        stockPrices: {
          where: { date: { gte: startDate } },
          orderBy: { date: 'desc' },
          take: 2
        }
      }
    });

    const movers = companies
      .filter(c => c.stockPrices.length >= 2)
      .map(c => ({
        symbol: c.symbol,
        name: c.name,
        price: c.stockPrices[0].close,
        change: ((c.stockPrices[0].close - c.stockPrices[1].close) / c.stockPrices[1].close) * 100
      }))
      .sort((a, b) => b.change - a.change);

    return {
      gainers: movers.slice(0, 5),
      losers: movers.slice(-5).reverse()
    };
  }

  /**
   * Get market breadth
   */
  async getMarketBreadth(days) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const companies = await this.prisma.company.findMany({
      where: { isActive: true },
      include: {
        stockPrices: {
          where: { date: { gte: startDate } },
          orderBy: { date: 'desc' },
          take: 2
        }
      }
    });

    let advance = 0;
    let decline = 0;
    let unchanged = 0;

    companies.forEach(c => {
      if (c.stockPrices.length >= 2) {
        const change = c.stockPrices[0].close - c.stockPrices[1].close;
        if (change > 0) advance++;
        else if (change < 0) decline++;
        else unchanged++;
      }
    });

    const total = advance + decline + unchanged;
    
    return {
      advance,
      decline,
      unchanged,
      total,
      advanceDeclineRatio: decline > 0 ? advance / decline : advance,
      percentAdvance: total > 0 ? (advance / total) * 100 : 0
    };
  }

  // ============================================
  // TRADING SIGNALS
  // ============================================

  /**
   * Generate trading signals
   */
  async getTradingSignals(params = {}) {
    const { symbols, strategy = 'TECHNICAL' } = params;
    
    return this.getCached(
      `signals_${symbols?.join('_') || 'all'}_${strategy}`,
      async () => {
        const companies = symbols 
          ? await this.prisma.company.findMany({
              where: { 
                symbol: { in: symbols },
                isActive: true 
              },
              take: symbols.length
            })
          : await this.prisma.company.findMany({
              where: { isActive: true },
              take: 20
            });

        const signals = [];

        for (const company of companies) {
          const signal = await this.generateSignal(company, strategy);
          if (signal) {
            signals.push(signal);
          }
        }

        // Sort by confidence
        signals.sort((a, b) => b.confidence - a.confidence);

        return {
          signals: signals.slice(0, 20),
          count: signals.length,
          summary: {
            strongBuy: signals.filter(s => s.signal === 'STRONG_BUY').length,
            buy: signals.filter(s => s.signal === 'BUY').length,
            hold: signals.filter(s => s.signal === 'HOLD').length,
            sell: signals.filter(s => s.signal === 'SELL').length,
            strongSell: signals.filter(s => s.signal === 'STRONG_SELL').length
          },
          timestamp: new Date().toISOString()
        };
      },
      300000 // 5 minute cache
    );
  }

  /**
   * Generate signal for a company
   */
  async generateSignal(company, strategy) {
    const prices = await this.prisma.stockPrice.findMany({
      where: { companyId: company.id },
      orderBy: { date: 'desc' },
      take: 50
    });

    if (prices.length < 30) return null;

    // Calculate technical indicators
    const sma20 = this.calculateSMA(prices, 20);
    const sma50 = prices.length >= 50 ? this.calculateSMA(prices, 50) : null;
    const rsi = this.calculateRSI(prices, 14);
    const latestRSI = rsi[r.length - 1];

    // Generate signal
    let signal = 'HOLD';
    let confidence = 0.5;

    // RSI-based signals
    if (latestRSI < 30) {
      signal = 'BUY';
      confidence = (30 - latestRSI) / 30;
    } else if (latestRSI > 70) {
      signal = 'SELL';
      confidence = (latestRSI - 70) / 30;
    }

    // SMA crossover confirmation
    if (sma20 > sma50 && signal === 'BUY') {
      signal = 'STRONG_BUY';
      confidence = Math.min(confidence + 0.2, 1);
    } else if (sma20 < sma50 && signal === 'SELL') {
      signal = 'STRONG_SELL';
      confidence = Math.min(confidence + 0.2, 1);
    }

    const latestPrice = prices[0];

    return {
      symbol: company.symbol,
      name: company.name,
      sector: company.sector,
      signal,
      confidence: Math.round(confidence * 100) / 100,
      price: latestPrice.close,
      change: ((latestPrice.close - prices[1].close) / prices[1].close) * 100,
      indicators: {
        rsi: Math.round(latestRSI * 100) / 100,
        sma20: Math.round(sma20 * 100) / 100,
        sma50: sma50 ? Math.round(sma50 * 100) / 100 : null,
        trend: sma20 > sma50 ? 'UP' : 'DOWN'
      }
    };
  }

  // ============================================
  // PREDICTIONS
  // ============================================

  /**
   * Get market predictions
   */
  async getPredictions(params = {}) {
    const { symbols, horizon = 5 } = params;
    
    return this.getCached(
      `predictions_${symbols?.join('_') || 'all'}_${horizon}`,
      async () => {
        const companies = symbols
          ? await this.prisma.company.findMany({
              where: { 
                symbol: { in: symbols },
                isActive: true 
              }
            })
          : await this.prisma.company.findMany({
              where: { isActive: true },
              take: 10
            });

        const predictions = [];

        for (const company of companies) {
          const prediction = await this.generatePrediction(company, horizon);
          predictions.push(prediction);
        }

        // Market sentiment
        const sentiment = this.calculatePredictionSentiment(predictions);

        return {
          predictions,
          marketSentiment: sentiment,
          horizon: `${horizon} days`,
          timestamp: new Date().toISOString()
        };
      },
      600000 // 10 minute cache
    );
  }

  /**
   * Generate prediction for a company
   */
  async generatePrediction(company, horizon) {
    const prices = await this.prisma.stockPrice.findMany({
      where: { companyId: company.id },
      orderBy: { date: 'desc' },
      take: 30
    });

    if (prices.length < 20) {
      return {
        symbol: company.symbol,
        name: company.name,
        available: false
      };
    }

    // Simple prediction based on trend and momentum
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i - 1].close - prices[i].close) / prices[i].close);
    }

    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const volatility = Math.sqrt(returns.reduce((sum, r) => 
      sum + Math.pow(r - avgReturn, 2), 0) / returns.length);

    // Project future price
    const currentPrice = prices[0].close;
    const expectedReturn = avgReturn * horizon;
    const predictedPrice = currentPrice * (1 + expectedReturn);
    const confidence = Math.max(0.3, 1 - volatility * 3);

    const direction = predictedPrice > currentPrice ? 'UP' : 'DOWN';

    return {
      symbol: company.symbol,
      name: company.name,
      available: true,
      currentPrice,
      predictedPrice: Math.round(predictedPrice * 100) / 100,
      expectedChange: Math.round(expectedReturn * 10000) / 100,
      direction,
      confidence: Math.round(confidence * 100) / 100,
      horizon,
      methodology: 'Statistical trend projection'
    };
  }

  /**
   * Calculate overall market sentiment from predictions
   */
  calculatePredictionSentiment(predictions) {
    const available = predictions.filter(p => p.available);
    
    if (available.length === 0) {
      return { sentiment: 'NEUTRAL', score: 0 };
    }

    const upCount = available.filter(p => p.direction === 'UP').length;
    const downCount = available.filter(p => p.direction === 'DOWN').length;
    const avgConfidence = available.reduce((sum, p) => sum + p.confidence, 0) / available.length;

    const score = (upCount - downCount) / available.length;
    let sentiment = 'NEUTRAL';
    
    if (score > 0.3) sentiment = 'BULLISH';
    else if (score < -0.3) sentiment = 'BEARISH';

    return {
      sentiment,
      score: Math.round(score * 100) / 100,
      confidence: Math.round(avgConfidence * 100) / 100,
      upPredictions: upCount,
      downPredictions: downCount
    };
  }

  // ============================================
  // TECHNICAL INDICATORS
  // ============================================

  calculateSMA(prices, period) {
    const closes = prices.map(p => p.close).reverse();
    const slice = closes.slice(0, period);
    return slice.reduce((a, b) => a + b, 0) / period;
  }

  calculateRSI(prices, period) {
    const closes = prices.map(p => p.close).reverse();
    const rsi = [];
    const gains = [];
    const losses = [];

    for (let i = 1; i < closes.length; i++) {
      const change = closes[i] - closes[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }

    for (let i = period; i < gains.length; i++) {
      const avgGain = gains.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
      const avgLoss = losses.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
      
      if (avgLoss === 0) {
        rsi.push(100);
      } else {
        const rs = avgGain / avgLoss;
        rsi.push(100 - (100 / (1 + rs)));
      }
    }

    return rsi;
  }

  // ============================================
  // OVERVIEW
  // ============================================

  /**
   * Get market overview
   */
  async getMarketOverview() {
    return this.getCached(
      'market_overview',
      async () => {
        const [totalCompanies, indices, recentMovers] = await Promise.all([
          this.prisma.company.count({ where: { isActive: true } }),
          this.prisma.marketIndex.findMany({
            where: { isActive: true },
            include: {
              indexValues: {
                orderBy: { date: 'desc' },
                take: 1
              }
            }
          }),
          this.getTopMovers(1)
        ]);

        return {
          status: 'OPEN',
          lastUpdated: new Date().toISOString(),
          totalCompanies,
          indices: indices.map(i => ({
            code: i.code,
            name: i.name,
            value: i.indexValues[0]?.close || 0,
            change: i.indexValues[0]?.changePercent || 0
          })),
          topGainers: recentMovers.gainers.slice(0, 3),
          topLosers: recentMovers.losers.slice(0, 3)
        };
      },
      30000 // 30 second cache
    );
  }
}

module.exports = MarketIntelligenceService;
