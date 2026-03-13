/**
 * FinSathi AI - Agent Orchestrator Routes
 * API endpoints for AI agent orchestration
 */

const express = require('express');
const AgentOrchestrator = require('../services/agentOrchestrator');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const orchestrator = new AgentOrchestrator();

/**
 * POST /api/v1/orchestrator/run
 * Run complete AI workflow
 * Requires authentication
 */
router.post('/run', authMiddleware, async (req, res) => {
  try {
    const { symbols } = req.body;

    res.status(202).json({
      success: true,
      message: 'AI workflow started'
    });

    const result = await orchestrator.runWorkflow({
      symbols: symbols || ['NABIL', 'NICA', 'SCB', 'MBL', 'BOK'],
      userId: req.user.id
    });

    console.log('[Orchestrator] Workflow result:', result);
  } catch (error) {
    console.error('Workflow error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v1/orchestrator/status
 * Get orchestrator status
 */
router.get('/status', (req, res) => {
  try {
    const status = orchestrator.getStatus();

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get status'
    });
  }
});

/**
 * POST /api/v1/orchestrator/schedule
 * Schedule recurring workflow
 * Requires authentication
 */
router.post('/schedule', authMiddleware, async (req, res) => {
  try {
    const { cron, symbols, name } = req.body;

    if (!cron) {
      return res.status(400).json({
        success: false,
        error: 'cron expression is required'
      });
    }

    const scheduleId = orchestrator.scheduleWorkflow(cron, {
      symbols: symbols || ['NABIL', 'NICA', 'SCB'],
      userId: req.user.id,
      name: name || 'Scheduled Workflow'
    });

    res.status(201).json({
      success: true,
      data: { scheduleId },
      message: 'Workflow scheduled'
    });
  } catch (error) {
    console.error('Schedule error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/v1/orchestrator/scheduler/start
 * Start workflow scheduler
 * Requires authentication
 */
router.post('/scheduler/start', authMiddleware, (req, res) => {
  try {
    orchestrator.startScheduler();

    res.json({
      success: true,
      message: 'Scheduler started'
    });
  } catch (error) {
    console.error('Scheduler start error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start scheduler'
    });
  }
});

/**
 * POST /api/v1/orchestrator/scheduler/stop
 * Stop workflow scheduler
 * Requires authentication
 */
router.post('/scheduler/stop', authMiddleware, (req, res) => {
  try {
    orchestrator.stopScheduler();

    res.json({
      success: true,
      message: 'Scheduler stopped'
    });
  } catch (error) {
    console.error('Scheduler stop error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop scheduler'
    });
  }
});

/**
 * GET /api/v1/orchestrator/schedules
 * Get scheduled workflows
 */
router.get('/schedules', (req, res) => {
  try {
    const status = orchestrator.getStatus();

    res.json({
      success: true,
      data: status.schedules
    });
  } catch (error) {
    console.error('Schedules error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get schedules'
    });
  }
});

/**
 * DELETE /api/v1/orchestrator/schedules/:id
 * Delete scheduled workflow
 * Requires authentication
 */
router.delete('/schedules/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;

    if (orchestrator.schedules.has(id)) {
      orchestrator.schedules.delete(id);
      
      return res.json({
        success: true,
        message: 'Schedule deleted'
      });
    }

    res.status(404).json({
      success: false,
      error: 'Schedule not found'
    });
  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete schedule'
    });
  }
});

/**
 * GET /api/v1/orchestrator/insights
 * Get aggregated AI insights
 * Requires authentication
 */
router.get('/insights', authMiddleware, async (req, res) => {
  try {
    // Run quick workflow for insights
    const result = await orchestrator.runWorkflow({
      symbols: ['NABIL', 'NICA', 'SCB', 'MBL', 'BOK'],
      userId: req.user.id,
      generateReport: false
    });

    res.json({
      success: true,
      data: result.results
    });
  } catch (error) {
    console.error('Insights error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get insights'
    });
  }
});

/**
 * GET /api/v1/orchestrator/agents
 * Get available agents
 */
router.get('/agents', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        name: 'research',
        description: 'Market research and analysis',
        status: 'ready'
      },
      {
        name: 'prediction',
        description: 'Stock price predictions',
        status: 'ready'
      },
      {
        name: 'news',
        description: 'Financial news analysis',
        status: 'ready'
      },
      {
        name: 'portfolio',
        description: 'Portfolio optimization',
        status: 'ready'
      }
    ]
  });
});

/**
 * POST /api/v1/orchestrator/agents/:agent/run
 * Run specific agent
 * Requires authentication
 */
router.post('/agents/:agent/run', authMiddleware, async (req, res) => {
  try {
    const { agent } = req.params;
    const { symbols } = req.body;

    if (!orchestrator.agents[agent]) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    let result;
    switch (agent) {
      case 'research':
        result = await orchestrator.runResearchAgent(symbols);
        break;
      case 'prediction':
        result = await orchestrator.runPredictionAgent(symbols);
        break;
      case 'news':
        result = await orchestrator.runNewsAgent();
        break;
      case 'portfolio':
        result = await orchestrator.runPortfolioOptimizer(symbols, {});
        break;
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Agent run error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
