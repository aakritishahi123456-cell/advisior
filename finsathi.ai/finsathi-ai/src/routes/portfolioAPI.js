const { Router } = require('express');
const { PortfolioController } = require('../controllers/portfolioController');

const portfolioAPI = Router();

// POST /api/v1/portfolio/optimize
portfolioAPI.post('/optimize', PortfolioController.recommend);

// Back-compat: POST /api/v1/portfolio/recommend
portfolioAPI.post('/recommend', PortfolioController.recommend);

module.exports = { portfolioAPI };

