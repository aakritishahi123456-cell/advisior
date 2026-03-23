import fs from 'fs'
import path from 'path'
import { createLogger, format, transports } from 'winston'

type LogMeta = Record<string, unknown>

const logDir = process.env.LOG_DIR || path.resolve(process.cwd(), 'logs')
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true })
}

const rootLogger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: {
    service: process.env.LOG_SERVICE_NAME || 'finsathi-api',
    environment: process.env.NODE_ENV || 'development',
  },
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  transports: [
    new transports.Console({
      format:
        process.env.NODE_ENV === 'production'
          ? format.combine(format.timestamp(), format.json())
          : format.combine(
              format.colorize(),
              format.timestamp({ format: 'HH:mm:ss' }),
              format.printf(({ timestamp, level, message, ...meta }) => {
                const serializedMeta = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : ''
                return `${timestamp} ${level}: ${message}${serializedMeta}`
              })
            ),
    }),
    new transports.File({
      filename: path.join(logDir, 'app.log'),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
    }),
    new transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
    }),
  ],
  exceptionHandlers: [new transports.File({ filename: path.join(logDir, 'exceptions.log') })],
  rejectionHandlers: [new transports.File({ filename: path.join(logDir, 'rejections.log') })],
})

type LoggerLike = {
  child(meta: LogMeta): LoggerLike
  info: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
  debug: (...args: unknown[]) => void
  http: (...args: unknown[]) => void
  stream: { write: (message: string) => void }
}

function normalizeLogArgs(args: unknown[], childMeta: LogMeta) {
  const [first, second, third] = args

  if (typeof first === 'string') {
    return {
      message: first,
      meta: {
        ...childMeta,
        ...(second && typeof second === 'object' ? (second as LogMeta) : {}),
        ...(third && typeof third === 'object' ? (third as LogMeta) : {}),
      },
    }
  }

  if (first && typeof first === 'object' && typeof second === 'string') {
    return {
      message: second,
      meta: {
        ...childMeta,
        ...(first as LogMeta),
        ...(third && typeof third === 'object' ? (third as LogMeta) : {}),
      },
    }
  }

  if (first instanceof Error) {
    return {
      message: first.message,
      meta: {
        ...childMeta,
        errorName: first.name,
        stack: first.stack,
        ...(second && typeof second === 'object' ? (second as LogMeta) : {}),
      },
    }
  }

  return {
    message: 'Log event',
    meta: {
      ...childMeta,
      ...(first && typeof first === 'object' ? (first as LogMeta) : {}),
      ...(second && typeof second === 'object' ? (second as LogMeta) : {}),
    },
  }
}

function createCompatibleLogger(childMeta: LogMeta = {}): LoggerLike {
  const logAtLevel =
    (level: 'info' | 'warn' | 'error' | 'debug' | 'http') =>
    (...args: unknown[]) => {
      const { message, meta } = normalizeLogArgs(args, childMeta)
      rootLogger.log(level, message, meta)
    }

  return {
    child(meta: LogMeta) {
      return createCompatibleLogger({ ...childMeta, ...meta })
    },
    info: logAtLevel('info'),
    warn: logAtLevel('warn'),
    error: logAtLevel('error'),
    debug: logAtLevel('debug'),
    http: logAtLevel('http'),
    stream: {
      write(message: string) {
        rootLogger.http(message.trim(), childMeta)
      },
    },
  }
}

const logger = createCompatibleLogger()

export const authLogger = logger.child({ module: 'auth' })
export const loanLogger = logger.child({ module: 'loan' })
export const companyLogger = logger.child({ module: 'company' })
export const reportLogger = logger.child({ module: 'report' })
export const subscriptionLogger = logger.child({ module: 'subscription' })
export const dbLogger = logger.child({ module: 'database' })
export const requestLogStream = logger.stream

export default logger
