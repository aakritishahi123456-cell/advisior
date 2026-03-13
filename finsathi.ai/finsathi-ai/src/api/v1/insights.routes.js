const { Router } = require('express');
const { InsightsController } = require('../../modules/insights/insights.controller');

const insightsRoutes = Router();

// GET /api/v1/insights/daily
insightsRoutes.get('/daily', InsightsController.getDailySummary);

module.exports = { insightsRoutes };

