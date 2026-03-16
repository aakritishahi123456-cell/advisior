let Redis;
try {
  // eslint-disable-next-line global-require
  Redis = require('ioredis');
} catch {
  Redis = null;
}

const { logger } = require('./logger');

let redisSingleton;

function getRedis() {
  if (!Redis) return null;
  if (redisSingleton) return redisSingleton;
  const url = process.env.REDIS_URL;
  if (url) {
    redisSingleton = new Redis(url, { maxRetriesPerRequest: null });
    return redisSingleton;
  }

  if (process.env.REDIS_HOST || process.env.REDIS_PORT) {
    redisSingleton = new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: Number(process.env.REDIS_PORT || 6379),
      username: process.env.REDIS_USERNAME || undefined,
      password: process.env.REDIS_PASSWORD || undefined,
      db: Number(process.env.REDIS_DB || 0),
      maxRetriesPerRequest: null,
    });
    return redisSingleton;
  }

  return null;
}

function ipKey(req) {
  return req.ip || req.header('x-forwarded-for') || 'unknown';
}

function createInMemoryLimiter({ windowMs, max }) {
  const hits = new Map();
  return async (key) => {
    const now = Date.now();
    const bucket = hits.get(key) || { count: 0, start: now };
    if (now - bucket.start > windowMs) {
      bucket.count = 0;
      bucket.start = now;
    }
    bucket.count += 1;
    hits.set(key, bucket);
    return { allowed: bucket.count <= max, remaining: Math.max(0, max - bucket.count), resetMs: windowMs - (now - bucket.start) };
  };
}

function createRedisLimiter({ redis, windowMs, max, prefix }) {
  const p = prefix || 'rl';
  return async (key) => {
    const k = `${p}:${key}`;
    const ttlSec = Math.ceil(windowMs / 1000);
    const count = await redis.incr(k);
    if (count === 1) await redis.expire(k, ttlSec);
    const ttl = await redis.ttl(k);
    const resetMs = Math.max(0, ttl * 1000);
    return { allowed: count <= max, remaining: Math.max(0, max - count), resetMs };
  };
}

function buildLimiter({ windowMs, max, prefix }) {
  const redis = getRedis();
  const fn = redis ? createRedisLimiter({ redis, windowMs, max, prefix }) : createInMemoryLimiter({ windowMs, max });
  return { redis, consume: fn };
}

function rateLimit({ windowMs, max, prefix, keyFn } = {}) {
  const limiter = buildLimiter({ windowMs, max, prefix });
  const kf = keyFn || ipKey;

  return async (req, res, next) => {
    try {
      const key = kf(req);
      const out = await limiter.consume(key);

      res.setHeader('X-RateLimit-Limit', String(max));
      res.setHeader('X-RateLimit-Remaining', String(out.remaining));
      res.setHeader('X-RateLimit-Reset', String(Math.ceil(out.resetMs / 1000)));

      if (!out.allowed) {
        logger.warn({ key, prefix }, 'Rate limit exceeded');
        return res.status(429).json({ error: 'Too many requests', code: 'RATE_LIMIT_EXCEEDED' });
      }

      return next();
    } catch (err) {
      logger.error({ err: err?.message }, 'Rate limiter error');
      return next();
    }
  };
}

function buildRateLimiters() {
  const api = rateLimit({
    windowMs: Number(process.env.API_RL_WINDOW_MS || 60_000),
    max: Number(process.env.API_RL_MAX || 300),
    prefix: 'api',
  });

  const auth = rateLimit({
    windowMs: Number(process.env.AUTH_RL_WINDOW_MS || 15 * 60_000),
    max: Number(process.env.AUTH_RL_MAX || 30),
    prefix: 'auth',
  });

  const login = rateLimit({
    windowMs: Number(process.env.LOGIN_RL_WINDOW_MS || 15 * 60_000),
    max: Number(process.env.LOGIN_RL_MAX || 8),
    prefix: 'login',
  });

  return { api, auth, login };
}

module.exports = {
  buildRateLimiters,
  rateLimit,
};
