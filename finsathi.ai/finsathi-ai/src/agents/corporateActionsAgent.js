const { getPrisma } = require('../database/prismaClient');
const { CorporateActionsService } = require('../services/corporateActionsService');

class CorporateActionsAgent {
  constructor({ logger } = {}) {
    this.name = 'CorporateActionsAgent';
    this.logger = logger;
    this.service = new CorporateActionsService({ logger });
  }

  async run({ logger } = {}) {
    const log = logger || this.logger;
    const prisma = getPrisma();

    log?.info?.({ agent: this.name }, 'Corporate actions agent started');
    const result = await this.service.scrapeAndStore({ prisma });
    log?.info?.({ agent: this.name, ...result }, 'Corporate actions agent finished');

    return { ok: result.failed === 0, ...result };
  }
}

module.exports = { CorporateActionsAgent };

