const { normalizeCompanySymbol, normalizeSector } = require('./normalization');

function toNullableStringDecimal(input) {
  if (input == null) return null;
  const s = String(input).trim();
  if (!s) return null;
  if (!Number.isFinite(Number(s))) return null;
  return s;
}

function validateFundamentals(input) {
  const symbol = normalizeCompanySymbol(input?.symbol);
  if (!symbol) {
    const err = new Error('Missing or invalid symbol');
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  return {
    symbol,
    companyName: input?.companyName ? String(input.companyName).trim().slice(0, 320) : null,
    sector: normalizeSector(input?.sector),
    eps: toNullableStringDecimal(input?.eps),
    peRatio: toNullableStringDecimal(input?.peRatio),
    bookValue: toNullableStringDecimal(input?.bookValue),
    roe: toNullableStringDecimal(input?.roe),
    netProfit: toNullableStringDecimal(input?.netProfit),
    revenue: toNullableStringDecimal(input?.revenue),
    dividendYield: toNullableStringDecimal(input?.dividendYield),
    marketCap: toNullableStringDecimal(input?.marketCap),
  };
}

module.exports = { validateFundamentals };
