import Redis from 'ioredis';
import logger from '../utils/logger';

let redis: Redis;

export const connectRedis = async (): Promise<Redis> => {
  if (redis) {
    return redis;
  }

  try {
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    redis.on('connect', () => {
      logger.info('Connected to Redis');
    });

    redis.on('error', (err) => {
      logger.error('Redis connection error:', err);
    });

    await redis.connect();
    return redis;
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
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
