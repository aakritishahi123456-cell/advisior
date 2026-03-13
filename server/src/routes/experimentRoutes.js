/**
 * FinSathi AI - Experiment Tracking Routes
 * API endpoints for ML experiment tracking
 */

const express = require('express');
const ExperimentTracker = require('../services/experimentTracker');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const tracker = new ExperimentTracker();

/**
 * POST /api/v1/experiments
 * Create new experiment
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, type, parameters, datasetVersion, modelType } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'name is required'
      });
    }

    const experiment = await tracker.createExperiment({
      name,
      description,
      type,
      parameters,
      datasetVersion,
      modelType
    });

    res.status(201).json({
      success: true,
      data: experiment
    });
  } catch (error) {
    console.error('Create experiment error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v1/experiments
 * List experiments
 */
router.get('/', async (req, res) => {
  try {
    const { type, status, limit = 20 } = req.query;

    const experiments = await tracker.listExperiments({
      type,
      status,
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: experiments
    });
  } catch (error) {
    console.error('List experiments error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list experiments'
    });
  }
});

/**
 * GET /api/v1/experiments/:id
 * Get experiment details
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const experiment = await tracker.getExperiment(id);

    if (!experiment) {
      return res.status(404).json({
        success: false,
        error: 'Experiment not found'
      });
    }

    res.json({
      success: true,
      data: experiment
    });
  } catch (error) {
    console.error('Get experiment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get experiment'
    });
  }
});

/**
 * POST /api/v1/experiments/:id/metrics
 * Log experiment metrics
 */
router.post('/:id/metrics', async (req, res) => {
  try {
    const { id } = req.params;
    const metrics = req.body;

    await tracker.logMetric(id, metrics);

    res.json({
      success: true,
      message: 'Metric logged'
    });
  } catch (error) {
    console.error('Log metric error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log metric'
    });
  }
});

/**
 * POST /api/v1/experiments/:id/complete
 * Complete experiment
 */
router.post('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { results } = req.body;

    const experiment = await tracker.completeExperiment(id, results);

    res.json({
      success: true,
      data: experiment
    });
  } catch (error) {
    console.error('Complete experiment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete experiment'
    });
  }
});

/**
 * GET /api/v1/experiments/:id/compare
 * Compare experiments
 */
router.get('/compare', async (req, res) => {
  try {
    const { ids } = req.query;

    if (!ids) {
      return res.status(400).json({
        success: false,
        error: 'ids query parameter is required'
      });
    }

    const experimentIds = ids.split(',');
    const comparison = await tracker.compareExperiments(experimentIds);

    res.json({
      success: true,
      data: comparison
    });
  } catch (error) {
    console.error('Compare error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to compare experiments'
    });
  }
});

/**
 * POST /api/v1/predictions
 * Log prediction for tracking
 */
router.post('/predictions', async (req, res) => {
  try {
    const {
      experimentId,
      modelId,
      symbol,
      predictedDirection,
      actualDirection,
      predictedPrice,
      actualPrice,
      features
    } = req.body;

    const prediction = await tracker.logPrediction({
      experimentId,
      modelId,
      symbol,
      predictedDirection,
      actualDirection,
      predictedPrice,
      actualPrice,
      features
    });

    res.status(201).json({
      success: true,
      data: prediction
    });
  } catch (error) {
    console.error('Log prediction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log prediction'
    });
  }
});

/**
 * GET /api/v1/accuracy/:modelId
 * Get model accuracy
 */
router.get('/accuracy/:modelId', async (req, res) => {
  try {
    const { modelId } = req.params;
    const { symbol, startDate, endDate } = req.query;

    const accuracy = await tracker.calculateAccuracy(modelId, {
      symbol,
      startDate,
      endDate
    });

    res.json({
      success: true,
      data: accuracy
    });
  } catch (error) {
    console.error('Accuracy error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate accuracy'
    });
  }
});

/**
 * GET /api/v1/performance/:modelId
 * Get performance over time
 */
router.get('/performance/:modelId', async (req, res) => {
  try {
    const { modelId } = req.params;
    const { metric = 'accuracy', window = 7, startDate, endDate } = req.query;

    const performance = await tracker.getPerformanceOverTime(modelId, {
      metric,
      window: parseInt(window),
      startDate,
      endDate
    });

    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    console.error('Performance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get performance'
    });
  }
});

/**
 * GET /api/v1/leaderboard
 * Get model leaderboard
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const { metric = 'accuracy', minPredictions = 50, limit = 10 } = req.query;

    const leaderboard = await tracker.getLeaderboard({
      metric,
      minPredictions: parseInt(minPredictions),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get leaderboard'
    });
  }
});

/**
 * POST /api/v1/datasets
 * Log dataset version
 */
router.post('/datasets', authMiddleware, async (req, res) => {
  try {
    const { name, version, description, size, recordCount, features, source, statistics } = req.body;

    if (!name || !version) {
      return res.status(400).json({
        success: false,
        error: 'name and version are required'
      });
    }

    const dataset = await tracker.logDatasetVersion({
      name,
      version,
      description,
      size,
      recordCount,
      features,
      source,
      statistics
    });

    res.status(201).json({
      success: true,
      data: dataset
    });
  } catch (error) {
    console.error('Log dataset error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v1/datasets/:name
 * Get dataset versions
 */
router.get('/datasets/:name', async (req, res) => {
  try {
    const { name } = req.params;

    const versions = await tracker.getDatasetVersions(name);

    res.json({
      success: true,
      data: versions
    });
  } catch (error) {
    console.error('Get datasets error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get datasets'
    });
  }
});

module.exports = router;
