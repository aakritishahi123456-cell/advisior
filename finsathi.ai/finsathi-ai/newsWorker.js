require('dotenv').config();

const { createWorker } = require('./src/queue/workerFactory');
const { getPrisma } = require('./src/database/prismaClient');
const { logger } = require('./src/config/logger');
const { NewsService } = require('./src/services/newsService');
const { SentimentAgent } = require('./src/agents/sentimentAgent');

async function main() {
  const service = new NewsService({ logger });
  const agent = new SentimentAgent({ logger });

  createWorker({
    queueName: process.env.NEWS_QUEUE_NAME || 'newsQueue',
    concurrency: Number(process.env.NEWS_WORKER_CONCURRENCY || 1),
    processor: async ({ job }) => {
      if (job.name !== 'collect_and_analyze') return null;
      const prisma = getPrisma();

      const items = await service.collectLatest();
      await service.storeArticles({ prisma, articles: items });
      return agent.run({ logger });
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

