const { Router } = require('express');
const { marketRoutes } = require('../../routes/marketRoutes');
const { analysisRoutes } = require('../../routes/analysisRoutes');
const { portfolioAPI } = require('../../routes/portfolioAPI');
const { orchestratorRoutes } = require('../../routes/orchestratorRoutes');
const { corporateActionsRoutes } = require('../../routes/corporateActionsRoutes');
const { queueRoutes } = require('../../routes/queueRoutes');

const v1Router = Router();

v1Router.get('/health', (req, res) => {
  res.json({ ok: true, version: 'v1', timestamp: new Date().toISOString() });
});

v1Router.use('/market', marketRoutes);
v1Router.use('/analysis', analysisRoutes);
v1Router.use('/portfolio', portfolioAPI);
v1Router.use('/orchestrator', orchestratorRoutes);
v1Router.use('/corporate-actions', corporateActionsRoutes);
v1Router.use('/queues', queueRoutes);

module.exports = { v1Router };
