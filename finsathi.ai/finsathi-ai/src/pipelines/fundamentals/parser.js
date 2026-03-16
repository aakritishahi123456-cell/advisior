const cheerio = require('cheerio');
const { normalizeLabelKey, normalizeText } = require('./normalization');

function buildLabelValueMapFromTables($) {
  const map = new Map();

  $('tr').each((_, tr) => {
    const $tr = $(tr);
    const cells = $tr.find('th,td').toArray();
    if (cells.length < 2) return;

    const label = normalizeLabelKey($(cells[0]).text());
    const value = normalizeText($(cells[cells.length - 1]).text());
    if (!label || !value) return;
    if (!map.has(label)) map.set(label, value);
  });

  return map;
}

function findValueBySynonyms(map, synonyms) {
  if (!map || map.size === 0) return null;

  const keys = Array.from(map.keys());
  for (const syn of synonyms) {
    const target = normalizeLabelKey(syn);
    if (!target) continue;

    if (map.has(target)) return map.get(target);

    const includes = keys.find((k) => k.includes(target) || target.includes(k));
    if (includes) return map.get(includes);
  }

  return null;
}

function parseNumberString(input) {
  const raw = normalizeText(input);
  if (!raw) return null;
  if (/^(n\/a|na|nil|none|-|—)$/i.test(raw)) return null;

  let s = raw;
  // Handle "(123.45)" negatives.
  let isNegative = false;
  const parenMatch = s.match(/^\(\s*(.+?)\s*\)$/);
  if (parenMatch) {
    isNegative = true;
    s = parenMatch[1];
  }

  // Strip currency/unit labels but keep unit words for multiplier detection.
  const unitMatch = s.match(/(crore|cr\b|lakh|arab|b\b|m\b|k\b)/i);
  const unitToken = unitMatch ? unitMatch[1].toLowerCase() : null;

  s = s
    .replace(/,/g, '')
    .replace(/rs\.?/gi, '')
    .replace(/npr/gi, '')
    .replace(/(crore|cr\b|lakh|arab|b\b|m\b|k\b)/gi, '')
    .replace(/[^0-9.+-]/g, '')
    .trim();

  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;

  let mult = 1;
  if (unitToken) {
    if (unitToken.startsWith('cr') || unitToken === 'crore') mult = 1e7;
    else if (unitToken === 'lakh') mult = 1e5;
    else if (unitToken === 'arab') mult = 1e9;
    else if (unitToken === 'b') mult = 1e9;
    else if (unitToken === 'm') mult = 1e6;
    else if (unitToken === 'k') mult = 1e3;
  }

  const out = n * mult * (isNegative ? -1 : 1);
  // Prisma Decimal accepts string; avoid floating precision surprises.
  return String(out);
}

function parsePercentString(input) {
  const raw = normalizeText(input);
  if (!raw) return null;
  const s = raw.replace(/%/g, '');
  return parseNumberString(s);
}

function loadHtml(html) {
  return cheerio.load(html || '');
}

module.exports = {
  buildLabelValueMapFromTables,
  findValueBySynonyms,
  loadHtml,
  parseNumberString,
  parsePercentString,
};

