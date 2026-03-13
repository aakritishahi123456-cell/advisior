const { getOpenAIClient } = require('../config/openai');
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
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function formatPct(value) {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return Number(num.toFixed(2));
}

function formatNum(value, decimals = 2) {
  const num = toNumber(value);
  if (num === null) return null;
  return Number(num.toFixed(decimals));
}

function marketDirectionFromIndex(indexPercentChange) {
  if (indexPercentChange === null || indexPercentChange === undefined) return 'UNKNOWN';
  if (indexPercentChange > 0.05) return 'UP';
  if (indexPercentChange < -0.05) return 'DOWN';
  return 'FLAT';
}

function summarizeSectorActivity(sectorRows) {
  return sectorRows
    .map((s) => ({
      sector: s.sector,
      avgChangePct: formatPct(s.avgChangePct),
      advancers: s.advancers,
      decliners: s.decliners,
      unchanged: s.unchanged,
      total: s.total,
    }))
    .sort((a, b) => (b.avgChangePct ?? 0) - (a.avgChangePct ?? 0));
}

function buildFallbackText(report) {
  const idx = report.market?.index || null;
  const direction = report.market?.direction || 'UNKNOWN';
  const topG = report.topGainers || [];
  const topL = report.topLosers || [];
  const sectors = report.sectors?.slice?.(0, 3) || [];

  const idxLine = idx
    ? `${idx.indexName}: ${idx.value ?? '—'} (${idx.percentChange ?? '—'}%)`
    : 'NEPSE index: —';

  const gainersLine = topG.length
    ? `Top gainers: ${topG.map((x) => `${x.symbol} ${x.percentChangePct}%`).join(', ')}`
    : 'Top gainers: —';

  const losersLine = topL.length
    ? `Top losers: ${topL.map((x) => `${x.symbol} ${x.percentChangePct}%`).join(', ')}`
    : 'Top losers: —';

  const sectorLine = sectors.length
    ? `Notable sectors: ${sectors.map((s) => `${s.sector} ${s.avgChangePct}%`).join(', ')}`
    : 'Notable sectors: —';

  return [
    `Daily NEPSE Summary (${report.date})`,
    `Market direction: ${direction}`,
    idxLine,
    gainersLine,
    losersLine,
    sectorLine,
  ].join('\n');
}

