import crypto from 'crypto';
import Redis from 'ioredis';
import { ApiKey, ApiPermission, ApiTier, API_PLANS } from './apiPlatformTypes';

export class ApiKeyService {
  private redis: Redis;

  constructor(redisClient?: Redis) {
    this.redis = redisClient || new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  async generateApiKey(
    userId: string,
    name: string,
    tier: ApiTier,
    permissions?: ApiPermission[]
  ): Promise<ApiKey> {
    const plan = API_PLANS.find(p => p.tier === tier);
    if (!plan) {
      throw new Error(`Invalid tier: ${tier}`);
    }

    const apiKey: ApiKey = {
      id: `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      key: `fsa_${crypto.randomBytes(24).toString('hex')}`,
      name,
      userId,
      tier,
      permissions: permissions || this.getDefaultPermissions(tier),
      rateLimit: plan.rateLimit,
      rateLimitWindow: plan.rateLimitWindow,
      monthlyQuota: plan.monthlyQuota,
      usedThisMonth: 0,
      createdAt: new Date(),
      status: 'active',
    };

    await this.saveApiKey(apiKey);
    return apiKey;
  }

  private getDefaultPermissions(tier: ApiTier): ApiPermission[] {
    const tierPermissions: Record<ApiTier, ApiPermission[]> = {
      free: [
        { resource: 'market', actions: ['read'] },
        { resource: 'company', actions: ['read'] },
      ],
      basic: [
        { resource: 'market', actions: ['read'] },
        { resource: 'company', actions: ['read'] },
        { resource: 'analysis', actions: ['read'] },
        { resource: 'historical', actions: ['read'] },
      ],
      pro: [
        { resource: 'market', actions: ['read'] },
        { resource: 'company', actions: ['read'] },
        { resource: 'analysis', actions: ['read'] },
        { resource: 'predictions', actions: ['read'] },
        { resource: 'portfolio', actions: ['read', 'write'] },
        { resource: 'advisor', actions: ['read', 'write'] },
      ],
      enterprise: [
        { resource: '*', actions: ['read', 'write', 'delete'] },
      ],
    };

    return tierPermissions[tier];
  }

  async getApiKey(keyId: string): Promise<ApiKey | null> {
    const cached = await this.redis.get(`apikey:${keyId}`);
    if (cached) {
      return JSON.parse(cached);
    }

    return null;
  }

  async getApiKeyByKey(key: string): Promise<ApiKey | null> {
    const keyId = await this.redis.get(`apikey_lookup:${key}`);
    if (!keyId) return null;
    
    return this.getApiKey(keyId);
  }

  private async saveApiKey(apiKey: ApiKey): Promise<void> {
    const keyData = JSON.stringify(apiKey);
    await this.redis.set(`apikey:${apiKey.id}`, keyData, 'EX', 86400 * 365);
    await this.redis.set(`apikey_lookup:${apiKey.key}`, apiKey.id, 'EX', 86400 * 365);
  }

  async revokeApiKey(keyId: string): Promise<boolean> {
    const apiKey = await this.getApiKey(keyId);
    if (!apiKey) return false;

    apiKey.status = 'expired';
    await this.saveApiKey(apiKey);
    await this.redis.del(`apikey_lookup:${apiKey.key}`);
    
    return true;
  }

  async checkPermission(apiKey: ApiKey, resource: string, action: string): Promise<boolean> {
    for (const perm of apiKey.permissions) {
      if (perm.resource === '*') return true;
      if (perm.resource === resource && perm.actions.includes(action as any)) {
        return true;
      }
    }
    return false;
  }

  async getUsageStats(keyId: string): Promise<{ total: number; byEndpoint: Record<string, number> }> {
    const key = `api_usage:${keyId}:*`;
    const stats = await this.redis.hgetall(key.replace('*', 'monthly'));
    
    const byEndpoint: Record<string, number> = {};
    let total = 0;
    
    for (const [endpoint, count] of Object.entries(stats)) {
      byEndpoint[endpoint] = parseInt(count);
      total += parseInt(count);
    }

    return { total, byEndpoint };
  }
}

export const apiKeyService = new ApiKeyService();
