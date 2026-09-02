import Redis from 'ioredis';
import config from '../config';

const redisClient = new Redis(config.redis.url, {
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    const delay = Math.min(times * 100, 3000);
    return delay;
  },
});

redisClient.on('connect', () => {
  console.log('⚡ Redis client connected successfully');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis Connection Error:', err.message);
});

export default redisClient;
