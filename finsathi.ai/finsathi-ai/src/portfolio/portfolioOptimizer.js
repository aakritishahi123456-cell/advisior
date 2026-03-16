const {
  annualizeReturn,
  annualizeVol,
  clamp,
  covarianceMatrix,
  diversificationScore,
  mean,
  maxDrawdownPct,
  portfolioVariance,
  riskScoreFromVolAndDrawdown,
  stdev,
} = require('./riskCalculator');

function normalizeWeights(weights) {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum <= 0) return weights.map(() => 0);
  return weights.map((w) => w / sum);
}

function buildSectorWeights(allocation) {
  const map = {};
  for (const it of allocation) {
    const sector = it.sector || 'UNKNOWN';
    map[sector] = (map[sector] || 0) + it.weight;
  }
  return map;
}

function riskToleranceProfile(riskTolerance) {
  const t = String(riskTolerance || 'moderate').toLowerCase();
  if (t === 'low' || t === 'conservative') {
    return { riskAversion: 9, maxSingleWeight: 0.3, maxSectorWeight: 0.35, targetHoldings: 8, cashTarget: 0.30 };
  }
  if (t === 'high' || t === 'aggressive') {
    return { riskAversion: 3, maxSingleWeight: 0.3, maxSectorWeight: 0.5, targetHoldings: 10, cashTarget: 0.05 };
  }
  return { riskAversion: 5, maxSingleWeight: 0.3, maxSectorWeight: 0.4, targetHoldings: 10, cashTarget: 0.15 };
}

function projectConstraints({ weights, sectors, maxSingleWeight, maxSectorWeight }) {
  let w = weights.map((x) => Math.max(0, x));
  w = w.map((x) => Math.min(x, maxSingleWeight));
  w = normalizeWeights(w);

  for (let iter = 0; iter < 12; iter += 1) {
    const sectorW = {};
    for (let i = 0; i < w.length; i += 1) {
      const sector = sectors[i] || 'UNKNOWN';
      sectorW[sector] = (sectorW[sector] || 0) + w[i];
    }
    const overweight = Object.entries(sectorW).filter(([, sw]) => sw > maxSectorWeight + 1e-9);
    if (!overweight.length) break;

    let freed = 0;
    for (const [sector, sw] of overweight) {
      const ratio = (sw - maxSectorWeight) / sw;
      for (let i = 0; i < w.length; i += 1) {
        if ((sectors[i] || 'UNKNOWN') !== sector) continue;
        const cut = w[i] * ratio;
        w[i] -= cut;
        freed += cut;
      }
    }
    if (freed <= 0) break;

    const eligibleIdx = [];
    for (let i = 0; i < w.length; i += 1) {
      const sector = sectors[i] || 'UNKNOWN';
      if ((sectorW[sector] || 0) < maxSectorWeight - 1e-9 && w[i] < maxSingleWeight - 1e-9) eligibleIdx.push(i);
    }
    if (!eligibleIdx.length) break;

    const addEach = freed / eligibleIdx.length;
    for (const i of eligibleIdx) w[i] += addEach;
    w = w.map((x) => Math.max(0, Math.min(x, maxSingleWeight)));
    w = normalizeWeights(w);
  }

  return w;
}

function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i += 1) s += a[i] * b[i];
  return s;
}

function matVec(mat, vec) {
  return mat.map((row) => dot(row, vec));
}

function optimizeWeightsMPT({ mu, cov, sectors, riskAversion, maxSingleWeight, maxSectorWeight }) {
  const n = mu.length;
  let w = normalizeWeights(Array.from({ length: n }, () => 1 / n));

  const lr = clamp(Number(process.env.PORTFOLIO_OPT_LR || 0.15), 0.02, 0.5);
  const steps = clamp(Number(process.env.PORTFOLIO_OPT_STEPS || 80), 20, 400);

  for (let step = 0; step < steps; step += 1) {
    const sigmaW = matVec(cov, w);
    const grad = mu.map((m, i) => m - 2 * riskAversion * sigmaW[i]);
    w = w.map((wi, i) => wi + lr * grad[i]);
    w = projectConstraints({ weights: w, sectors, maxSingleWeight, maxSectorWeight });
  }

  return w;
}

function selectUniverse({ assets, minStocks, targetHoldings }) {
  const scored = assets
    .map((a) => ({
      ...a,
      score: (a.expReturnAnnual ?? 0) / Math.max(1e-6, (a.volAnnual ?? 0) ** 2),
    }))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  const n = Math.max(minStocks, targetHoldings);
  return scored.slice(0, Math.min(n, scored.length));
}

function computeAssetStats(asset) {
  const dailyMean = mean(asset.dailyReturns || []);
  const dailyStd = stdev(asset.dailyReturns || []);
  const expReturnAnnual = annualizeReturn(dailyMean);
  const volAnnual = annualizeVol(dailyStd);
  const mdd = maxDrawdownPct(asset.prices || []);
  const riskScore = riskScoreFromVolAndDrawdown({ volAnnual, maxDrawdownPct: mdd });

  return {
    ...asset,
    expReturnAnnual,
    volAnnual,
    maxDrawdownPct: mdd,
    riskScore,
  };
}

