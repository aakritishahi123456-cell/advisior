require('dotenv').config();

const { createApp } = require('./app');
const { logger } = require('./config/logger');
const { startCronJobs } = require('./scheduler/cronJobs');

async function main() {
  const port = Number(process.env.PORT || 5050);
  const app = createApp();

  const server = app.listen(port, () => {
    logger.info({ port }, 'API server listening');
  });

  // Optional: start autonomous agents on the API server process
  if (process.env.SCHEDULER_ENABLED !== 'false') {
    startCronJobs();
  }

  const shutdown = async () => {
    logger.info('Shutting down...');
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
