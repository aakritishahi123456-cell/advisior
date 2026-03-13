const { StocksService } = require('./stocks.service');

class StocksController {
  static async getBySymbol(req, res, next) {
    try {
      const symbol = String(req.params.symbol || '').toUpperCase();
      const data = await StocksService.getBySymbol(symbol);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = { StocksController };

