/**
 * Simple in-memory rate limiter (per-process).
 * For multi-instance production, replace with Redis-backed limiter.
 */
function rateLimit({ windowMs = 60_000, max = 120 } = {}) {
  const hits = new Map();

  return (req, res, next) => {
    const key = req.ip || 'unknown';
    const now = Date.now();

    const bucket = hits.get(key) || { count: 0, start: now };
    if (now - bucket.start > windowMs) {
      bucket.count = 0;
      bucket.start = now;
    }

    bucket.count += 1;
    hits.set(key, bucket);

    if (bucket.count > max) {
      return res.status(429).json({ error: 'Too many requests' });
    }

    return next();
  };
}

module.exports = { rateLimit };

