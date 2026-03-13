import pino from 'pino';
import pretty from 'pino-pretty';

// Create logger instance
const logger = pino(
  {
    level: process.env.LOG_LEVEL || 'info',
    base: {
      pid: process.pid,
      hostname: process.env.HOSTNAME || 'localhost',
      service: 'finsathi-api',
      version: process.env.npm_package_version || '1.0.0',
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      log(object) {
        return { ...object, environment: process.env.NODE_ENV || 'development' };
      },
    },
  },
  process.env.NODE_ENV === 'production' 
    ? pino.destination({ dest: 'logs/app.log', mkdir: true })
    : pretty({
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
    })
);

// Create child loggers for different modules
export const authLogger = logger.child({ module: 'auth' });
export const loanLogger = logger.child({ module: 'loan' });
export const companyLogger = logger.child({ module: 'company' });
export const reportLogger = logger.child({ module: 'report' });
export const subscriptionLogger = logger.child({ module: 'subscription' });
export const dbLogger = logger.child({ module: 'database' });

// Utility functions for structured logging
export const logRequest = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info({
      event: 'request_completed',
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      userId: req.user?.id,
    });
  });
  
  next();
};

export const logError = (error, context = {}) => {
  logger.error({
    event: 'error_occurred',
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
    ...context,
  });
};

export const logAuth = (event, userId, details = {}) => {
  authLogger.info({
    event,
    userId,
    ...details,
  });
};

export const logBusiness = (event, details = {}) => {
  logger.info({
    event: 'business_event',
    ...details,
  });
};

export default logger;
