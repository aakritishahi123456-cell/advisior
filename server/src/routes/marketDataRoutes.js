/**
 * FinSathi AI - Market Data API Routes
 * Express routes for market data endpoints
 */

const express = require('express');
const MarketDataController = require('../controllers/marketDataController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const controller = new MarketDataController();

// Middleware for request logging
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Market Data Endpoints

/**
 * GET /api/v1/market/snapshot
 * Get current market snapshot
 * Public endpoint
 */
router.get('/snapshot', controller.getMarketSnapshot.bind(controller));

/**
 * GET /api/v1/market/stocks
 * Get list of all stocks with current prices
 * Query params: page, limit, sector, search
 * Public endpoint
 */
router.get('/stocks', controller.getStockList.bind(controller));

/**
 * GET /api/v1/market/stocks/:symbol
 * Get detailed stock information
 * Public endpoint
 */
router.get('/stocks/:symbol', controller.getStockDetails.bind(controller));

/**
 * GET /api/v1/market/stocks/:symbol/history
 * Get stock price history
 * Query params: period (1W, 1M, 3M, 6M, 1Y), startDate, endDate
 * Public endpoint
 */
router.get('/stocks/:symbol/history', controller.getStockHistory.bind(controller));

/**
 * GET /api/v1/market/indicators
 * Get market indicators (indices, etc.)
 * Public endpoint
 */
router.get('/indicators', controller.getMarketIndicators.bind(controller));

/**
 * GET /api/v1/market/movers
 * Get top gainers and losers
 * Query params: limit (default: 10)
 * Public endpoint
 */
router.get('/movers', controller.getTopMovers.bind(controller));

/**
 * GET /api/v1/market/news
 * Get market news
 * Query params: page, limit, category
 * Public endpoint
 */
router.get('/news', controller.getMarketNews.bind(controller));

/**
 * GET /api/v1/market/search
 * Search stocks by symbol or name
 * Query params: q (required), limit
 * Public endpoint
 */
router.get('/search', controller.searchStocks.bind(controller));

/**
 * GET /api/v1/market/sectors
 * Get sector analysis
 * Public endpoint
 */
router.get('/sectors', controller.getSectorAnalysis.bind(controller));

// Pipeline Management Endpoints (Admin only)

/**
 * POST /api/v1/market/pipeline/trigger
 * Trigger manual pipeline execution
 * Requires authentication
 */
router.post('/pipeline/trigger', authMiddleware, controller.triggerPipeline.bind(controller));

/**
 * GET /api/v1/market/pipeline/status
 * Get pipeline status and statistics
 * Requires authentication
 */
router.get('/pipeline/status', authMiddleware, controller.getPipelineStatus.bind(controller));

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Market Data API Error:', error);
  
  if (error.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json({
      success: false,
      error: 'Database error',
      message: 'Invalid request parameters'
    });
  }
  
  if (error.name === 'PrismaClientUnknownRequestError') {
    return res.status(500).json({
      success: false,
      error: 'Database connection error',
      message: 'Unable to connect to database'
    });
  }
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

module.exports = router;