function optimizePortfolio({
  assets,
  riskTolerance,
  rfAnnual = 0.02,
  constraints,
} = {}) {
  const profile = riskToleranceProfile(riskTolerance);
  const maxSingleWeight = Math.min(constraints?.maxSingleWeight ?? 0.3, profile.maxSingleWeight);
  const minStocks = Math.max(5, constraints?.minStocks ?? 5);

  const analyzed = (assets || []).map(computeAssetStats).filter((a) => (a.dailyReturns?.length || 0) >= 30);
  const universe = selectUniverse({ assets: analyzed, minStocks, targetHoldings: profile.targetHoldings });
  if (universe.length < minStocks) {
    const err = new Error('Not enough symbols with sufficient price history');
    err.statusCode = 400;
    throw err;
  }

  const returnsByAsset = universe.map((a) => a.dailyReturns);
  const covDaily = covarianceMatrix(returnsByAsset);
  const covAnnual = covDaily.map((row) => row.map((x) => x * 252));

  const mu = universe.map((a) => a.expReturnAnnual ?? 0);
  const sectors = universe.map((a) => a.sector || 'UNKNOWN');

  let w = optimizeWeightsMPT({
    mu,
    cov: covAnnual,
    sectors,
    riskAversion: profile.riskAversion,
    maxSingleWeight,
    maxSectorWeight: constraints?.maxSectorWeight ?? profile.maxSectorWeight,
  });

  // Enforce minimum holdings: keep top-N weights, zero out rest, renormalize.
  const ranked = w.map((weight, i) => ({ i, weight })).sort((a, b) => b.weight - a.weight);
  const keep = ranked.slice(0, Math.max(minStocks, profile.targetHoldings));
  const keepSet = new Set(keep.map((x) => x.i));
  w = w.map((weight, i) => (keepSet.has(i) ? weight : 0));
  w = normalizeWeights(w);
  w = projectConstraints({
    weights: w,
    sectors,
    maxSingleWeight,
    maxSectorWeight: constraints?.maxSectorWeight ?? profile.maxSectorWeight,
  });

  const expectedReturnAnnual = dot(mu, w);
  const varAnnual = portfolioVariance(w, covAnnual);
  const volAnnual = Math.sqrt(Math.max(0, varAnnual));

  const allocationStocks = universe
    .map((a, i) => ({
      symbol: a.symbol,
      name: a.name || null,
      sector: a.sector || 'UNKNOWN',
      weight: Number(w[i].toFixed(6)),
      expectedReturnAnnual: Number((a.expReturnAnnual ?? 0).toFixed(6)),
      volatilityAnnual: Number((a.volAnnual ?? 0).toFixed(6)),
      riskScore: a.riskScore,
      maxDrawdownPct: Number((a.maxDrawdownPct ?? 0).toFixed(4)),
    }))
    .filter((x) => x.weight > 1e-8)
    .sort((a, b) => b.weight - a.weight);

  // Add cash allocation (risk-free) by scaling down equities if desired.
  const cashTarget = clamp(constraints?.cashTarget ?? profile.cashTarget, 0, 0.9);
  const scale = 1 - cashTarget;
  const scaledStocks = allocationStocks.map((x) => ({ ...x, weight: Number((x.weight * scale).toFixed(6)) }));
  const cashWeight = Number((1 - scaledStocks.reduce((acc, x) => acc + x.weight, 0)).toFixed(6));

  const allocation = cashWeight > 1e-6
    ? [...scaledStocks, { symbol: 'CASH', name: 'Cash', sector: 'CASH', weight: cashWeight, expectedReturnAnnual: rfAnnual, volatilityAnnual: 0, riskScore: 0, maxDrawdownPct: 0 }]
    : scaledStocks;

  const sectorWeights = buildSectorWeights(allocation.filter((x) => x.symbol !== 'CASH'));
  const diversification = {
    diversificationScore: diversificationScore({
      weights: allocation.filter((x) => x.symbol !== 'CASH').map((x) => x.weight),
      sectorWeights,
      minHoldings: minStocks,
    }),
    sectorWeights,
  };

  return {
    allocation,
    expectedReturnAnnual: Number(((expectedReturnAnnual * scale) + (rfAnnual * (1 - scale))).toFixed(6)),
    portfolioRiskScore: Math.round(allocationStocks.reduce((acc, x) => acc + x.weight * x.riskScore, 0) * scale),
    volatilityAnnual: Number((volAnnual * scale).toFixed(6)),
    diversification,
    correlationMatrix: null, // compute on demand if needed (can be large)
  };
}

module.exports = {
  optimizePortfolio,
  riskToleranceProfile,
};

