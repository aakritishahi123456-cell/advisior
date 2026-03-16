const { getPrisma } = require('../database/prismaClient');
const { optimizePortfolio } = require('../portfolio/portfolioOptimizer');
const { clamp, computeReturnsFromPrices } = require('../portfolio/riskCalculator');

function toNumber(value) {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function groupClosesBySymbol(priceRows) {
  const bySymbol = new Map();
  for (const row of priceRows) {
    const close = toNumber(row.close);
    if (close === null) continue;
    const arr = bySymbol.get(row.symbol) || [];
    arr.push(close);
    bySymbol.set(row.symbol, arr);
  }
  return bySymbol;
}

class PortfolioService {
  static async recommend({ riskTolerance = 'moderate', horizonDays = 180, investmentAmount = null } = {}) {
    const prisma = getPrisma();

    const lookbackDays = clamp(Number(process.env.PORTFOLIO_LOOKBACK_DAYS || horizonDays || 180), 30, 720);
    const universeLimit = clamp(Number(process.env.PORTFOLIO_UNIVERSE_LIMIT || 80), 10, 600);
    const minObs = clamp(Number(process.env.PORTFOLIO_MIN_OBSERVATIONS || 90), 30, 720);
    const rfAnnual = clamp(Number(process.env.PORTFOLIO_RF_ANNUAL || 0.02), 0, 0.5);

    const since = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);

    const companies = await prisma.company.findMany({
      select: { symbol: true, name: true, sector: true },
      orderBy: { symbol: 'asc' },
      take: universeLimit,
    });

    const symbols = companies.map((c) => c.symbol);
    const priceRows = await prisma.stockPrice.findMany({
      where: { date: { gte: since }, symbol: { in: symbols } },
      orderBy: [{ symbol: 'asc' }, { date: 'asc' }],
      select: { symbol: true, date: true, close: true },
    });

    const closesBySymbol = groupClosesBySymbol(priceRows);
    const assets = [];
    for (const c of companies) {
      const closes = closesBySymbol.get(c.symbol) || [];
      if (closes.length < minObs) continue;
      assets.push({
        symbol: c.symbol,
        name: c.name,
        sector: c.sector || 'UNKNOWN',
        prices: closes,
        dailyReturns: computeReturnsFromPrices(closes),
      });
    }

    const engine = optimizePortfolio({
      assets,
      riskTolerance,
      rfAnnual,
      constraints: {
        maxSingleWeight: 0.3,
        minStocks: 5,
        maxSectorWeight: Number(process.env.PORTFOLIO_MAX_SECTOR_WEIGHT || 0.4),
      },
    });

    const amountNum = investmentAmount === null || investmentAmount === undefined ? null : Number(investmentAmount);
    const amount = Number.isFinite(amountNum) && amountNum > 0 ? amountNum : null;

    const allocation = amount
      ? engine.allocation.map((a) => ({
        ...a,
        amount: Number((a.weight * amount).toFixed(2)),
      }))
      : engine.allocation;

    const result = {
      generatedAt: new Date().toISOString(),
      inputs: {
        riskTolerance,
        horizonDays,
        investmentAmount: amount,
        lookbackDays,
        universeLimit,
        minObservations: minObs,
        constraints: { maxSingleWeight: 0.3, minStocks: 5, sectorDiversification: true },
      },
      allocation,
      portfolioMetrics: {
        expectedReturnAnnual: engine.expectedReturnAnnual,
        volatilityAnnual: engine.volatilityAnnual,
        riskScore: engine.portfolioRiskScore,
      },
      diversification: {
        score: engine.diversification.diversificationScore,
        sectorWeights: engine.diversification.sectorWeights,
      },
    };

    if (process.env.PORTFOLIO_STORE_RECOMMENDATION !== 'false') {
      await prisma.portfolioRecommendation.create({
        data: {
          riskTolerance: String(riskTolerance),
          horizonDays: Number(horizonDays) || null,
          allocation: result.allocation,
          metrics: result,
        },
      });
    }

    return result;
  }
}

module.exports = { PortfolioService };
