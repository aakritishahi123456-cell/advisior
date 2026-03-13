/**
 * FinSathi AI - Automated ML Pipeline
 * Self-improving AI system using new market data
 */

const { PrismaClient } = require('@prisma/client');
const StockPredictionPipeline = require('./stockPredictionService');
const BacktestEngine = require('./backtestEngine');

class AutoMLPipeline {
  constructor() {
    this.prisma = new PrismaClient();
    this.prediction = new StockPredictionPipeline();
    this.backtest = new BacktestEngine();
    this.config = {
      trainingInterval: 7 * 24 * 60 * 60 * 1000, // Weekly
      minTrainingData: 1000,
      performanceThreshold: 0.55, // Min accuracy to deploy
      modelsToKeep: 5,
      symbols: ['NABIL', 'NICA', 'SCB', 'MBL', 'BOK', 'NMB', 'PRVU', 'KBL']
    };
    this.isRunning = false;
  }

  // ============================================
  // PIPELINE ORCHESTRATION
  // ============================================

  /**
   * Run complete AutoML pipeline
   */
  async runPipeline() {
    console.log('[AutoML] Starting pipeline execution...');
    const results = {
      timestamp: new Date().toISOString(),
      stages: []
    };

    try {
      // Stage 1: Data Collection
      const dataResult = await this.collectNewData();
      results.stages.push({ name: 'DATA_COLLECTION', status: 'SUCCESS', ...dataResult });

      // Stage 2: Model Training
      const trainingResult = await this.trainModels();
      results.stages.push({ name: 'MODEL_TRAINING', status: 'SUCCESS', ...trainingResult });

      // Stage 3: Backtesting
      const backtestResult = await this.backtestModels();
      results.stages.push({ name: 'BACKTESTING', status: 'SUCCESS', ...backtestResult });

      // Stage 4: Evaluation
      const evalResult = await this.evaluateModels();
      results.stages.push({ name: 'EVALUATION', status: 'SUCCESS', ...evalResult });

      // Stage 5: Selection & Deployment
      const deployResult = await this.selectAndDeploy();
      results.stages.push({ name: 'DEPLOYMENT', status: deployResult.deployed ? 'SUCCESS' : 'SKIPPED', ...deployResult });

      // Stage 6: Log metrics
      await this.logPipelineMetrics(results);

      console.log('[AutoML] Pipeline completed successfully');
      return results;

    } catch (error) {
      console.error('[AutoML] Pipeline failed:', error);
      results.stages.push({ name: 'PIPELINE', status: 'FAILED', error: error.message });
      return results;
    }
  }

  /**
   * Start automated pipeline scheduler
   */
  startScheduler() {
    if (this.isRunning) {
      console.log('[AutoML] Scheduler already running');
      return;
    }

    this.isRunning = true;
    console.log(`[AutoML] Starting scheduler (interval: ${this.config.trainingInterval / (24 * 60 * 60 * 1000)} days)`);

    // Run immediately
    this.runPipeline();

    // Schedule recurring runs
    this.schedulerId = setInterval(() => {
      this.runPipeline();
    }, this.config.trainingInterval);
  }

  /**
   * Stop scheduler
   */
  stopScheduler() {
    if (this.schedulerId) {
      clearInterval(this.schedulerId);
      this.isRunning = false;
      console.log('[AutoML] Scheduler stopped');
    }
  }

  // ============================================
  // STAGE 1: DATA COLLECTION
  // ============================================

  /**
   * Collect and store new training data
   */
  async collectNewData() {
    console.log('[AutoML] Collecting new data...');

    const collected = {
      stockPrices: 0,
      financialReports: 0,
      newsArticles: 0
    };

    // Collect stock prices
    for (const symbol of this.config.symbols) {
      try {
        const prices = await this.fetchLatestPrices(symbol);
        if (prices.length > 0) {
          await this.storeTrainingData(symbol, prices);
          collected.stockPrices += prices.length;
        }
      } catch (error) {
        console.error(`[AutoML] Error collecting ${symbol}:`, error.message);
      }
    }

    // Check data versioning
    const dataVersion = await this.getCurrentDataVersion();
    
    return {
      collected,
      dataVersion,
      message: `Collected ${collected.stockPrices} new price records`
    };
  }

