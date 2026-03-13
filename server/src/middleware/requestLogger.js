import { logger } from '../utils/logger';

export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Record request
  logger.info({
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
  });

  // Record response
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'error' : 'info';
    
    logger[logLevel]({
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      timestamp: new Date().toISOString(),
    });
  });

  next();
};
