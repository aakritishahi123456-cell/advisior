require('dotenv').config();

const { createWorker } = require('./src/queue/workerFactory');
const { getPrisma } = require('./src/database/prismaClient');
const { logger } = require('./src/config/logger');
const { runFundamentalsScraper } = require('./src/pipelines/fundamentals/fundamentalsScraper');

async function main() {
  createWorker({
    queueName: process.env.FUNDAMENTALS_QUEUE_NAME || 'fundamentalsQueue',
    concurrency: Number(process.env.FUNDAMENTALS_WORKER_CONCURRENCY || 1),
    processor: async ({ job }) => {
      if (job.name !== 'scrape_fundamentals') return null;
      const prisma = getPrisma();
      const symbols = job.data?.symbols || null;
      return runFundamentalsScraper({ prisma, logger, symbols });
    },
  });
}

module.exports = { main };

if (require.main === module) {
  main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
}

