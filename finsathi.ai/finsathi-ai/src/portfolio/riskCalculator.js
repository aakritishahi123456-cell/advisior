function mean(values) {
  if (!values || values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stdev(values) {
  if (!values || values.length < 2) return 0;
  const m = mean(values);
  const v = values.reduce((acc, x) => acc + (x - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(Math.max(0, v));
}

function covariance(a, b) {
  const n = Math.min(a?.length || 0, b?.length || 0);
  if (n < 2) return 0;
  const ma = mean(a.slice(0, n));
  const mb = mean(b.slice(0, n));
  let sum = 0;
  for (let i = 0; i < n; i += 1) sum += (a[i] - ma) * (b[i] - mb);
  return sum / (n - 1);
}

function covarianceMatrix(returnsByAsset) {
  const n = returnsByAsset.length;
  const cov = Array.from({ length: n }, () => Array.from({ length: n }, () => 0));
  for (let i = 0; i < n; i += 1) {
    for (let j = i; j < n; j += 1) {
      const c = covariance(returnsByAsset[i], returnsByAsset[j]);
      cov[i][j] = c;
      cov[j][i] = c;
    }
  }
  return cov;
}

function correlationMatrix(returnsByAsset) {
  const cov = covarianceMatrix(returnsByAsset);
  const n = cov.length;
  const corr = Array.from({ length: n }, () => Array.from({ length: n }, () => 0));
  const vols = returnsByAsset.map((r) => stdev(r));
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < n; j += 1) {
      const denom = vols[i] * vols[j];
      corr[i][j] = denom > 0 ? cov[i][j] / denom : (i === j ? 1 : 0);
    }
  }
  return corr;
}

function annualizeReturn(dailyMean) {
  return (1 + dailyMean) ** 252 - 1;
}

function annualizeVol(dailyStd) {
  return dailyStd * Math.sqrt(252);
}

function computeReturnsFromPrices(chronologicalCloses) {
  const returns = [];
  const closes = chronologicalCloses || [];
  for (let i = 1; i < closes.length; i += 1) {
    const prev = closes[i - 1];
    const cur = closes[i];
    if (!Number.isFinite(prev) || !Number.isFinite(cur) || prev <= 0) continue;
    returns.push((cur - prev) / prev);
  }
  return returns;
}

function maxDrawdownPct(prices) {
  const xs = prices || [];
  let peak = -Infinity;
  let maxDd = 0;
  for (const p of xs) {
    if (!Number.isFinite(p)) continue;
    if (p > peak) peak = p;
    if (peak > 0) {
      const dd = (p - peak) / peak;
      if (dd < maxDd) maxDd = dd;
    }
  }
  return maxDd * 100;
}

function clamp(num, min, max) {
  return Math.min(max, Math.max(min, num));
}

function riskScoreFromVolAndDrawdown({ volAnnual, maxDrawdownPct: mdd }) {
  const volComponent = clamp((volAnnual / 0.6) * 60, 0, 60);
  const ddComponent = clamp((Math.abs(mdd) / 60) * 40, 0, 40);
  return Math.round(volComponent + ddComponent);
}

function portfolioVariance(weights, cov) {
  const n = weights.length;
  let out = 0;
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < n; j += 1) out += weights[i] * weights[j] * cov[i][j];
  }
  return out;
}

function hhi(weights) {
  return (weights || []).reduce((acc, w) => acc + w * w, 0);
}

function effectiveHoldings(weights) {
  const v = hhi(weights);
  return v > 0 ? 1 / v : 0;
}

function diversificationScore({ weights, sectorWeights, minHoldings }) {
  const eff = effectiveHoldings(weights);
  const holdingsComponent = minHoldings ? clamp((eff / minHoldings) * 60, 0, 60) : clamp(eff * 6, 0, 60);
  const maxSector = Math.max(...Object.values(sectorWeights || {}), 0);
  const sectorComponent = clamp((1 - maxSector) * 40, 0, 40);
  return Math.round(holdingsComponent + sectorComponent);
}

module.exports = {
  annualizeReturn,
  annualizeVol,
  clamp,
  computeReturnsFromPrices,
  correlationMatrix,
  covariance,
  covarianceMatrix,
  diversificationScore,
  effectiveHoldings,
  hhi,
  maxDrawdownPct,
  mean,
  portfolioVariance,
  riskScoreFromVolAndDrawdown,
  stdev,
};

