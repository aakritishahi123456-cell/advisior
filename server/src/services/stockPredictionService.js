/**
 * FinSathi AI - Stock Prediction Pipeline
 * ML pipeline for short-term stock price prediction
 */

const { PrismaClient } = require('@prisma/client');

class StockPredictionPipeline {
  constructor() {
    this.prisma = new PrismaClient();
    this.featureConfig = {
      lookbackDays: 30,
      predictionHorizon: 5, // Predict 5 days ahead
      technicalIndicators: [
        'sma_5', 'sma_10', 'sma_20',
        'ema_12', 'ema_26',
        'rsi_14', 'macd', 'macd_signal',
        'bb_upper', 'bb_middle', 'bb_lower',
        'atr_14', 'stoch_k', 'stoch_d'
      ]
    };
    this.models = {};
  }

  // ============================================
  // FEATURE ENGINEERING
  // ============================================

  /**
   * Generate features from raw stock data
   */
  async generateFeatures(symbol, days = 90) {
    const prices = await this.getStockPrices(symbol, days);
    
    if (prices.length < 30) {
      throw new Error(`Insufficient data for ${symbol}. Need at least 30 days.`);
    }

    const features = {
      // Price-based features
      returns: this.calculateReturns(prices),
      priceChange: this.calculatePriceChanges(prices),
      volatility: this.calculateVolatility(prices),
      
      // Technical indicators
      sma: this.calculateSMA(prices),
      ema: this.calculateEMA(prices),
      rsi: this.calculateRSI(prices),
      macd: this.calculateMACD(prices),
      bollingerBands: this.calculateBollingerBands(prices),
      atr: this.calculateATR(prices),
      stochastic: this.calculateStochastic(prices),
      
      // Volume features
      volumeFeatures: this.calculateVolumeFeatures(prices),
      
      // Pattern features
      patternFeatures: this.identifyPatterns(prices)
    };

    return this.flattenFeatures(features, prices);
  }

