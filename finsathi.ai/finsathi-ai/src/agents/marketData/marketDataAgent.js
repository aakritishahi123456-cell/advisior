const { BaseAgent } = require('../baseAgent');
const { NepseClient } = require('./nepseClient');

class MarketDataAgent extends BaseAgent {
  constructor() {
    super({ name: 'MarketDataAgent' });
    this.client = new NepseClient();
  }

  async run(context) {
    // Placeholder: fetch NEPSE data, normalize, persist.
    // Implementations should write to: Company, StockPrice.
    const { prisma, logger } = context;
    logger.info({ agent: this.name }, 'Running market data agent');

    // Example: return a structured run result
    return {
      ok: true,
      fetched: 0,
      stored: 0,
      source: 'NEPSE',
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = { MarketDataAgent };

