/**
 * FinSathi AI - AutoML Routes
 * API endpoints for automated ML pipeline
 */

const express = require('express');
const AutoMLPipeline = require('../services/autoMLPipeline');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const automl = new AutoMLPipeline();

/**
 * POST /api/v1/automl/run
 * Run the AutoML pipeline manually
 * Requires authentication
 */
router.post('/run', authMiddleware, async (req, res) => {
  try {
    res.status(202).json({
      success: true,
      message: 'AutoML pipeline started'
    });

    const result = await automl.runPipeline();

    console.log('[AutoML] Pipeline result:', result);
  } catch (error) {
    console.error('AutoML error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Pipeline execution failed'
    });
  }
});

/**
 * GET /api/v1/automl/status
 * Get pipeline status
 * Requires authentication
 */
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const status = await automl.getPipelineStatus();

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pipeline status'
    });
  }
});

/**
 * POST /api/v1/automl/start-scheduler
 * Start automated training scheduler
 * Requires authentication
 */
router.post('/start-scheduler', authMiddleware, async (req, res) => {
  try {
    automl.startScheduler();

    res.json({
      success: true,
      message: 'AutoML scheduler started'
    });
  } catch (error) {
    console.error('Scheduler start error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start scheduler'
    });
  }
});

/**
 * POST /api/v1/automl/stop-scheduler
 * Stop automated training scheduler
 * Requires authentication
 */
router.post('/stop-scheduler', authMiddleware, async (req, res) => {
  try {
    automl.stopScheduler();

    res.json({
      success: true,
      message: 'AutoML scheduler stopped'
    });
  } catch (error) {
    console.error('Scheduler stop error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop scheduler'
    });
  }
});

/**
 * GET /api/v1/automl/models
 * Get all trained models
 * Requires authentication
 */
router.get('/models', authMiddleware, async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const models = await prisma.mlModel.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    res.json({
      success: true,
      data: models
    });
  } catch (error) {
    console.error('Models error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get models'
    });
  }
});

/**
 * GET /api/v1/automl/models/:modelId
 * Get specific model details
 * Requires authentication
 */
router.get('/models/:modelId', authMiddleware, async (req, res) => {
  try {
    const { modelId } = req.params;
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const model = await prisma.mlModel.findFirst({
      where: { modelId }
    });

    if (!model) {
      return res.status(404).json({
        success: false,
        error: 'Model not found'
      });
    }

    res.json({
      success: true,
      data: model
    });
  } catch (error) {
    console.error('Model error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get model'
    });
  }
});

/**
 * POST /api/v1/automl/models/:modelId/deploy
 * Deploy specific model
 * Requires authentication
 */
router.post('/models/:modelId/deploy', authMiddleware, async (req, res) => {
  try {
    const { modelId } = req.params;
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    // Archive current production
    await prisma.mlModel.updateMany({
      where: { status: 'PRODUCTION' },
      data: { status: 'ARCHIVED' }
    });

    // Deploy selected model
    const model = await prisma.mlModel.update({
      where: { modelId },
      data: { 
        status: 'PRODUCTION',
        deployedAt: new Date()
      }
    });

    res.json({
      success: true,
      data: model,
      message: `Model ${modelId} deployed successfully`
    });
  } catch (error) {
    console.error('Deploy error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deploy model'
    });
  }
});

/**
 * GET /api/v1/automl/history
 * Get pipeline execution history
 * Requires authentication
 */
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const history = await prisma.pipelineLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit)
    });

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get history'
    });
  }
});

/**
 * GET /api/v1/automl/config
 * Get pipeline configuration
 * Requires authentication
 */
router.get('/config', authMiddleware, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        trainingInterval: automl.config.trainingInterval,
        minTrainingData: automl.config.minTrainingData,
        performanceThreshold: automl.config.performanceThreshold,
        modelsToKeep: automl.config.modelsToKeep,
        symbols: automl.config.symbols
      }
    });
  } catch (error) {
    console.error('Config error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get config'
    });
  }
});

/**
 * PUT /api/v1/automl/config
 * Update pipeline configuration
 * Requires authentication
 */
router.put('/config', authMiddleware, async (req, res) => {
  try {
    const { 
      trainingInterval,
      minTrainingData,
      performanceThreshold,
      modelsToKeep,
      symbols 
    } = req.body;

    if (trainingInterval) automl.config.trainingInterval = trainingInterval;
    if (minTrainingData) automl.config.minTrainingData = minTrainingData;
    if (performanceThreshold) automl.config.performanceThreshold = performanceThreshold;
    if (modelsToKeep) automl.config.modelsToKeep = modelsToKeep;
    if (symbols) automl.config.symbols = symbols;

    res.json({
      success: true,
      data: automl.config,
      message: 'Configuration updated'
    });
  } catch (error) {
    console.error('Config update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update config'
    });
  }
});

/**
 * POST /api/v1/automl/retrain
 * Force immediate retraining
 * Requires authentication
 */
router.post('/retrain', authMiddleware, async (req, res) => {
  try {
    res.status(202).json({
      success: true,
      message: 'Retraining initiated'
    });

    await automl.forceRetrain();
  } catch (error) {
    console.error('Retrain error:', error);
    res.status(500).json({
      success: false,
      error: 'Retraining failed'
    });
  }
});

/**
 * GET /api/v1/automl/performance
 * Get model performance metrics
 * Requires authentication
 */
router.get('/performance', authMiddleware, async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const productionModel = await prisma.mlModel.findFirst({
      where: { status: 'PRODUCTION' }
    });

    const recentPipelines = await prisma.pipelineLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 30
    });

    const avgAccuracy = recentPipelines
      .filter(p => p.metrics?.evaluations)
      .flatMap(p => p.metrics.evaluations)
      .reduce((sum, e) => sum + (e.accuracy || 0), 0) / 
      recentPipelines.filter(p => p.metrics?.evaluations).length || 0;

    res.json({
      success: true,
      data: {
        currentModel: productionModel,
        metrics: productionModel?.metrics || {},
        historicalAccuracy: avgAccuracy,
        pipelineSuccessRate: recentPipelines.filter(p => p.status === 'SUCCESS').length / recentPipelines.length,
        totalPipelines: recentPipelines.length
      }
    });
  } catch (error) {
    console.error('Performance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get performance'
    });
  }
});

module.exports = router;
