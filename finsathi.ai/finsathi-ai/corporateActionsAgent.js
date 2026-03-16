require('dotenv').config();

const { CorporateActionsAgent } = require('./src/agents/corporateActionsAgent');
const { logger } = require('./src/config/logger');

async function main() {
  const agent = new CorporateActionsAgent({ logger });
  await agent.run({ logger });
}

module.exports = { main };

if (require.main === module) {
  main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
}

