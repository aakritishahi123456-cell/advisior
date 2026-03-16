const axios = require('axios');
const { getPrisma } = require('../database/prismaClient');
const { parseCompanies, parseDailyPrices } = require('../market/marketParser');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function asDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  // eslint-disable-next-line no-restricted-globals
  return isNaN(date.getTime()) ? null : date;
}

function toDecimalInput(value) {
  if (value === null || value === undefined) return null;
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return null;
  return String(num);
}

function toBigIntInput(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null;
    // best effort: avoid unsafe integer coercion
    if (!Number.isSafeInteger(value)) return null;
    return BigInt(value);
  }
  const text = String(value).replace(/,/g, '').trim();
  if (!/^\d+$/.test(text)) return null;
  try {
    return BigInt(text);
  } catch {
    return null;
  }
}

function unwrapData(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.result)) return payload.result;
    if (Array.isArray(payload.items)) return payload.items;
  }
  return [];
}

class NepseService {
  constructor({ logger } = {}) {
    this.logger = logger;
    this.baseUrl = process.env.NEPSE_API_BASE_URL || '';
    this.endpoints = {
      companies: process.env.NEPSE_COMPANIES_PATH || '/companies',
      pricesDaily: process.env.NEPSE_DAILY_PRICES_PATH || '/prices/daily',
      indices: process.env.NEPSE_INDICES_PATH || '/indices',
    };

    this.http = axios.create({
      timeout: Number(process.env.NEPSE_HTTP_TIMEOUT_MS || 30_000),
      headers: { 'User-Agent': 'FinSathiAI/1.0 (Market Data Agent)' },
    });
  }

  buildUrl(path) {
    if (!this.baseUrl) {
      throw new Error('NEPSE_API_BASE_URL is not set');
    }
    return new URL(path, this.baseUrl).toString();
  }

