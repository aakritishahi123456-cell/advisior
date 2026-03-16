const crypto = require('crypto');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const { createRateLimiter, createScraperHttpClient, requestWithRetry } = require('../pipelines/fundamentals/httpClient');
const { normalizeCompanySymbol, normalizeLabelKey, normalizeText } = require('../pipelines/fundamentals/normalization');
const { parseNumberString, parsePercentString } = require('../pipelines/fundamentals/parser');

function appendJsonLine({ filePath, record }) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, `${JSON.stringify(record)}\n`, 'utf8');
}

function logCorporateActionsError({ logger, err, context }) {
  const record = {
    ts: new Date().toISOString(),
    context: context || {},
    error: {
      message: err?.message || String(err),
      code: err?.code,
      status: err?.response?.status,
      url: err?.config?.url,
      stack: err?.stack,
    },
  };

  logger?.error?.({ ...record.context, err: record.error.message }, 'Corporate actions scrape error');

  const filePath =
    process.env.CORP_ACTIONS_ERROR_LOG ||
    path.join(process.cwd(), 'logs', 'corporate-actions-scraper-errors.log');
  appendJsonLine({ filePath, record });
}

function toDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  // eslint-disable-next-line no-restricted-globals
  return isNaN(d.getTime()) ? null : d;
}

function parseDateString(input) {
  const raw = normalizeText(input);
  if (!raw) return null;

  // Fast path for ISO-ish strings.
  const direct = toDate(raw);
  if (direct) return direct;

  // yyyy-mm-dd / yyyy/mm/dd
  let m = raw.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (m) return toDate(`${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`);

  // dd-mm-yyyy / dd/mm/yyyy
  m = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) return toDate(`${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`);

  // dd MMM yyyy (e.g., 12 Mar 2026)
  m = raw.match(/^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})$/);
  if (m) return toDate(`${m[1]} ${m[2]} ${m[3]}`);

  return null;
}

function classifyActionType(text) {
  const t = normalizeText(text).toLowerCase();
  if (!t) return null;
  if (t.includes('bonus')) return 'BONUS_SHARES';
  if (t.includes('right')) return 'RIGHTS_SHARES';
  if (t.includes('split')) return 'STOCK_SPLIT';
  if (t.includes('merge') || t.includes('merger') || t.includes('acquire')) return 'MERGER';
  if (t.includes('dividend') || t.includes('cash')) return 'DIVIDEND';
  return null;
}

