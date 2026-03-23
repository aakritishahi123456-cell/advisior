import Redis from 'ioredis';
import logger from '../utils/logger';

let redis: Redis;

export const connectRedis = async (): Promise<Redis> => {
  if (redis) {
    return redis;
  }

  try {
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      retryStrategy: (times) => {
        if (times > 3) {
          return null;
        }
        return Math.min(times * 100, 3000);
      }
    });

    redis.on('connect', () => {
      logger.info('Connected to Redis');
    });

    redis.on('error', (err) => {
      logger.error(err, { component: 'redis', event: 'redis_connection_error' });
    });

    await redis.connect();
    return redis;
  } catch (error) {
    logger.error(error as Error, { component: 'redis', event: 'redis_connection_failed' });
    throw error;
  }
};

export const getRedis = (): Redis => {
  if (!redis) {
    throw new Error('Redis not connected. Call connectRedis() first.');
  }
  return redis;
};

export const disconnectRedis = async (): Promise<void> => {
  if (redis) {
    await redis.disconnect();
    redis = null as any;
  }
};
