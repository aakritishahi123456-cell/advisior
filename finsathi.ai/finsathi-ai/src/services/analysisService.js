const { getPrisma } = require('../database/prismaClient');

class AnalysisService {
  static toNumber(value) {
    if (value === null || value === undefined) return null;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  }

  static startOfDayUTC(date) {
    const d = date instanceof Date ? date : new Date(date);
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }

  static buildSignals({
    peRatio,
    roe,
    debtToEquity,
    revenueGrowth,
    thresholds,
    flags,
    inputs,
  }) {
    return {
      thresholds,
      inputs,
      metrics: {
        peRatio,
        roe,
        debtToEquity,
        revenueGrowth,
      },
      flags,
    };
  }

  // Computes and stores EPS/ROE/Debt-to-equity/P-E and classification flags.
  static async computeMetricsForSymbol({ symbol, asOfDate }) {
    const prisma = getPrisma();

    const company = await prisma.company.findUnique({
      where: { symbol },
      include: {
        reports: {
          orderBy: [{ fiscalYear: 'desc' }],
          take: 2, // latest + previous for growth calculation
        },
        prices: {
          orderBy: [{ date: 'desc' }],
          take: 1,
        },
      },
    });
    if (!company) return null;

    const latestReport = company.reports?.[0] || null;
    const prevReport = company.reports?.[1] || null;
    const latestPrice = company.prices?.[0] || null;

    const effectiveAsOfDate = this.startOfDayUTC(
      asOfDate || latestPrice?.date || new Date()
    );

    const thresholds = {
      undervaluedPeMax: Number(process.env.UNDERVALUED_PE_MAX || 15),
      undervaluedMinRoe: Number(process.env.UNDERVALUED_MIN_ROE || 10),
      highGrowthRevenuePct: Number(process.env.HIGH_GROWTH_REVENUE_PCT || 20),
      highRiskDebtToEquity: Number(process.env.HIGH_RISK_DEBT_TO_EQUITY || 2),
      highRiskDebtRatio: Number(process.env.HIGH_RISK_DEBT_RATIO || 70),
    };

    // Metric calculations (best-effort; can be null if inputs missing)
    const netProfit = this.toNumber(latestReport?.netProfit);
    const totalEquity = this.toNumber(latestReport?.totalEquity);
    const totalDebt = this.toNumber(latestReport?.totalDebt);
    const totalAssets = this.toNumber(latestReport?.totalAssets);
    const revenue = this.toNumber(latestReport?.revenue);
    const prevRevenue = this.toNumber(prevReport?.revenue);

    const sharesOutstanding = company.sharesOutstanding ? Number(company.sharesOutstanding) : null;

    const eps = netProfit !== null && sharesOutstanding && sharesOutstanding > 0
      ? netProfit / sharesOutstanding
      : null;

    const roe = netProfit !== null && totalEquity !== null && totalEquity !== 0
      ? (netProfit / totalEquity) * 100
      : null;

    const debtToEquity = totalDebt !== null && totalEquity !== null && totalEquity !== 0
      ? totalDebt / totalEquity
      : null;

    const debtRatio = totalDebt !== null && totalAssets !== null && totalAssets !== 0
      ? (totalDebt / totalAssets) * 100
      : null;

    const revenueGrowth = revenue !== null && prevRevenue !== null && prevRevenue !== 0
      ? ((revenue - prevRevenue) / prevRevenue) * 100
      : null;

    const close = this.toNumber(latestPrice?.close);
    const peRatio = close !== null && eps !== null && eps !== 0 ? close / eps : null;

    const flags = {
      isUndervalued:
        peRatio !== null &&
        Number.isFinite(thresholds.undervaluedPeMax) &&
        peRatio <= thresholds.undervaluedPeMax &&
        (roe === null || roe >= thresholds.undervaluedMinRoe),
      isHighGrowth:
        revenueGrowth !== null &&
        Number.isFinite(thresholds.highGrowthRevenuePct) &&
        revenueGrowth >= thresholds.highGrowthRevenuePct,
      isHighRisk:
        (debtToEquity !== null &&
          Number.isFinite(thresholds.highRiskDebtToEquity) &&
          debtToEquity >= thresholds.highRiskDebtToEquity) ||
        (debtRatio !== null &&
          Number.isFinite(thresholds.highRiskDebtRatio) &&
          debtRatio >= thresholds.highRiskDebtRatio) ||
        (netProfit !== null && netProfit < 0),
    };

    const row = await prisma.financialMetric.upsert({
      where: { symbol_asOfDate: { symbol, asOfDate: effectiveAsOfDate } },
      create: {
        companyId: company.id,
        symbol,
        asOfDate: effectiveAsOfDate,
        eps: eps === null ? null : String(eps),
        peRatio: peRatio === null ? null : String(peRatio),
        roe: roe === null ? null : String(roe),
        debtRatio: debtRatio === null ? null : String(debtRatio),
        debtToEquity: debtToEquity === null ? null : String(debtToEquity),
        revenueGrowth: revenueGrowth === null ? null : String(revenueGrowth),
        isUndervalued: flags.isUndervalued,
        isHighGrowth: flags.isHighGrowth,
        isHighRisk: flags.isHighRisk,
        signals: this.buildSignals({
          peRatio,
          roe,
          debtToEquity,
          revenueGrowth,
          thresholds,
          flags,
          inputs: {
            latestReportFiscalYear: latestReport?.fiscalYear || null,
            latestPriceDate: latestPrice?.date ? latestPrice.date.toISOString() : null,
            sharesOutstanding: company.sharesOutstanding ? String(company.sharesOutstanding) : null,
          },
        }),
      },
      update: {
        eps: eps === null ? null : String(eps),
        peRatio: peRatio === null ? null : String(peRatio),
        roe: roe === null ? null : String(roe),
        debtRatio: debtRatio === null ? null : String(debtRatio),
        debtToEquity: debtToEquity === null ? null : String(debtToEquity),
        revenueGrowth: revenueGrowth === null ? null : String(revenueGrowth),
        isUndervalued: flags.isUndervalued,
        isHighGrowth: flags.isHighGrowth,
        isHighRisk: flags.isHighRisk,
        signals: this.buildSignals({
          peRatio,
          roe,
          debtToEquity,
          revenueGrowth,
          thresholds,
          flags,
          inputs: {
            latestReportFiscalYear: latestReport?.fiscalYear || null,
            latestPriceDate: latestPrice?.date ? latestPrice.date.toISOString() : null,
            sharesOutstanding: company.sharesOutstanding ? String(company.sharesOutstanding) : null,
          },
        }),
      },
    });

    return row;
  }

