require('dotenv').config();

const { getPrisma } = require('./src/database/prismaClient');
const { logger } = require('./src/config/logger');
const { runFundamentalsScraper } = require('./src/pipelines/fundamentals/fundamentalsScraper');

async function main() {
  const prisma = getPrisma();

  try {
    const symbols = process.env.FUNDAMENTALS_SYMBOLS
      ? process.env.FUNDAMENTALS_SYMBOLS.split(',').map((s) => s.trim()).filter(Boolean)
      : null;

    await runFundamentalsScraper({ prisma, logger, symbols });
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
