const { AgentOrchestrator } = require('../orchestrator/agentOrchestrator');
const { logger } = require('../config/logger');

class OrchestratorController {
  static async runAgent(req, res, next) {
    try {
      const agent = String(req.query.agent || '');
      const orchestrator = new AgentOrchestrator({ logger });
      const result = await orchestrator.runAgent(agent, { logger });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async runCycle(req, res, next) {
    try {
      const orchestrator = new AgentOrchestrator({ logger });
      const continueOnError = String(req.query.continueOnError || 'true') !== 'false';
      const runStrategy = String(req.query.runStrategy || 'true') !== 'false';
      const result = await orchestrator.runCycle({ continueOnError, runStrategy, logger });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = { OrchestratorController };

