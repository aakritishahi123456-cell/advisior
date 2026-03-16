const { createRateLimiter, createScraperHttpClient, requestWithRetry } = require('./httpClient');
const { normalizeCompanySymbol } = require('./normalization');
const { validateFundamentals } = require('./validator');
const { logScraperError } = require('./errorLog');

const sharesansar = require('./sources/sharesansar');
const merolagani = require('./sources/merolagani');
const nepsealpha = require('./sources/nepsealpha');

function mergeFundamentals(preferred, fallback) {
  if (!fallback) return preferred;
  if (!preferred) return fallback;

  return {
    symbol: preferred.symbol || fallback.symbol,
    companyName: preferred.companyName || fallback.companyName,
    sector: preferred.sector || fallback.sector,
    eps: preferred.eps || fallback.eps,
    peRatio: preferred.peRatio || fallback.peRatio,
    bookValue: preferred.bookValue || fallback.bookValue,
    roe: preferred.roe || fallback.roe,
    netProfit: preferred.netProfit || fallback.netProfit,
    revenue: preferred.revenue || fallback.revenue,
    dividendYield: preferred.dividendYield || fallback.dividendYield,
    marketCap: preferred.marketCap || fallback.marketCap,
  };
}

function buildSources(order) {
  const all = [sharesansar, merolagani, nepsealpha];
  if (!order || order.length === 0) return all;

  const byId = new Map(all.map((s) => [s.id, s]));
  return order.map((id) => byId.get(id)).filter(Boolean);
}

async function listCompanySymbolsFromDb(prisma) {
  const rows = await prisma.company.findMany({ select: { symbol: true } });
  return rows.map((r) => normalizeCompanySymbol(r.symbol)).filter(Boolean);
}

async function scrapeFromSource({ client, schedule, source, symbol, logger, retries }) {
  const url = source.buildCompanyUrl(symbol);

  const res = await schedule(() =>
    requestWithRetry(
      client,
      { method: 'GET', url },
      {
        retries,
        onRetry: ({ attempt, delayMs, err }) => {
          logger?.warn?.(
            { source: source.id, symbol, attempt, delayMs, status: err?.response?.status },
            'Retrying fundamentals fetch'
          );
        },
      }
    )
  );

  const html = res?.data;
  if (typeof html !== 'string' || html.length < 50) {
    const err = new Error(`Unexpected HTML response from ${source.id}`);
    err.code = 'BAD_HTML';
    throw err;
  }

  if (source.id === 'sharesansar') return source.parseSharesansarFundamentals(html, symbol);
  if (source.id === 'merolagani') return source.parseMerolaganiFundamentals(html, symbol);
  if (source.id === 'nepsealpha') return source.parseNepsealphaFundamentals(html, symbol);

  const err = new Error(`Unknown source: ${source.id}`);
  err.code = 'UNKNOWN_SOURCE';
  throw err;
}

async function upsertFundamentals({ prisma, logger, fundamentals }) {
  const symbol = fundamentals.symbol;

  const existingCompany = await prisma.company.findUnique({ where: { symbol } });
  if (!existingCompany) {
    logger?.warn?.({ symbol }, 'Company missing in DB; creating placeholder record');
    await prisma.company.create({
      data: {
        symbol,
        name: fundamentals.companyName || symbol,
        sector: fundamentals.sector || null,
      },
    });
  } else {
    const update = {};
    if (fundamentals.sector && existingCompany.sector !== fundamentals.sector) update.sector = fundamentals.sector;
    if (fundamentals.companyName) {
      const isPlaceholder = !existingCompany.name || existingCompany.name === existingCompany.symbol;
      if (isPlaceholder || existingCompany.name.length < fundamentals.companyName.length) update.name = fundamentals.companyName;
    }
    if (Object.keys(update).length) {
      await prisma.company.update({ where: { symbol }, data: update });
    }
  }

  await prisma.companyFundamentals.upsert({
    where: { symbol },
    create: {
      symbol,
      companyName: fundamentals.companyName,
      sector: fundamentals.sector,
      eps: fundamentals.eps,
      peRatio: fundamentals.peRatio,
      bookValue: fundamentals.bookValue,
      roe: fundamentals.roe,
      netProfit: fundamentals.netProfit,
      revenue: fundamentals.revenue,
      dividendYield: fundamentals.dividendYield,
      marketCap: fundamentals.marketCap,
    },
    update: {
      companyName: fundamentals.companyName,
      sector: fundamentals.sector,
      eps: fundamentals.eps,
      peRatio: fundamentals.peRatio,
      bookValue: fundamentals.bookValue,
      roe: fundamentals.roe,
      netProfit: fundamentals.netProfit,
      revenue: fundamentals.revenue,
      dividendYield: fundamentals.dividendYield,
      marketCap: fundamentals.marketCap,
    },
  });
}

async function runFundamentalsScraper({
  prisma,
  logger,
  symbols,
  sourceOrder,
  maxConcurrent = Number(process.env.FUNDAMENTALS_MAX_CONCURRENT || 2),
  minTimeMs = Number(process.env.FUNDAMENTALS_MIN_TIME_MS || 450),
  retries = Number(process.env.FUNDAMENTALS_RETRIES || 3),
} = {}) {
  if (!prisma) throw new Error('runFundamentalsScraper requires prisma');
  const selectedSymbols = (symbols && symbols.length ? symbols : await listCompanySymbolsFromDb(prisma))
    .map(normalizeCompanySymbol)
    .filter(Boolean);

  const sources = buildSources(sourceOrder);
  const client = createScraperHttpClient({ timeoutMs: Number(process.env.FUNDAMENTALS_TIMEOUT_MS || 20_000) });
  const schedule = createRateLimiter({ maxConcurrent, minTimeMs });

  const pipelineLog = await prisma.pipelineLog.create({
    data: {
      pipelineType: 'fundamentals_scraper',
      status: 'running',
      metrics: { symbols: selectedSymbols.length, sources: sources.map((s) => s.id) },
    },
  });

  const startedAt = Date.now();
  let ok = 0;
  let failed = 0;

  const inFlight = new Set();
  async function runOne(symbol) {
    let merged = { symbol };

    for (const source of sources) {
      try {
        const partial = await scrapeFromSource({ client, schedule, source, symbol, logger, retries });
        merged = mergeFundamentals(merged, partial);
      } catch (err) {
        logScraperError({ logger, err, context: { symbol, source: source.id } });
      }
    }

    const validated = validateFundamentals(merged);
    await upsertFundamentals({ prisma, logger, fundamentals: validated });
    ok += 1;
  }

  for (const symbol of selectedSymbols) {
    const p = Promise.resolve()
      .then(() => runOne(symbol))
      .catch((err) => {
        failed += 1;
        logScraperError({ logger, err, context: { symbol, stage: 'runOne' } });
      })
      .finally(() => inFlight.delete(p));

    inFlight.add(p);

    if (inFlight.size >= maxConcurrent) {
      // Wait for at least one to finish.
      // eslint-disable-next-line no-await-in-loop
      await Promise.race(inFlight);
    }
  }

  await Promise.allSettled(Array.from(inFlight));

  const ms = Date.now() - startedAt;
  await prisma.pipelineLog.update({
    where: { id: pipelineLog.id },
    data: {
      status: failed > 0 ? 'completed_with_errors' : 'completed',
      completedAt: new Date(),
      metrics: { ...pipelineLog.metrics, ok, failed, ms },
    },
  });

  logger?.info?.({ ok, failed, ms }, 'Fundamentals scraper finished');
  return { ok, failed, ms };
}

module.exports = { runFundamentalsScraper };
