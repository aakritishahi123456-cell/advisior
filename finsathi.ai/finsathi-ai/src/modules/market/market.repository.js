const { prisma } = require('../../config/prisma');

class MarketRepository {
  static async getMarketSnapshot() {
    // Placeholder: return aggregate metrics from StockPrice.
    const companies = await prisma.company.count();
    return {
      companies,
      lastUpdated: new Date().toISOString(),
    };
  }
}

module.exports = { MarketRepository };

