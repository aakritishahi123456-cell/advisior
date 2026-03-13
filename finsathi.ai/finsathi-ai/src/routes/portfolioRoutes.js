const { Router } = require('express');
const { PortfolioController } = require('../controllers/portfolioController');

const portfolioRoutes = Router();

// POST /api/v1/portfolio/recommend
portfolioRoutes.post('/recommend', PortfolioController.recommend);

module.exports = { portfolioRoutes };