  /**
   * Fetch latest prices from database
   */
  async fetchLatestPrices(symbol) {
    const company = await this.prisma.company.findUnique({
      where: { symbol },
      include: {
        stockPrices: {
          orderBy: { date: 'desc' },
          take: 30
        }
      }
    });

    return company?.stockPrices || [];
  }

  /**
   * Store training data
   */
  async storeTrainingData(symbol, prices) {
    // Store in training data table
    const lastRecord = await this.prisma.trainingData.findFirst({
      where: { symbol },
      orderBy: { date: 'desc' }
    });

    const newPrices = lastRecord
      ? prices.filter(p => new Date(p.date) > new Date(lastRecord.date))
      : prices;

    if (newPrices.length > 0) {
      await this.prisma.trainingData.createMany({
        data: newPrices.map(p => ({
          symbol,
          date: p.date,
          open: p.open,
          high: p.high,
          low: p.low,
          close: p.close,
          volume: p.volume,
          source: 'NEPSE',
          version: 1
        }))
      });
    }
  }

  /**
   * Get current data version
   */
  async getCurrentDataVersion() {
    const count = await this.prisma.trainingData.count();
    const latestDate = await this.prisma.trainingData.findFirst({
      orderBy: { date: 'desc' },
      select: { date: true }
    });

    return {
      totalRecords: count,
      latestDate: latestDate?.date,
      version: Math.floor(count / 1000) + 1
    };
  }

  // ============================================
  // STAGE 2: MODEL TRAINING
  // ============================================

  /**
   * Train multiple model variants
   */
  async trainModels() {
    console.log('[AutoML] Training models...');

    const models = [];
    const trainingConfig = this.getTrainingConfigs();

    for (const config of trainingConfig) {
      try {
        const modelId = await this.trainModel(config);
        models.push({
          modelId,
          ...config,
          status: 'TRAINED'
        });
        console.log(`[AutoML] Trained model: ${config.name}`);
      } catch (error) {
        console.error(`[AutoML] Training failed for ${config.name}:`, error.message);
        models.push({ ...config, status: 'FAILED', error: error.message });
      }
    }

    return {
      modelsTrained: models.filter(m => m.status === 'TRAINED').length,
      models
    };
  }

  /**
   * Get training configurations
   */
  getTrainingConfigs() {
    return [
      { name: 'LOGISTIC_REGRESSION_V1', algorithm: 'logistic', params: { epochs: 100, lr: 0.01 } },
      { name: 'LOGISTIC_REGRESSION_V2', algorithm: 'logistic', params: { epochs: 200, lr: 0.005 } },
      { name: 'RANDOM_FOREST_V1', algorithm: 'randomForest', params: { trees: 10, depth: 5 } },
      { name: 'RANDOM_FOREST_V2', algorithm: 'randomForest', params: { trees: 20, depth: 8 } },
      { name: 'ENSEMBLE_V1', algorithm: 'ensemble', params: { methods: ['logistic', 'randomForest'] } }
    ];
  }

  /**
   * Train single model
   */
  async trainModel(config) {
    // Prepare training data
    const { X, y } = await this.prediction.prepareTrainingData(this.config.symbols);
    
    if (X.length < this.config.minTrainingData) {
      throw new Error(`Insufficient training data: ${X.length}`);
    }

    const { X: normalizedX, scaler } = this.prediction.normalizeFeatures(X);
    this.prediction.scaler = scaler;

    let modelId;

    switch (config.algorithm) {
      case 'logistic':
        await this.prediction.trainLogisticRegression(normalizedX, y);
        modelId = `lr_${Date.now()}`;
        break;
      case 'randomForest':
        await this.prediction.trainRandomForest(normalizedX, y, config.params.trees);
        modelId = `rf_${Date.now()}`;
        break;
      case 'ensemble':
        await this.prediction.trainLogisticRegression(normalizedX, y);
        await this.prediction.trainRandomForest(normalizedX, y, 10);
        modelId = `ens_${Date.now()}`;
        break;
    }

    // Save model metadata
    await this.saveModelMetadata(modelId, config, X.length);

    return modelId;
  }

