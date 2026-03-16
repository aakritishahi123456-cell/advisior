const crypto = require('crypto');

let jwt;
try {
  // eslint-disable-next-line global-require
  jwt = require('jsonwebtoken');
} catch {
  jwt = null;
}

const { getPrisma } = require('../database/prismaClient');
const { logger } = require('../config/logger');
const { normalizeText } = require('../pipelines/fundamentals/normalization');

function requireJwt() {
  if (!jwt) throw new Error('Missing dependency `jsonwebtoken`');
}

function getAccessSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('Missing JWT_SECRET');
  return secret;
}

function getRefreshSecret() {
  return process.env.JWT_REFRESH_SECRET || getAccessSecret();
}

function sha256(input) {
  return crypto.createHash('sha256').update(String(input)).digest('hex');
}

function getBearerToken(req) {
  const header = req.header('authorization') || '';
  if (!header.toLowerCase().startsWith('bearer ')) return null;
  return header.slice(7).trim() || null;
}

function getApiKey(req) {
  const header = req.header('x-api-key') || '';
  return header.trim() || null;
}

function isHttps(req) {
  if (req.secure) return true;
  const proto = String(req.header('x-forwarded-proto') || '').toLowerCase();
  return proto === 'https';
}

function authError(res, code, message, status = 401) {
  return res.status(status).json({ error: message, code });
}

function asRole(user) {
  return user?.role || 'USER';
}

async function logAuthEvent({ prisma, eventType, success, userId, email, req, details }) {
  try {
    await prisma.authEvent.create({
      data: {
        eventType,
        success: Boolean(success),
        userId: userId || null,
        email: email || null,
        ip: req?.ip || null,
        userAgent: req?.header?.('user-agent') || null,
        details: details || null,
      },
    });
  } catch (e) {
    logger.error({ err: e?.message }, 'Failed to write auth event');
  }
}

function signAccessToken({ user }) {
  requireJwt();
  const expiresIn = process.env.JWT_ACCESS_TTL || '15m';
  const payload = { userId: user.id, email: user.email, role: asRole(user), type: 'access' };
  return jwt.sign(payload, getAccessSecret(), { expiresIn, issuer: process.env.JWT_ISSUER || 'finsathi-ai' });
}

function signRefreshToken({ user, tokenId }) {
  requireJwt();
  const expiresIn = process.env.JWT_REFRESH_TTL || '7d';
  const payload = { userId: user.id, email: user.email, role: asRole(user), type: 'refresh', tid: tokenId };
  return jwt.sign(payload, getRefreshSecret(), { expiresIn, issuer: process.env.JWT_ISSUER || 'finsathi-ai' });
}

function verifyAccessToken(token) {
  requireJwt();
  return jwt.verify(token, getAccessSecret(), { issuer: process.env.JWT_ISSUER || 'finsathi-ai' });
}

function verifyRefreshToken(token) {
  requireJwt();
  return jwt.verify(token, getRefreshSecret(), { issuer: process.env.JWT_ISSUER || 'finsathi-ai' });
}

async function requireAuth(req, res, next) {
  const token = getBearerToken(req);
  if (!token) return authError(res, 'NO_TOKEN', 'Authentication required', 401);

  try {
    const payload = verifyAccessToken(token);
    if (payload?.type !== 'access') return authError(res, 'INVALID_TOKEN', 'Invalid access token', 401);

    req.user = { id: payload.userId, email: payload.email, role: payload.role };
    return next();
  } catch (err) {
    const msg = err?.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    const code = err?.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN';
    return authError(res, code, msg, 401);
  }
}

function optionalAuth(req, res, next) {
  const token = getBearerToken(req);
  if (!token) return next();

  try {
    const payload = verifyAccessToken(token);
    if (payload?.type === 'access') req.user = { id: payload.userId, email: payload.email, role: payload.role };
  } catch {
    // Ignore
  }

  return next();
}

