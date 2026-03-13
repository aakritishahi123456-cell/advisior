/**
 * FinSathi AI - Experiment Tracking System
 * ML experiment tracking and model performance monitoring
 */

const { PrismaClient } = require('@prisma/client');

class ExperimentTracker {
  constructor() {
    this.prisma = new PrismaClient();
  }

  // ============================================
  // EXPERIMENTS
  // ============================================

  /**
   * Create new experiment
   */
  async createExperiment(config) {
    const {
      name,
      description,
      type, // HYPERPARAMETER, ARCHITECTURE, FEATURE_ENGINEERING, ENSEMBLE
      parameters,
      datasetVersion,
      modelType
    } = config;

    const experiment = await this.prisma.mlExperiment.create({
      data: {
        name,
        description,
        type,
        parameters: parameters || {},
        datasetVersion,
        modelType,
        status: 'RUNNING',
        startTime: new Date()
      }
    });

    return experiment;
  }

  /**
   * Log experiment metric
   */
  async logMetric(experimentId, metrics) {
    const { epoch, step, ...metricValues } = metrics;

    await this.prisma.experimentMetric.create({
      data: {
        experimentId,
        epoch: epoch || null,
        step: step || null,
        metrics: metricValues,
        timestamp: new Date()
      }
    });
  }

  /**
   * Complete experiment
   */
  async completeExperiment(experimentId, results) {
    return this.prisma.mlExperiment.update({
      where: { id: experimentId },
      data: {
        status: 'COMPLETED',
        endTime: new Date(),
        results: results || {}
      }
    });
  }

  /**
   * Get experiment details
   */
  async getExperiment(experimentId) {
    const experiment = await this.prisma.mlExperiment.findUnique({
      where: { id: experimentId },
      include: {
        metrics: {
          orderBy: { timestamp: 'asc' }
        }
      }
    });

    return experiment;
  }

  /**
   * List experiments
   */
  async listExperiments(filters = {}) {
    const { type, status, limit = 20 } = filters;

    const where = {};
    if (type) where.type = type;
    if (status) where.status = status;

    return this.prisma.mlExperiment.findMany({
      where,
      orderBy: { startTime: 'desc' },
      take: limit
    });
  }

  // ============================================
  // PREDICTION TRACKING
  // ============================================

  /**
   * Log prediction for accuracy tracking
   */
  async logPrediction(data) {
    const {
      experimentId,
      modelId,
      symbol,
      predictedDirection,
      actualDirection,
      predictedPrice,
      actualPrice,
      predictionTime,
      features
    } = data;

    const correct = predictedDirection === actualDirection;
    const error = actualPrice ? Math.abs(predictedPrice - actualPrice) / actualPrice : null;

    return this.prisma.predictionLog.create({
      data: {
        experimentId: experimentId || null,
        modelId: modelId || null,
        symbol,
        predictedDirection,
        actualDirection,
        predictedPrice,
        actualPrice,
        predictionError: error,
        correct,
        predictionTime: predictionTime || new Date(),
        features: features || {}
      }
    });
  }

  /**
   * Calculate model accuracy
   */
  async calculateAccuracy(modelId, options = {}) {
    const { symbol, startDate, endDate, minPredictions = 10 } = options;

    const where = {};
    if (modelId) where.modelId = modelId;
    if (symbol) where.symbol = symbol;
    if (startDate || endDate) {
      where.predictionTime = {};
      if (startDate) where.predictionTime.gte = new Date(startDate);
      if (endDate) where.predictionTime.lte = new Date(endDate);
    }

    const predictions = await this.prisma.predictionLog.findMany({ where });

    if (predictions.length < minPredictions) {
      return { accuracy: null, message: `Need ${minPredictions} predictions, have ${predictions.length}` };
    }

    const correct = predictions.filter(p => p.correct).length;
    const accuracy = correct / predictions.length;

    // Calculate additional metrics
    const directionalAccuracy = accuracy;
    const priceErrors = predictions.filter(p => p.predictionError !== null).map(p => p.predictionError);
    const avgError = priceErrors.length > 0 ? priceErrors.reduce((a, b) => a + b, 0) / priceErrors.length : null;

    return {
      accuracy,
      totalPredictions: predictions.length,
      correct: correct,
      incorrect: predictions.length - correct,
      averageError: avgError,
      bySymbol: await this.getAccuracyBySymbol(predictions)
    };
  }

  /**
   * Get accuracy breakdown by symbol
   */
  async getAccuracyBySymbol(predictions) {
    const bySymbol = {};
    
    predictions.forEach(p => {
      if (!bySymbol[p.symbol]) {
        bySymbol[p.symbol] = { total: 0, correct: 0 };
      }
      bySymbol[p.symbol].total++;
      if (p.correct) bySymbol[p.symbol].correct++;
    });

    return Object.entries(bySymbol).map(([symbol, data]) => ({
      symbol,
      accuracy: data.correct / data.total,
      total: data.total
    }));
  }

  // ============================================
  // MODEL COMPARISON
  // ============================================