  /**
   * Calculate daily returns
   */
  calculateReturns(prices) {
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      const ret = (prices[i].close - prices[i - 1].close) / prices[i - 1].close;
      returns.push(ret);
    }
    return returns;
  }

  /**
   * Calculate price changes
   */
  calculatePriceChanges(prices) {
    return prices.slice(1).map((p, i) => ({
      openClose: p.close - p.open,
      highLow: p.high - p.low,
      highOpen: p.high - p.open,
      lowOpen: p.open - p.low
    }));
  }

  /**
   * Calculate rolling volatility
   */
  calculateVolatility(prices, window = 20) {
    const returns = this.calculateReturns(prices);
    const volatility = [];

    for (let i = window; i < returns.length; i++) {
      const slice = returns.slice(i - window, i);
      const mean = slice.reduce((a, b) => a + b, 0) / window;
      const variance = slice.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / window;
      volatility.push(Math.sqrt(variance * 252)); // Annualized
    }

    return volatility;
  }

  /**
   * Calculate Simple Moving Averages
   */
  calculateSMA(prices, periods = [5, 10, 20]) {
    const sma = {};
    
    periods.forEach(period => {
      sma[`sma_${period}`] = [];
      for (let i = period - 1; i < prices.length; i++) {
        const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b.close, 0);
        sma[`sma_${period}`].push(sum / period);
      }
    });

    return sma;
  }

  /**
   * Calculate Exponential Moving Averages
   */
  calculateEMA(prices, periods = [12, 26]) {
    const ema = {};
    
    periods.forEach(period => {
      const multiplier = 2 / (period + 1);
      const values = [];
      
      // First EMA is SMA
      let sum = 0;
      for (let i = 0; i < period; i++) {
        sum += prices[i].close;
      }
      values.push(sum / period);

      for (let i = period; i < prices.length; i++) {
        const currentEma = (prices[i].close - values[values.length - 1]) * multiplier + values[values.length - 1];
        values.push(currentEma);
      }

      ema[`ema_${period}`] = values;
    });

    return ema;
  }

  /**
   * Calculate RSI (Relative Strength Index)
   */
  calculateRSI(prices, period = 14) {
    const rsi = [];
    const gains = [];
    const losses = [];

    for (let i = 1; i < prices.length; i++) {
      const change = prices[i].close - prices[i - 1].close;
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

  /**
   * Calculate MACD
   */
  calculateMACD(prices) {
    const ema12 = this.calculateEMA(prices, [12])['ema_12'];
    const ema26 = this.calculateEMA(prices, [26])['ema_26'];

    const macdLine = ema12.map((v, i) => v - ema26[i]);
    
    // Signal line (9-day EMA of MACD)
    const signalLine = [];
    const multiplier = 2 / 10;
    let prevSignal = macdLine.slice(0, 9).reduce((a, b) => a + b, 0) / 9;
    
    for (let i = 9; i < macdLine.length; i++) {
      const signal = (macdLine[i] - prevSignal) * multiplier + prevSignal;
      signalLine.push(signal);
      prevSignal = signal;
    }

    return {
      macd: macdLine.slice(9),
      signal: signalLine,
      histogram: macdLine.slice(9).map((m, i) => m - signalLine[i])
    };
  }

  /**
   * Calculate Bollinger Bands
   */
  calculateBollingerBands(prices, period = 20, stdDev = 2) {
    const sma20 = this.calculateSMA(prices, [20])['sma_20'];
    const upper = [];
    const lower = [];

    for (let i = 0; i < sma20.length; i++) {
      const slice = prices.slice(i, i + 20);
      const mean = sma20[i];
      const variance = slice.reduce((sum, p) => sum + Math.pow(p.close - mean, 2), 0) / 20;
      const std = Math.sqrt(variance);

      upper.push(mean + stdDev * std);
      lower.push(mean - stdDev * std);
    }

    return {
      upper,
      middle: sma20,
      lower,
      width: upper.map((u, i) => (u - lower[i]) / sma20[i])
    };
  }

  /**
   * Calculate ATR (Average True Range)
   */
  calculateATR(prices, period = 14) {
    const trueRanges = [];

    for (let i = 1; i < prices.length; i++) {
      const tr = Math.max(
        prices[i].high - prices[i].low,
        Math.abs(prices[i].high - prices[i - 1].close),
        Math.abs(prices[i].low - prices[i - 1].close)
      );
      trueRanges.push(tr);
    }

    const atr = [];
    for (let i = period; i < trueRanges.length; i++) {
      const avg = trueRanges.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
      atr.push(avg);
    }

    return atr;
  }

  /**
   * Calculate Stochastic Oscillator
   */
  calculateStochastic(prices, period = 14) {
    const k = [];
    const d = [];

    for (let i = period; i < prices.length; i++) {
      const slice = prices.slice(i - period + 1, i + 1);
      const high = Math.max(...slice.map(p => p.high));
      const low = Math.min(...slice.map(p => p.low));
      const close = prices[i].close;

      const stochK = ((close - low) / (high - low)) * 100;
      k.push(stochK);
    }

    // Smooth K (3-period SMA)
    for (let i = 2; i < k.length; i++) {
      const avg = (k[i] + k[i - 1] + k[i - 2]) / 3;
      d.push(avg);
    }

    return { k: k.slice(2), d };
  }

  /**
   * Calculate volume features
   */
  calculateVolumeFeatures(prices) {
    const volumes = prices.map(p => p.volume);
    
    // Volume SMA
    const volumeSMA = [];
    for (let i = 19; i < volumes.length; i++) {
      const avg = volumes.slice(i - 19, i + 1).reduce((a, b) => a + b, 0) / 20;
      volumeSMA.push(avg);
    }

    // Volume change
    const volumeChange = volumes.slice(1).map((v, i) => (v - volumes[i]) / volumes[i]);

    return {
      sma20: volumeSMA,
      change: volumeChange
    };
  }

  /**
   * Identify chart patterns (simplified)
   */
  identifyPatterns(prices) {
    const patterns = {
      doji: [],
      hammer: [],
      engulfing: []
    };

    for (let i = 1; i < prices.length; i++) {
      const body = Math.abs(prices[i].close - prices[i].open);
      const upperShadow = prices[i].high - Math.max(prices[i].close, prices[i].open);
      const lowerShadow = Math.min(prices[i].close, prices[i].open) - prices[i].low;

      // Doji
      if (body < (prices[i].high - prices[i].low) * 0.1) {
        patterns.doji.push(1);
      } else {
        patterns.doji.push(0);
      }

      // Hammer (bullish reversal)
      if (lowerShadow > body * 2 && upperShadow < body) {
        patterns.hammer.push(1);
      } else {
        patterns.hammer.push(0);
      }
    }

    return patterns;
  }

  /**
   * Flatten features into training-ready format
   */
  flattenFeatures(features, prices) {
    const minLength = Math.min(
      features.returns.length,
      features.volatility.length,
      features.sma.sma_20?.length || Infinity,
      features.rsi.length,
      features.macd.macd?.length || Infinity
    );

    const X = [];
    const y = [];

    for (let i = 30; i < minLength - this.featureConfig.predictionHorizon; i++) {
      const sample = {
        // Returns
        return_1d: features.returns[i - 1] || 0,
        return_5d: features.returns.slice(Math.max(0, i - 5), i).reduce((a, b) => a + b, 0) / 5,
        return_10d: features.returns.slice(Math.max(0, i - 10), i).reduce((a, b) => a + b, 0) / 10,
        
        // Volatility
        volatility_20d: features.volatility[i - 1] || 0,
        
        // SMA
        sma_5: features.sma.sma_5[i - 5] || 0,
        sma_10: features.sma.sma_10[i - 10] || 0,
        sma_20: features.sma.sma_20[i - 20] || 0,
        
        // Price relative to SMA
        price_to_sma20: prices[i].close / (features.sma.sma_20[i - 20] || 1),
        
        // RSI
        rsi_14: features.rsi[i - 15] || 50,
        
        // MACD
        macd: features.macd.macd[i - 39] || 0,
        macd_signal: features.macd.signal[i - 30] || 0,
        macd_histogram: features.macd.histogram[i - 39] || 0,
        
        // Bollinger Bands
        bb_position: (prices[i].close - features.bollingerBands.lower[i - 20]) / 
          (features.bollingerBands.upper[i - 20] - features.bollingerBands.lower[i - 20] || 1),
        
        // ATR
        atr_14: features.atr[i - 30] || 0,
        
        // Stochastic
        stoch_k: features.stochastic.k[i - 16] || 50,
        stoch_d: features.stochastic.d[i - 19] || 50,
        
        // Volume
        volume_sma20: features.volumeFeatures.sma20[i - 20] || 0,
        volume_ratio: prices[i].volume / (features.volumeFeatures.sma20[i - 20] || 1)
      };

      // Target: Will price increase in next 5 days?
      const futurePrice = prices[i + this.featureConfig.predictionHorizon]?.close;
      const currentPrice = prices[i].close;
      const target = futurePrice > currentPrice ? 1 : 0;

      X.push(sample);
      y.push(target);
    }

    return { X, y };
  }

  // ============================================
  // DATA PREPARATION
  // ============================================

  /**
   * Get stock prices from database
   */
  async getStockPrices(symbol, days) {
    const company = await this.prisma.company.findUnique({
      where: { symbol },
      include: {
        stockPrices: {
          orderBy: { date: 'desc' },
          take: days
        }
      }
    });

    if (!company) {
      throw new Error(`Company ${symbol} not found`);
    }

    return company.stockPrices.reverse();
  }

  /**
   * Prepare training dataset
   */
  async prepareTrainingData(symbols, minDays = 90) {
    const allX = [];
    const allY = [];

    for (const symbol of symbols) {
      try {
        const { X, y } = await this.generateFeatures(symbol, minDays);
        allX.push(...X);
        allY.push(...y);
      } catch (error) {
        console.error(`Error preparing data for ${symbol}:`, error.message);
      }
    }

    return { X: allX, y: allY };
  }

  /**
   * Normalize features
   */
  normalizeFeatures(X, scaler = null) {
    const features = X[0] ? Object.keys(X[0]) : [];
    const normalized = [];
    
    if (!scaler) {
      // Calculate statistics
      const stats = {};
      features.forEach(f => {
        const values = X.map(row => row[f]);
        stats[f] = {
          mean: values.reduce((a, b) => a + b, 0) / values.length,
          std: Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - values[0], 2), 0) / values.length)
        };
      });
      
      X.forEach(row => {
        const normalizedRow = {};
        features.forEach(f => {
          normalizedRow[f] = (row[f] - stats[f].mean) / (stats[f].std || 1);
        });
        normalized.push(normalizedRow);
      });
      
      return { X: normalized, scaler: stats };
    }
    
    // Use provided scaler
    X.forEach(row => {
      const normalizedRow = {};
      features.forEach(f => {
        normalizedRow[f] = (row[f] - scaler[f].mean) / (scaler[f].std || 1);
      });
      normalized.push(normalizedRow);
    });
    
    return { X: normalized, scaler };
  }

  // ============================================
  // MODEL TRAINING (Simplified Implementation)
  // ============================================

  /**
   * Train logistic regression model
   */
  async trainLogisticRegression(X, y) {
    // Simplified logistic regression
    const features = Object.keys(X[0]);
    const weights = {};
    const bias = 0;
    
    // Initialize weights
    features.forEach(f => weights[f] = 0);
    
    // Training parameters
    const learningRate = 0.01;
    const epochs = 100;
    
    // Training loop
    for (let epoch = 0; epoch < epochs; epoch++) {
      let totalLoss = 0;
      
      for (let i = 0; i < X.length; i++) {
        // Forward pass
        let prediction = bias;
        features.forEach(f => {
          prediction += X[i][f] * weights[f];
        });
        
        // Sigmoid
        const prob = 1 / (1 + Math.exp(-prediction));
        
        // Loss
        const loss = -y[i] * Math.log(prob + 1e-10) - (1 - y[i]) * Math.log(1 - prob + 1e-10);
        totalLoss += loss;
        
        // Backward pass
        const error = prob - y[i];
        features.forEach(f => {
          weights[f] -= learningRate * error * X[i][f];
        });
      }
      
      if (epoch % 20 === 0) {
        console.log(`Epoch ${epoch}, Loss: ${totalLoss / X.length}`);
      }
    }
    
    this.models.logisticRegression = { weights, bias, features };
    return this.models.logisticRegression;
  }

  /**
   * Train random forest (simplified)
   */
  async trainRandomForest(X, y, nTrees = 10) {
    const trees = [];
    
    for (let t = 0; t < nTrees; t++) {
      // Bootstrap sample
      const sampleX = [];
      const sampleY = [];
      for (let i = 0; i < X.length; i++) {
        const idx = Math.floor(Math.random() * X.length);
        sampleX.push(X[idx]);
        sampleY.push(y[idx]);
      }
      
      // Train a simple decision tree
      const tree = this.trainDecisionTree(sampleX, sampleY, 5);
      trees.push(tree);
    }
    
    this.models.randomForest = { trees };
    return this.models.randomForest;
  }

  /**
   * Train decision tree
   */
  trainDecisionTree(X, y, maxDepth) {
    const features = Object.keys(X[0]);
    
    function buildTree(x, y, depth) {
      if (depth >= maxDepth || y.length < 10 || y.every(v => v === y[0])) {
        return { 
          prediction: y.reduce((a, b) => a + b, 0) / y.length > 0.5 ? 1 : 0 
        };
      }
      
      // Find best split
      let bestFeature = null;
      let bestThreshold = null;
      let bestGain = -Infinity;
      
      for (const f of features.slice(0, 5)) { // Limit features
        const values = x.map(row => row[f]);
        const threshold = values.reduce((a, b) => a + b, 0) / values.length;
        
        const leftY = x.map((row, i) => row[f] < threshold ? y[i] : null).filter(v => v !== null);
        const rightY = x.map((row, i) => row[f] >= threshold ? y[i] : null).filter(v => v !== null);
        
        if (leftY.length === 0 || rightY.length === 0) continue;
        
        const parentEntropy = this.calculateEntropy(y);
        const leftEntropy = this.calculateEntropy(leftY);
        const rightEntropy = this.calculateEntropy(rightY);
        
        const gain = parentEntropy - (
          leftEntropy * leftY.length / y.length +
          rightEntropy * rightY.length / y.length
        );
        
        if (gain > bestGain) {
          bestGain = gain;
          bestFeature = f;
          bestThreshold = threshold;
        }
      }
      
      if (!bestFeature) {
        return { prediction: y.reduce((a, b) => a + b, 0) / y.length > 0.5 ? 1 : 0 };
      }
      
      const leftIndices = X.map((row, i) => row[bestFeature] < bestThreshold ? i : -1).filter(i => i >= 0);
      const rightIndices = X.map((row, i) => row[bestFeature] >= bestThreshold ? i : -1).filter(i => i >= 0);
      
      return {
        feature: bestFeature,
        threshold: bestThreshold,
        left: buildTree(leftIndices.map(i => X[i]), leftIndices.map(i => y[i]), depth + 1),
        right: buildTree(rightIndices.map(i => X[i]), rightIndices.map(i => y[i]), depth + 1)
      };
    }
    
    return buildTree(X, y, 0);
  }

  /**
   * Calculate entropy
   */
  calculateEntropy(y) {
    if (y.length === 0) return 0;
    
    const counts = {};
    y.forEach(v => counts[v] = (counts[v] || 0) + 1);
    
    let entropy = 0;
    Object.values(counts).forEach(count => {
      const p = count / y.length;
      entropy -= p * Math.log2(p);
    });
    
    return entropy;
  }

  // ============================================
  // PREDICTION
  // ============================================

  /**
   * Make prediction
   */
  async predict(symbol) {
    const { X, scaler } = await this.generateFeatures(symbol);
    const latestFeatures = X[X.length - 1];
    
    if (!latestFeatures) {
      throw new Error('No features available for prediction');
    }
    
    // Normalize
    const { X: normalizedX } = this.normalizeFeatures([latestFeatures], scaler || this.scaler);
    
    // Get predictions from all models
    const predictions = {};
    
    // Logistic regression
    if (this.models.logisticRegression) {
      const { weights, bias, features } = this.models.logisticRegression;
      let score = bias;
      features.forEach(f => {
        score += normalizedX[0][f] * weights[f];
      });
      predictions.logisticRegression = {
        probability: 1 / (1 + Math.exp(-score)),
        direction: score > 0 ? 'UP' : 'DOWN'
      };
    }
    
    // Random forest
    if (this.models.randomForest) {
      const votes = this.models.randomForest.trees.map(tree => 
        this.predictTree(normalizedX[0], tree)
      );
      const avgVote = votes.reduce((a, b) => a + b, 0) / votes.length;
      predictions.randomForest = {
        probability: avgVote,
        direction: avgVote > 0.5 ? 'UP' : 'DOWN'
      };
    }
    
    // Ensemble
    const ensembleProb = (
      (predictions.logisticRegression?.probability || 0.5) +
      (predictions.randomForest?.probability || 0.5)
    ) / 2;
    
    return {
      symbol,
      prediction: {
        probability: ensembleProb,
        direction: ensembleProb > 0.5 ? 'UP' : 'DOWN',
        confidence: Math.abs(ensembleProb - 0.5) * 2 // 0 to 1
      },
      models: predictions,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Predict using decision tree
   */
  predictTree(features, tree) {
    if (tree.prediction !== undefined) {
      return tree.prediction;
    }
    
    const value = features[tree.feature];
    if (value < tree.threshold) {
      return this.predictTree(features, tree.left);
    } else {
      return this.predictTree(features, tree.right);
    }
  }

  // ============================================
  // MODEL EVALUATION
  // ============================================

  /**
   * Evaluate model
   */
  async evaluate(symbols, testSize = 0.2) {
    const { X, y } = await this.prepareTrainingData(symbols);
    
    // Split data
    const splitIdx = Math.floor(X.length * (1 - testSize));
    const trainX = X.slice(0, splitIdx);
    const trainY = y.slice(0, splitIdx);
    const testX = X.slice(splitIdx);
    const testY = y.slice(splitIdx);
    
    // Train
    await this.trainLogisticRegression(trainX, trainY);
    
    // Predict
    const predictions = [];
    for (const x of testX) {
      const { X: normX } = this.normalizeFeatures([x], this.scaler);
      const { weights, bias, features } = this.models.logisticRegression;
      
      let score = bias;
      features.forEach(f => {
        score += normX[0][f] * weights[f];
      });
      
      predictions.push(score > 0 ? 1 : 0);
    }
    
    // Calculate metrics
    const metrics = {
      accuracy: predictions.filter((p, i) => p === testY[i]).length / testY.length,
      precision: this.calculatePrecision(predictions, testY),
      recall: this.calculateRecall(predictions, testY),
      f1: 0
    };
    
    metrics.f1 = 2 * (metrics.precision * metrics.recall) / (metrics.precision + metrics.recall);
    
    return metrics;
  }

  calculatePrecision(predictions, actual) {
    const truePositives = predictions.filter((p, i) => p === 1 && actual[i] === 1).length;
    const predictedPositives = predictions.filter(p => p === 1).length;
    return predictedPositives > 0 ? truePositives / predictedPositives : 0;
  }

  calculateRecall(predictions, actual) {
    const truePositives = predictions.filter((p, i) => p === 1 && actual[i] === 1).length;
    const actualPositives = actual.filter(a => a === 1).length;
    return actualPositives > 0 ? truePositives / actualPositives : 0;
  }
}

module.exports = StockPredictionPipeline;