  // Simple undervaluation scan placeholder.
  static async findUndervalued({ maxPeRatio = 15 } = {}) {
    const prisma = getPrisma();
    return prisma.financialMetric.findMany({
      where: {
        isUndervalued: true,
        peRatio: { lte: String(maxPeRatio) },
      },
      orderBy: [{ peRatio: 'asc' }, { roe: 'desc' }],
      take: 50,
    });
  }

  static async runDailyAnalysis({ limit } = {}) {
    const prisma = getPrisma();
    const take = limit ? Number(limit) : Number(process.env.FIN_ANALYSIS_LIMIT || 500);

    const companies = await prisma.company.findMany({
      select: { symbol: true },
      orderBy: { symbol: 'asc' },
      take,
    });

    const results = {
      analyzed: 0,
      stored: 0,
      errors: [],
      top: {
        undervalued: [],
        highGrowth: [],
        highRisk: [],
      },
      timestamp: new Date().toISOString(),
    };

    for (const c of companies) {
      try {
        const row = await this.computeMetricsForSymbol({
          symbol: c.symbol,
          asOfDate: new Date(),
        });
        results.analyzed += 1;
        if (row) results.stored += 1;
      } catch (e) {
        results.errors.push({ symbol: c.symbol, message: e?.message || String(e) });
      }
    }

    // Pull top lists for structured JSON output
    results.top.undervalued = await prisma.financialMetric.findMany({
      where: { isUndervalued: true },
      orderBy: [{ peRatio: 'asc' }],
      take: 10,
      select: { symbol: true, peRatio: true, roe: true, asOfDate: true },
    });

    results.top.highGrowth = await prisma.financialMetric.findMany({
      where: { isHighGrowth: true },
      orderBy: [{ revenueGrowth: 'desc' }],
      take: 10,
      select: { symbol: true, revenueGrowth: true, roe: true, asOfDate: true },
    });

    results.top.highRisk = await prisma.financialMetric.findMany({
      where: { isHighRisk: true },
      orderBy: [{ debtToEquity: 'desc' }, { debtRatio: 'desc' }],
      take: 10,
      select: { symbol: true, debtToEquity: true, debtRatio: true, asOfDate: true },
    });

    return results;
  }
}

module.exports = { AnalysisService };