  async requestJson({ method, url, params }) {
    const maxAttempts = Number(process.env.NEPSE_HTTP_RETRIES || 3);
    const baseDelayMs = Number(process.env.NEPSE_HTTP_RETRY_DELAY_MS || 750);

    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const res = await this.http.request({ method, url, params });
        return res.data;
      } catch (err) {
        lastError = err;
        const status = err?.response?.status;
        const retryable =
          !status || (status >= 500 && status <= 599) || status === 429 || err.code === 'ECONNABORTED';

        this.logger?.warn?.(
          {
            url,
            attempt,
            maxAttempts,
            status: status || null,
            retryable,
            message: err?.message,
          },
          'NEPSE API request failed'
        );

        if (!retryable || attempt === maxAttempts) break;
        await sleep(baseDelayMs * attempt);
      }
    }
    throw lastError;
  }

  async fetchCompanies() {
    const url = this.buildUrl(this.endpoints.companies);
    const data = await this.requestJson({ method: 'GET', url });
    return parseCompanies(data);
  }

  async fetchDailyPrices(businessDateISO) {
    const url = this.buildUrl(this.endpoints.pricesDaily);
    const params = businessDateISO ? { date: businessDateISO } : undefined;
    const data = await this.requestJson({ method: 'GET', url, params });
    return parseDailyPrices(data, { businessDateISO });
  }

  async fetchIndices(businessDateISO) {
    const url = this.buildUrl(this.endpoints.indices);
    const params = businessDateISO ? { date: businessDateISO } : undefined;
    const data = await this.requestJson({ method: 'GET', url, params });
    const rows = unwrapData(data);

    const businessDate = businessDateISO ? asDate(businessDateISO) : null;

    return rows
      .map((r) => {
        const indexName = String(r.indexName || r.name || r.index || 'NEPSE').trim();
        const date = asDate(r.date || r.businessDate || businessDate) || null;
        const value = r.value ?? r.indexValue ?? r.close ?? null;
        if (!indexName || !date || value === null || value === undefined) return null;
        return {
          indexName,
          date,
          value,
          change: r.change ?? r.pointChange ?? null,
          percentChange: r.percentChange ?? r.percentageChange ?? null,
          source: r.source || 'NEPSE',
        };
      })
      .filter(Boolean);
  }

  async upsertCompanies(companies) {
    const prisma = getPrisma();
    let stored = 0;
    for (const c of companies) {
      await prisma.company.upsert({
        where: { symbol: c.symbol },
        create: {
          symbol: c.symbol,
          name: c.name,
          sector: c.sector || null,
          listedYear: c.listedYear || null,
        },
        update: {
          name: c.name,
          sector: c.sector || null,
          listedYear: c.listedYear || null,
        },
      });
      stored += 1;
    }
    return stored;
  }

  async storeDailyPrices(prices) {
    const prisma = getPrisma();
    let stored = 0;
    for (const p of prices) {
      const company = await prisma.company.findUnique({ where: { symbol: p.symbol } });
      if (!company) continue;

      await prisma.stockPrice.upsert({
        where: { symbol_date: { symbol: p.symbol, date: p.date } },
        create: {
          companyId: company.id,
          symbol: p.symbol,
          date: p.date,
          open: toDecimalInput(p.open),
          high: toDecimalInput(p.high),
          low: toDecimalInput(p.low),
          close: toDecimalInput(p.close),
          volume: toBigIntInput(p.volume),
          source: p.source || 'NEPSE',
        },
        update: {
          open: toDecimalInput(p.open),
          high: toDecimalInput(p.high),
          low: toDecimalInput(p.low),
          close: toDecimalInput(p.close),
          volume: toBigIntInput(p.volume),
        },
      });
      stored += 1;
    }
    return stored;
  }

  async storeIndices(indices) {
    const prisma = getPrisma();
    let stored = 0;
    for (const idx of indices) {
      await prisma.marketIndexDaily.upsert({
        where: { indexName_date: { indexName: idx.indexName, date: idx.date } },
        create: {
          indexName: idx.indexName,
          date: idx.date,
          value: toDecimalInput(idx.value),
          change: toDecimalInput(idx.change),
          percentChange: toDecimalInput(idx.percentChange),
          source: idx.source || 'NEPSE',
        },
        update: {
          value: toDecimalInput(idx.value),
          change: toDecimalInput(idx.change),
          percentChange: toDecimalInput(idx.percentChange),
        },
      });
      stored += 1;
    }
    return stored;
  }

  async detectAbnormalMoves({ date, thresholdPct }) {
    const prisma = getPrisma();
    const threshold = Number(thresholdPct);
    if (!Number.isFinite(threshold) || threshold <= 0) return { anomalies: 0 };

    const todays = await prisma.stockPrice.findMany({
      where: { date },
      select: { symbol: true, close: true },
    });

    let anomalies = 0;
    for (const row of todays) {
      if (!row.close) continue;
      const prev = await prisma.stockPrice.findFirst({
        where: { symbol: row.symbol, date: { lt: date } },
        orderBy: { date: 'desc' },
        select: { close: true, date: true },
      });
      if (!prev?.close) continue;

      const close = Number(row.close);
      const prevClose = Number(prev.close);
      if (!Number.isFinite(close) || !Number.isFinite(prevClose) || prevClose === 0) continue;
      const pct = ((close - prevClose) / prevClose) * 100;

      if (Math.abs(pct) >= threshold) {
        await prisma.priceAnomaly.upsert({
          where: { symbol_date: { symbol: row.symbol, date } },
          create: {
            symbol: row.symbol,
            date,
            close: toDecimalInput(close),
            prevClose: toDecimalInput(prevClose),
            percentChange: toDecimalInput(pct),
            thresholdPct: toDecimalInput(threshold),
            reason: 'ABNORMAL_DAILY_MOVE',
            details: { prevDate: prev.date.toISOString() },
          },
          update: {
            close: toDecimalInput(close),
            prevClose: toDecimalInput(prevClose),
            percentChange: toDecimalInput(pct),
            thresholdPct: toDecimalInput(threshold),
          },
        });
        anomalies += 1;
      }
    }

    return { anomalies };
  }

  async collectAndStoreDailyData({ businessDateISO } = {}) {
    const errors = [];
    const metrics = {
      companiesFetched: 0,
      companiesStored: 0,
      pricesFetched: 0,
      pricesStored: 0,
      indicesFetched: 0,
      indicesStored: 0,
      anomalies: 0,
    };

    let businessDate = businessDateISO ? asDate(businessDateISO) : null;

    try {
      const companies = await this.fetchCompanies();
      metrics.companiesFetched = companies.length;
      metrics.companiesStored = await this.upsertCompanies(companies);
    } catch (e) {
      errors.push({ stage: 'companies', message: e?.message || String(e) });
    }

    try {
      const prices = await this.fetchDailyPrices(businessDateISO);
      metrics.pricesFetched = prices.length;
      metrics.pricesStored = await this.storeDailyPrices(prices);
      if (!businessDate && prices[0]?.date) businessDate = prices[0].date;
    } catch (e) {
      errors.push({ stage: 'prices', message: e?.message || String(e) });
    }

    try {
      const indices = await this.fetchIndices(businessDateISO);
      metrics.indicesFetched = indices.length;
      metrics.indicesStored = await this.storeIndices(indices);
      if (!businessDate && indices[0]?.date) businessDate = indices[0].date;
    } catch (e) {
      errors.push({ stage: 'indices', message: e?.message || String(e) });
    }

    try {
      if (businessDate) {
        const thresholdPct = Number(process.env.ABNORMAL_MOVE_PCT || 8);
        const res = await this.detectAbnormalMoves({ date: businessDate, thresholdPct });
        metrics.anomalies = res.anomalies;
      }
    } catch (e) {
      errors.push({ stage: 'anomalies', message: e?.message || String(e) });
    }

    return {
      ...metrics,
      businessDateISO: businessDate ? businessDate.toISOString().slice(0, 10) : (businessDateISO || null),
      errors,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = { NepseService };
