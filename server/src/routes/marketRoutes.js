/**
 * FinSathi AI - Market Intelligence Routes
 * High-performance real-time market data APIs
 */

const express = require('express');
const MarketIntelligenceService = require('../services/marketIntelligenceService');

const router = express.Router();
const marketService = new MarketIntelligenceService();

// Performance middleware
const trackPerformance = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    res.set('X-Response-Time', duration);
    if (duration > 200) {
      console.warn(`[PERF] ${req.path} took ${duration}ms`);
    }
  });
  next();
};

router.use(trackPerformance);

/**
 * GET /api/v1/market/overview
 * Get quick market overview
 * Public - No authentication required
 */
router.get('/overview', async (req, res) => {
  try {
    const overview = await marketService.getMarketOverview();
    
    res.json({
      success: true,
      data: overview,
      cached: false
    });
  } catch (error) {
    console.error('Overview error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get market overview'
    });
  }
});

/**
 * GET /api/v1/market/trends
 * Get comprehensive market trends
 * Public - No authentication required
 */
router.get('/trends', async (req, res) => {
  try {
    const { sector, days = 7 } = req.query;
    
    const trends = await marketService.getMarketTrends({
      sector,
      days: parseInt(days)
    });
    
    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('Trends error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get market trends'
    });
  }
});

/**
 * GET /api/v1/market/signals
 * Get trading signals
 * Public - No authentication required
 */
router.get('/signals', async (req, res) => {
  try {
    const { symbols, strategy = 'TECHNICAL' } = req.query;
    
    const symbolsList = symbols ? symbols.split(',') : undefined;
    
    const signals = await marketService.getTradingSignals({
      symbols: symbolsList,
      strategy
    });
    
    res.json({
      success: true,
      data: signals
    });
  } catch (error) {
    console.error('Signals error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get trading signals'
    });
  }
});

/**
 * GET /api/v1/market/signals/:symbol
 * Get signal for specific symbol
 * Public - No authentication required
 */
router.get('/signals/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    const signals = await marketService.getTradingSignals({
      symbols: [symbol.toUpperCase()]
    });
    
    if (signals.signals.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No signal available for this symbol'
      });
    }
    
    res.json({
      success: true,
      data: signals.signals[0]
    });
  } catch (error) {
    console.error('Signal error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get signal'
    });
  }
});

/**
 * GET /api/v1/market/predictions
 * Get market predictions
 * Public - No authentication required
 */
router.get('/predictions', async (req, res) => {
  try {
    const { symbols, horizon = 5 } = req.query;
    
    const symbolsList = symbols ? symbols.split(',') : undefined;
    
    const predictions = await marketService.getPredictions({
      symbols: symbolsList,
      horizon: parseInt(horizon)
    });
    
    res.json({
      success: true,
      data: predictions
    });
  } catch (error) {
    console.error('Predictions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get predictions'
    });
  }
});

/**
 * GET /api/v1/market/predictions/:symbol
 * Get prediction for specific symbol
 * Public - No authentication required
 */
router.get('/predictions/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { horizon = 5 } = req.query;
    
    const predictions = await marketService.getPredictions({
      symbols: [symbol.toUpperCase()],
      horizon: parseInt(horizon)
    });
    
    if (!predictions.predictions[0]?.available) {
      return res.status(404).json({
        success: false,
        error: 'Prediction not available for this symbol'
      });
    }
    
    res.json({
      success: true,
      data: predictions.predictions[0]
    });
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get prediction'
    });
  }
});

/**
 * GET /api/v1/market/sectors
 * Get sector performance
 * Public - No authentication required
 */
router.get('/sectors', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const trends = await marketService.getMarketTrends({ days: parseInt(days) });
    
    res.json({
      success: true,
      data: trends.sectors
    });
  } catch (error) {
    console.error('Sectors error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sector data'
    });
  }
});

/**
 * GET /api/v1/market/movers
 * Get top gainers and losers
 * Public - No authentication required
 */
router.get('/movers', async (req, res) => {
  try {
    const { days = 1, type = 'all' } = req.query;
    
    const trends = await marketService.getMarketTrends({ days: parseInt(days) });
    
    let result = trends.topMovers;
    if (type === 'gainers') {
      result = { gainers: trends.topMovers.gainers };
    } else if (type === 'losers') {
      result = { losers: trends.topMovers.losers };
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Movers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get movers'
    });
  }
});

/**
 * GET /api/v1/market/breadth
 * Get market breadth
 * Public - No authentication required
 */
router.get('/breadth', async (req, res) => {
  try {
    const { days = 1 } = req.query;
    
    const trends = await marketService.getMarketTrends({ days: parseInt(days) });
    
    res.json({
      success: true,
      data: trends.breadth
    });
  } catch (error) {
    console.error('Breadth error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get market breadth'
    });
  }
});

/**
 * POST /api/v1/market/cache/clear
 * Clear market data cache
 * Requires authentication (admin)
 */
router.post('/cache/clear', async (req, res) => {
  try {
    const { pattern } = req.body;
    
    marketService.clearCache(pattern);
    
    res.json({
      success: true,
      message: 'Cache cleared'
    });
  } catch (error) {
    console.error('Cache clear error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache'
    });
  }
});

/**
 * GET /api/v1/market/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
