const express = require('express');
const { v1Router } = require('./api/v1');
const { errorHandler, notFoundHandler } = require('./middleware/error');
const { requestLogger } = require('./middleware/requestLogger');
const { apiKeyAuth } = require('./middleware/apiKeyAuth');
const { rateLimit } = require('./middleware/rateLimit');

function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '2mb' }));
  app.use(requestLogger);

  app.get('/health', (req, res) => {
    res.status(200).json({
      ok: true,
      service: 'finsathi-ai-backend',
      timestamp: new Date().toISOString(),
    });
  });

  // Security defaults (API key is enforced only if API_KEY is set)
  app.use(rateLimit({ windowMs: 60_000, max: 300 }));
  app.use('/api/v1', apiKeyAuth);
  app.use('/api/v1', v1Router);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
