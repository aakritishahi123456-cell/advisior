/**
 * FinSathi AI - Market Intelligence System
 * Stock trend analysis with technical indicators
 */

class MarketIntelligence {
  constructor() {
    this.indicators = {
      sma: this.calculateSMA.bind(this),
      ema: this.calculateEMA.bind(this),
      rsi: this.calculateRSI.bind(this),
      macd: this.calculateMACD.bind(this),
      bollinger: this.calculateBollingerBands.bind(this),
      atr: this.calculateATR.bind(this),
      volume: this.analyzeVolume.bind(this),
      momentum: this.calculateMomentum.bind(this),
      volatility: this.calculateVolatility.bind(this)
    };
  }

  /**
   * Calculate Simple Moving Average (SMA)
   */
  calculateSMA(prices, period = 20) {
    if (prices.length < period) return null;
    
    const sma = [];
    for (let i = period - 1; i < prices.length; i++) {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
    return sma;
  }

  /**
   * Calculate Exponential Moving Average (EMA)
   */
  calculateEMA(prices, period = 20) {
    if (prices.length < period) return null;
    
    const multiplier = 2 / (period + 1);
    const ema = [prices[0]]; // Start with first price
    
    for (let i = 1; i < prices.length; i++) {
      ema.push((prices[i] * multiplier) + (ema[i - 1] * (1 - multiplier)));
    }
    
    return ema;
  }

  /**
   * Calculate Relative Strength Index (RSI)
   */
  calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) return null;
    
