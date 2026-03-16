let pdfjsLib;
try {
  // eslint-disable-next-line global-require
  pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
} catch (e) {
  pdfjsLib = null;
}

const fs = require('fs');

function requirePdfJs() {
  if (!pdfjsLib) throw new Error('Missing dependency `pdfjs-dist`. Install it to parse PDFs.');
}

function normalizeText(input) {
  return String(input || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function extractPdfPages({ filePath }) {
  requirePdfJs();
  const data = new Uint8Array(fs.readFileSync(filePath));
  const loadingTask = pdfjsLib.getDocument({ data });
  const pdf = await loadingTask.promise;

  const pages = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    // eslint-disable-next-line no-await-in-loop
    const page = await pdf.getPage(pageNumber);
    // eslint-disable-next-line no-await-in-loop
    const content = await page.getTextContent();
    const text = normalizeText(content.items.map((it) => it.str).join(' '));
    pages.push({ pageNumber, text });
  }

  return { numPages: pdf.numPages, pages };
}

module.exports = { extractPdfPages };

