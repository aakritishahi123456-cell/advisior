const { getPrisma } = require('../database/prismaClient');
const { CorporateActionsService } = require('../services/corporateActionsService');

const service = new CorporateActionsService();

class CorporateActionsController {
  static async getBySymbol(req, res, next) {
    try {
      const prisma = getPrisma();
      const data = await service.getCorporateActionsBySymbol({ prisma, symbol: req.params.symbol });
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = { CorporateActionsController };

