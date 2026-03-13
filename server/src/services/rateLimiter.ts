import Redis from 'ioredis';
import { RateLimitInfo, ApiTier, API_PLANS } from './apiPlatformTypes';

export class RateLimiter {
  private redis: Redis;

  constructor(redisClient?: Redis) {
    this.redis = redisClient || new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  async checkRateLimit(
    identifier: string,
    limit: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; info: RateLimitInfo }> {
    const key = `ratelimit:${identifier}`;
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;

    const requests = await this.redis.zrangebyscore(key, windowStart, now);
    const currentCount = requests.length;

    const remaining = Math.max(0, limit - currentCount - 1);
    const reset = Math.ceil((now + windowSeconds * 1000) / 1000);

    if (currentCount >= limit) {
      return {
        allowed: false,
        info: {
          limit,
          remaining: 0,
          reset,
        },
      };
    }

    await this.redis.zadd(key, now, `${now}_${Math.random()}`);
    await this.redis.expire(key, windowSeconds);

    return {
      allowed: true,
      info: {
        limit,
        remaining,
        reset,
      },
    };
  }

  async checkMonthlyQuota(
    apiKeyId: string,
    monthlyLimit: number
  ): Promise<{ allowed: boolean; used: number; limit: number }> {
    const key = `quota:${apiKeyId}:${this.getCurrentMonth()}`;
    const used = parseInt((await this.redis.get(key)) || '0');

    if (monthlyLimit > 0 && used >= monthlyLimit) {
      return { allowed: false, used, limit: monthlyLimit };
    }

    await this.redis.incr(key);
    if (used === 0) {
      await this.redis.expire(key, this.getSecondsUntilMonthEnd());
    }

    return { allowed: true, used: used + 1, limit: monthlyLimit };
  }

  async getRateLimitInfo(identifier: string, limit: number, windowSeconds: number): Promise<RateLimitInfo> {
    const key = `ratelimit:${identifier}`;
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;

    const requests = await this.redis.zrangebyscore(key, windowStart, now);
    const currentCount = requests.length;

    const remaining = Math.max(0, limit - currentCount);
    const reset = Math.ceil((now + windowSeconds * 1000) / 1000);

    return {
      limit,
      remaining,
      reset,
    };
  }

  async resetRateLimit(identifier: string): Promise<void> {
    const key = `ratelimit:${identifier}`;
    await this.redis.del(key);
  }

  async getQuotaUsage(apiKeyId: string): Promise<{ used: number; limit: number; resetDate: string }> {
    const key = `quota:${apiKeyId}:${this.getCurrentMonth()}`;
    const used = parseInt((await this.redis.get(key)) || '0');
    const limit = API_PLANS.reduce((max, plan) => Math.max(max, 0), 0);

    return {
      used,
      limit: -1,
      resetDate: this.getNextMonthStart(),
    };
  }

  private getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private getNextMonthStart(): string {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth.toISOString();
  }

  private getSecondsUntilMonthEnd(): number {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return Math.floor((endOfMonth.getTime() - now.getTime()) / 1000);
  }
}

export const rateLimiter = new RateLimiter();
