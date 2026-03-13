const { BaseAgent } = require('../baseAgent');
const { getOpenAIClient } = require('../../config/openai');

class InsightGenerationAgent extends BaseAgent {
  constructor() {
    super({ name: 'InsightGenerationAgent' });
  }

  async run(context) {
    const { logger } = context;
    logger.info({ agent: this.name }, 'Running insight generation agent');

    // Placeholder: generate daily narrative summaries from warehouse data.
    // Keep LLM calls behind getOpenAIClient().
    if (process.env.INSIGHTS_LLM_ENABLED === 'true') {
      const client = getOpenAIClient();
      void client; // integrate prompt + structured output later
    }

    return { ok: true, reports: 0, timestamp: new Date().toISOString() };
  }
}

module.exports = { InsightGenerationAgent };

