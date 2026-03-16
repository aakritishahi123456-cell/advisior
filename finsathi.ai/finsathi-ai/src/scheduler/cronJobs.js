const cron = require('node-cron');
const { logger } = require('../config/logger');
const { AgentOrchestrator } = require('../orchestrator/agentOrchestrator');
const { getPrisma } = require('../database/prismaClient');
const { runFundamentalsScraper } = require('../pipelines/fundamentals/fundamentalsScraper');
const { CorporateActionsAgent } = require('../agents/corporateActionsAgent');
const { SentimentAgent } = require('../agents/sentimentAgent');
const { NewsService } = require('../services/newsService');
const { enqueueAnalysis, enqueueFundamentals, enqueueMarketData, enqueueNews } = require('../queue/enqueue');
const { MarketService } = require('../services/marketService');

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
  const queueEnabled = process.env.QUEUE_ENABLED === 'true';

  const orchestrator = new AgentOrchestrator({ logger });
  const corporateActionsAgent = new CorporateActionsAgent({ logger });
  const sentimentAgent = new SentimentAgent({ logger });
  const newsService = new NewsService({ logger });
  const marketService = new MarketService({ logger });

  // Automation layer (Nepal time). Default weekdays: Sun–Thu (0–4).
  // 9:00 AM — Market Data Agent
  cron.schedule(
    process.env.MARKET_DATA_CRON || '0 9 * * 0-4',
    withErrorHandling({
      jobName: 'Market Data Agent',
      fn: async () => (queueEnabled ? enqueueMarketData() : orchestrator.runAgent('market', { logger })),
    }),
    { timezone: tz }
  );

  // Every 5 minutes — NEPSE Auto Data Collector (prices + companies)
  // Disable by setting `NEPSE_COLLECTOR_ENABLED=false`.
  if (process.env.NEPSE_COLLECTOR_ENABLED !== 'false') {
    cron.schedule(
      process.env.NEPSE_COLLECTOR_CRON || '*/5 * * * *',
      withErrorHandling({
        jobName: 'NEPSE Auto Collector',
        fn: async () => {
          if (queueEnabled) {
            await enqueueMarketData({ force: true });
            return;
          }
          await marketService.collectAndStoreDailyData();
        },
      }),
      { timezone: tz }
    );
  }

  // 4:00 PM — Financial Analysis Agent
  cron.schedule(
    process.env.FIN_ANALYSIS_CRON || '0 16 * * 0-4',
    withErrorHandling({
      jobName: 'Financial Analysis Agent',
      fn: async () => (queueEnabled ? enqueueAnalysis({ agentKey: 'financial' }) : orchestrator.runAgent('financial', { logger })),
    }),
    { timezone: tz }
  );

  // 5:00 PM — Portfolio Intelligence Agent
  cron.schedule(
    process.env.PORTFOLIO_CRON || '0 17 * * 0-4',
    withErrorHandling({
      jobName: 'Portfolio Intelligence Agent',
      fn: async () => (queueEnabled ? enqueueAnalysis({ agentKey: 'portfolio' }) : orchestrator.runAgent('portfolio', { logger })),
    }),
    { timezone: tz }
  );

  // 6:00 PM — Insight Generation Agent
  cron.schedule(
    process.env.INSIGHTS_CRON || '0 18 * * 0-4',
    withErrorHandling({
      jobName: 'Insight Generation Agent',
      fn: async () => (queueEnabled ? enqueueAnalysis({ agentKey: 'insight' }) : orchestrator.runAgent('insight', { logger })),
    }),
    { timezone: tz }
  );

  // Optional strategy simulation job (keep existing default if set)
  cron.schedule(
    process.env.STRATEGY_CRON || '30 18 * * 0-4',
    withErrorHandling({
      jobName: 'Strategy Simulation Agent',
      fn: async () => (queueEnabled ? enqueueAnalysis({ agentKey: 'strategy' }) : orchestrator.runAgent('strategy', { logger })),
    }),
    { timezone: tz }
  );

  // 2:30 AM — Fundamentals Scraper (off-peak)
  cron.schedule(
    process.env.FUNDAMENTALS_CRON || '30 2 * * 0-6',
    withErrorHandling({
      jobName: 'Fundamentals Scraper',
      fn: async () => {
        if (queueEnabled) {
          await enqueueFundamentals();
          return;
        }
        const prisma = getPrisma();
        await runFundamentalsScraper({ prisma, logger });
      },
    }),
    { timezone: tz }
  );

  // 3:15 AM — Corporate Actions Agent (off-peak)
  cron.schedule(
    process.env.CORPORATE_ACTIONS_CRON || '15 3 * * 0-6',
    withErrorHandling({
      jobName: 'Corporate Actions Agent',
      fn: async () => corporateActionsAgent.run({ logger }),
    }),
    { timezone: tz }
  );

  // Every 30 minutes — News collection + sentiment classification
  cron.schedule(
    process.env.NEWS_SENTIMENT_CRON || '*/30 * * * *',
    withErrorHandling({
      jobName: 'News Sentiment Agent',
      fn: async () => {
        if (queueEnabled) {
          await enqueueNews();
          return;
        }
        const prisma = getPrisma();
        const items = await newsService.collectLatest();
        await newsService.storeArticles({ prisma, articles: items });
        await sentimentAgent.run({ logger });
      },
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
