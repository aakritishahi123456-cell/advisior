const { normalizeCompanySymbol } = require('../pipelines/fundamentals/normalization');

function asDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  // eslint-disable-next-line no-restricted-globals
  return isNaN(date.getTime()) ? null : date;
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

function parseCompanies(payload) {
  const rows = unwrapData(payload);
  return rows
    .map((r) => {
      const symbol = normalizeCompanySymbol(r.symbol || r.symbolCode || r.ticker || '');
      const name = String(r.name || r.companyName || '').trim();
      if (!symbol || !name) return null;
      return {
        symbol,
        name,
        sector: r.sector ? String(r.sector).trim() : null,
        listedYear: r.listedYear ? Number(r.listedYear) : null,
      };
    })
    .filter(Boolean);
}

function parseDailyPrices(payload, { businessDateISO } = {}) {
  const rows = unwrapData(payload);
  const fallbackDate = businessDateISO ? asDate(businessDateISO) : null;

  return rows
    .map((r) => {
      const symbol = normalizeCompanySymbol(r.symbol || r.symbolCode || r.ticker || '');
      const date = asDate(r.date || r.businessDate || fallbackDate) || null;
      if (!symbol || !date) return null;

      return {
        symbol,
        date,
        open: r.open ?? r.openPrice ?? null,
        high: r.high ?? r.highPrice ?? null,
        low: r.low ?? r.lowPrice ?? null,
        close: r.close ?? r.closePrice ?? null,
        volume: r.volume ?? r.totalVolume ?? null,
        source: r.source || 'NEPSE',
      };
    })
    .filter(Boolean);
}

module.exports = {
  asDate,
  parseCompanies,
  parseDailyPrices,
  unwrapData,
};