function dedupeKeyForAction(action) {
  const payload = {
    symbol: action.symbol,
    actionType: action.actionType,
    announcementDate: action.announcementDate ? action.announcementDate.toISOString().slice(0, 10) : null,
    recordDate: action.recordDate ? action.recordDate.toISOString().slice(0, 10) : null,
    paymentDate: action.paymentDate ? action.paymentDate.toISOString().slice(0, 10) : null,
    dividendPercentage: action.dividendPercentage || null,
    bonusPercentage: action.bonusPercentage || null,
    rightsRatio: action.rightsRatio || null,
    description: normalizeText(action.description || '').toLowerCase(),
    source: action.source || null,
  };

  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

function findBestTables($) {
  const tables = $('table').toArray();
  if (tables.length === 0) return [];

  // Prefer tables that contain corporate-action-ish headers/labels.
  const scored = tables
    .map((t) => {
      const text = normalizeText($(t).text()).toLowerCase();
      const score =
        (text.includes('dividend') ? 2 : 0) +
        (text.includes('bonus') ? 2 : 0) +
        (text.includes('right') ? 2 : 0) +
        (text.includes('record') ? 1 : 0) +
        (text.includes('book close') ? 1 : 0) +
        (text.includes('announcement') || text.includes('announced') ? 1 : 0);
      return { t, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.map((x) => x.t);
}

function parseTableRows($, tableEl) {
  const $table = $(tableEl);
  const rows = $table.find('tr').toArray();
  if (rows.length < 2) return [];

  const headerCells = $(rows[0]).find('th,td').toArray();
  const headers = headerCells.map((c) => normalizeLabelKey($(c).text()));
  const colIndex = (synonyms) => {
    for (const syn of synonyms) {
      const target = normalizeLabelKey(syn);
      const idx = headers.findIndex((h) => h === target || h.includes(target) || target.includes(h));
      if (idx >= 0) return idx;
    }
    return -1;
  };

  const idxAction = colIndex(['action', 'type', 'event', 'particular', 'particulars', 'description']);
  const idxAnnouncement = colIndex(['announcement date', 'announce date', 'announced on', 'announcement']);
  const idxRecord = colIndex(['record date', 'book close date', 'book close', 'book closure']);
  const idxPayment = colIndex(['payment date', 'distribution date', 'cash dividend distribution', 'payment']);
  const idxDividend = colIndex(['dividend', 'cash dividend', 'dividend %', 'cash dividend %']);
  const idxBonus = colIndex(['bonus', 'bonus %', 'bonus shares', 'bonus share %']);
  const idxRights = colIndex(['right', 'rights', 'rights ratio', 'right share ratio']);

  const parsed = [];

  for (let i = 1; i < rows.length; i += 1) {
    const cells = $(rows[i]).find('td,th').toArray();
    if (cells.length < 2) continue;
    const get = (idx) => (idx >= 0 && idx < cells.length ? normalizeText($(cells[idx]).text()) : '');

    const actionText = get(idxAction) || normalizeText($(rows[i]).text());
    const actionType = classifyActionType(actionText);
    const announcementDate = parseDateString(get(idxAnnouncement)) || null;
    const recordDate = parseDateString(get(idxRecord)) || null;
    const paymentDate = parseDateString(get(idxPayment)) || null;

    const dividendText = get(idxDividend);
    const bonusText = get(idxBonus);
    const rightsText = get(idxRights);

    const dividendPercentage =
      dividendText && dividendText.includes('%') ? parsePercentString(dividendText) : parseNumberString(dividendText);
    const bonusPercentage =
      bonusText && bonusText.includes('%') ? parsePercentString(bonusText) : parseNumberString(bonusText);

    const rightsRatio = rightsText ? normalizeText(rightsText) : null;
    const description = normalizeText(actionText) || null;

    if (!actionType || !announcementDate) continue;

    parsed.push({
      actionType,
      announcementDate,
      recordDate,
      paymentDate,
      dividendPercentage,
      bonusPercentage,
      rightsRatio,
      description,
    });
  }

  return parsed;
}

function buildCompanyUrls(symbol) {
  const sharesansarBase = process.env.SHARESANSAR_BASE_URL || 'https://www.sharesansar.com';
  const merolaganiBase = process.env.MEROLAGANI_BASE_URL || 'https://merolagani.com';
  const nepseAnnouncementsTemplate = process.env.NEPSE_ANNOUNCEMENTS_URL_TEMPLATE || null;

  const urls = [
    {
      source: 'sharesansar',
      url: `${sharesansarBase.replace(/\/$/, '')}/company/${encodeURIComponent(symbol)}`,
    },
    {
      source: 'merolagani',
      url: `${merolaganiBase.replace(/\/$/, '')}/CompanyDetail.aspx?symbol=${encodeURIComponent(symbol)}`,
    },
  ];

  if (nepseAnnouncementsTemplate) {
    urls.push({
      source: 'nepse_official',
      url: nepseAnnouncementsTemplate.replace(/%SYMBOL%/g, encodeURIComponent(symbol)),
    });
  }

  return urls;
}

async function scrapeCorporateActionsForSymbol({ symbol, client, schedule, logger, retries }) {
  const urls = buildCompanyUrls(symbol);
  const actions = [];

  for (const { source, url } of urls) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const res = await schedule(() =>
        requestWithRetry(
          client,
          { method: 'GET', url },
          {
            retries,
            onRetry: ({ attempt, delayMs, err }) => {
              logger?.warn?.({ source, symbol, attempt, delayMs, status: err?.response?.status }, 'Retrying corporate actions fetch');
            },
          }
        )
      );

      const html = res?.data;
      if (typeof html !== 'string' || html.length < 50) continue;

      const $ = cheerio.load(html);
      const tables = findBestTables($);
      for (const t of tables) {
        const rows = parseTableRows($, t);
        for (const row of rows) {
          actions.push({
            symbol,
            actionType: row.actionType,
            announcementDate: row.announcementDate,
            recordDate: row.recordDate,
            paymentDate: row.paymentDate,
            dividendPercentage: row.dividendPercentage,
            bonusPercentage: row.bonusPercentage,
            rightsRatio: row.rightsRatio,
            description: row.description,
            source,
            sourceUrl: url,
            raw: { source, url, extractedFrom: 'table' },
          });
        }
      }
    } catch (err) {
      logCorporateActionsError({ logger, err, context: { symbol, source, url } });
    }
  }

  return actions;
}

class CorporateActionsService {
  constructor({ logger } = {}) {
    this.logger = logger;
  }

  async listSymbols(prisma) {
    const rows = await prisma.company.findMany({ select: { symbol: true } });
    return rows.map((r) => normalizeCompanySymbol(r.symbol)).filter(Boolean);
  }

  async upsertActions(prisma, items) {
    let stored = 0;

    for (const item of items) {
      const symbol = normalizeCompanySymbol(item.symbol);
      const actionType = item.actionType;
      const announcementDate = item.announcementDate instanceof Date ? item.announcementDate : parseDateString(item.announcementDate);
      if (!symbol || !actionType || !announcementDate) continue;

      const action = {
        symbol,
        actionType,
        announcementDate,
        recordDate: item.recordDate ? parseDateString(item.recordDate) || toDate(item.recordDate) : null,
        paymentDate: item.paymentDate ? parseDateString(item.paymentDate) || toDate(item.paymentDate) : null,
        dividendPercentage: item.dividendPercentage,
        bonusPercentage: item.bonusPercentage,
        rightsRatio: item.rightsRatio ? normalizeText(item.rightsRatio) : null,
        description: item.description ? normalizeText(item.description) : null,
        source: item.source || 'SCRAPER',
        sourceUrl: item.sourceUrl || null,
        raw: item.raw || null,
      };

      const dedupeKey = dedupeKeyForAction(action);

      await prisma.corporateAction.upsert({
        where: { dedupeKey },
        create: {
          ...action,
          dedupeKey,
        },
        update: {
          ...action,
        },
      });

      stored += 1;
    }

    return stored;
  }

  async scrapeAndStore({ prisma, symbols } = {}) {
    if (!prisma) throw new Error('CorporateActionsService.scrapeAndStore requires prisma');

    const startedAt = new Date();
    const pipelineLog = await prisma.pipelineLog.create({
      data: {
        pipelineType: 'CORPORATE_ACTIONS_AGENT',
        status: 'RUNNING',
        startedAt,
        details: {
          sources: ['sharesansar', 'merolagani', process.env.NEPSE_ANNOUNCEMENTS_URL_TEMPLATE ? 'nepse_official' : null].filter(Boolean),
        },
      },
    });

    const client = createScraperHttpClient({ timeoutMs: Number(process.env.CORP_ACTIONS_TIMEOUT_MS || 25_000) });
    const maxConcurrent = Number(process.env.CORP_ACTIONS_MAX_CONCURRENT || 2);
    const minTimeMs = Number(process.env.CORP_ACTIONS_MIN_TIME_MS || 550);
    const retries = Number(process.env.CORP_ACTIONS_RETRIES || 3);
    const schedule = createRateLimiter({ maxConcurrent, minTimeMs });

    const selectedSymbols = (symbols && symbols.length ? symbols : await this.listSymbols(prisma))
      .map(normalizeCompanySymbol)
      .filter(Boolean);

    let ok = 0;
    let failed = 0;
    let stored = 0;

    try {
      const inFlight = new Set();

      const runOne = async (symbol) => {
        const items = await scrapeCorporateActionsForSymbol({ symbol, client, schedule, logger: this.logger, retries });
        const n = await this.upsertActions(prisma, items);
        stored += n;
        ok += 1;
      };

      for (const sym of selectedSymbols) {
        const p = Promise.resolve()
          .then(() => runOne(sym))
          .catch((err) => {
            failed += 1;
            logCorporateActionsError({ logger: this.logger, err, context: { symbol: sym, stage: 'runOne' } });
          })
          .finally(() => inFlight.delete(p));

        inFlight.add(p);
        if (inFlight.size >= maxConcurrent) {
          // eslint-disable-next-line no-await-in-loop
          await Promise.race(inFlight);
        }
      }

      await Promise.allSettled(Array.from(inFlight));

      await prisma.pipelineLog.update({
        where: { id: pipelineLog.id },
        data: {
          status: failed > 0 ? 'COMPLETED_WITH_ERRORS' : 'COMPLETED',
          completedAt: new Date(),
          metrics: {
            symbols: selectedSymbols.length,
            ok,
            failed,
            stored,
            ms: Date.now() - startedAt.getTime(),
          },
        },
      });

      return { ok, failed, stored, symbols: selectedSymbols.length };
    } catch (err) {
      await prisma.pipelineLog.update({
        where: { id: pipelineLog.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          details: { ...(pipelineLog.details || {}), error: err?.message || String(err) },
        },
      });
      throw err;
    }
  }

  async getCorporateActionsBySymbol({ prisma, symbol }) {
    const sym = normalizeCompanySymbol(symbol);
    if (!sym) {
      const err = new Error('Invalid symbol');
      err.statusCode = 400;
      throw err;
    }

    const rows = await prisma.corporateAction.findMany({
      where: { symbol: sym },
      orderBy: [{ announcementDate: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        symbol: true,
        actionType: true,
        announcementDate: true,
        recordDate: true,
        paymentDate: true,
        dividendPercentage: true,
        bonusPercentage: true,
        rightsRatio: true,
        description: true,
        source: true,
        sourceUrl: true,
        createdAt: true,
      },
    });

    return rows.map((r) => ({
      ...r,
      announcementDate: r.announcementDate?.toISOString?.() || null,
      recordDate: r.recordDate?.toISOString?.() || null,
      paymentDate: r.paymentDate?.toISOString?.() || null,
      createdAt: r.createdAt?.toISOString?.() || null,
    }));
  }
}

module.exports = { CorporateActionsService };
