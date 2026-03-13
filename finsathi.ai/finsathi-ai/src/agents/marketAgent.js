const { NepseService } = require('../services/nepseService');
const { getPrisma } = require('../database/prismaClient');

class MarketAgent {
  constructor({ logger } = {}) {
    this.name = 'MarketAgent';
    this.logger = logger;
    this.nepse = new NepseService({ logger });
  }

  async run({ logger } = {}) {
    const log = logger || this.logger;
    const prisma = getPrisma();

    const startedAt = new Date();
    const pipeline = await prisma.pipelineLog.create({
      data: {
        pipelineType: 'MARKET_DATA_AGENT',
        status: 'RUNNING',
        startedAt,
        details: {
          baseUrl: process.env.NEPSE_API_BASE_URL || null,
          endpoints: {
            companies: process.env.NEPSE_COMPANIES_PATH || null,
            pricesDaily: process.env.NEPSE_DAILY_PRICES_PATH || null,
            indices: process.env.NEPSE_INDICES_PATH || null,
          },
        },
      },
    });

    try {
      log?.info?.({ agent: this.name, pipelineId: pipeline.id }, 'Market agent started');

      const result = await this.nepse.collectAndStoreDailyData();

      await prisma.pipelineLog.update({
        where: { id: pipeline.id },
        data: {
          status: result.errors?.length ? 'COMPLETED_WITH_ERRORS' : 'COMPLETED',
          completedAt: new Date(),
          metrics: {
            companiesFetched: result.companiesFetched,
            companiesStored: result.companiesStored,
            pricesFetched: result.pricesFetched,
            pricesStored: result.pricesStored,
            indicesFetched: result.indicesFetched,
            indicesStored: result.indicesStored,
            anomalies: result.anomalies,
          },
          details: {
            ...((pipeline.details || {}) && pipeline.details),
            errors: result.errors || [],
            businessDateISO: result.businessDateISO,
          },
        },
      });

      log?.info?.(
        {
          agent: this.name,
          pipelineId: pipeline.id,
          businessDateISO: result.businessDateISO,
          anomalies: result.anomalies,
          errors: result.errors?.length || 0,
        },
        'Market agent finished'
      );

      return result;
    } catch (err) {
      await prisma.pipelineLog.update({
        where: { id: pipeline.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          details: {
            ...((pipeline.details || {}) && pipeline.details),
            error: err?.message || String(err),
          },
        },
      });
      log?.error?.({ agent: this.name, pipelineId: pipeline.id, err: err?.message }, 'Market agent failed');
      throw err;
    }
  }
}

module.exports = { MarketAgent };
