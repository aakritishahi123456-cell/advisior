const { buildLabelValueMapFromTables, findValueBySynonyms, loadHtml, parseNumberString, parsePercentString } = require('../parser');
const { normalizeText } = require('../normalization');

function buildCompanyUrl(symbol) {
  const base = process.env.SHARESANSAR_BASE_URL || 'https://www.sharesansar.com';
  return `${base.replace(/\/$/, '')}/company/${encodeURIComponent(symbol)}`;
}

function extractCompanyName($) {
  const h1 = normalizeText($('h1').first().text());
  if (h1) return h1;
  const og = normalizeText($('meta[property="og:title"]').attr('content'));
  if (og) return og;
  const title = normalizeText($('title').text());
  return title || null;
}

function parseSharesansarFundamentals(html, symbol) {
  const $ = loadHtml(html);
  const map = buildLabelValueMapFromTables($);

  const sector = findValueBySynonyms(map, ['sector']);
  const eps = findValueBySynonyms(map, ['eps', 'earning per share']);
  const peRatio = findValueBySynonyms(map, ['pe ratio', 'p e ratio', 'p/e', 'p/e ratio']);
  const bookValue = findValueBySynonyms(map, ['book value', 'bv', 'bvps']);
  const roe = findValueBySynonyms(map, ['roe', 'return on equity']);
  const netProfit = findValueBySynonyms(map, ['net profit', 'profit after tax', 'pat']);
  const revenue = findValueBySynonyms(map, ['revenue', 'total revenue', 'sales', 'operating revenue']);
  const dividendYield = findValueBySynonyms(map, ['dividend yield', 'dividend yield %']);
  const marketCap = findValueBySynonyms(map, ['market cap', 'market capitalization', 'market capitalisation']);

  // Sharesansar often uses % for yield/roe.
  return {
    symbol,
    companyName: extractCompanyName($),
    sector: normalizeText(sector) || null,
    eps: parseNumberString(eps),
    peRatio: parseNumberString(peRatio),
    bookValue: parseNumberString(bookValue),
    roe: roe && roe.includes('%') ? parsePercentString(roe) : parseNumberString(roe),
    netProfit: parseNumberString(netProfit),
    revenue: parseNumberString(revenue),
    dividendYield: dividendYield && dividendYield.includes('%') ? parsePercentString(dividendYield) : parseNumberString(dividendYield),
    marketCap: parseNumberString(marketCap),
  };
}

module.exports = {
  id: 'sharesansar',
  buildCompanyUrl,
  parseSharesansarFundamentals,
};
