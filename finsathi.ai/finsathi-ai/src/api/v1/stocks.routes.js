const { Router } = require('express');
const { StocksController } = require('../../modules/market/stocks.controller');

const stocksRoutes = Router();

// GET /api/v1/stocks/:symbol
stocksRoutes.get('/:symbol', StocksController.getBySymbol);

module.exports = { stocksRoutes };

