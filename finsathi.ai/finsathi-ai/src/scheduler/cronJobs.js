const cron = require('node-cron');
const { logger } = require('../config/logger');
const { AgentOrchestrator } = require('../orchestrator/agentOrchestrator');

function withErrorHandling({ jobName, fn }) {
  let inFlight = false;

  return async () => {
    if (inFlight) {
      logger.warn({ job: jobName }, 'Job skipped (previous run still in progress)');
      return;
    }

    inFlight = true;
    const started = Date.now();
    logger.info({ job: jobName }, 'Job started');

    try {
      await fn();
      logger.info({ job: jobName, ms: Date.now() - started }, 'Job completed');
    } catch (err) {
      logger.error(
        { job: jobName, err: err?.message, stack: err?.stack, ms: Date.now() - started },
        'Job failed'
      );
    } finally {
      inFlight = false;
    }
  };
}

function startCronJobs() {
  const tz = process.env.SCHEDULER_TZ || 'Asia/Kathmandu';

  const orchestrator = new AgentOrchestrator({ logger });

  // Automation layer (Nepal time). Default weekdays: Sun–Thu (0–4).
  // 9:00 AM — Market Data Agent
  cron.schedule(
    process.env.MARKET_DATA_CRON || '0 9 * * 0-4',
    withErrorHandling({
      jobName: 'Market Data Agent',
      fn: async () => orchestrator.runAgent('market', { logger }),
    }),
    { timezone: tz }
  );

  // 4:00 PM — Financial Analysis Agent
  cron.schedule(
    process.env.FIN_ANALYSIS_CRON || '0 16 * * 0-4',
    withErrorHandling({
      jobName: 'Financial Analysis Agent',
      fn: async () => orchestrator.runAgent('financial', { logger }),
    }),
    { timezone: tz }
  );

  // 5:00 PM — Portfolio Intelligence Agent
  cron.schedule(
    process.env.PORTFOLIO_CRON || '0 17 * * 0-4',
    withErrorHandling({
      jobName: 'Portfolio Intelligence Agent',
      fn: async () => orchestrator.runAgent('portfolio', { logger }),
    }),
    { timezone: tz }
  );

  // 6:00 PM — Insight Generation Agent
  cron.schedule(
    process.env.INSIGHTS_CRON || '0 18 * * 0-4',
    withErrorHandling({
      jobName: 'Insight Generation Agent',
      fn: async () => orchestrator.runAgent('insight', { logger }),
    }),
    { timezone: tz }
  );

  // Optional strategy simulation job (keep existing default if set)
  cron.schedule(
    process.env.STRATEGY_CRON || '30 18 * * 0-4',
    withErrorHandling({
      jobName: 'Strategy Simulation Agent',
      fn: async () => orchestrator.runAgent('strategy', { logger }),
    }),
    { timezone: tz }
  );

  // Optional: run the full pipeline in-order via one cron (disabled unless set)
  if (process.env.AUTONOMOUS_CYCLE_CRON) {
    cron.schedule(
      process.env.AUTONOMOUS_CYCLE_CRON,
      withErrorHandling({
        jobName: 'Autonomous Agent Cycle',
        fn: async () =>
          orchestrator.runCycle({
            continueOnError: process.env.AUTONOMOUS_CYCLE_CONTINUE_ON_ERROR !== 'false',
            runStrategy: process.env.AUTONOMOUS_CYCLE_RUN_STRATEGY !== 'false',
            logger,
          }),
      }),
      { timezone: tz }
    );
  }

  logger.info({ tz }, 'Cron jobs started');
}

module.exports = { startCronJobs };
