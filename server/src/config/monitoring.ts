import * as Sentry from '@sentry/node'
import { Express, Request, Response, NextFunction } from 'express'
import client from 'prom-client'
import logger from '../utils/logger'
import { getEnvBoolean } from './env'

const register = new client.Registry()
client.collectDefaultMetrics({ register, prefix: 'finsathi_' })

const httpRequestCounter = new client.Counter({
  name: 'finsathi_http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'] as const,
  registers: [register],
})

const httpRequestDuration = new client.Histogram({
  name: 'finsathi_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'] as const,
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
})

const processHealthGauge = new client.Gauge({
  name: 'finsathi_process_up',
  help: 'Whether the process is running',
  registers: [register],
})

processHealthGauge.set(1)

export function initializeMonitoring(app: Express) {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0),
      enabled: true,
    })
    logger.info('Sentry error tracking enabled')
  } else {
    logger.warn('Sentry DSN not configured; error tracking is disabled')
  }

  if (getEnvBoolean('METRICS_ENABLED', true)) {
    app.get('/metrics', async (_req: Request, res: Response) => {
      res.set('Content-Type', register.contentType)
      res.end(await register.metrics())
    })
  }
}

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const startedAt = process.hrtime.bigint()

  res.on('finish', () => {
    const durationSeconds = Number(process.hrtime.bigint() - startedAt) / 1_000_000_000
    const labels = {
      method: req.method,
      route: req.route?.path || req.path || 'unmatched',
      status_code: String(res.statusCode),
    }

    httpRequestCounter.inc(labels)
    httpRequestDuration.observe(labels, durationSeconds)
  })

  next()
}

export function captureException(error: unknown, context: Record<string, unknown> = {}) {
  if (!process.env.SENTRY_DSN) {
    return
  }

  Sentry.withScope((scope) => {
    Object.entries(context).forEach(([key, value]) => scope.setExtra(key, value))
    Sentry.captureException(error)
  })
}
