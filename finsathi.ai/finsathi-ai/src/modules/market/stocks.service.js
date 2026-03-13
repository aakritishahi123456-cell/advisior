const { StocksRepository } = require('./stocks.repository');

class StocksService {
  static async getBySymbol(symbol) {
    return StocksRepository.getCompanyWithLatestPrice(symbol);
  }
}

module.exports = { StocksService };

