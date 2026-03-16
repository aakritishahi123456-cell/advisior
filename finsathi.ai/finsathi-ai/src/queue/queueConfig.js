let Redis;
let bullmq;

try {
  // eslint-disable-next-line global-require
  Redis = require('ioredis');
  // eslint-disable-next-line global-require
  bullmq = require('bullmq');
} catch (e) {
  Redis = null;
  bullmq = null;
}

const { logger } = require('../config/logger');

function requireDeps() {
  if (!Redis || !bullmq) {
    throw new Error('Missing queue dependencies. Install `bullmq` and `ioredis`.');
  }
}

function buildRedisConnection() {
  requireDeps();

  const url = process.env.REDIS_URL;
  if (url) return new Redis(url, { maxRetriesPerRequest: null });

  return new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT || 6379),
    username: process.env.REDIS_USERNAME || undefined,
    password: process.env.REDIS_PASSWORD || undefined,
    db: Number(process.env.REDIS_DB || 0),
    maxRetriesPerRequest: null,
  });
}

function defaultJobOptions() {
  return {
    attempts: Number(process.env.QUEUE_ATTEMPTS || 5),
    backoff: {
      type: 'exponential',
      delay: Number(process.env.QUEUE_BACKOFF_MS || 2_000),
    },
    removeOnComplete: { count: Number(process.env.QUEUE_REMOVE_ON_COMPLETE || 1000) },
    removeOnFail: { count: Number(process.env.QUEUE_REMOVE_ON_FAIL || 5000) },
  };
}

function getQueueNames() {
  return {
    marketDataQueue: process.env.MARKET_QUEUE_NAME || 'marketDataQueue',
    fundamentalsQueue: process.env.FUNDAMENTALS_QUEUE_NAME || 'fundamentalsQueue',
    newsQueue: process.env.NEWS_QUEUE_NAME || 'newsQueue',
    analysisQueue: process.env.ANALYSIS_QUEUE_NAME || 'analysisQueue',
    deadLetterQueue: process.env.DLQ_NAME || 'deadLetterQueue',
  };
}

function createQueues({ connection } = {}) {
  requireDeps();
  const { Queue } = bullmq;
  const conn = connection || buildRedisConnection();
  const names = getQueueNames();
  const opts = { connection: conn, defaultJobOptions: defaultJobOptions() };

  const queues = {
    connection: conn,
    names,
    marketDataQueue: new Queue(names.marketDataQueue, opts),
    fundamentalsQueue: new Queue(names.fundamentalsQueue, opts),
    newsQueue: new Queue(names.newsQueue, opts),
    analysisQueue: new Queue(names.analysisQueue, opts),
    deadLetterQueue: new Queue(names.deadLetterQueue, opts),
  };

  return queues;
}

async function enqueueOnce(queue, { name, jobId, data, opts } = {}) {
  const jobName = name || 'job';
  const id = jobId || undefined;
  return queue.add(jobName, data || {}, { jobId: id, ...(opts || {}) });
}

async function getQueueStats(queue) {
  const counts = await queue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed', 'paused');
  return counts;
}

function queueLogger() {
  return {
    info: (meta, msg) => logger.info(meta, msg),
    warn: (meta, msg) => logger.warn(meta, msg),
    error: (meta, msg) => logger.error(meta, msg),
  };
}

module.exports = {
  buildRedisConnection,
  createQueues,
  defaultJobOptions,
  enqueueOnce,
  getQueueNames,
  getQueueStats,
  queueLogger,
};

