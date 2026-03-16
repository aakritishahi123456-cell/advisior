const express = require('express');
const { v1Router } = require('./api/v1');
const { corporateActionsRoutes } = require('./routes/corporateActionsRoutes');
const { errorHandler, notFoundHandler } = require('./middleware/error');
const { requestLogger } = require('./middleware/requestLogger');
const { apiKeyOrJwt, enforceHttps } = require('./middleware/authMiddleware');
const { buildRateLimiters } = require('./config/rateLimitConfig');
const { applySecurity } = require('./config/securityConfig');
const { authRoutes } = require('./routes/authRoutes');

function createApp() {
  const app = express();
  const rls = buildRateLimiters();

  app.disable('x-powered-by');
  app.use(enforceHttps);
  applySecurity(app);
  app.use(express.json({ limit: '2mb' }));
  app.use(requestLogger);

  app.get('/health', (req, res) => {
    res.status(200).json({
      ok: true,
      service: 'finsathi-ai-backend',
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/v1/health', (req, res) => {
    res.json({ ok: true, version: 'v1', timestamp: new Date().toISOString() });
  });

  // Rate limit + auth
  app.use('/api/v1', rls.api);
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1', apiKeyOrJwt, v1Router);

  // Back-compat: GET /corporate-actions/:symbol
  app.use('/corporate-actions', apiKeyOrJwt, corporateActionsRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
