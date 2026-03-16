let helmet;
let cors;

try {
  // eslint-disable-next-line global-require
  helmet = require('helmet');
} catch {
  helmet = null;
}

try {
  // eslint-disable-next-line global-require
  cors = require('cors');
} catch {
  cors = null;
}

const { logger } = require('./logger');

function requireDeps() {
  if (!helmet) throw new Error('Missing dependency `helmet`');
  if (!cors) throw new Error('Missing dependency `cors`');
}

function sanitizeObject(input, depth = 0) {
  if (depth > 6) return undefined;
  if (input === null || input === undefined) return input;

  if (typeof input === 'string') {
    // strip null bytes + control chars
    return input.replace(/\0/g, '').replace(/[\u0000-\u001F\u007F]/g, '').trim();
  }

  if (Array.isArray(input)) return input.map((v) => sanitizeObject(v, depth + 1)).filter((v) => v !== undefined);

  if (typeof input === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(input)) {
      if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
      const sv = sanitizeObject(v, depth + 1);
      if (sv === undefined) continue;
      out[k] = sv;
    }
    return out;
  }

  return input;
}

function sanitizeRequest(req, res, next) {
  try {
    if (req.body) req.body = sanitizeObject(req.body);
    if (req.query) req.query = sanitizeObject(req.query);
    if (req.params) req.params = sanitizeObject(req.params);
  } catch (e) {
    logger.warn({ err: e?.message }, 'Request sanitize failed');
  }
  return next();
}

function corsOptions() {
  const raw = process.env.CORS_ORIGINS || '';
  const allowAll = raw.trim() === '*';
  const origins = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    origin(origin, cb) {
      if (!origin) return cb(null, true); // curl/server-to-server
      if (allowAll) return cb(null, true);
      if (origins.includes(origin)) return cb(null, true);
      return cb(new Error('CORS_NOT_ALLOWED'));
    },
    credentials: process.env.CORS_CREDENTIALS === 'true',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-API-Key'],
    maxAge: 600,
  };
}

function applySecurity(app) {
  requireDeps();

  const trustProxy = process.env.TRUST_PROXY;
  if (trustProxy) app.set('trust proxy', trustProxy === 'true' ? 1 : trustProxy);

  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  app.use(cors(corsOptions()));
  app.use(sanitizeRequest);
}

module.exports = {
  applySecurity,
  sanitizeRequest,
};

