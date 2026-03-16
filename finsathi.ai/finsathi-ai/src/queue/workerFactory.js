const { createQueues } = require('./queueConfig');
const { logger } = require('../config/logger');

let bullmq;
try {
  // eslint-disable-next-line global-require
  bullmq = require('bullmq');
} catch {
  bullmq = null;
}

function requireBullmq() {
  if (!bullmq) throw new Error('Missing `bullmq`. Install dependencies and restart.');
}

async function toDlq({ dlq, originalQueue, job, err, extra }) {
  try {
    await dlq.add(
      'dead_letter',
      {
        fromQueue: originalQueue,
        job: {
          id: job?.id,
          name: job?.name,
          data: job?.data,
          opts: job?.opts,
          attemptsMade: job?.attemptsMade,
          timestamp: job?.timestamp,
        },
        error: {
          message: err?.message || String(err),
          stack: err?.stack,
          failedReason: job?.failedReason,
          stacktrace: job?.stacktrace,
        },
        extra: extra || null,
        ts: new Date().toISOString(),
      },
      { removeOnComplete: { count: 10_000 }, removeOnFail: { count: 10_000 } }
    );
  } catch (e) {
    logger.error({ err: e?.message }, 'Failed to write to DLQ');
  }
}

function createWorker({
  queueName,
  concurrency = Number(process.env.QUEUE_CONCURRENCY || 2),
  processor,
  onStart,
  onStop,
} = {}) {
  requireBullmq();
  if (!queueName) throw new Error('createWorker requires queueName');
  if (typeof processor !== 'function') throw new Error('createWorker requires processor(job)');

  const { Worker, QueueEvents } = bullmq;
  const queues = createQueues();

  const dlq = queues.deadLetterQueue;
  const events = new QueueEvents(queueName, { connection: queues.connection });

  const worker = new Worker(
    queueName,
    async (job) => processor({ job, queues }),
    { connection: queues.connection, concurrency }
  );

  worker.on('ready', async () => {
    logger.info({ queue: queueName, concurrency }, 'Worker ready');
    if (typeof onStart === 'function') await onStart({ worker, queues });
  });

  worker.on('failed', async (job, err) => {
    const attempts = job?.opts?.attempts || 1;
    const attemptsMade = job?.attemptsMade || 0;
    const exhausted = attemptsMade >= attempts;

    logger.error(
      { queue: queueName, jobId: job?.id, name: job?.name, attemptsMade, attempts, exhausted, err: err?.message },
      'Job failed'
    );

    if (exhausted) {
      await toDlq({ dlq, originalQueue: queueName, job, err });
    }
  });

  worker.on('completed', (job) => {
    logger.info({ queue: queueName, jobId: job?.id, name: job?.name }, 'Job completed');
  });

  events.on('error', (e) => {
    logger.error({ queue: queueName, err: e?.message }, 'QueueEvents error');
  });

  const shutdown = async () => {
    logger.info({ queue: queueName }, 'Worker shutting down');
    try {
      if (typeof onStop === 'function') await onStop({ worker, queues });
      await worker.close();
      await events.close();
      await queues.connection.quit();
    } catch (e) {
      logger.error({ queue: queueName, err: e?.message }, 'Worker shutdown error');
    } finally {
      process.exit(0);
    }
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  return { worker, events, queues };
}

module.exports = { createWorker };

