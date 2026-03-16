const { PortfolioService } = require('../services/portfolioService');

class PortfolioController {
  static async recommend(req, res, next) {
    try {
      const { riskTolerance, horizonDays, investmentAmount } = req.body || {};
      const data = await PortfolioService.recommend({ riskTolerance, horizonDays, investmentAmount });
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = { PortfolioController };