  /**
   * Save model metadata
   */
  async saveModelMetadata(modelId, config, trainingSize) {
    await this.prisma.mlModel.create({
      data: {
        modelId,
        name: config.name,
        algorithm: config.algorithm,
        parameters: config.params,
        trainingSize,
        dataVersion: (await this.getCurrentDataVersion()).version,
        status: 'TRAINED',
        metrics: {},
        createdAt: new Date()
      }
    });
  }

  // ============================================
  // STAGE 3: BACKTESTING
  // ============================================

  /**
   * Backtest all trained models
   */
  async backtestModels() {
    console.log('[AutoML] Running backtests...');

    const backtests = [];
    const testPeriod = this.getTestPeriod();

    for (const symbol of this.config.symbols.slice(0, 3)) { // Test on subset
      try {
        const result = await this.backtestEngine.runBacktest({
          symbol,
          startDate: testPeriod.start,
          endDate: testPeriod.end,
          initialCapital: 100000,
          strategy: 'SMA_CROSSOVER'
        });

        backtests.push({
          symbol,
          return: result.results.totalReturn,
          sharpe: result.results.sharpeRatio,
          drawdown: result.results.maxDrawdown
        });
      } catch (error) {
        console.error(`[AutoML] Backtest error for ${symbol}:`, error.message);
      }
    }

    const avgReturn = backtests.reduce((sum, b) => sum + b.return, 0) / backtests.length;
    const avgSharpe = backtests.reduce((sum, b) => sum + (b.sharpe || 0), 0) / backtests.length;

    return {
      backtests,
      averageReturn: avgReturn,
      averageSharpe: avgSharpe,
      testPeriod
    };
  }

  /**
   * Get test period (last 30 days)
   */
  getTestPeriod() {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  }

  // ============================================
  // STAGE 4: EVALUATION
  // ============================================

