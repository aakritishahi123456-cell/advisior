const { Router } = require('express');
const { QueueController } = require('../controllers/queueController');

const queueRoutes = Router();

// GET /api/v1/queues/stats
queueRoutes.get('/stats', QueueController.stats);

module.exports = { queueRoutes };

