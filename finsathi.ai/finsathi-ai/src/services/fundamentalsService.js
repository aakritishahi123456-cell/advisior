const { getPrisma } = require('../database/prismaClient');
const { logger } = require('../config/logger');
const { runFundamentalsScraper } = require('../pipelines/fundamentals/fundamentalsScraper');

class FundamentalsService {
  static async updateDaily({ symbols } = {}) {
    const prisma = getPrisma();
    return runFundamentalsScraper({ prisma, logger, symbols });
  }
}

module.exports = { FundamentalsService };

