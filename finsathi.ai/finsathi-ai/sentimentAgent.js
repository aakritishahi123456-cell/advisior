require('dotenv').config();

const { logger } = require('./src/config/logger');
const { SentimentAgent } = require('./src/agents/sentimentAgent');
const { getPrisma } = require('./src/database/prismaClient');

async function main() {
  const prisma = getPrisma();
  try {
    const agent = new SentimentAgent({ logger });
    await agent.run({ logger });
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

