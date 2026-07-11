/**
 * src/config/redis.js
 *
 * WHY: Redis is used for caching expensive API calls (LeetCode GraphQL,
 *      AI responses) so we don't hit rate limits and users get fast responses.
 * HOW: Uses ioredis which supports automatic reconnection and pipelining.
 * DESIGN: Singleton pattern — one connection shared across all services.
 */

import Redis from 'ioredis';
import logger from './logger.js';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,

  tls: process.env.NODE_ENV === "production" ? {} : undefined,

  retryStrategy: (times) => Math.min(times * 50, 2000),
  lazyConnect: true,
  maxRetriesPerRequest: 3,
});

redis.on('error', (err) => {
  logger.error('Redis error', { error: err.message });
});

redis.on('connect', () => {
  logger.info('✅ Redis connected successfully');
});

export const connectRedis = async () => {
  await redis.connect();
};

export default redis;