    const changes = [];
    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i] - prices[i - 1]);
    }
    
    let avgGain = 0;
    let avgLoss = 0;
    
    // Calculate initial averages
    for (let i = 0; i < period; i++) {
      if (changes[i] > 0) avgGain += changes[i];
      else avgLoss += Math.abs(changes[i]);
    }
    
    avgGain /= period;
    avgLoss /= period;
    
    const rsi = [100 - (100 / (1 + (avgGain / avgLoss)))];
    
    // Calculate subsequent RSI values
    for (let i = period; i < changes.length; i++) {
      avgGain = (avgGain * (period - 1) + (changes[i] > 0 ? changes[i] : 0)) / period;
      avgLoss = (avgLoss * (period - 1) + (changes[i] < 0 ? Math.abs(changes[i]) : 0)) / period;
      
      rsi.push(100 - (100 / (1 + (avgGain / avgLoss))));
    }
    
    return rsi;
  }

  /**
   * Calculate MACD (Moving Average Convergence Divergence)
   */
  calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    if (prices.length < slowPeriod) return null;
    
    const fastEMA = this.calculateEMA(prices, fastPeriod);
    const slowEMA = this.calculateEMA(prices, slowPeriod);
    
    if (!fastEMA || !slowEMA) return null;
    
    const macdLine = fastEMA.slice(slowPeriod - fastPeriod).map((fast, i) => fast - slowEMA[i]);
    const signalLine = this.calculateEMA(macdLine, signalPeriod);
    const histogram = signalLine ? signalLine.map((signal, i) => macdLine[i + signalPeriod - 1] - signal) : null;
    
    return {
      macd: macdLine,
      signal: signalLine,
      histogram: histogram
    };
  }

  /**
   * Calculate Bollinger Bands
   */
  calculateBollingerBands(prices, period = 20, stdDev = 2) {
    if (prices.length < period) return null;
    
    const sma = this.calculateSMA(prices, period);
    const bands = [];
    
    for (let i = period - 1; i < prices.length; i++) {
      const slice = prices.slice(i - period + 1, i + 1);
      const mean = sma[i - period + 1];
      
      // Calculate standard deviation
      const variance = slice.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
      const standardDeviation = Math.sqrt(variance);
      
      bands.push({
        upper: mean + (standardDeviation * stdDev),
        middle: mean,
        lower: mean - (standardDeviation * stdDev)
      });
    }
    
    return bands;
  }

  /**
   * Calculate Average True Range (ATR) - Volatility measure
   */
  calculateATR(highs, lows, closes, period = 14) {
    if (highs.length < period + 1) return null;
    
    const trueRanges = [];
    
    for (let i = 1; i < highs.length; i++) {
      const tr1 = highs[i] - lows[i];
      const tr2 = Math.abs(highs[i] - closes[i - 1]);
      const tr3 = Math.abs(lows[i] - closes[i - 1]);
      
      trueRanges.push(Math.max(tr1, tr2, tr3));
    }
    
    return this.calculateSMA(trueRanges, period);
  }

  /**
   * Analyze volume patterns
   */
  analyzeVolume(prices, volumes, period = 20) {
    if (volumes.length < period) return null;
    
    const avgVolume = this.calculateSMA(volumes, period);
    const volumeAnalysis = [];
    
    for (let i = period - 1; i < volumes.length; i++) {
      const currentVolume = volumes[i];
      const avg = avgVolume[i - period + 1];
      const volumeRatio = currentVolume / avg;
      
      // Price change
      const priceChange = i > 0 ? ((prices[i] - prices[i - 1]) / prices[i - 1]) * 100 : 0;
      
      volumeAnalysis.push({
        volume: currentVolume,
        avgVolume: avg,
        volumeRatio: volumeRatio,
        priceChange: priceChange,
        isHighVolume: volumeRatio > 1.5,
        isLowVolume: volumeRatio < 0.7,
        volumeTrend: volumeRatio > 1.2 ? 'increasing' : volumeRatio < 0.8 ? 'decreasing' : 'normal'
      });
    }
    
    return volumeAnalysis;
  }

  /**
   * Calculate price momentum
   */
  calculateMomentum(prices, period = 10) {
    if (prices.length < period + 1) return null;
    
    const momentum = [];
    
    for (let i = period; i < prices.length; i++) {
      const momentumValue = ((prices[i] - prices[i - period]) / prices[i - period]) * 100;
      momentum.push(momentumValue);
    }
    
    return momentum;
  }

  /**
   * Calculate volatility
   */
  calculateVolatility(prices, period = 20) {
    if (prices.length < period) return null;
    
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    
    const volatility = [];
    for (let i = period - 1; i < returns.length; i++) {
      const slice = returns.slice(i - period + 1, i + 1);
      const mean = slice.reduce((sum, ret) => sum + ret, 0) / period;
      const variance = slice.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / period;
      volatility.push(Math.sqrt(variance) * Math.sqrt(252)); // Annualized volatility
    }
    
    return volatility;
  }

  /**
   * Analyze trend direction
   */
  analyzeTrend(prices, shortMA = 20, longMA = 50) {
    const shortSMA = this.calculateSMA(prices, shortMA);
    const longSMA = this.calculateSMA(prices, longMA);
    
    if (!shortSMA || !longSMA) return null;
    
    const trends = [];
    const startIndex = Math.max(shortMA, longMA) - 1;
    
    for (let i = startIndex; i < prices.length; i++) {
      const shortIndex = i - shortMA + 1;
      const longIndex = i - longMA + 1;
      
      const shortMAValue = shortSMA[shortIndex];
      const longMAValue = longSMA[longIndex];
      const currentPrice = prices[i];
      
      // Trend analysis
      let trend = 'neutral';
      let strength = 'weak';
      
      if (shortMAValue > longMAValue) {
        trend = 'bullish';
        strength = (shortMAValue / longMAValue - 1) > 0.02 ? 'strong' : 'moderate';
      } else if (shortMAValue < longMAValue) {
        trend = 'bearish';
        strength = (longMAValue / shortMAValue - 1) > 0.02 ? 'strong' : 'moderate';
      }
      
      // Price relative to moving averages
      const priceVsShortMA = currentPrice > shortMAValue;
      const priceVsLongMA = currentPrice > longMAValue;
      
      trends.push({
        price: currentPrice,
        shortMA: shortMAValue,
        longMA: longMAValue,
        trend: trend,
        strength: strength,
        priceAboveShortMA: priceVsShortMA,
        priceAboveLongMA: priceVsLongMA,
        maSpread: ((shortMAValue / longMAValue) - 1) * 100
      });
    }
    
    return trends;
  }

  /**
   * Generate market insights
   */
  generateInsights(symbol, data) {
    const { prices, volumes, highs, lows, dates } = data;
    
    if (!prices || prices.length < 50) {
      return {
        symbol,
        insights: ['Insufficient data for analysis'],
        confidence: 'low'
      };
    }

    const insights = [];
    const confidence = [];

    // Trend analysis
    const trends = this.analyzeTrend(prices);
    if (trends && trends.length > 0) {
      const latestTrend = trends[trends.length - 1];
      
      if (latestTrend.trend === 'bullish' && latestTrend.strength === 'strong') {
        insights.push(`${symbol} shows strong bullish trend with price above key moving averages`);
        confidence.push('high');
      } else if (latestTrend.trend === 'bullish') {
        insights.push(`${symbol} trend is bullish with moderate strength`);
        confidence.push('medium');
      } else if (latestTrend.trend === 'bearish' && latestTrend.strength === 'strong') {
        insights.push(`${symbol} shows strong bearish trend with price below key moving averages`);
        confidence.push('high');
      } else if (latestTrend.trend === 'bearish') {
        insights.push(`${symbol} trend is bearish with moderate strength`);
        confidence.push('medium');
      } else {
        insights.push(`${symbol} is trading in a neutral range`);
        confidence.push('medium');
      }
    }

    // Momentum analysis
    const momentum = this.calculateMomentum(prices);
    if (momentum && momentum.length > 0) {
      const latestMomentum = momentum[momentum.length - 1];
      
      if (latestMomentum > 5) {
        insights.push(`${symbol} shows strong positive momentum (${latestMomentum.toFixed(2)}%)`);
        confidence.push('medium');
      } else if (latestMomentum > 2) {
        insights.push(`${symbol} shows moderate positive momentum (${latestMomentum.toFixed(2)}%)`);
        confidence.push('medium');
      } else if (latestMomentum < -5) {
        insights.push(`${symbol} shows strong negative momentum (${latestMomentum.toFixed(2)}%)`);
        confidence.push('medium');
      } else if (latestMomentum < -2) {
        insights.push(`${symbol} shows moderate negative momentum (${latestMomentum.toFixed(2)}%)`);
        confidence.push('medium');
      }
    }

    // Volatility analysis
    const volatility = this.calculateVolatility(prices);
    if (volatility && volatility.length > 0) {
      const latestVolatility = volatility[volatility.length - 1];
      const avgVolatility = volatility.reduce((sum, vol) => sum + vol, 0) / volatility.length;
      
      if (latestVolatility > avgVolatility * 1.5) {
        insights.push(`${symbol} volatility is increasing significantly (${(latestVolatility * 100).toFixed(2)}%)`);
        confidence.push('high');
      } else if (latestVolatility > avgVolatility * 1.2) {
        insights.push(`${symbol} volatility is moderately elevated (${(latestVolatility * 100).toFixed(2)}%)`);
        confidence.push('medium');
      } else if (latestVolatility < avgVolatility * 0.7) {
        insights.push(`${symbol} volatility is decreasing (${(latestVolatility * 100).toFixed(2)}%)`);
        confidence.push('medium');
      }
    }

    // RSI analysis
    const rsi = this.calculateRSI(prices);
    if (rsi && rsi.length > 0) {
      const latestRSI = rsi[rsi.length - 1];
      
      if (latestRSI > 70) {
        insights.push(`${symbol} is overbought (RSI: ${latestRSI.toFixed(2)}) - potential reversal risk`);
        confidence.push('medium');
      } else if (latestRSI > 60) {
        insights.push(`${symbol} is approaching overbought levels (RSI: ${latestRSI.toFixed(2)})`);
        confidence.push('medium');
      } else if (latestRSI < 30) {
        insights.push(`${symbol} is oversold (RSI: ${latestRSI.toFixed(2)}) - potential buying opportunity`);
        confidence.push('medium');
      } else if (latestRSI < 40) {
        insights.push(`${symbol} is approaching oversold levels (RSI: ${latestRSI.toFixed(2)})`);
        confidence.push('medium');
      }
    }

    // Volume analysis
    if (volumes && volumes.length > 0) {
      const volumeAnalysis = this.analyzeVolume(prices, volumes);
      if (volumeAnalysis && volumeAnalysis.length > 0) {
        const latestVolume = volumeAnalysis[volumeAnalysis.length - 1];
        
        if (latestVolume.isHighVolume && latestVolume.priceChange > 2) {
          insights.push(`${symbol} shows strong buying interest with high volume and price increase`);
          confidence.push('high');
        } else if (latestVolume.isHighVolume && latestVolume.priceChange < -2) {
          insights.push(`${symbol} shows strong selling pressure with high volume and price decrease`);
          confidence.push('high');
        } else if (latestVolume.isLowVolume) {
          insights.push(`${symbol} trading volume is low - indicating lack of conviction`);
          confidence.push('medium');
        }
      }
    }

    // Bollinger Bands analysis
    const bollinger = this.calculateBollingerBands(prices);
    if (bollinger && bollinger.length > 0) {
      const latestBands = bollinger[bollinger.length - 1];
      const currentPrice = prices[prices.length - 1];
      
      if (currentPrice > latestBands.upper) {
        insights.push(`${symbol} is trading above Bollinger Bands - indicating strong momentum`);
        confidence.push('medium');
      } else if (currentPrice < latestBands.lower) {
        insights.push(`${symbol} is trading below Bollinger Bands - indicating potential oversold condition`);
        confidence.push('medium');
      }
    }

    // Calculate overall confidence
    const overallConfidence = confidence.length > 0 ? 
      confidence.reduce((sum, conf) => {
        if (conf === 'high') return sum + 3;
        if (conf === 'medium') return sum + 2;
        if (conf === 'low') return sum + 1;
        return sum;
      }, 0) / (confidence.length * 3) : 0;

    let confidenceLevel = 'low';
    if (overallConfidence > 0.7) confidenceLevel = 'high';
    else if (overallConfidence > 0.4) confidenceLevel = 'medium';

    return {
      symbol,
      insights: insights.length > 0 ? insights : ['No significant signals detected'],
      confidence: confidenceLevel,
      confidenceScore: overallConfidence,
      dataPoints: prices.length,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Comprehensive stock analysis
   */
  analyzeStock(symbol, data) {
    const { prices, volumes, highs, lows, dates } = data;
    
    if (!prices || prices.length < 20) {
      return {
        error: 'Insufficient data for analysis',
        minimumRequired: 20,
        provided: prices ? prices.length : 0
      };
    }

    const analysis = {
      symbol,
      summary: this.generateInsights(symbol, data),
      technical: {
        trend: this.analyzeTrend(prices),
        momentum: this.calculateMomentum(prices),
        volatility: this.calculateVolatility(prices),
        rsi: this.calculateRSI(prices),
        macd: this.calculateMACD(prices),
        bollinger: this.calculateBollingerBands(prices),
        volume: volumes ? this.analyzeVolume(prices, volumes) : null
      },
      statistics: this.calculateStatistics(prices),
      lastUpdated: new Date().toISOString()
    };

    return analysis;
  }

  /**
   * Calculate basic statistics
   */
  calculateStatistics(prices) {
    if (!prices || prices.length === 0) return null;

    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }

    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    return {
      currentPrice: prices[prices.length - 1],
      priceChange: prices.length > 1 ? prices[prices.length - 1] - prices[prices.length - 2] : 0,
      priceChangePercent: prices.length > 1 ? ((prices[prices.length - 1] - prices[prices.length - 2]) / prices[prices.length - 2]) * 100 : 0,
      periodHigh: Math.max(...prices),
      periodLow: Math.min(...prices),
      averageReturn: mean * 100,
      volatility: stdDev * Math.sqrt(252) * 100, // Annualized
      dataPoints: prices.length
    };
  }
}

module.exports = MarketIntelligence;
