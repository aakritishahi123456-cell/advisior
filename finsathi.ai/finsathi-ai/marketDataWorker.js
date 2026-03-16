require('dotenv').config();

// Backward/explicit naming: marketDataWorker.js
// Runs jobs from `marketDataQueue`.
const { createWorker } = require('./src/queue/workerFactory');
const { MarketAgent } = require('./src/agents/marketAgent');

async function main() {
  const agent = new MarketAgent();

  createWorker({
    queueName: process.env.MARKET_QUEUE_NAME || process.env.MARKET_DATA_QUEUE_NAME || 'marketDataQueue',
    concurrency: Number(process.env.MARKET_WORKER_CONCURRENCY || 1),
    processor: async ({ job }) => {
      if (job.name !== 'collect_market_data') return null;
      return agent.run();
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

