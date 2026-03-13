/**
 * Base interface for all autonomous agents.
 *
 * Agents should:
 * - read from external sources or warehouse
 * - write normalized outputs to the warehouse
 * - emit structured run logs (status/metrics)
 */
class BaseAgent {
  constructor({ name }) {
    this.name = name;
  }

  // eslint-disable-next-line class-methods-use-this
  async run(_context) {
    throw new Error('Agent.run() not implemented');
  }
}

module.exports = { BaseAgent };

