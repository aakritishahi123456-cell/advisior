import { Request, Response, NextFunction } from 'express'
import logger from '../utils/logger'

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startedAt = Date.now()

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt
    const log = res.statusCode >= 500 ? logger.error : res.statusCode >= 400 ? logger.warn : logger.info

    log('http_request', {
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    })
  })

  next()
}
