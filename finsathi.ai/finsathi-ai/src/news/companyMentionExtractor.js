const { normalizeCompanySymbol, normalizeText } = require('../pipelines/fundamentals/normalization');

function normalizeForSearch(text) {
  return normalizeText(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract mentioned company symbols from a news article.
 * - Matches explicit symbols (e.g., NABIL, NABIL.NP -> NABIL)
 * - Matches company names (best-effort substring match)
 */
function extractCompanyMentions({ text, companies }) {
  const original = String(text || '');
  const t = normalizeForSearch(original);
  if (!t) return [];

  const mentions = new Set();
  for (const c of companies || []) {
    const symbol = normalizeCompanySymbol(c.symbol);
    if (!symbol) continue;

    // Symbol exact word match in original text (case-insensitive).
    if (symbol.length >= 3) {
      const re = new RegExp(`\\b${symbol}\\b`, 'i');
      if (re.test(original)) mentions.add(symbol);
    }

    // Company name match (normalized).
    const name = normalizeForSearch(c.name);
    if (name && name.length >= 6 && t.includes(name)) mentions.add(symbol);
  }

  return Array.from(mentions);
}

module.exports = { extractCompanyMentions };