function requireRole(role) {
  const desired = String(role || '').toUpperCase();
  return (req, res, next) => {
    const current = String(req.user?.role || '').toUpperCase();
    if (!current) return authError(res, 'AUTH_REQUIRED', 'Authentication required', 401);
    if (current !== desired) return authError(res, 'FORBIDDEN', 'Forbidden', 403);
    return next();
  };
}

/**
 * Backward-compatible auth gate:
 * - If API_KEY is set and matches, request is treated as service-authenticated.
 * - Otherwise require JWT access token.
 */
async function apiKeyOrJwt(req, res, next) {
  const expected = process.env.API_KEY;

  if (expected) {
    const apiKey = getApiKey(req);
    const bearer = getBearerToken(req);
    const token = apiKey || bearer;

    if (token === expected) {
      req.user = { id: 'service', email: null, role: 'ADMIN', auth: 'api_key' };
      return next();
    }
  }

  return requireAuth(req, res, next);
}

async function issueTokensForUser({ prisma, user, req }) {
  const refreshRow = await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: sha256(crypto.randomUUID()),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdByIp: req?.ip || null,
      createdByUserAgent: req?.header?.('user-agent') || null,
    },
  });

  const refreshToken = signRefreshToken({ user, tokenId: refreshRow.id });
  // Store hash of actual refresh JWT (not the random UUID), for revocation/rotation.
  await prisma.refreshToken.update({
    where: { id: refreshRow.id },
    data: { tokenHash: sha256(refreshToken) },
  });

  const accessToken = signAccessToken({ user });
  return { accessToken, refreshToken };
}

async function rotateRefreshToken({ prisma, refreshToken, req }) {
  const payload = verifyRefreshToken(refreshToken);
  if (payload?.type !== 'refresh' || !payload?.userId) {
    const err = new Error('Invalid refresh token');
    err.code = 'INVALID_TOKEN';
    throw err;
  }

  const tokenHash = sha256(refreshToken);
  const existing = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!existing) {
    const err = new Error('Refresh token not recognized');
    err.code = 'TOKEN_BLACKLISTED';
    throw err;
  }
  if (existing.revokedAt) {
    const err = new Error('Refresh token revoked');
    err.code = 'TOKEN_BLACKLISTED';
    throw err;
  }
  if (existing.expiresAt && existing.expiresAt < new Date()) {
    const err = new Error('Refresh token expired');
    err.code = 'TOKEN_EXPIRED';
    throw err;
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) {
    const err = new Error('User not found');
    err.code = 'USER_NOT_FOUND';
    throw err;
  }

  const newRefreshRow = await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: sha256(crypto.randomUUID()),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdByIp: req?.ip || null,
      createdByUserAgent: req?.header?.('user-agent') || null,
    },
  });

  const newRefreshToken = signRefreshToken({ user, tokenId: newRefreshRow.id });
  await prisma.refreshToken.update({
    where: { id: newRefreshRow.id },
    data: { tokenHash: sha256(newRefreshToken) },
  });

  await prisma.refreshToken.update({
    where: { id: existing.id },
    data: { revokedAt: new Date(), replacedByTokenId: newRefreshRow.id },
  });

  const accessToken = signAccessToken({ user });
  return { accessToken, refreshToken: newRefreshToken, user };
}

function enforceHttps(req, res, next) {
  const enabled = process.env.ENFORCE_HTTPS === 'true' || process.env.NODE_ENV === 'production';
  if (!enabled) return next();

  if (isHttps(req)) return next();

  const host = req.header('host');
  const url = `https://${host}${req.originalUrl}`;
  return res.redirect(308, url);
}

function sanitizeAuthInput(value) {
  return normalizeText(value).slice(0, 320);
}

module.exports = {
  apiKeyOrJwt,
  enforceHttps,
  issueTokensForUser,
  logAuthEvent,
  optionalAuth,
  requireAuth,
  requireRole,
  rotateRefreshToken,
  sanitizeAuthInput,
  sha256,
};

