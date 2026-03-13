const { MarketService } = require('./market.service');

class MarketController {
  static async getTrends(req, res, next) {
    try {
      const data = await MarketService.getTrends();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = { MarketController };

