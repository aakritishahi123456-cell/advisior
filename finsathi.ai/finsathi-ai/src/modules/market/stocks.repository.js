const { prisma } = require('../../config/prisma');

class StocksRepository {
  static async getCompanyWithLatestPrice(symbol) {
    const company = await prisma.company.findUnique({
      where: { symbol },
      include: {
        prices: {
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
    });
    return company;
  }
}

module.exports = { StocksRepository };

