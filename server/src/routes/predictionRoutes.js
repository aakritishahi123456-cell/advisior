/**
 * FinSathi AI - Stock Prediction Routes
 * API endpoints for ML-based stock predictions
 */

const express = require('express');
const StockPredictionPipeline = require('../services/stockPredictionService');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const predictionPipeline = new StockPredictionPipeline();

/**
 * POST /api/v1/prediction/train
 * Train prediction models
 * Requires authentication
 */
router.post('/train', authMiddleware, async (req, res) => {
  try {
    const { symbols } = req.body;
    
    if (!symbols || !Array.isArray(symbols)) {
      return res.status(400).json({
        success: false,
        error: 'symbols array is required'
      });
    }

    res.status(202).json({
      success: true,
      message: 'Training started in background'
    });

    // Run training in background
    setImmediate(async () => {
      try {
        const { X, y } = await predictionPipeline.prepareTrainingData(symbols);
        const { X: normalized, scaler } = predictionPipeline.normalizeFeatures(X);
        
        predictionPipeline.scaler = scaler;
        
        await predictionPipeline.trainLogisticRegression(normalized, y);
        await predictionPipeline.trainRandomForest(normalized, y);
        
        console.log('[Prediction] Models trained successfully');
      } catch (error) {
        console.error('[Prediction] Training failed:', error);
      }
    });
  } catch (error) {
    console.error('Error starting training:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start training'
    });
  }
});

/**
 * GET /api/v1/prediction/:symbol
 * Get prediction for a specific stock
 * Requires authentication
 */
router.get('/:symbol', authMiddleware, async (req, res) => {
  try {
    const { symbol } = req.params;
    const { horizon = 5 } = req.query;

    // Check if models are trained
    if (!predictionPipeline.models.logisticRegression) {
      return res.status(400).json({
        success: false,
        error: 'Models not trained yet. Call /prediction/train first.'
      });
    }

    const prediction = await predictionPipeline.predict(symbol.toUpperCase());

    res.json({
      success: true,
      data: {
        ...prediction,
        horizon: parseInt(horizon)
      }
    });
  } catch (error) {
    console.error('Error making prediction:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to make prediction'
    });
  }
});

/**
 * GET /api/v1/prediction/:symbol/features
 * Get generated features for a stock
 * Requires authentication
 */
router.get('/:symbol/features', authMiddleware, async (req, res) => {
  try {
    const { symbol } = req.params;
    const { days = 90 } = req.query;

    const features = await predictionPipeline.generateFeatures(
      symbol.toUpperCase(), 
      parseInt(days)
    );

    res.json({
      success: true,
      data: {
        symbol,
        featureCount: features.X.length,
        features: features.X.slice(-5) // Last 5 samples
      }
    });
  } catch (error) {
    console.error('Error generating features:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate features'
    });
  }
});

/**
 * POST /api/v1/prediction/evaluate
 * Evaluate model performance
 * Requires authentication
 */
router.post('/evaluate', authMiddleware, async (req, res) => {
  try {
    const { symbols } = req.body;
    
    if (!symbols || !Array.isArray(symbols)) {
      return res.status(400).json({
        success: false,
        error: 'symbols array is required'
      });
    }

    const metrics = await predictionPipeline.evaluate(symbols);

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error evaluating model:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to evaluate model'
    });
  }
});

/**
 * GET /api/v1/prediction/batch
 * Get predictions for multiple stocks
 * Requires authentication
 */
router.get('/batch', authMiddleware, async (req, res) => {
  try {
    const { symbols } = req.query;
    
    if (!symbols) {
      return res.status(400).json({
        success: false,
        error: 'symbols query parameter is required'
      });
    }

    const symbolList = symbols.split(',');
    const predictions = [];

    for (const symbol of symbolList) {
      try {
        const prediction = await predictionPipeline.predict(symbol.trim().toUpperCase());
        predictions.push({
          symbol: symbol.trim().toUpperCase(),
          ...prediction.prediction,
          success: true
        });
      } catch (error) {
        predictions.push({
          symbol: symbol.trim().toUpperCase(),
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      data: {
        predictions,
        summary: {
          total: predictions.length,
          successful: predictions.filter(p => p.success).length,
          up: predictions.filter(p => p.success && p.direction === 'UP').length,
          down: predictions.filter(p => p.success && p.direction === 'DOWN').length
        }
      }
    });
  } catch (error) {
    console.error('Error making batch predictions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to make batch predictions'
    });
  }
});

/**
 * GET /api/v1/prediction/market/sentiment
 * Get market-wide prediction sentiment
 * Requires authentication
 */
router.get('/market/sentiment', authMiddleware, async (req, res) => {
  try {
    const { symbols = 'NABIL,NICA,SCB,MBL,ACL' } = req.query;
    const symbolList = symbols.split(',');
    
    const predictions = [];
    for (const symbol of symbolList) {
      try {
        const prediction = await predictionPipeline.predict(symbol.trim().toUpperCase());
        predictions.push(prediction);
      } catch (error) {
        // Skip failed predictions
      }
    }

    const avgProbability = predictions.reduce((sum, p) => sum + p.prediction.probability, 0) / predictions.length;
    
    const sentiment = {
      score: (avgProbability - 0.5) * 2, // -1 to 1
      label: avgProbability > 0.55 ? 'BULLISH' : 
             avgProbability < 0.45 ? 'BEARISH' : 'NEUTRAL',
      confidence: Math.abs(avgProbability - 0.5) * 2,
      predictions: predictions.length,
      upCount: predictions.filter(p => p.prediction.direction === 'UP').length,
      downCount: predictions.filter(p => p.prediction.direction === 'DOWN').length
    };

    res.json({
      success: true,
      data: sentiment
    });
  } catch (error) {
    console.error('Error getting market sentiment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get market sentiment'
    });
  }
});

/**
 * GET /api/vrediction/status
 * Get model status
 */
router.get('/status', (req, res) => {
  const models = predictionPipeline.models;
  
  res.json({
    success: true,
    data: {
      trained: {
        logisticRegression: !!models.logisticRegression,
        randomForest: !!models.randomForest
      },
      featureConfig: predictionPipeline.featureConfig,
      scalerAvailable: !!predictionPipeline.scaler
    }
  });
});

module.exports = router;
