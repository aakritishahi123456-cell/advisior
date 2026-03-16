const { getPrisma } = require('../database/prismaClient');
const { getOpenAIClient } = require('../config/openai');
const { retrieveTopChunks } = require('../docs/vectorIndexer');
const { normalizeCompanySymbol } = require('../pipelines/fundamentals/normalization');

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function embedQuery({ model, text }) {
  const client = getOpenAIClient();
  const res = await client.embeddings.create({ model, input: text });
  return res.data?.[0]?.embedding || null;
}

function buildContextChunks(scored) {
  return scored.map(({ chunk, score }, i) => ({
    rank: i + 1,
    score: Number(score.toFixed(6)),
    source: {
      title: chunk.document?.title,
      symbol: chunk.document?.symbol,
      sourceUrl: chunk.document?.sourceUrl || null,
      localPath: chunk.document?.localPath || null,
      pageNumber: chunk.pageNumber,
      chunkId: chunk.id,
    },
    text: chunk.text,
    snippet: chunk.snippet || chunk.text.slice(0, 280),
  }));
}

function formatAnswerWithCitations(out) {
  const answer = String(out?.answer || '').trim();
  const citations = Array.isArray(out?.citations) ? out.citations : [];

  const lines = [];
  lines.push('Answer');
  lines.push(answer || 'Insufficient information in the indexed official documents.');
  lines.push('');

  for (const c of citations) {
    const title = c?.source_document || 'Unknown document';
    const page = c?.page_number ?? null;
    const snippet = c?.citation_snippet || '';
    lines.push('Source document');
    lines.push(String(title));
    lines.push('Page number');
    lines.push(page === null ? 'Unknown' : String(page));
    lines.push('Citation snippet');
    lines.push(String(snippet));
    lines.push('');
  }

  return lines.join('\n').trim();
}

class FinancialQAAgent {
  constructor({ logger } = {}) {
    this.name = 'FinancialQAAgent';
    this.logger = logger;
  }

  async answer({ question, symbol, topK = 8 } = {}) {
    if (!question || String(question).trim().length < 5) {
      const err = new Error('Question is required');
      err.statusCode = 400;
      throw err;
    }

    const prisma = getPrisma();
    const sym = symbol ? normalizeCompanySymbol(symbol) : null;

    const embedModel = process.env.DOCS_EMBED_MODEL || 'text-embedding-3-small';
    const queryEmbedding = await embedQuery({ model: embedModel, text: String(question) });
    if (!queryEmbedding) throw new Error('Failed to embed query');

    const scored = await retrieveTopChunks({ prisma, queryEmbedding, symbol: sym, topK });
    const context = buildContextChunks(scored);

    const client = getOpenAIClient();
    const model = process.env.DOCS_QA_MODEL || 'gpt-4.1-mini';

    const system = [
      'You are FinSathi AI: a financial document intelligence assistant.',
      'You MUST answer using ONLY the provided official document excerpts.',
      'If the excerpts do not contain the answer, say you cannot answer from the official documents.',
      'Return ONLY a single JSON object with:',
      '{',
      '  "answer": string,',
      '  "citations": [{ "source_document": string, "page_number": number, "citation_snippet": string }]',
      '}',
      'Rules:',
      '- Provide at least 1 citation for any factual claim.',
      '- citation_snippet must be a short exact excerpt from the provided context.',
      '- page_number must match the provided pageNumber.',
      '- Do not cite URLs; cite document title + page number.',
    ].join('\n');

    const user = [
      `Question: ${String(question)}`,
      sym ? `Company filter: ${sym}` : 'Company filter: (none)',
      'Official document context (JSON):',
      JSON.stringify(context),
    ].join('\n');

    const resp = await client.responses.create({
      model,
      input: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.2,
      max_output_tokens: 800,
    });

    const out = safeJsonParse(resp.output_text || '');
    if (!out) {
      return {
        ok: false,
        error: 'LLM output was not valid JSON',
        raw: resp.output_text || '',
        context,
      };
    }

    return {
      ok: true,
      result: out,
      formatted: formatAnswerWithCitations(out),
      context,
      used: {
        model,
        embedModel,
        symbol: sym,
        topK,
        contextChunks: context.length,
      },
    };
  }
}

module.exports = { FinancialQAAgent };
