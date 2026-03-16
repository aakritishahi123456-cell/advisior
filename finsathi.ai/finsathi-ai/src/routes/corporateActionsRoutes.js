const { Router } = require('express');
const { CorporateActionsController } = require('../controllers/corporateActionsController');

const corporateActionsRoutes = Router();

// GET /api/v1/corporate-actions/:symbol
corporateActionsRoutes.get('/:symbol', CorporateActionsController.getBySymbol);

module.exports = { corporateActionsRoutes };

