const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { getPrisma } = require('../database/prismaClient');
const { logger } = require('../config/logger');
const { createRateLimiter, createScraperHttpClient, requestWithRetry } = require('../pipelines/fundamentals/httpClient');
const { normalizeCompanySymbol, normalizeText } = require('../pipelines/fundamentals/normalization');

function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

function safeName(input) {
  return normalizeText(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || 'document';
}

function defaultStorageDir() {
  return process.env.DOCS_STORAGE_DIR || path.join(process.cwd(), 'data', 'official-documents');
}

function loadManifest(manifestPath) {
  const p = manifestPath || process.env.DOCS_MANIFEST || path.join(process.cwd(), 'data', 'documents', 'manifest.json');
  if (!fs.existsSync(p)) {
    const err = new Error(`Manifest not found: ${p}`);
    err.code = 'MANIFEST_MISSING';
    throw err;
  }
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function normalizeDocType(input) {
  const t = String(input || '').toUpperCase().replace(/[\s-]+/g, '_');
  const allowed = new Set([
    'ANNUAL_REPORT',
    'QUARTERLY_REPORT',
    'INVESTOR_PRESENTATION',
    'FINANCIAL_DISCLOSURE',
    'OTHER',
  ]);
  return allowed.has(t) ? t : 'OTHER';
}

async function collectDocuments({ manifestPath } = {}) {
  const prisma = getPrisma();
  const manifest = loadManifest(manifestPath);
  const docs = Array.isArray(manifest?.documents) ? manifest.documents : [];

  const client = createScraperHttpClient({ timeoutMs: Number(process.env.DOCS_HTTP_TIMEOUT_MS || 30_000) });
  const schedule = createRateLimiter({
    maxConcurrent: Number(process.env.DOCS_MAX_CONCURRENT || 2),
    minTimeMs: Number(process.env.DOCS_MIN_TIME_MS || 650),
  });
  const retries = Number(process.env.DOCS_RETRIES || 3);

  const storageDir = defaultStorageDir();
  fs.mkdirSync(storageDir, { recursive: true });

  let downloaded = 0;
  let skipped = 0;

  for (const d of docs) {
    const symbol = normalizeCompanySymbol(d.symbol);
    const url = d.url ? String(d.url).trim() : null;
    const local = d.localPath ? String(d.localPath).trim() : null;
    const title = normalizeText(d.title || `${symbol || 'NEPSE'} Document`);
    const isOfficial = d.isOfficial !== false;

    if (!symbol) {
      logger.warn({ title }, 'Skipping doc with invalid symbol');
      continue;
    }

    if (!isOfficial) {
      logger.warn({ symbol, title }, 'Skipping non-official document');
      continue;
    }

    let filePath = null;
    if (local) {
      filePath = path.isAbsolute(local) ? local : path.join(process.cwd(), local);
      if (!fs.existsSync(filePath)) {
        logger.warn({ symbol, localPath: filePath }, 'Local PDF missing, skipping');
        continue;
      }
    } else if (url) {
      const companyDir = path.join(storageDir, symbol);
      fs.mkdirSync(companyDir, { recursive: true });

      const fname = `${safeName(title)}.pdf`;
      filePath = path.join(companyDir, fname);

      // Skip download if file exists.
      if (!fs.existsSync(filePath)) {
        // eslint-disable-next-line no-await-in-loop
        const res = await schedule(() =>
          requestWithRetry(client, { method: 'GET', url, responseType: 'arraybuffer' }, { retries })
        );
        fs.writeFileSync(filePath, Buffer.from(res.data));
        downloaded += 1;
      } else {
        skipped += 1;
      }
    } else {
      logger.warn({ symbol, title }, 'Skipping doc without url or localPath');
      continue;
    }

    const digest = sha256File(filePath);
    const docType = normalizeDocType(d.docType);
    const publishedAt = d.publishedAt ? new Date(d.publishedAt) : null;
    const source = normalizeText(d.source || 'OFFICIAL');

    await prisma.officialDocument.upsert({
      where: { sha256: digest },
      create: {
        symbol,
        docType,
        title,
        source,
        sourceUrl: url,
        localPath: filePath,
        sha256: digest,
        publishedAt,
        isOfficial: true,
        raw: d,
      },
      update: {
        symbol,
        docType,
        title,
        source,
        sourceUrl: url,
        localPath: filePath,
        publishedAt,
        isOfficial: true,
        raw: d,
      },
    });
  }

  return { downloaded, skipped, total: docs.length };
}

module.exports = { collectDocuments };

