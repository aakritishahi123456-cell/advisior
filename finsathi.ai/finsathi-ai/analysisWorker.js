require('dotenv').config();

const { createWorker } = require('./src/queue/workerFactory');
const { AgentOrchestrator } = require('./src/orchestrator/agentOrchestrator');
const { logger } = require('./src/config/logger');

async function main() {
  const orchestrator = new AgentOrchestrator({ logger });

  createWorker({
    queueName: process.env.ANALYSIS_QUEUE_NAME || 'analysisQueue',
    concurrency: Number(process.env.ANALYSIS_WORKER_CONCURRENCY || 1),
    processor: async ({ job }) => {
      if (job.name !== 'run_analysis') return null;
      const agentKey = job.data?.agentKey || 'financial';
      return orchestrator.runAgent(agentKey, { logger });
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

