const cron = require('node-cron');
const { agents } = require('../agents/registry');
const { prisma } = require('../config/prisma');
const { logger } = require('../config/logger');

function buildContext() {
  return { prisma, logger };
}

function startScheduler() {
  const tz = process.env.SCHEDULER_TZ || 'Asia/Kathmandu';

  // Market Data Agent — every trading day (placeholder schedule)
  cron.schedule(process.env.MARKET_DATA_CRON || '20 15 * * 0-4', async () => {
    await agents.marketData.run(buildContext());
  }, { timezone: tz });

  // Financial Analysis Agent — daily
  cron.schedule(process.env.FIN_ANALYSIS_CRON || '30 16 * * 0-4', async () => {
    await agents.financialAnalysis.run(buildContext());
  }, { timezone: tz });

  // Insight Generation Agent — daily summary
  cron.schedule(process.env.INSIGHTS_CRON || '0 18 * * 0-4', async () => {
    await agents.insightGeneration.run(buildContext());
  }, { timezone: tz });

  logger.info({ tz }, 'Scheduler started');
}

module.exports = { startScheduler };

