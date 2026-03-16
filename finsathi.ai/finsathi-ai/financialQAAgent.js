require('dotenv').config();

const { FinancialQAAgent } = require('./src/agents/financialQAAgent');
const { logger } = require('./src/config/logger');
const { getPrisma } = require('./src/database/prismaClient');

async function main() {
  const prisma = getPrisma();
  try {
    const question = process.argv.slice(2).join(' ').trim();
    if (!question) {
      // eslint-disable-next-line no-console
      console.error('Usage: node financialQAAgent.js "<question>"');
      process.exit(2);
    }
    const agent = new FinancialQAAgent({ logger });
    const out = await agent.answer({ question, symbol: process.env.DOCS_QA_SYMBOL || null });
    // eslint-disable-next-line no-console
    console.log(out.formatted || JSON.stringify(out, null, 2));
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

