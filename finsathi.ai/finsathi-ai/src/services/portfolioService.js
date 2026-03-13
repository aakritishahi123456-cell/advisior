const { getPrisma } = require('../database/prismaClient');

function toNumber(value) {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function mean(values) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stdev(values) {
  if (values.length < 2) return 0;
  const m = mean(values);
  const v = values.reduce((acc, x) => acc + (x - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(Math.max(0, v));
}

function covariance(a, b) {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;
  const ma = mean(a.slice(0, n));
  const mb = mean(b.slice(0, n));
  let sum = 0;
  for (let i = 0; i < n; i += 1) sum += (a[i] - ma) * (b[i] - mb);
  return sum / (n - 1);
}

function annualizeReturn(dailyMean) {
  // Approx for small daily returns: (1+r)^252 - 1
  return (1 + dailyMean) ** 252 - 1;
}

function annualizeVol(dailyStd) {
  return dailyStd * Math.sqrt(252);
}

function clamp(num, min, max) {
  return Math.min(max, Math.max(min, num));
}

function normalizeWeights(weights) {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum <= 0) return weights.map(() => 0);
  return weights.map((w) => w / sum);
}

function hhi(weights) {
  return weights.reduce((acc, w) => acc + w * w, 0);
}

function effectiveHoldings(weights) {
  const value = hhi(weights);
  return value > 0 ? 1 / value : 0;
}

function buildSectorWeights(items) {
  const map = {};
  for (const it of items) {
    const sector = it.sector || 'UNKNOWN';
    map[sector] = (map[sector] || 0) + it.weight;
  }
  return map;
}

function riskScoreFromVolAndDrawdown({ volAnnual, maxDrawdownPct }) {
  // 0..100 (higher = riskier). Tuneable, simple and monotonic.
  const volComponent = clamp((volAnnual / 0.6) * 60, 0, 60); // 60% vol -> 60 pts
  const ddComponent = clamp((Math.abs(maxDrawdownPct) / 60) * 40, 0, 40); // 60% drawdown -> 40 pts
  return Math.round(volComponent + ddComponent);
}

function maxDrawdownPct(prices) {
  let peak = -Infinity;
  let maxDd = 0;
  for (const p of prices) {
    if (p > peak) peak = p;
    if (peak > 0) {
      const dd = (p - peak) / peak;
      if (dd < maxDd) maxDd = dd;
    }
  }
  return maxDd * 100; // negative number
}

function computeReturnsFromPrices(chronologicalCloses) {
  const returns = [];
  for (let i = 1; i < chronologicalCloses.length; i += 1) {
    const prev = chronologicalCloses[i - 1];
    const cur = chronologicalCloses[i];
    if (!Number.isFinite(prev) || !Number.isFinite(cur) || prev <= 0) continue;
    returns.push((cur - prev) / prev);
  }
  return returns;
}

function riskToleranceProfile(riskTolerance) {
  const t = String(riskTolerance || 'moderate').toLowerCase();
  if (t === 'low' || t === 'conservative') {
    return { riskAversion: 8, maxSingleWeight: 0.2, maxSectorWeight: 0.35, targetHoldings: 8 };
  }
  if (t === 'high' || t === 'aggressive') {
    return { riskAversion: 2.5, maxSingleWeight: 0.35, maxSectorWeight: 0.5, targetHoldings: 10 };
  }
  return { riskAversion: 4.5, maxSingleWeight: 0.25, maxSectorWeight: 0.4, targetHoldings: 10 };
}

class PortfolioService {
  /**
   * Portfolio recommendation (mean-variance flavored heuristic):
   * - expected returns: mean daily returns annualized
   * - risk: annualized volatility + max drawdown (risk score)
   * - weights: proportional to mu / (lambda * sigma^2), clipped and diversified
   * - constraints: no shorting, sum=1, max single weight, max sector weight
   */
  static async recommend({ riskTolerance = 'moderate', horizonDays = 180 } = {}) {
    const prisma = getPrisma();

    const lookbackDays = clamp(
      Number(process.env.PORTFOLIO_LOOKBACK_DAYS || horizonDays || 180),
      30,
      720
    );
    const universeLimit = clamp(Number(process.env.PORTFOLIO_UNIVERSE_LIMIT || 60), 10, 400);
    const minObs = clamp(Number(process.env.PORTFOLIO_MIN_OBSERVATIONS || 60), 20, 400);
    const rfAnnual = clamp(Number(process.env.PORTFOLIO_RF_ANNUAL || 0.02), 0, 0.5);
    const anomalyPenaltyPct = clamp(Number(process.env.PORTFOLIO_ANOMALY_PENALTY_PCT || 0.1), 0, 1);

    const profile = riskToleranceProfile(riskTolerance);

    const since = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);

    // Load symbols with enough data efficiently: fetch recent prices grouped by symbol.
    const symbols = await prisma.company.findMany({
      select: { id: true, symbol: true, name: true, sector: true },
      orderBy: { symbol: 'asc' },
      take: universeLimit,
    });

    const priceRows = await prisma.stockPrice.findMany({
      where: { date: { gte: since }, symbol: { in: symbols.map((s) => s.symbol) } },
      orderBy: [{ symbol: 'asc' }, { date: 'asc' }],
      select: { symbol: true, date: true, close: true, volume: true },
    });

    const anomalies = await prisma.priceAnomaly.findMany({
      where: { date: { gte: since }, symbol: { in: symbols.map((s) => s.symbol) } },
      select: { symbol: true },
    });
    const anomalySet = new Set(anomalies.map((a) => a.symbol));

    const bySymbol = new Map();
    for (const row of priceRows) {
      const close = toNumber(row.close);
      if (!Number.isFinite(close)) continue;
      const arr = bySymbol.get(row.symbol) || [];
      arr.push({ close, volume: row.volume ? toNumber(row.volume) : null });
      bySymbol.set(row.symbol, arr);
    }

    // Compute asset stats
    const assets = [];
    for (const company of symbols) {
      const series = bySymbol.get(company.symbol) || [];
      if (series.length < minObs) continue;

      const closes = series.map((x) => x.close);
      const returns = computeReturnsFromPrices(closes);
      if (returns.length < minObs - 1) continue;

      const dailyMean = mean(returns);
      const dailyStd = stdev(returns);
      const expReturnAnnual = annualizeReturn(dailyMean);
      const volAnnual = annualizeVol(dailyStd);
      const ddPct = maxDrawdownPct(closes);

      let riskScore = riskScoreFromVolAndDrawdown({ volAnnual, maxDrawdownPct: ddPct });
      if (anomalySet.has(company.symbol)) {
        riskScore = clamp(Math.round(riskScore * (1 + anomalyPenaltyPct)), 0, 100);
      }

      // Liquidity proxy: average volume (if present)
      const volumes = series.map((x) => toNumber(x.volume)).filter((v) => Number.isFinite(v));
      const avgVolume = volumes.length ? mean(volumes) : null;

      assets.push({
        symbol: company.symbol,
        name: company.name,
        sector: company.sector || 'UNKNOWN',
        expReturnAnnual,
        volAnnual,
        maxDrawdownPct: ddPct,
        avgVolume,
        riskScore,
        dailyReturns: returns,
        latestClose: closes[closes.length - 1],
      });
    }

    // Select a diversified universe: favor higher expected return per unit risk, but avoid extreme risk
    assets.sort((a, b) => {
      const aScore = (a.expReturnAnnual || 0) / Math.max(1e-6, a.volAnnual || 0.0001);
      const bScore = (b.expReturnAnnual || 0) / Math.max(1e-6, b.volAnnual || 0.0001);
      return bScore - aScore;
    });

    const targetHoldings = clamp(profile.targetHoldings, 3, 30);
    const universe = [];
    const sectorCounts = {};
    const maxPerSector = Math.max(1, Math.floor(targetHoldings / 2));
    for (const a of assets) {
      if (universe.length >= targetHoldings) break;
      sectorCounts[a.sector] = sectorCounts[a.sector] || 0;
      if (sectorCounts[a.sector] >= maxPerSector) continue;
      universe.push(a);
      sectorCounts[a.sector] += 1;
    }
    if (universe.length < 3) {
      // Fallback: take top 3 by score.
      universe.splice(0, universe.length, ...assets.slice(0, Math.min(assets.length, 3)));
    }

    // Mean-variance flavored heuristic weights (no shorting):
    // w_i ∝ max(0, mu_i - rf) / (lambda * sigma_i^2)
    const lambda = profile.riskAversion;
    const weightsRaw = universe.map((a) => {
      const mu = a.expReturnAnnual ?? 0;
      const excess = Math.max(0, mu - rfAnnual);
      const sigma2 = (a.volAnnual ?? 0) ** 2;
      const base = sigma2 > 0 ? excess / (lambda * sigma2) : 0;
      // Risk-weighted allocation: penalize high risk scores
      const riskPenalty = 1 - clamp(a.riskScore / 150, 0, 0.5); // max 50% penalty
      return base * riskPenalty;
    });

    let weights = normalizeWeights(weightsRaw);

    // Apply max single weight cap
    weights = weights.map((w) => Math.min(w, profile.maxSingleWeight));
    weights = normalizeWeights(weights);

    // Apply max sector weight cap by iterative redistribution
    const maxSectorWeight = profile.maxSectorWeight;
    for (let iter = 0; iter < 10; iter += 1) {
      const sectorW = {};
      for (let i = 0; i < universe.length; i += 1) {
        const sector = universe[i].sector || 'UNKNOWN';
        sectorW[sector] = (sectorW[sector] || 0) + weights[i];
      }

      const overweightSectors = Object.entries(sectorW).filter(([, w]) => w > maxSectorWeight + 1e-9);
      if (!overweightSectors.length) break;

      // Reduce overweight sectors proportionally and redistribute to others
      let freed = 0;
      for (const [sector, w] of overweightSectors) {
        const ratio = (w - maxSectorWeight) / w;
        for (let i = 0; i < universe.length; i += 1) {
          if ((universe[i].sector || 'UNKNOWN') !== sector) continue;
          const cut = weights[i] * ratio;
          weights[i] -= cut;
          freed += cut;
        }
      }

      if (freed <= 0) break;
      const eligible = universe.map((a, i) => ({ i, sector: a.sector || 'UNKNOWN' }))
        .filter((x) => (sectorW[x.sector] || 0) < maxSectorWeight - 1e-9);
      if (!eligible.length) break;

      const addEach = freed / eligible.length;
      for (const e of eligible) weights[e.i] += addEach;
      weights = weights.map((w) => Math.max(0, w));
      weights = normalizeWeights(weights);
    }

    // Compute portfolio metrics
    const muVec = universe.map((a) => a.expReturnAnnual ?? 0);
    const volVec = universe.map((a) => a.volAnnual ?? 0);

    const expectedReturnAnnual = muVec.reduce((acc, mu, i) => acc + mu * weights[i], 0);

    // Approx portfolio variance using covariance of daily returns (annualized)
    const dailyReturns = universe.map((a) => a.dailyReturns);
    let varDaily = 0;
    for (let i = 0; i < universe.length; i += 1) {
      for (let j = 0; j < universe.length; j += 1) {
        const cov = covariance(dailyReturns[i], dailyReturns[j]);
        varDaily += weights[i] * weights[j] * cov;
      }
    }
    const volPortfolioAnnual = Math.sqrt(Math.max(0, varDaily)) * Math.sqrt(252);
    const sharpe = volPortfolioAnnual > 0 ? (expectedReturnAnnual - rfAnnual) / volPortfolioAnnual : null;

    const allocation = universe.map((a, i) => ({
      symbol: a.symbol,
      name: a.name,
      sector: a.sector,
      weight: Number(weights[i].toFixed(6)),
      expectedReturnAnnual: Number((a.expReturnAnnual ?? 0).toFixed(6)),
      volatilityAnnual: Number((a.volAnnual ?? 0).toFixed(6)),
      riskScore: a.riskScore,
      maxDrawdownPct: Number((a.maxDrawdownPct ?? 0).toFixed(4)),
      latestClose: Number((a.latestClose ?? 0).toFixed(4)),
      avgVolume: a.avgVolume !== null ? Number(a.avgVolume.toFixed(2)) : null,
    }));

    const weightsOnly = allocation.map((x) => x.weight);
    const diversification = {
      holdingsCount: allocation.length,
      hhi: Number(hhi(weightsOnly).toFixed(6)),
      effectiveHoldings: Number(effectiveHoldings(weightsOnly).toFixed(4)),
      maxSingleWeight: Number(Math.max(...weightsOnly, 0).toFixed(6)),
      sectorWeights: buildSectorWeights(allocation),
      maxSectorWeight: Number(Math.max(...Object.values(buildSectorWeights(allocation)), 0).toFixed(6)),
    };

    const riskScorePortfolio = Math.round(
      allocation.reduce((acc, x) => acc + x.weight * x.riskScore, 0)
    );

    const result = {
      generatedAt: new Date().toISOString(),
      inputs: {
        riskTolerance,
        horizonDays,
        lookbackDays,
        universeLimit,
        minObservations: minObs,
        rfAnnual,
        constraints: {
          maxSingleWeight: profile.maxSingleWeight,
          maxSectorWeight: profile.maxSectorWeight,
          targetHoldings,
        },
      },
      universeStats: {
        candidates: assets.length,
        selected: allocation.length,
        since: since.toISOString(),
      },
      allocation,
      portfolioMetrics: {
        expectedReturnAnnual: Number(expectedReturnAnnual.toFixed(6)),
        volatilityAnnual: Number(volPortfolioAnnual.toFixed(6)),
        sharpe: sharpe === null ? null : Number(sharpe.toFixed(6)),
        riskScore: riskScorePortfolio,
      },
      diversification,
    };

    // Optional persistence (enabled by default)
    if (process.env.PORTFOLIO_STORE_RECOMMENDATION !== 'false') {
      await prisma.portfolioRecommendation.create({
        data: {
          riskTolerance: String(riskTolerance),
          horizonDays: Number(horizonDays) || null,
          allocation: result.allocation,
          metrics: { portfolioMetrics: result.portfolioMetrics, diversification: result.diversification },
        },
      });
    }

    return result;
  }
}

module.exports = { PortfolioService };
