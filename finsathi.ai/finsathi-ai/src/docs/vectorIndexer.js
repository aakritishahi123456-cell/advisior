const { getPrisma } = require('../database/prismaClient');
const { logger } = require('../config/logger');
const { extractPdfPages } = require('./pdfParser');
const { chunkText } = require('./textChunker');
const { getOpenAIClient } = require('../config/openai');

function cosineSimilarity(a, b) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i += 1) {
    const x = a[i];
    const y = b[i];
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom > 0 ? dot / denom : 0;
}

async function embedTexts({ model, texts }) {
  const client = getOpenAIClient();
  const res = await client.embeddings.create({
    model,
    input: texts,
  });
  return res.data.map((d) => d.embedding);
}

async function indexDocument({ prisma, doc, embeddingModel, maxChunksPerDoc }) {
  const parsed = await extractPdfPages({ filePath: doc.localPath });
  const allChunks = [];

  for (const page of parsed.pages) {
    const chunks = chunkText({
      text: page.text,
      maxChars: Number(process.env.DOCS_CHUNK_MAX_CHARS || 1400),
      overlapChars: Number(process.env.DOCS_CHUNK_OVERLAP_CHARS || 150),
    });
    for (const c of chunks) {
      allChunks.push({
        pageNumber: page.pageNumber,
        text: c,
        snippet: c.slice(0, 280),
      });
    }
  }

  const limited = allChunks.slice(0, maxChunksPerDoc);
  if (limited.length === 0) return { chunks: 0 };

  // Embed in batches.
  const batchSize = Math.max(1, Math.min(64, Number(process.env.DOCS_EMBED_BATCH || 32)));
  let offset = 0;
  let chunkIndex = 0;

  while (offset < limited.length) {
    const batch = limited.slice(offset, offset + batchSize);
    // eslint-disable-next-line no-await-in-loop
    const embeddings = await embedTexts({ model: embeddingModel, texts: batch.map((x) => x.text) });

    for (let i = 0; i < batch.length; i += 1) {
      const row = batch[i];
      const embedding = embeddings[i];
      // eslint-disable-next-line no-await-in-loop
      await prisma.officialDocumentChunk.upsert({
        where: { documentId_chunkIndex: { documentId: doc.id, chunkIndex } },
        create: {
          documentId: doc.id,
          chunkIndex,
          pageNumber: row.pageNumber,
          text: row.text,
          snippet: row.snippet,
          embedding,
          embeddingModel,
        },
        update: {
          pageNumber: row.pageNumber,
          text: row.text,
          snippet: row.snippet,
          embedding,
          embeddingModel,
        },
      });
      chunkIndex += 1;
    }

    offset += batchSize;
  }

  return { chunks: limited.length };
}

async function indexOfficialDocuments({ symbol } = {}) {
  const prisma = getPrisma();
  const embeddingModel = process.env.DOCS_EMBED_MODEL || 'text-embedding-3-small';
  const maxChunksPerDoc = Math.max(10, Math.min(5000, Number(process.env.DOCS_MAX_CHUNKS_PER_DOC || 1200)));

  const docs = await prisma.officialDocument.findMany({
    where: {
      isOfficial: true,
      ...(symbol ? { symbol } : {}),
    },
    orderBy: [{ collectedAt: 'desc' }],
  });

  let indexedDocs = 0;
  let indexedChunks = 0;

  for (const doc of docs) {
    // eslint-disable-next-line no-await-in-loop
    const existing = await prisma.officialDocumentChunk.count({ where: { documentId: doc.id } });
    if (existing > 0 && process.env.DOCS_REINDEX !== 'true') continue;

    logger.info({ docId: doc.id, symbol: doc.symbol, title: doc.title }, 'Indexing official document');
    // eslint-disable-next-line no-await-in-loop
    const res = await indexDocument({ prisma, doc, embeddingModel, maxChunksPerDoc });
    indexedDocs += 1;
    indexedChunks += res.chunks;
  }

  return { indexedDocs, indexedChunks };
}

async function retrieveTopChunks({ prisma, queryEmbedding, symbol, topK = 8 }) {
  // NOTE: This is a JSON-vector store fallback (brute force). For large scale, switch to pgvector.
  const docs = await prisma.officialDocument.findMany({
    where: { isOfficial: true, ...(symbol ? { symbol } : {}) },
    select: { id: true, symbol: true, title: true },
  });
  const docIds = docs.map((d) => d.id);

  const chunks = await prisma.officialDocumentChunk.findMany({
    where: { documentId: { in: docIds } },
    select: {
      id: true,
      documentId: true,
      chunkIndex: true,
      pageNumber: true,
      text: true,
      snippet: true,
      embedding: true,
      document: { select: { symbol: true, title: true, sourceUrl: true, localPath: true } },
    },
  });

  const scored = chunks
    .map((c) => {
      const emb = Array.isArray(c.embedding) ? c.embedding : null;
      if (!emb || emb.length !== queryEmbedding.length) return null;
      return { chunk: c, score: cosineSimilarity(queryEmbedding, emb) };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored;
}

module.exports = {
  indexOfficialDocuments,
  retrieveTopChunks,
};

