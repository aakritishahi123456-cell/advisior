const { BaseAgent } = require('../baseAgent');

class StrategySimulationAgent extends BaseAgent {
  constructor() {
    super({ name: 'StrategySimulationAgent' });
  }

  async run(context) {
    const { logger } = context;
    logger.info({ agent: this.name }, 'Running strategy simulation agent');

    // Placeholder: backtest strategies, store BacktestRun.
    return { ok: true, runs: 0, timestamp: new Date().toISOString() };
  }
}

module.exports = { StrategySimulationAgent };