async function llmGenerate({ model, maxTokens, input }) {
  const client = getOpenAIClient();
  const response = await client.responses.create({
    model,
    input,
    temperature: 0.3,
    max_output_tokens: maxTokens,
  });
  return response.output_text || '';
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

class InsightAgent {
  constructor() {
    this.name = 'InsightAgent';
  }

  async computeDailySnapshot({ date }) {
    const prisma = getPrisma();
    const businessDate = startOfDayUTC(date);

    const index = await prisma.marketIndexDaily.findFirst({
      where: { date: businessDate },
      orderBy: [{ indexName: 'asc' }],
    });

    const indexForDirection = index
      ? {
          indexName: index.indexName,
          value: formatNum(index.value, 4),
          change: formatNum(index.change, 4),
          percentChange: formatPct(index.percentChange),
        }
      : null;

    const direction = marketDirectionFromIndex(indexForDirection?.percentChange ?? null);

    // Compute percent changes using today close vs previous close
    const todays = await prisma.stockPrice.findMany({
      where: { date: businessDate },
      select: { symbol: true, close: true, company: { select: { name: true, sector: true } } },
    });

    const changes = [];
    for (const row of todays) {
      const close = toNumber(row.close);
      if (close === null) continue;

      const prev = await prisma.stockPrice.findFirst({
        where: { symbol: row.symbol, date: { lt: businessDate } },
        orderBy: { date: 'desc' },
        select: { close: true, date: true },
      });
      const prevClose = toNumber(prev?.close);
      if (prevClose === null || prevClose === 0) continue;

      const pct = ((close - prevClose) / prevClose) * 100;
      changes.push({
        symbol: row.symbol,
        name: row.company?.name || null,
        sector: row.company?.sector || 'UNKNOWN',
        close: formatNum(close, 2),
        prevClose: formatNum(prevClose, 2),
        percentChangePct: formatPct(pct),
      });
    }

    changes.sort((a, b) => (b.percentChangePct ?? 0) - (a.percentChangePct ?? 0));
    const topN = clamp(Number(process.env.INSIGHTS_TOP_N || 10), 3, 50);

    const topGainers = changes.slice(0, topN);
    const topLosers = [...changes].sort((a, b) => (a.percentChangePct ?? 0) - (b.percentChangePct ?? 0)).slice(0, topN);

    const breadth = {
      advancers: changes.filter((x) => (x.percentChangePct ?? 0) > 0).length,
      decliners: changes.filter((x) => (x.percentChangePct ?? 0) < 0).length,
      unchanged: changes.filter((x) => (x.percentChangePct ?? 0) === 0).length,
      total: changes.length,
    };

    // Sector activity: average move + breadth per sector
    const sectorMap = new Map();
    for (const c of changes) {
      const sector = c.sector || 'UNKNOWN';
      const existing = sectorMap.get(sector) || { sector, sum: 0, total: 0, advancers: 0, decliners: 0, unchanged: 0 };
      existing.sum += c.percentChangePct ?? 0;
      existing.total += 1;
      if ((c.percentChangePct ?? 0) > 0) existing.advancers += 1;
      else if ((c.percentChangePct ?? 0) < 0) existing.decliners += 1;
      else existing.unchanged += 1;
      sectorMap.set(sector, existing);
    }

    const sectorRows = Array.from(sectorMap.values()).map((s) => ({
      sector: s.sector,
      avgChangePct: s.total ? s.sum / s.total : 0,
      advancers: s.advancers,
      decliners: s.decliners,
      unchanged: s.unchanged,
      total: s.total,
    }));

    const sectors = summarizeSectorActivity(sectorRows);

    // Trend detection: 5-day change from index series
    const indexSeries = await prisma.marketIndexDaily.findMany({
      where: index ? { indexName: index.indexName } : undefined,
      orderBy: { date: 'desc' },
      take: 10,
      select: { date: true, value: true },
    });
    const seriesAsc = [...indexSeries].reverse().map((x) => toNumber(x.value)).filter((x) => x !== null);
    let trend = 'UNKNOWN';
    if (seriesAsc.length >= 6) {
      const last = seriesAsc[seriesAsc.length - 1];
      const prev5 = seriesAsc[seriesAsc.length - 6];
      const pct5 = prev5 ? ((last - prev5) / prev5) * 100 : 0;
      if (pct5 > 1) trend = 'UPTREND';
      else if (pct5 < -1) trend = 'DOWNTREND';
      else trend = 'SIDEWAYS';
    }

    return {
      date: businessDate.toISOString().slice(0, 10),
      market: {
        direction,
        trend,
        index: indexForDirection,
        breadth,
      },
      topGainers,
      topLosers,
      sectors,
      symbolsAnalyzed: changes.length,
    };
  }

  async run({ logger } = {}) {
    const prisma = getPrisma();
    const startedAt = new Date();

    const pipeline = await prisma.pipelineLog.create({
      data: {
        pipelineType: 'INSIGHT_GENERATION_AGENT',
        status: 'RUNNING',
        startedAt,
        details: {
          llmEnabled: process.env.INSIGHTS_LLM_ENABLED === 'true',
          model: process.env.INSIGHTS_LLM_MODEL || null,
        },
      },
    });

    try {
      logger?.info?.({ agent: this.name, pipelineId: pipeline.id }, 'Generating daily NEPSE insights');

      const latestDateRow =
        (await prisma.stockPrice.findFirst({ orderBy: { date: 'desc' }, select: { date: true } })) ||
        (await prisma.marketIndexDaily.findFirst({ orderBy: { date: 'desc' }, select: { date: true } }));

      if (!latestDateRow?.date) {
        const result = {
          ok: false,
          error: 'No market data available. Run MarketAgent first.',
          timestamp: new Date().toISOString(),
        };

        await prisma.pipelineLog.update({
          where: { id: pipeline.id },
          data: { status: 'FAILED', completedAt: new Date(), details: { ...(pipeline.details || {}), error: result.error } },
        });

        return result;
      }

      const snapshot = await this.computeDailySnapshot({ date: latestDateRow.date });

      const llmEnabled = process.env.INSIGHTS_LLM_ENABLED === 'true';
      const model = process.env.INSIGHTS_LLM_MODEL || 'gpt-4.1-mini';
      const maxTokens = clamp(Number(process.env.INSIGHTS_LLM_MAX_TOKENS || 700), 200, 2000);

      let text = buildFallbackText(snapshot);
      let llmJson = null;
      let usedModel = null;

      if (llmEnabled) {
        const system = [
          'You are FinSathi AI, a financial insights generator for Nepal Stock Exchange (NEPSE).',
          'Return a SINGLE JSON object only (no markdown), with fields:',
          '{',
          '  "headline": string,',
          '  "market_direction": "UP"|"DOWN"|"FLAT"|"UNKNOWN",',
          '  "trend": "UPTREND"|"DOWNTREND"|"SIDEWAYS"|"UNKNOWN",',
          '  "summary_text": string,',
          '  "highlights": string[],',
          '  "notable_sectors": [{"sector": string, "avg_change_pct": number, "comment": string}],',
          '  "top_gainers": [{"symbol": string, "percent_change_pct": number, "note": string}],',
          '  "top_losers": [{"symbol": string, "percent_change_pct": number, "note": string}]',
          '}',
          'Write in clear English. Do not invent numbers; use the provided data and reference it.',
        ].join('\n');

        const user = `Use this market snapshot JSON to generate the report:\n${JSON.stringify(snapshot)}`;

        const output = await llmGenerate({
          model,
          maxTokens,
          input: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
        });

        llmJson = safeJsonParse(output);
        usedModel = model;

        if (llmJson?.summary_text) {
          text = [
            llmJson.headline ? llmJson.headline : `Daily NEPSE Summary (${snapshot.date})`,
            '',
            llmJson.summary_text,
            '',
            'Top gainers:',
            ...(Array.isArray(llmJson.top_gainers) ? llmJson.top_gainers.slice(0, 10).map((x) => `- ${x.symbol}: ${x.percent_change_pct}% ${x.note ? `(${x.note})` : ''}`) : []),
            '',
            'Top losers:',
            ...(Array.isArray(llmJson.top_losers) ? llmJson.top_losers.slice(0, 10).map((x) => `- ${x.symbol}: ${x.percent_change_pct}% ${x.note ? `(${x.note})` : ''}`) : []),
          ].join('\n');
        }
      }

      const stored = await prisma.insightReport.upsert({
        where: { date: startOfDayUTC(snapshot.date) },
        create: {
          date: startOfDayUTC(snapshot.date),
          summary: llmJson?.summary_text || `NEPSE ${snapshot.market.direction}`,
          details: {
            snapshot,
            llm: llmJson,
            text,
          },
          model: usedModel,
        },
        update: {
          summary: llmJson?.summary_text || `NEPSE ${snapshot.market.direction}`,
          details: {
            snapshot,
            llm: llmJson,
            text,
          },
          model: usedModel,
        },
      });

      const result = {
        ok: true,
        date: snapshot.date,
        report: {
          json: {
            snapshot,
            llm: llmJson,
          },
          text,
        },
        stored: { id: stored.id },
        timestamp: new Date().toISOString(),
      };

      await prisma.pipelineLog.update({
        where: { id: pipeline.id },
        data: {
          status: llmEnabled && !llmJson ? 'COMPLETED_WITH_ERRORS' : 'COMPLETED',
          completedAt: new Date(),
          metrics: { symbolsAnalyzed: snapshot.symbolsAnalyzed, llmEnabled, llmParsed: Boolean(llmJson) },
          details: {
            ...(pipeline.details || {}),
            date: snapshot.date,
            direction: snapshot.market.direction,
            trend: snapshot.market.trend,
          },
        },
      });

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
      logger?.error?.({ agent: this.name, pipelineId: pipeline.id, err: err?.message }, 'Insight agent failed');
      throw err;
    }
  }
}

module.exports = { InsightAgent };
