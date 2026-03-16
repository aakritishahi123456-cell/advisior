const { NepseService } = require('./nepseService');
const { logger } = require('../config/logger');

class MarketService {
  constructor({ logger: injectedLogger } = {}) {
    this.logger = injectedLogger || logger;
    this.nepse = new NepseService({ logger: this.logger });
  }

  async collectAndStoreDailyData({ businessDateISO } = {}) {
    return this.nepse.collectAndStoreDailyData({ businessDateISO });
  }
}

module.exports = { MarketService };

