const { PortfolioService } = require('../services/portfolioService');
const { getPrisma } = require('../database/prismaClient');

class PortfolioAgent {
  constructor() {
    this.name = 'PortfolioAgent';
  }

  async run({ logger } = {}) {
    logger?.info?.({ agent: this.name }, 'Generating portfolio intelligence');
    const prisma = getPrisma();
    const startedAt = new Date();

    const pipeline = await prisma.pipelineLog.create({
      data: {
        pipelineType: 'PORTFOLIO_INTELLIGENCE_AGENT',
        status: 'RUNNING',
        startedAt,
        details: {
          lookbackDays: process.env.PORTFOLIO_LOOKBACK_DAYS || null,
          universeLimit: process.env.PORTFOLIO_UNIVERSE_LIMIT || null,
          minObservations: process.env.PORTFOLIO_MIN_OBSERVATIONS || null,
          rfAnnual: process.env.PORTFOLIO_RF_ANNUAL || null,
        },
      },
    });

    try {
      const riskTolerance = process.env.PORTFOLIO_RISK_TOLERANCE || 'moderate';
      const horizonDays = Number(process.env.PORTFOLIO_HORIZON_DAYS || 180);
      const result = await PortfolioService.recommend({ riskTolerance, horizonDays });

      await prisma.pipelineLog.update({
        where: { id: pipeline.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          metrics: {
            holdings: result.allocation?.length || 0,
            expectedReturnAnnual: result.portfolioMetrics?.expectedReturnAnnual || null,
            volatilityAnnual: result.portfolioMetrics?.volatilityAnnual || null,
            sharpe: result.portfolioMetrics?.sharpe || null,
            riskScore: result.portfolioMetrics?.riskScore || null,
          },
          details: {
            ...(pipeline.details || {}),
            diversification: result.diversification,
          },
        },
      });

      logger?.info?.(
        { agent: this.name, pipelineId: pipeline.id, holdings: result.allocation?.length || 0 },
        'Portfolio agent finished'
      );

      return result;
    } catch (err) {
      await prisma.pipelineLog.update({
        where: { id: pipeline.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          details: { ...(pipeline.details || {}), error: err?.message || String(err) },
        },
      });
      logger?.error?.({ agent: this.name, pipelineId: pipeline.id, err: err?.message }, 'Portfolio agent failed');
      throw err;
    }
  }
}

module.exports = { PortfolioAgent };
