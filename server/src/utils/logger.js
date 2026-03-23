import fs from 'fs'
import path from 'path'
import winston from 'winston'

const { createLogger, format, transports } = winston
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
  format: format.combine(format.timestamp(), format.errors({ stack: true }), format.splat(), format.json()),
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
    new transports.File({ filename: path.join(logDir, 'app.log') }),
    new transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }),
  ],
})

function normalizeLogArgs(args, childMeta) {
  const [first, second, third] = args

  if (typeof first === 'string') {
    return {
      message: first,
      meta: {
        ...childMeta,
        ...(second && typeof second === 'object' ? second : {}),
        ...(third && typeof third === 'object' ? third : {}),
      },
    }
  }

  if (first && typeof first === 'object' && typeof second === 'string') {
    return {
      message: second,
      meta: {
        ...childMeta,
        ...first,
        ...(third && typeof third === 'object' ? third : {}),
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
        ...(second && typeof second === 'object' ? second : {}),
      },
    }
  }

  return {
    message: 'Log event',
    meta: {
      ...childMeta,
      ...(first && typeof first === 'object' ? first : {}),
      ...(second && typeof second === 'object' ? second : {}),
    },
  }
}

function createCompatibleLogger(childMeta = {}) {
  const logAtLevel = (level) => (...args) => {
    const { message, meta } = normalizeLogArgs(args, childMeta)
    rootLogger.log(level, message, meta)
  }

  return {
    child(meta) {
      return createCompatibleLogger({ ...childMeta, ...meta })
    },
    info: logAtLevel('info'),
    warn: logAtLevel('warn'),
    error: logAtLevel('error'),
    debug: logAtLevel('debug'),
    http: logAtLevel('http'),
    stream: {
      write(message) {
        rootLogger.http(message.trim(), childMeta)
      },
    },
  }
}

export const logger = createCompatibleLogger()
export const authLogger = logger.child({ module: 'auth' })
export const loanLogger = logger.child({ module: 'loan' })
export const companyLogger = logger.child({ module: 'company' })
export const reportLogger = logger.child({ module: 'report' })
export const subscriptionLogger = logger.child({ module: 'subscription' })
export const dbLogger = logger.child({ module: 'database' })

export default logger
