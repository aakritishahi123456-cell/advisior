const { getPrisma } = require('../database/prismaClient');
const { logger } = require('../config/logger');
const { NewsService } = require('../services/newsService');

async function run() {
  const prisma = getPrisma();
  const service = new NewsService({ logger });

  const items = await service.collectLatest();
  const stored = await service.storeArticles({ prisma, articles: items });

  logger.info({ collected: items.length, stored }, 'News collection completed');
  return { collected: items.length, stored };
}

module.exports = { run };

