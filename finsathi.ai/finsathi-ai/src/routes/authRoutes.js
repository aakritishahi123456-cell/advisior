const { Router } = require('express');
const { AuthController } = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');
const { buildRateLimiters } = require('../config/rateLimitConfig');

const authRoutes = Router();
const rls = buildRateLimiters();

// POST /api/v1/auth/register
authRoutes.post('/register', rls.auth, AuthController.register);

// POST /api/v1/auth/login
authRoutes.post('/login', rls.login, AuthController.login);

// POST /api/v1/auth/refresh
authRoutes.post('/refresh', rls.auth, AuthController.refresh);

// GET /api/v1/auth/me
authRoutes.get('/me', requireAuth, AuthController.me);

// POST /api/v1/auth/logout
authRoutes.post('/logout', requireAuth, rls.auth, AuthController.logout);

module.exports = { authRoutes };

