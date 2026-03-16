const { createQueues, enqueueOnce, getQueueNames } = require('./queueConfig');

function stableDailyJobId(prefix) {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${prefix}:${y}-${m}-${day}`;
}

async function enqueueMarketData({ force = false } = {}) {
  const queues = createQueues();
  const jobId = force ? undefined : stableDailyJobId('market');
  const job = await enqueueOnce(queues.marketDataQueue, { name: 'collect_market_data', jobId, data: {} });
  return { id: job.id, queue: getQueueNames().marketDataQueue };
}

async function enqueueFundamentals({ symbols } = {}) {
  const queues = createQueues();
  const job = await enqueueOnce(queues.fundamentalsQueue, { name: 'scrape_fundamentals', data: { symbols: symbols || null } });
  return { id: job.id, queue: getQueueNames().fundamentalsQueue };
}

async function enqueueNews({ force = false } = {}) {
  const queues = createQueues();
  const jobId = force ? undefined : stableDailyJobId('news-sentiment');
  const job = await enqueueOnce(queues.newsQueue, { name: 'collect_and_analyze', jobId, data: {} });
  return { id: job.id, queue: getQueueNames().newsQueue };
}

async function enqueueAnalysis({ agentKey } = {}) {
  const queues = createQueues();
  const job = await enqueueOnce(queues.analysisQueue, { name: 'run_analysis', data: { agentKey: agentKey || 'financial' } });
  return { id: job.id, queue: getQueueNames().analysisQueue };
}

module.exports = {
  enqueueAnalysis,
  enqueueFundamentals,
  enqueueMarketData,
  enqueueNews,
};

