const cheerio = require('cheerio');

const { createRateLimiter, createScraperHttpClient, requestWithRetry } = require('../pipelines/fundamentals/httpClient');
const { normalizeText } = require('../pipelines/fundamentals/normalization');

function toDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  // eslint-disable-next-line no-restricted-globals
  return isNaN(d.getTime()) ? null : d;
}

function normalizeUrl(input) {
  const raw = normalizeText(input);
  if (!raw) return null;
  try {
    return new URL(raw).toString();
  } catch {
    return null;
  }
}

function parseRss(xml, { source }) {
  const $ = cheerio.load(xml || '', { xmlMode: true });
  const items = [];

  $('item').each((_, el) => {
    const title = normalizeText($(el).find('title').first().text());
    const link = normalizeText($(el).find('link').first().text());
    const guid = normalizeText($(el).find('guid').first().text());
    const url = normalizeUrl(link) || normalizeUrl(guid);
    const pubDate = normalizeText($(el).find('pubDate').first().text());
    const isoDate = normalizeText($(el).find('published').first().text());

    const description = normalizeText($(el).find('description').first().text());
    const contentEncoded = normalizeText($(el).find('content\\:encoded').first().text());
    const content = contentEncoded || description || null;

    const publishedAt = toDate(pubDate) || toDate(isoDate) || null;
    if (!title || !url || !publishedAt) return;

    items.push({
      title,
      source,
      url,
      publishedAt,
      content,
      raw: { type: 'rss' },
    });
  });

  // Atom feeds (entry)
  $('entry').each((_, el) => {
    const title = normalizeText($(el).find('title').first().text());
    const linkHref = $(el).find('link').first().attr('href');
    const url = normalizeUrl(linkHref);
    const published = normalizeText($(el).find('published').first().text());
    const updated = normalizeText($(el).find('updated').first().text());
    const summary = normalizeText($(el).find('summary').first().text());
    const contentText = normalizeText($(el).find('content').first().text());
    const content = contentText || summary || null;
    const publishedAt = toDate(published) || toDate(updated) || null;
    if (!title || !url || !publishedAt) return;

    items.push({
      title,
      source,
      url,
      publishedAt,
      content,
      raw: { type: 'atom' },
    });
  });

  return items;
}

async function fetchRssFeed({ client, schedule, url, source, retries, logger }) {
  const res = await schedule(() =>
    requestWithRetry(
      client,
      { method: 'GET', url },
      {
        retries,
        onRetry: ({ attempt, delayMs, err }) => {
          logger?.warn?.({ source, url, attempt, delayMs, status: err?.response?.status }, 'Retrying RSS fetch');
        },
      }
    )
  );

  const xml = res?.data;
  if (typeof xml !== 'string' || xml.length < 50) return [];
  return parseRss(xml, { source });
}

async function fetchFromNewsApi({ client, schedule, retries, logger }) {
  const apiKey = process.env.NEWSAPI_KEY;
  if (!apiKey) return [];

  const endpoint = process.env.NEWSAPI_ENDPOINT || 'https://newsapi.org/v2/everything';
  const q = process.env.NEWSAPI_QUERY || 'NEPSE OR "Nepal stock market" OR "Nepal Stock Exchange"';
  const language = process.env.NEWSAPI_LANGUAGE || 'en';
  const pageSize = Math.min(100, Math.max(1, Number(process.env.NEWSAPI_PAGE_SIZE || 50)));

  const res = await schedule(() =>
    requestWithRetry(
      client,
      {
        method: 'GET',
        url: endpoint,
        params: {
          q,
          language,
          sortBy: 'publishedAt',
          pageSize,
        },
        headers: { 'X-Api-Key': apiKey },
      },
      {
        retries,
        onRetry: ({ attempt, delayMs, err }) => {
          logger?.warn?.({ attempt, delayMs, status: err?.response?.status }, 'Retrying NewsAPI fetch');
        },
      }
    )
  );

  const payload = res?.data;
  const articles = Array.isArray(payload?.articles) ? payload.articles : [];

  return articles
    .map((a) => {
      const title = normalizeText(a.title);
      const url = normalizeUrl(a.url);
      const publishedAt = toDate(a.publishedAt);
      if (!title || !url || !publishedAt) return null;

      const source = normalizeText(a.source?.name) || 'NewsAPI';
      const content = normalizeText(a.content) || normalizeText(a.description) || null;

      return {
        title,
        source,
        url,
        publishedAt,
        content,
        raw: { type: 'newsapi', ...a },
      };
    })
    .filter(Boolean);
}

class NewsService {
  constructor({ logger } = {}) {
    this.logger = logger;
    this.client = createScraperHttpClient({ timeoutMs: Number(process.env.NEWS_HTTP_TIMEOUT_MS || 25_000) });
    this.schedule = createRateLimiter({
      maxConcurrent: Number(process.env.NEWS_MAX_CONCURRENT || 2),
      minTimeMs: Number(process.env.NEWS_MIN_TIME_MS || 500),
    });
    this.retries = Number(process.env.NEWS_HTTP_RETRIES || 3);
  }

  getRssFeeds() {
    const raw = process.env.NEWS_RSS_FEEDS || '';
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async collectLatest() {
    const feeds = this.getRssFeeds();

    const out = [];
    for (const feedUrl of feeds) {
      const url = normalizeUrl(feedUrl);
      if (!url) continue;
      try {
        // eslint-disable-next-line no-await-in-loop
        const items = await fetchRssFeed({
          client: this.client,
          schedule: this.schedule,
          url,
          source: url,
          retries: this.retries,
          logger: this.logger,
        });
        out.push(...items);
      } catch (err) {
        this.logger?.error?.({ url, err: err?.message }, 'RSS collection failed');
      }
    }

    try {
      const newsApiItems = await fetchFromNewsApi({
        client: this.client,
        schedule: this.schedule,
        retries: this.retries,
        logger: this.logger,
      });
      out.push(...newsApiItems);
    } catch (err) {
      this.logger?.error?.({ err: err?.message }, 'NewsAPI collection failed');
    }

    // De-dup by URL (keep latest publishedAt)
    const byUrl = new Map();
    for (const a of out) {
      const prev = byUrl.get(a.url);
      if (!prev || (prev.publishedAt && a.publishedAt && a.publishedAt > prev.publishedAt)) byUrl.set(a.url, a);
    }

    return Array.from(byUrl.values()).sort((a, b) => b.publishedAt - a.publishedAt);
  }

  async storeArticles({ prisma, articles }) {
    let stored = 0;

    for (const a of articles) {
      await prisma.newsArticle.upsert({
        where: { url: a.url },
        create: {
          title: a.title,
          source: a.source,
          url: a.url,
          publishedAt: a.publishedAt,
          content: a.content,
          raw: a.raw || null,
        },
        update: {
          title: a.title,
          source: a.source,
          publishedAt: a.publishedAt,
          content: a.content,
          raw: a.raw || null,
        },
      });
      stored += 1;
    }

    return stored;
  }
}

module.exports = { NewsService };

