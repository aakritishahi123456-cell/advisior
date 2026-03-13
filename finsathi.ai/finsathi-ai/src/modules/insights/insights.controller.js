const { InsightsService } = require('./insights.service');

class InsightsController {
  static async getDailySummary(req, res, next) {
    try {
      const data = await InsightsService.getDailySummary();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = { InsightsController };

