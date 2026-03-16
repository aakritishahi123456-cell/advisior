require('dotenv').config();

const { logger } = require('./src/config/logger');
const { MarketService } = require('./src/services/marketService');

async function main() {
  const service = new MarketService({ logger });
  const out = await service.collectAndStoreDailyData();
  logger.info(out, 'NEPSE auto collector finished');
}

module.exports = { main };

if (require.main === module) {
  main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
}

