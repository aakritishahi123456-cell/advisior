const { Router } = require('express');
const { marketRoutes } = require('../../routes/marketRoutes');
const { analysisRoutes } = require('../../routes/analysisRoutes');
const { portfolioRoutes } = require('../../routes/portfolioRoutes');
const { orchestratorRoutes } = require('../../routes/orchestratorRoutes');

const v1Router = Router();

v1Router.get('/health', (req, res) => {
  res.json({ ok: true, version: 'v1', timestamp: new Date().toISOString() });
});

v1Router.use('/market', marketRoutes);
v1Router.use('/analysis', analysisRoutes);
v1Router.use('/portfolio', portfolioRoutes);
v1Router.use('/orchestrator', orchestratorRoutes);

module.exports = { v1Router };