  /**
   * Compare multiple experiments
   */
  async compareExperiments(experimentIds) {
    const experiments = await this.prisma.mlExperiment.findMany({
      where: { id: { in: experimentIds } },
      include: {
        metrics: {
          orderBy: { timestamp: 'asc' }
        }
      }
    });

    const comparison = experiments.map(exp => ({
      id: exp.id,
      name: exp.name,
      type: exp.type,
      status: exp.status,
      duration: exp.endTime && exp.startTime 
        ? (new Date(exp.endTime) - new Date(exp.startTime)) / (1000 * 60) 
        : null,
      finalMetrics: exp.results || {},
      metricHistory: this.extractMetricHistory(exp.metrics)
    }));

    return comparison;
  }

  /**
   * Extract metric history
   */
  extractMetricHistory(metrics) {
    const history = {};
    
    metrics.forEach(m => {
      Object.entries(m.metrics || {}).forEach(([key, value]) => {
        if (!history[key]) history[key] = [];
        history[key].push({ 
          epoch: m.epoch, 
          step: m.step, 
          value, 
          timestamp: m.timestamp 
        });
      });
    });

    return history;
  }

  // ============================================
  // DATASET TRACKING
  // ============================================

  /**
   * Log dataset version
   */
  async logDatasetVersion(config) {
    const {
      name,
      version,
      description,
      size,
      recordCount,
      features,
      source,
      statistics
    } = config;

    return this.prisma.datasetVersion.create({
      data: {
        name,
        version,
        description,
        size,
        recordCount,
        features: features || [],
        source,
        statistics: statistics || {},
        createdAt: new Date()
      }
    });
  }

  /**
   * Get dataset versions
   */
  async getDatasetVersions(name) {
    return this.prisma.datasetVersion.findMany({
      where: { name },
      orderBy: { version: 'desc' }
    });
  }

  /**
   * Compare dataset versions
   */
  async compareDatasetVersions(version1Id, version2Id) {
    const [v1, v2] = await Promise.all([
      this.prisma.datasetVersion.findUnique({ where: { id: version1Id } }),
      this.prisma.datasetVersion.findUnique({ where: { id: version2Id } })
    ]);

    return {
      version1: { version: v1?.version, recordCount: v1?.recordCount },
      version2: { version: v2?.version, recordCount: v2?.recordCount },
      differences: {
        recordsAdded: (v2?.recordCount || 0) - (v1?.recordCount || 0),
        featuresChanged: this.compareFeatures(v1?.features, v2?.features)
      }
    };
  }

  /**
   * Compare feature lists
   */
  compareFeatures(features1, features2) {
    const set1 = new Set(features1 || []);
    const set2 = new Set(features2 || []);
    
    return {
      added: [...set2].filter(f => !set1.has(f)),
      removed: [...set1].filter(f => !set2.has(f)),
      unchanged: [...set1].filter(f => set2.has(f))
    };
  }

  // ============================================
  // PERFORMANCE MONITORING
  // ============================================

  /**
   * Get model performance over time
   */
  async getPerformanceOverTime(modelId, options = {}) {
    const { metric = 'accuracy', window = 7, startDate, endDate } = options;

    const where = modelId ? { modelId } : {};
    if (startDate || endDate) {
      where.predictionTime = {};
      if (startDate) where.predictionTime.gte = new Date(startDate);
      if (endDate) where.predictionTime.lte = new Date(endDate);
    }

    const predictions = await this.prisma.predictionLog.findMany({
      where,
      orderBy: { predictionTime: 'asc' }
    });

    // Group by time windows
    const windows = {};
    predictions.forEach(p => {
      const date = new Date(p.predictionTime);
      const windowKey = this.getWindowKey(date, window);
      
      if (!windows[windowKey]) {
        windows[windowKey] = { total: 0, correct: 0, errors: [] };
      }
      windows[windowKey].total++;
      if (p.correct) windows[windowKey].correct++;
      if (p.predictionError) windows[windowKey].errors.push(p.predictionError);
    });

    return Object.entries(windows).map(([date, data]) => ({
      date,
      accuracy: data.total > 0 ? data.correct / data.total : 0,
      avgError: data.errors.length > 0 ? data.errors.reduce((a, b) => a + b, 0) / data.errors.length : null,
      predictions: data.total
    }));
  }

  /**
   * Get window key for grouping
   */
  getWindowKey(date, window) {
    const d = new Date(date);
    if (window === 1) return d.toISOString().split('T')[0];
    if (window === 7) {
      const day = d.getDay();
      d.setDate(d.getDate() - day);
      return d.toISOString().split('T')[0];
    }
    return d.toISOString().slice(0, 7); // Monthly
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(options = {}) {
    const { metric = 'accuracy', minPredictions = 50, limit = 10 } = options;

    // Get all models with predictions
    const predictions = await this.prisma.predictionLog.findMany({
      select: { modelId: true }
    });

    const modelIds = [...new Set(predictions.map(p => p.modelId).filter(Boolean))];

    const leaderboard = [];
    for (const modelId of modelIds) {
      const accuracyData = await this.calculateAccuracy(modelId, { minPredictions });
      
      if (accuracyData.accuracy !== null) {
        leaderboard.push({
          modelId,
          accuracy: accuracyData.accuracy,
          totalPredictions: accuracyData.totalPredictions,
          avgError: accuracyData.averageError
        });
      }
    }

    return leaderboard
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, limit);
  }
}

module.exports = ExperimentTracker;
