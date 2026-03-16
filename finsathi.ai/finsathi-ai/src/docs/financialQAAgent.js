require('dotenv').config();

const { FinancialQAAgent } = require('../agents/financialQAAgent');
const { logger } = require('../config/logger');

async function main() {
  const question = process.argv.slice(2).join(' ').trim();
  if (!question) {
    // eslint-disable-next-line no-console
    console.error('Usage: node src/docs/financialQAAgent.js "<question>"');
    process.exit(2);
  }

  const agent = new FinancialQAAgent({ logger });
  const out = await agent.answer({ question, symbol: process.env.DOCS_QA_SYMBOL || null });
  // eslint-disable-next-line no-console
  console.log(out.formatted || JSON.stringify(out, null, 2));
}

module.exports = { main };

if (require.main === module) {
  main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
}

