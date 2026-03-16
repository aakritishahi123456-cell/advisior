function normalizeCompanySymbol(input) {
  if (input == null) return null;
  const raw = String(input).trim().toUpperCase();
  if (!raw) return null;
  // Keep NEPSE-like symbols (letters/numbers), drop spaces and punctuation.
  const cleaned = raw.replace(/[^A-Z0-9]/g, '');
  return cleaned || null;
}

function normalizeSector(input) {
  if (input == null) return null;
  const raw = String(input).replace(/\s+/g, ' ').trim();
  if (!raw) return null;
  return raw;
}

function normalizeText(input) {
  if (input == null) return '';
  return String(input)
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeLabelKey(input) {
  return normalizeText(input)
    .toLowerCase()
    .replace(/[’'"]/g, '')
    .replace(/[%():.,/\\\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

module.exports = {
  normalizeCompanySymbol,
  normalizeLabelKey,
  normalizeSector,
  normalizeText,
};

