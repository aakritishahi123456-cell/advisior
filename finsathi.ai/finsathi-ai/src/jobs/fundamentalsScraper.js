const { getPrisma } = require('../database/prismaClient');
const { logger } = require('../config/logger');
const { runFundamentalsScraper } = require('../pipelines/fundamentals/fundamentalsScraper');

async function run() {
  const prisma = getPrisma();
  const symbols = process.env.FUNDAMENTALS_SYMBOLS
    ? process.env.FUNDAMENTALS_SYMBOLS.split(',').map((s) => s.trim()).filter(Boolean)
    : null;

  await runFundamentalsScraper({ prisma, logger, symbols });
}

module.exports = { run };

