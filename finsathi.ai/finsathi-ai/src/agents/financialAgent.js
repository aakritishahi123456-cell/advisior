const { AnalysisService } = require('../services/analysisService');
const { getPrisma } = require('../database/prismaClient');

class FinancialAgent {
  constructor() {
    this.name = 'FinancialAgent';
  }

  async run({ logger } = {}) {
    logger?.info?.({ agent: this.name }, 'Computing financial metrics');
    const prisma = getPrisma();
    const startedAt = new Date();

    const pipeline = await prisma.pipelineLog.create({
      data: {
        pipelineType: 'FINANCIAL_ANALYSIS_AGENT',
        status: 'RUNNING',
        startedAt,
        details: {
          thresholds: {
            UNDERVALUED_PE_MAX: process.env.UNDERVALUED_PE_MAX || null,
            UNDERVALUED_MIN_ROE: process.env.UNDERVALUED_MIN_ROE || null,
            HIGH_GROWTH_REVENUE_PCT: process.env.HIGH_GROWTH_REVENUE_PCT || null,
            HIGH_RISK_DEBT_TO_EQUITY: process.env.HIGH_RISK_DEBT_TO_EQUITY || null,
            HIGH_RISK_DEBT_RATIO: process.env.HIGH_RISK_DEBT_RATIO || null,
          },
        },
      },
    });

    try {
      const result = await AnalysisService.runDailyAnalysis();

      await prisma.pipelineLog.update({
        where: { id: pipeline.id },
        data: {
          status: result.errors?.length ? 'COMPLETED_WITH_ERRORS' : 'COMPLETED',
          completedAt: new Date(),
          metrics: {
            analyzed: result.analyzed,
            stored: result.stored,
            errors: result.errors?.length || 0,
          },
          details: {
            ...(pipeline.details || {}),
            top: result.top,
          },
        },
      });

      logger?.info?.(
        { agent: this.name, pipelineId: pipeline.id, analyzed: result.analyzed, stored: result.stored },
        'Financial analysis agent finished'
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
      logger?.error?.({ agent: this.name, pipelineId: pipeline.id, err: err?.message }, 'Financial analysis agent failed');
      throw err;
    }
  }
}

module.exports = { FinancialAgent };
