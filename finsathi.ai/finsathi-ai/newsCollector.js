require('dotenv').config();

const { getPrisma } = require('./src/database/prismaClient');
const { logger } = require('./src/config/logger');
const { NewsService } = require('./src/services/newsService');

async function main() {
  const prisma = getPrisma();
  const service = new NewsService({ logger });

  try {
    const items = await service.collectLatest();
    const stored = await service.storeArticles({ prisma, articles: items });
    logger.info({ collected: items.length, stored }, 'News collector finished');
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = { main };

if (require.main === module) {
  main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
}

