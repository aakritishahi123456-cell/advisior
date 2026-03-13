const { MarketAgent } = require('../agents/marketAgent');
const { getPrisma } = require('../database/prismaClient');

const marketAgent = new MarketAgent();

class MarketController {
  static async collectNow(req, res, next) {
    try {
      const result = await marketAgent.run();
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async getTrends(req, res, next) {
    try {
      // Placeholder: return latest market snapshot (counts + latest date).
      const prisma = getPrisma();
      const companies = await prisma.company.count();
      const latest = await prisma.stockPrice.findFirst({ orderBy: { date: 'desc' } });
      res.json({
        success: true,
        data: {
          companies,
          latestDate: latest?.date?.toISOString?.() || null,
          note: 'Implement indicators (MA/volatility/momentum) here.',
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = { MarketController };
