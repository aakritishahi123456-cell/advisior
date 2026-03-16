const { buildLabelValueMapFromTables, findValueBySynonyms, loadHtml, parseNumberString, parsePercentString } = require('../parser');
const { normalizeText } = require('../normalization');

function buildCompanyUrl(symbol) {
  const base = process.env.MEROLAGANI_BASE_URL || 'https://merolagani.com';
  // Common public endpoint pattern for company detail pages.
  const path = process.env.MEROLAGANI_COMPANY_PATH || '/CompanyDetail.aspx';
  return `${base.replace(/\/$/, '')}${path}?symbol=${encodeURIComponent(symbol)}`;
}

function extractCompanyName($) {
  const h1 = normalizeText($('h1').first().text());
  if (h1) return h1;
  const og = normalizeText($('meta[property="og:title"]').attr('content'));
  if (og) return og;
  const title = normalizeText($('title').text());
  return title || null;
}

function parseMerolaganiFundamentals(html, symbol) {
  const $ = loadHtml(html);
  const map = buildLabelValueMapFromTables($);

  const sector = findValueBySynonyms(map, ['sector']);
  const eps = findValueBySynonyms(map, ['eps', 'earning per share']);
  const peRatio = findValueBySynonyms(map, ['pe ratio', 'p/e', 'p/e ratio']);
  const bookValue = findValueBySynonyms(map, ['book value', 'bvps', 'bv']);
  const roe = findValueBySynonyms(map, ['roe', 'return on equity']);
  const netProfit = findValueBySynonyms(map, ['net profit', 'profit after tax', 'pat']);
  const revenue = findValueBySynonyms(map, ['revenue', 'sales', 'total revenue']);
  const dividendYield = findValueBySynonyms(map, ['dividend yield', 'dividend yield %']);
  const marketCap = findValueBySynonyms(map, ['market cap', 'market capitalization', 'market capitalisation']);

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
  id: 'merolagani',
  buildCompanyUrl,
  parseMerolaganiFundamentals,
};
