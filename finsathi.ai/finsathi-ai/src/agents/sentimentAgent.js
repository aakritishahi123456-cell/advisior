const crypto = require('crypto');

const { getOpenAIClient } = require('../config/openai');
const { getPrisma } = require('../database/prismaClient');
const { logger } = require('../config/logger');

const { NewsService } = require('../services/newsService');
const { extractCompanyMentions } = require('../news/companyMentionExtractor');

function clamp(num, min, max) {
  return Math.min(max, Math.max(min, num));
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function llmClassifySentiment({ model, symbol, article }) {
  const client = getOpenAIClient();

  const system = [
    'You are a financial news sentiment classifier for Nepal Stock Exchange (NEPSE).',
    'Classify sentiment for the *specific mentioned company* (symbol provided) in the given article.',
    'Return ONLY a single JSON object (no markdown) with fields:',
    '{ "sentiment_label": "positive"|"neutral"|"negative", "confidence": number, "sentiment_score": number }',
    'Where sentiment_score is in [-1, 1] and confidence is in [0, 1].',
    'Base your decision only on the article content; if unclear, use neutral with lower confidence.',
  ].join('\n');

  const user = [
    `Company symbol: ${symbol}`,
    `Title: ${article.title}`,
    `Source: ${article.source}`,
    `PublishedAt: ${article.publishedAt.toISOString()}`,
    `Content: ${article.content || ''}`,
  ].join('\n');

  const response = await client.responses.create({
    model,
    input: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    temperature: 0.1,
    max_output_tokens: 250,
  });

  const out = response.output_text || '';
  return safeJsonParse(out);
}

function mapLabel(label) {
  const l = String(label || '').toLowerCase().trim();
  if (l === 'positive') return 'POSITIVE';
  if (l === 'negative') return 'NEGATIVE';
  return 'NEUTRAL';
}

function toDecimalInput(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return String(num);
}

function stableKey({ symbol, articleId }) {
  return crypto.createHash('sha256').update(`${symbol}:${articleId}`).digest('hex');
}

class SentimentAgent {
  constructor({ logger: injectedLogger } = {}) {
    this.name = 'SentimentAgent';
    this.logger = injectedLogger || logger;
    this.newsService = new NewsService({ logger: this.logger });
  }

  async run({ logger: runLogger } = {}) {
    const log = runLogger || this.logger;
    const prisma = getPrisma();

    const startedAt = new Date();
    const pipeline = await prisma.pipelineLog.create({
      data: {
        pipelineType: 'NEWS_SENTIMENT_AGENT',
        status: 'RUNNING',
        startedAt,
        details: {
          rssFeeds: this.newsService.getRssFeeds(),
          newsApiEnabled: Boolean(process.env.NEWSAPI_KEY),
        },
      },
    });

    const lookbackHours = clamp(Number(process.env.NEWS_LOOKBACK_HOURS || 24), 1, 168);
    const cutoff = new Date(Date.now() - lookbackHours * 60 * 60 * 1000);
    const model = process.env.NEWS_SENTIMENT_MODEL || 'gpt-4.1-mini';

    try {
      // Step 1: collect + store articles
      const collected = await this.newsService.collectLatest();
      const storedArticles = await this.newsService.storeArticles({ prisma, articles: collected });

      // Step 2: pick recent articles to analyze
      const articles = await prisma.newsArticle.findMany({
        where: { publishedAt: { gte: cutoff } },
        orderBy: { publishedAt: 'desc' },
        select: { id: true, title: true, source: true, url: true, publishedAt: true, content: true },
        take: Number(process.env.NEWS_ANALYZE_LIMIT || 150),
      });

      const companies = await prisma.company.findMany({ select: { symbol: true, name: true } });

      let mentionsFound = 0;
      let sentimentsStored = 0;
      let llmCalls = 0;
      let skipped = 0;

      for (const article of articles) {
        const text = `${article.title}\n${article.content || ''}`;
        const mentions = extractCompanyMentions({ text, companies });
        if (mentions.length === 0) continue;
        mentionsFound += mentions.length;

        for (const symbol of mentions) {
          const key = stableKey({ symbol, articleId: article.id });
          // Skip if already exists
          // eslint-disable-next-line no-await-in-loop
          const existing = await prisma.newsSentiment.findUnique({
            where: { symbol_articleId: { symbol, articleId: article.id } },
            select: { id: true },
          });
          if (existing) {
            skipped += 1;
            continue;
          }

          let llm = null;
          try {
            // eslint-disable-next-line no-await-in-loop
            llm = await llmClassifySentiment({ model, symbol, article });
            llmCalls += 1;
          } catch (err) {
            log?.error?.({ symbol, articleId: article.id, err: err?.message }, 'LLM sentiment classification failed');
          }

          const labelEnum = mapLabel(llm?.sentiment_label);
          const sentimentScore = toDecimalInput(
            llm?.sentiment_score ??
              (labelEnum === 'POSITIVE' ? 0.5 : labelEnum === 'NEGATIVE' ? -0.5 : 0)
          );
          const confidenceScore = toDecimalInput(llm?.confidence ?? null);

          // eslint-disable-next-line no-await-in-loop
          await prisma.newsSentiment.upsert({
            where: { symbol_articleId: { symbol, articleId: article.id } },
            create: {
              symbol,
              articleId: article.id,
              sentimentLabel: labelEnum,
              sentimentScore: sentimentScore || '0',
              confidenceScore,
              model,
              raw: { llm, key, articleUrl: article.url },
            },
            update: {
              sentimentLabel: labelEnum,
              sentimentScore: sentimentScore || '0',
              confidenceScore,
              model,
              raw: { llm, key, articleUrl: article.url },
            },
          });

          sentimentsStored += 1;
        }
      }

      await prisma.pipelineLog.update({
        where: { id: pipeline.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          metrics: {
            collected: collected.length,
            storedArticles,
            analyzedArticles: articles.length,
            mentionsFound,
            sentimentsStored,
            llmCalls,
            skipped,
          },
        },
      });

      return {
        ok: true,
        collected: collected.length,
        storedArticles,
        analyzedArticles: articles.length,
        mentionsFound,
        sentimentsStored,
        llmCalls,
        skipped,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      await prisma.pipelineLog.update({
        where: { id: pipeline.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          details: { ...(pipeline.details || {}), error: err?.message || String(err) },
        },
      });
      throw err;
    }
  }
}

module.exports = { SentimentAgent };
