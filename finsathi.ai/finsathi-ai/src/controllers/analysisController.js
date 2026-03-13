const { AnalysisService } = require('../services/analysisService');

class AnalysisController {
  static async undervalued(req, res, next) {
    try {
      const maxPe = req.query.maxPe ? Number(req.query.maxPe) : 15;
      const data = await AnalysisService.findUndervalued({ maxPeRatio: maxPe });
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = { AnalysisController };

