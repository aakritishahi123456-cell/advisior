const { getPrisma } = require('../database/prismaClient');

function clamp(num, min, max) {
  return Math.min(max, Math.max(min, num));
}

function toNumber(value) {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function startOfDayUTC(date) {
  const d = date instanceof Date ? date : new Date(date);
  // eslint-disable-next-line no-restricted-globals
  if (isNaN(d.getTime())) return null;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
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

function maxDrawdown(equityCurve) {
  let peak = -Infinity;
  let maxDd = 0;
  for (const v of equityCurve) {
    if (v > peak) peak = v;
    if (peak > 0) {
      const dd = (v - peak) / peak;
      if (dd < maxDd) maxDd = dd;
    }
  }
  return maxDd; // negative
}

function annualizeReturnFromDaily(dailyReturns) {
  if (!dailyReturns.length) return 0;
  const avg = mean(dailyReturns);
  return (1 + avg) ** 252 - 1;
}

function annualizeVolFromDaily(dailyReturns) {
  if (!dailyReturns.length) return 0;
  return stdev(dailyReturns) * Math.sqrt(252);
}

function safeDiv(a, b) {
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return null;
  return a / b;
}

function normalizeWeights(raw) {
  const sum = raw.reduce((a, b) => a + b, 0);
  if (!Number.isFinite(sum) || sum <= 0) return raw.map(() => 0);
  return raw.map((w) => w / sum);
}

function computeDailyReturns(values) {
  const returns = [];
  for (let i = 1; i < values.length; i += 1) {
    const prev = values[i - 1];
    const cur = values[i];
    if (!Number.isFinite(prev) || !Number.isFinite(cur) || prev <= 0) continue;
    returns.push((cur - prev) / prev);
  }
  return returns;
}

function lastN(arr, n) {
  if (arr.length <= n) return arr;
  return arr.slice(arr.length - n);
}

function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

async function loadPriceMatrix({ prisma, symbols, startDate, endDate }) {
  const rows = await prisma.stockPrice.findMany({
    where: {
      symbol: { in: symbols },
      date: { gte: startDate, lte: endDate },
    },
    orderBy: [{ symbol: 'asc' }, { date: 'asc' }],
    select: { symbol: true, date: true, close: true },
  });

  const datesSet = new Set();
  const bySymbol = new Map();
  for (const r of rows) {
    const close = toNumber(r.close);
    if (close === null) continue;
    const dateKey = toISODate(r.date);
    datesSet.add(dateKey);
    const map = bySymbol.get(r.symbol) || new Map();
    map.set(dateKey, close);
    bySymbol.set(r.symbol, map);
  }

  const dates = Array.from(datesSet).sort();

  // Build forward-filled close series per symbol aligned to dates
  const matrix = {};
  for (const sym of symbols) {
    const map = bySymbol.get(sym) || new Map();
    const series = [];
    let last = null;
    for (const d of dates) {
      if (map.has(d)) last = map.get(d);
      series.push(last);
    }
    matrix[sym] = series;
  }

  return { dates, matrix };
}

function computeSymbolReturns({ dates, closes }) {
  // closes aligned to dates; may contain nulls
  const clean = [];
  for (let i = 0; i < closes.length; i += 1) {
    const c = closes[i];
    if (c === null) continue;
    clean.push({ i, close: c });
  }
  // Build returns aligned to original indices (null when not computable)
  const daily = new Array(closes.length).fill(null);
  for (let k = 1; k < clean.length; k += 1) {
    const prev = clean[k - 1];
    const cur = clean[k];
    if (prev.close > 0) daily[cur.i] = (cur.close - prev.close) / prev.close;
  }
  return { dates, daily };
}

function pickRebalanceDays({ dates, frequency }) {
  // frequency: 'weekly' | 'monthly' | 'daily'
  const f = String(frequency || 'weekly').toLowerCase();
  if (f === 'daily') return dates.map((_, i) => i);
  if (f === 'monthly') {
    const idx = [];
    let lastMonth = null;
    for (let i = 0; i < dates.length; i += 1) {
      const d = dates[i];
      const month = d.slice(0, 7);
      if (month !== lastMonth) idx.push(i);
      lastMonth = month;
    }
    return idx;
  }
  // weekly: every 5 trading days
  const step = 5;
  const idx = [];
  for (let i = 0; i < dates.length; i += step) idx.push(i);
  return idx;
}

function momentumSelect({ symbols, closesBySymbol, t, lookbackDays, topN }) {
  const scores = [];
  const lb = clamp(lookbackDays, 5, 252);
  for (const sym of symbols) {
    const series = closesBySymbol[sym];
    const cur = series[t];
    const past = t - lb >= 0 ? series[t - lb] : null;
    if (cur === null || past === null || past <= 0) continue;
    const ret = (cur - past) / past;
    scores.push({ sym, score: ret });
  }
  scores.sort((a, b) => b.score - a.score);
  return scores.slice(0, topN).map((x) => x.sym);
}

function meanReversionSelect({ symbols, closesBySymbol, t, lookbackDays, bottomN }) {
  const scores = [];
  const lb = clamp(lookbackDays, 10, 252);
  for (const sym of symbols) {
    const series = closesBySymbol[sym];
    const cur = series[t];
    if (cur === null) continue;

    const start = Math.max(0, t - lb + 1);
    const window = series.slice(start, t + 1).filter((x) => x !== null);
    if (window.length < Math.floor(lb * 0.6)) continue;
    const m = mean(window);
    const sd = stdev(window);
    if (sd <= 0) continue;
    const z = (cur - m) / sd; // negative = below mean (oversold)
    scores.push({ sym, score: z });
  }
  scores.sort((a, b) => a.score - b.score); // most negative first
  return scores.slice(0, bottomN).map((x) => x.sym);
}

async function valueQualitySelect({ prisma, topN }) {
  // Dividend investing proxy: prefer undervalued + quality (low PE, high ROE)
  const rows = await prisma.financialMetric.findMany({
    orderBy: [{ asOfDate: 'desc' }],
    take: 1000,
    select: { symbol: true, peRatio: true, roe: true, asOfDate: true },
  });
  const latestBySymbol = new Map();
  for (const r of rows) {
    if (!latestBySymbol.has(r.symbol)) latestBySymbol.set(r.symbol, r);
  }
  const items = Array.from(latestBySymbol.values()).map((r) => ({
    sym: r.symbol,
    pe: toNumber(r.peRatio),
    roe: toNumber(r.roe),
  }));
  // Score: higher ROE and lower PE
  const scored = items
    .filter((x) => x.pe !== null && x.pe > 0 && x.roe !== null)
    .map((x) => ({ sym: x.sym, score: x.roe / x.pe }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topN).map((x) => x.sym);
}

function buildEqualWeights(selected) {
  if (!selected.length) return {};
  const w = 1 / selected.length;
  const weights = {};
  for (const sym of selected) weights[sym] = w;
  return weights;
}

function portfolioDailyReturn({ weights, dailyReturnsBySymbol, t }) {
  let r = 0;
  for (const [sym, w] of Object.entries(weights)) {
    const dr = dailyReturnsBySymbol[sym]?.[t];
    if (dr === null || dr === undefined) continue;
    r += w * dr;
  }
  return r;
}

function computeTurnover(prevW, nextW) {
  const symbols = new Set([...Object.keys(prevW || {}), ...Object.keys(nextW || {})]);
  let sum = 0;
  for (const s of symbols) {
    const a = prevW?.[s] || 0;
    const b = nextW?.[s] || 0;
    sum += Math.abs(b - a);
  }
  return sum / 2;
}

async function backtest({
  prisma,
  strategy,
  startDate,
  endDate,
  universeSymbols,
  params,
}) {
  const topN = clamp(Number(params.topN || 10), 3, 50);
  const lookbackDays = clamp(Number(params.lookbackDays || 60), 5, 252);
  const rebalance = params.rebalance || 'weekly';
  const feeBps = clamp(Number(params.feeBps || 10), 0, 100); // 10 bps default
  const feeRate = feeBps / 10_000;

  const { dates, matrix } = await loadPriceMatrix({
    prisma,
    symbols: universeSymbols,
    startDate,
    endDate,
  });

  if (dates.length < Math.max(lookbackDays + 5, 20)) {
    return {
      ok: false,
      error: 'Not enough historical price data for backtest window.',
      inputs: { strategy, startDate: toISODate(startDate), endDate: toISODate(endDate), params },
    };
  }

  // Precompute daily returns per symbol aligned to dates indices
  const dailyReturnsBySymbol = {};
  for (const sym of universeSymbols) {
    const closes = matrix[sym];
    dailyReturnsBySymbol[sym] = computeSymbolReturns({ dates, closes }).daily;
  }

  const rebalanceDays = pickRebalanceDays({ dates, frequency: rebalance }).filter((i) => i >= lookbackDays);

  let weights = {};
  const equity = [1];
  const dailyReturns = [0];
  let turnoverSum = 0;
  let trades = 0;

  for (let t = 1; t < dates.length; t += 1) {
    // Rebalance at start of day t if in rebalanceDays
    if (rebalanceDays.includes(t)) {
      let selected = [];
      const s = String(strategy || '').toLowerCase();
      if (s === 'momentum') {
        selected = momentumSelect({
          symbols: universeSymbols,
          closesBySymbol: matrix,
          t,
          lookbackDays,
          topN,
        });
      } else if (s === 'mean_reversion' || s === 'mean-reversion' || s === 'meanreversion') {
        selected = meanReversionSelect({
          symbols: universeSymbols,
          closesBySymbol: matrix,
          t,
          lookbackDays,
          bottomN: topN,
        });
      } else if (s === 'dividend' || s === 'dividend_investing' || s === 'dividend-investing') {
        selected = await valueQualitySelect({ prisma, topN });
      } else {
        return { ok: false, error: `Unsupported strategy: ${strategy}` };
      }

      const nextWeights = buildEqualWeights(selected);
      const turnover = computeTurnover(weights, nextWeights);
      turnoverSum += turnover;
      if (turnover > 0) trades += 1;
      weights = nextWeights;
    }

    const r = portfolioDailyReturn({ weights, dailyReturnsBySymbol, t });
    const cost = feeRate * (rebalanceDays.includes(t) ? computeTurnover({}, weights) : 0);
    const net = r - cost;

    const prevEquity = equity[equity.length - 1];
    const nextEquity = prevEquity * (1 + net);
    equity.push(nextEquity);
    dailyReturns.push(net);
  }

  const totalReturn = equity[equity.length - 1] - 1;
  const vol = annualizeVolFromDaily(dailyReturns.slice(1));
  const expReturn = annualizeReturnFromDaily(dailyReturns.slice(1));
  const rf = clamp(Number(params.rfAnnual || process.env.PORTFOLIO_RF_ANNUAL || 0.02), 0, 0.5);
  const sharpe = vol > 0 ? (expReturn - rf) / vol : null;
  const dd = maxDrawdown(equity);
  const winDays = dailyReturns.slice(1).filter((x) => x > 0).length;
  const lossDays = dailyReturns.slice(1).filter((x) => x < 0).length;
  const winRate = safeDiv(winDays, winDays + lossDays);

  const avgTurnover = trades ? turnoverSum / trades : 0;

  return {
    ok: true,
    strategy,
    parameters: {
      ...params,
      topN,
      lookbackDays,
      rebalance,
      feeBps,
    },
    period: {
      startDate: toISODate(startDate),
      endDate: toISODate(endDate),
      tradingDays: dates.length,
    },
    performance: {
      totalReturn: Number(totalReturn.toFixed(6)),
      expectedReturnAnnual: Number(expReturn.toFixed(6)),
      volatilityAnnual: Number(vol.toFixed(6)),
      sharpe: sharpe === null ? null : Number(sharpe.toFixed(6)),
      maxDrawdown: Number(dd.toFixed(6)),
      winRate: winRate === null ? null : Number(winRate.toFixed(6)),
      trades,
      avgTurnover: Number(avgTurnover.toFixed(6)),
    },
    outputs: {
      equityCurveTail: lastN(
        dates.map((d, i) => ({ date: d, equity: Number(equity[i].toFixed(6)) })),
        clamp(Number(params.curveTailDays || 30), 10, 180)
      ),
    },
  };
}

class StrategyAgent {
  constructor() {
    this.name = 'StrategyAgent';
  }

  async run({ logger } = {}) {
    const prisma = getPrisma();
    const startedAt = new Date();

    const pipeline = await prisma.pipelineLog.create({
      data: {
        pipelineType: 'STRATEGY_SIMULATION_AGENT',
        status: 'RUNNING',
        startedAt,
        details: {
          strategy: process.env.STRATEGY_NAME || 'momentum',
        },
      },
    });

    try {
      const strategy = process.env.STRATEGY_NAME || 'momentum';

      const end = startOfDayUTC(process.env.STRATEGY_END_DATE || new Date());
      const start = startOfDayUTC(
        process.env.STRATEGY_START_DATE || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
      );

      if (!start || !end || start >= end) {
        throw new Error('Invalid STRATEGY_START_DATE/STRATEGY_END_DATE');
      }

      const universeLimit = clamp(Number(process.env.STRATEGY_UNIVERSE_LIMIT || 60), 10, 400);
      const universe = await prisma.company.findMany({
        select: { symbol: true },
        orderBy: { symbol: 'asc' },
        take: universeLimit,
      });
      const universeSymbols = universe.map((x) => x.symbol);

      const params = {
        topN: Number(process.env.STRATEGY_TOP_N || 10),
        lookbackDays: Number(process.env.STRATEGY_LOOKBACK_DAYS || 60),
        rebalance: process.env.STRATEGY_REBALANCE || 'weekly',
        feeBps: Number(process.env.STRATEGY_FEE_BPS || 10),
        curveTailDays: Number(process.env.STRATEGY_CURVE_TAIL_DAYS || 30),
        rfAnnual: Number(process.env.STRATEGY_RF_ANNUAL || 0.02),
      };

      logger?.info?.(
        { agent: this.name, strategy, start: toISODate(start), end: toISODate(end), universe: universeSymbols.length },
        'Running strategy backtest'
      );

      const result = await backtest({
        prisma,
        strategy,
        startDate: start,
        endDate: end,
        universeSymbols,
        params,
      });

      if (!result.ok) {
        await prisma.pipelineLog.update({
          where: { id: pipeline.id },
          data: {
            status: 'FAILED',
            completedAt: new Date(),
            details: { ...(pipeline.details || {}), error: result.error || 'Backtest failed' },
          },
        });
        return { ok: false, error: result.error || 'Backtest failed', timestamp: new Date().toISOString() };
      }

      const stored = await prisma.backtestRun.create({
        data: {
          strategy: String(result.strategy),
          parameters: result.parameters,
          startDate: new Date(result.period.startDate),
          endDate: new Date(result.period.endDate),
          performance: {
            ...result.performance,
            period: result.period,
            outputs: result.outputs,
          },
        },
      });

      await prisma.pipelineLog.update({
        where: { id: pipeline.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          metrics: {
            totalReturn: result.performance.totalReturn,
            maxDrawdown: result.performance.maxDrawdown,
            sharpe: result.performance.sharpe,
            trades: result.performance.trades,
          },
          details: { ...(pipeline.details || {}), backtestRunId: stored.id, strategy: result.strategy },
        },
      });

      return {
        ok: true,
        stored: { id: stored.id },
        result,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      await prisma.pipelineLog.update({
        where: { id: pipeline.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          details: { ...(pipeline.details || {}), error: err?.message || String(err) },
        },
      });
      logger?.error?.({ agent: this.name, pipelineId: pipeline.id, err: err?.message }, 'Strategy agent failed');
      throw err;
    }
  }
}

module.exports = { StrategyAgent };
