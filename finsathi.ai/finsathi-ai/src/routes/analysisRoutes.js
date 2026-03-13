const { Router } = require('express');
const { AnalysisController } = require('../controllers/analysisController');

const analysisRoutes = Router();

// GET /api/v1/analysis/undervalued?maxPe=15
analysisRoutes.get('/undervalued', AnalysisController.undervalued);

module.exports = { analysisRoutes };

