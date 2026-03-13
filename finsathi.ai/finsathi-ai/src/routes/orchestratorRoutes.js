const { Router } = require('express');
const { OrchestratorController } = require('../controllers/orchestratorController');

const orchestratorRoutes = Router();

// POST /api/v1/orchestrator/agent?agent=market|financial|portfolio|insight|strategy
orchestratorRoutes.post('/agent', OrchestratorController.runAgent);

// POST /api/v1/orchestrator/cycle?continueOnError=true&runStrategy=true
orchestratorRoutes.post('/cycle', OrchestratorController.runCycle);

module.exports = { orchestratorRoutes };

