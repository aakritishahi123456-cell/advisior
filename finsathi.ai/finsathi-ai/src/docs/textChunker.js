function normalizeText(input) {
  return String(input || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitIntoParagraphs(text) {
  const raw = String(text || '').replace(/\r/g, '');
  // keep blank-line boundaries if present; otherwise fall back to sentence-ish splitting
  const parts = raw
    .split(/\n\s*\n+/g)
    .map((p) => normalizeText(p))
    .filter(Boolean);

  if (parts.length > 1) return parts;

  return normalizeText(raw)
    .split(/(?<=[.?!])\s+(?=[A-Z0-9])/g)
    .map((s) => normalizeText(s))
    .filter(Boolean);
}

function chunkText({ text, maxChars = 1400, overlapChars = 150 } = {}) {
  const paragraphs = splitIntoParagraphs(text);
  const chunks = [];

  let current = '';
  for (const p of paragraphs) {
    if (!current) {
      current = p;
      continue;
    }

    if ((current.length + 1 + p.length) <= maxChars) {
      current = `${current}\n${p}`;
      continue;
    }

    chunks.push(current);
    const overlap = current.slice(Math.max(0, current.length - overlapChars));
    current = overlap ? `${overlap}\n${p}` : p;
  }

  if (current) chunks.push(current);
  return chunks.map((c) => normalizeText(c)).filter(Boolean);
}

module.exports = { chunkText, normalizeText, splitIntoParagraphs };

