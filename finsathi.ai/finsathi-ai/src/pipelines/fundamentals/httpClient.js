const axios = require('axios');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableAxiosError(err) {
  const code = err?.code;
  if (code && ['ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN', 'ENOTFOUND'].includes(code)) return true;

  const status = err?.response?.status;
  if (!status) return false;
  if (status === 429) return true;
  if (status >= 500) return true;
  return false;
}

function computeBackoffMs({ attempt, baseDelayMs, maxDelayMs }) {
  const exp = Math.min(maxDelayMs, baseDelayMs * (2 ** (attempt - 1)));
  const jitter = Math.floor(Math.random() * Math.min(250, exp * 0.2));
  return Math.min(maxDelayMs, exp + jitter);
}

async function requestWithRetry(client, config, opts) {
  const {
    retries = 3,
    baseDelayMs = 500,
    maxDelayMs = 10_000,
    onRetry,
  } = opts || {};

  let lastErr;
  for (let attempt = 1; attempt <= retries + 1; attempt += 1) {
    try {
      return await client.request(config);
    } catch (err) {
      lastErr = err;
      if (attempt > retries || !isRetryableAxiosError(err)) throw err;

      const delayMs = computeBackoffMs({ attempt, baseDelayMs, maxDelayMs });
      if (typeof onRetry === 'function') onRetry({ attempt, delayMs, err });
      await sleep(delayMs);
    }
  }

  // Should be unreachable.
  throw lastErr;
}

function createRateLimiter({ maxConcurrent = 2, minTimeMs = 350 } = {}) {
  let active = 0;
  let nextAllowedAt = 0;
  const queue = [];

  function drain() {
    if (active >= maxConcurrent) return;
    if (queue.length === 0) return;

    const now = Date.now();
    const waitMs = Math.max(0, nextAllowedAt - now);
    if (waitMs > 0) {
      setTimeout(drain, waitMs);
      return;
    }

    const { task, resolve, reject } = queue.shift();
    nextAllowedAt = Date.now() + minTimeMs;
    active += 1;

    Promise.resolve()
      .then(task)
      .then(resolve, reject)
      .finally(() => {
        active -= 1;
        drain();
      });

    // Fill remaining concurrency slots (respecting minTimeMs per start).
    if (active < maxConcurrent) drain();
  }

  return function schedule(task) {
    return new Promise((resolve, reject) => {
      queue.push({ task, resolve, reject });
      drain();
    });
  };
}

function createScraperHttpClient({ timeoutMs = 20_000 } = {}) {
  return axios.create({
    timeout: timeoutMs,
    headers: {
      'User-Agent':
        process.env.SCRAPER_UA ||
        'FinSathiAI-FundamentalsBot/1.0 (+https://finsathi.ai; contact: ops@finsathi.ai)',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    maxRedirects: 5,
    validateStatus: (s) => s >= 200 && s < 400,
  });
}

module.exports = {
  createRateLimiter,
  createScraperHttpClient,
  requestWithRetry,
  sleep,
};

