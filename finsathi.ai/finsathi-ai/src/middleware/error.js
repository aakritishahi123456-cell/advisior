const { logger } = require('../config/logger');

function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Route not found' });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  logger.error({ err: err?.message, stack: err?.stack }, 'Unhandled error');
  const status = Number(err?.statusCode || 500);
  const expose = status < 500 || process.env.NODE_ENV !== 'production';
  res.status(status).json({ error: expose ? (err?.message || 'Error') : 'Internal Server Error' });
}

module.exports = { errorHandler, notFoundHandler };
