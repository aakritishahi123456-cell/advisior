let bcrypt;
let jwt;
let z;

try {
  // eslint-disable-next-line global-require
  bcrypt = require('bcryptjs');
} catch {
  bcrypt = null;
}

try {
  // eslint-disable-next-line global-require
  jwt = require('jsonwebtoken');
} catch {
  jwt = null;
}

try {
  // eslint-disable-next-line global-require
  ({ z } = require('zod'));
} catch {
  z = null;
}

const { getPrisma } = require('../database/prismaClient');
const { logger } = require('../config/logger');
const {
  issueTokensForUser,
  logAuthEvent,
  rotateRefreshToken,
  sanitizeAuthInput,
} = require('../middleware/authMiddleware');

function requireDeps() {
  if (!bcrypt) throw new Error('Missing dependency `bcryptjs`');
  if (!jwt) throw new Error('Missing dependency `jsonwebtoken`');
  if (!z) throw new Error('Missing dependency `zod`');
}

function validatePassword(pw) {
  const s = String(pw || '');
  if (s.length < 8) return 'Password must be at least 8 characters';
  if (s.length > 128) return 'Password too long';
  return null;
}

const registerSchema = () =>
  z.object({
    email: z.string().email().max(320),
    password: z.string().min(8).max(128),
  });

const loginSchema = () =>
  z.object({
    email: z.string().email().max(320),
    password: z.string().min(1).max(128),
  });

const refreshSchema = () =>
  z.object({
    refreshToken: z.string().min(20),
  });

class AuthService {
  constructor({ logger: injectedLogger } = {}) {
    this.logger = injectedLogger || logger;
  }

  async register({ email, password, req }) {
    requireDeps();
    const prisma = getPrisma();

    if (process.env.AUTH_ALLOW_REGISTER !== 'true') {
      const err = new Error('Registration disabled');
      err.statusCode = 403;
      throw err;
    }

    const data = registerSchema().parse({ email, password });
    const pwErr = validatePassword(data.password);
    if (pwErr) {
      const err = new Error(pwErr);
      err.statusCode = 400;
      throw err;
    }

    const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (existing) {
      await logAuthEvent({ prisma, eventType: 'REGISTER_FAIL', success: false, email: data.email, req, details: { reason: 'EMAIL_EXISTS' } });
      const err = new Error('Email already registered');
      err.statusCode = 409;
      throw err;
    }

    const saltRounds = Number(process.env.BCRYPT_ROUNDS || 12);
    const passwordHash = await bcrypt.hash(data.password, saltRounds);
    const user = await prisma.user.create({
      data: { email: data.email.toLowerCase(), passwordHash },
      select: { id: true, email: true, role: true, createdAt: true },
    });

    const tokens = await issueTokensForUser({ prisma, user, req });
    await logAuthEvent({ prisma, eventType: 'REGISTER_SUCCESS', success: true, userId: user.id, email: user.email, req });

    return { user, ...tokens };
  }

  async login({ email, password, req }) {
    requireDeps();
    const prisma = getPrisma();

    const data = loginSchema().parse({ email, password });
    const normalizedEmail = sanitizeAuthInput(data.email).toLowerCase();

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      await logAuthEvent({ prisma, eventType: 'LOGIN_FAIL', success: false, email: normalizedEmail, req, details: { reason: 'USER_NOT_FOUND' } });
      const err = new Error('Invalid credentials');
      err.statusCode = 401;
      throw err;
    }

    const ok = await bcrypt.compare(data.password, user.passwordHash);
    if (!ok) {
      await logAuthEvent({ prisma, eventType: 'LOGIN_FAIL', success: false, userId: user.id, email: user.email, req, details: { reason: 'BAD_PASSWORD' } });
      const err = new Error('Invalid credentials');
      err.statusCode = 401;
      throw err;
    }

    const safeUser = { id: user.id, email: user.email, role: user.role, createdAt: user.createdAt };
    const tokens = await issueTokensForUser({ prisma, user, req });
    await logAuthEvent({ prisma, eventType: 'LOGIN_SUCCESS', success: true, userId: user.id, email: user.email, req });

    return { user: safeUser, ...tokens };
  }

  async refresh({ refreshToken, req }) {
    requireDeps();
    const prisma = getPrisma();

    const data = refreshSchema().parse({ refreshToken });
    try {
      const rotated = await rotateRefreshToken({ prisma, refreshToken: data.refreshToken, req });
      await logAuthEvent({ prisma, eventType: 'REFRESH_SUCCESS', success: true, userId: rotated.user.id, email: rotated.user.email, req });
      return { accessToken: rotated.accessToken, refreshToken: rotated.refreshToken };
    } catch (e) {
      await logAuthEvent({ prisma, eventType: 'REFRESH_FAIL', success: false, email: null, req, details: { error: e?.message, code: e?.code } });
      const err = new Error('Invalid refresh token');
      err.statusCode = 401;
      throw err;
    }
  }

  async logout({ refreshToken, req }) {
    requireDeps();
    const prisma = getPrisma();

    if (!refreshToken) return { ok: true };

    const data = refreshSchema().parse({ refreshToken });
    const tokenHash = require('../middleware/authMiddleware').sha256(data.refreshToken);
    const existing = await prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (existing && !existing.revokedAt) {
      await prisma.refreshToken.update({ where: { id: existing.id }, data: { revokedAt: new Date() } });
      await logAuthEvent({ prisma, eventType: 'LOGOUT', success: true, userId: existing.userId, email: null, req });
    }
    return { ok: true };
  }
}

module.exports = { AuthService };

