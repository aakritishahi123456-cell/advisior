const { Router } = require('express');
const { MarketController } = require('../../modules/market/market.controller');

const marketRoutes = Router();

// GET /api/v1/market/trends
marketRoutes.get('/trends', MarketController.getTrends);

module.exports = { marketRoutes };