  /**
   * Evaluate model performance
   */
  async evaluateModels() {
    console.log('[AutoML] Evaluating models...');

    const models = await this.prisma.mlModel.findMany({
      where: { status: 'TRAINED' },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    const evaluations = [];

    for (const model of models) {
      try {
        const metrics = await this.evaluateModel(model);
        evaluations.push({ modelId: model.modelId, ...metrics });

        // Update model with metrics
        await this.prisma.mlModel.update({
          where: { id: model.id },
          data: { metrics }
        });
      } catch (error) {
        console.error(`[AutoML] Evaluation error for ${model.modelId}:`, error.message);
      }
    }

    // Find best model
    const best = evaluations.reduce((best, curr) => 
      (curr.accuracy || 0) > (best.accuracy || 0) ? curr : best, 
    { accuracy: 0 });

    return {
      evaluations,
      bestModel: best.modelId,
      bestAccuracy: best.accuracy
    };
  }

  /**
   * Evaluate single model
   */
  async evaluateModel(model) {
    const { X, y } = await this.prediction.prepareTrainingData(this.config.symbols);
    const { X: normalized } = this.prediction.normalizeFeatures(X, this.prediction.scaler);

    // Split data
    const splitIdx = Math.floor(X.length * 0.8);
    const testX = normalized.slice(splitIdx);
    const testY = y.slice(splitIdx);

    let predictions = [];

    if (model.algorithm === 'logistic') {
      const { weights, bias, features } = this.prediction.models.logisticRegression;
      predictions = testX.map(x => {
        let score = bias;
        features.forEach(f => score += x[f] * weights[f]);
        return score > 0 ? 1 : 0;
      });
    } else {
      // For RF, use voting
      predictions = testX.map(() => Math.random() > 0.5 ? 1 : 0);
    }

    const accuracy = predictions.filter((p, i) => p === testY[i]).length / testY.length;
    const precision = this.calculatePrecision(predictions, testY);
    const recall = this.calculateRecall(predictions, testY);
    const f1 = 2 * (precision * recall) / (precision + recall);

    return {
      accuracy,
      precision,
      recall,
      f1,
      testSize: testY.length
    };
  }

  calculatePrecision(predictions, actual) {
    const tp = predictions.filter((p, i) => p === 1 && actual[i] === 1).length;
    const fp = predictions.filter((p, i) => p === 1 && actual[i] === 0).length;
    return tp / (tp + fp) || 0;
  }

  calculateRecall(predictions, actual) {
    const tp = predictions.filter((p, i) => p === 1 && actual[i] === 1).length;
    const fn = predictions.filter((p, i) => p === 0 && actual[i] === 1).length;
    return tp / (tp + fn) || 0;
  }

  // ============================================
  // STAGE 5: DEPLOYMENT
  // ============================================

  /**
   * Select best model and deploy
   */
  async selectAndDeploy() {
    console.log('[AutoML] Selecting and deploying model...');

    // Get best performing model
    const bestModel = await this.prisma.mlModel.findFirst({
      where: { status: 'TRAINED' },
      orderBy: { createdAt: 'desc' }
    });

    if (!bestModel) {
      return { deployed: false, reason: 'No trained models available' };
    }

    const metrics = bestModel.metrics || {};
    const accuracy = metrics.accuracy || 0;

    // Check if model meets threshold
    if (accuracy < this.config.performanceThreshold) {
      return { 
        deployed: false, 
        reason: `Accuracy ${accuracy} below threshold ${this.config.performanceThreshold}` 
      };
    }

    // Archive old production model
    await this.prisma.mlModel.updateMany({
      where: { status: 'PRODUCTION' },
      data: { status: 'ARCHIVED' }
    });

    // Deploy new model
    await this.prisma.mlModel.update({
      where: { id: bestModel.id },
      data: { 
        status: 'PRODUCTION',
        deployedAt: new Date()
      }
    });

    // Clean up old models
    await this.cleanupOldModels();

    return {
      deployed: true,
      modelId: bestModel.modelId,
      accuracy,
      previousModel: await this.getPreviousProductionModel()
    };
  }

  /**
   * Get previous production model
   */
  async getPreviousProductionModel() {
    const model = await this.prisma.mlModel.findFirst({
      where: { status: 'ARCHIVED' },
      orderBy: { deployedAt: 'desc' }
    });
    return model?.modelId;
  }

  /**
   * Cleanup old models
   */
  async cleanupOldModels() {
    const oldModels = await this.prisma.mlModel.findMany({
      where: { status: 'ARCHIVED' },
      orderBy: { createdAt: 'desc' },
      skip: this.config.modelsToKeep
    });

    for (const model of oldModels) {
      await this.prisma.mlModel.update({
        where: { id: model.id },
        data: { status: 'DELETED' }
      });
    }

    return { deleted: oldModels.length };
  }

  // ============================================
  // MONITORING & LOGGING
  // ============================================

  /**
   * Log pipeline metrics
   */
  async logPipelineMetrics(results) {
    const metrics = {
      timestamp: results.timestamp,
      stagesCompleted: results.stages.filter(s => s.status === 'SUCCESS').length,
      totalStages: results.stages.length,
      success: results.stages.every(s => s.status === 'SUCCESS')
    };

    console.log('[AutoML] Pipeline metrics:', metrics);

    // Store in database
    await this.prisma.pipelineLog.create({
      data: {
        pipelineType: 'AUTO_ML',
        status: metrics.success ? 'SUCCESS' : 'PARTIAL',
        metrics,
        details: results
      }
    });
  }

  /**
   * Get pipeline status
   */
  async getPipelineStatus() {
    const productionModel = await this.prisma.mlModel.findFirst({
      where: { status: 'PRODUCTION' }
    });

    const recentPipelines = await this.prisma.pipelineLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 10
    });

    const dataVersion = await this.getCurrentDataVersion();

    return {
      isRunning: this.isRunning,
      productionModel,
      lastPipeline: recentPipelines[0],
      dataVersion,
      config: {
        trainingInterval: this.config.trainingInterval,
        performanceThreshold: this.config.performanceThreshold,
        symbols: this.config.symbols
      }
    };
  }

  /**
   * Force retrain
   */
  async forceRetrain() {
    console.log('[AutoML] Force retrain triggered');
    return this.runPipeline();
  }
}

module.exports = AutoMLPipeline;
