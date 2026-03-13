const { PortfolioService } = require('./portfolio.service');

class PortfolioController {
  static async recommend(req, res, next) {
    try {
      const { riskTolerance, horizonDays } = req.body || {};
      const data = await PortfolioService.recommend({ riskTolerance, horizonDays });
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = { PortfolioController };

