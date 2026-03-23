import crypto from 'crypto'
import logger from '../utils/logger'
import { getRedis } from '../config/redis'
import { getAIRuntimeConfig } from './aiRuntime.service'

export class AIResponseCacheService {
  private static buildKey(scope: string, payload: unknown) {
    const digest = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex')
    return `ai-cache:${scope}:${digest}`
  }

  static async get<T>(scope: string, payload: unknown): Promise<T | null> {
    const config = getAIRuntimeConfig()
    if (!config.responseCacheEnabled) {
      return null
    }

    try {
      const redis = getRedis()
      const key = this.buildKey(scope, payload)
      const cached = await redis.get(key)
      return cached ? (JSON.parse(cached) as T) : null
    } catch (error) {
      logger.warn?.('AI cache get failed', {
        error: error instanceof Error ? error.message : String(error),
        scope,
      })
      return null
    }
  }

  static async set(scope: string, payload: unknown, value: unknown): Promise<void> {
    const config = getAIRuntimeConfig()
    if (!config.responseCacheEnabled) {
      return
    }

    try {
      const redis = getRedis()
      const key = this.buildKey(scope, payload)
      await redis.setex(key, config.responseCacheTtlSeconds, JSON.stringify(value))
    } catch (error) {
      logger.warn?.('AI cache set failed', {
        error: error instanceof Error ? error.message : String(error),
        scope,
      })
    }
  }
}
