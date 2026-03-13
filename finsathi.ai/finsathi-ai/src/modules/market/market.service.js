const { MarketRepository } = require('./market.repository');

class MarketService {
  static async getTrends() {
    // Placeholder: compute MA/volatility/momentum from prices.
    return MarketRepository.getMarketSnapshot();
  }
}

module.exports = { MarketService };

