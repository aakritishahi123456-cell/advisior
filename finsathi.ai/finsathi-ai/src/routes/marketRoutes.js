const { Router } = require('express');
const { MarketController } = require('../controllers/marketController');

const marketRoutes = Router();

// GET /api/v1/market/trends
marketRoutes.get('/trends', MarketController.getTrends);

// POST /api/v1/market/collect
marketRoutes.post('/collect', MarketController.collectNow);

module.exports = { marketRoutes };

