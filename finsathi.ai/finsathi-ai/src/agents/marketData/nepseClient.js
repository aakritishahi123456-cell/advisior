const axios = require('axios');

class NepseClient {
  constructor() {
    this.http = axios.create({
      timeout: 30_000,
      headers: {
        'User-Agent': 'FinSathiAI/1.0 (NEPSE Market Data Agent)',
      },
    });
  }

  // Placeholder methods — implement NEPSE endpoints/scraping here.
  // eslint-disable-next-line class-methods-use-this
  async fetchCompanies() {
    return [];
  }

  // eslint-disable-next-line class-methods-use-this
  async fetchDailyPrices() {
    return [];
  }
}

module.exports = { NepseClient };

