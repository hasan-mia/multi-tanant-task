const Redis = require('ioredis');

const redisConfig = {
  host:
    process.env.REDIS_HOST ||
    'redis-12780.c299.asia-northeast1-1.gce.redns.redis-cloud.com',
  port: Number(process.env.REDIS_PORT) || 12780,
  password: process.env.REDIS_PASS || '53GZchGmrMTst7uEglVtNlwPoJG3y6pe',
  ...(process.env.REDIS_TLS === 'true' ? { tls: {} } : {}),
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  connectTimeout: 10000,
  retryStrategy: (times) => Math.min(times * 100, 3000),
};

const redisConnection = new Redis(redisConfig);

redisConnection.on('connect', () => console.log('Redis connected'));
redisConnection.on('ready', () => console.log('Redis ready'));
redisConnection.on('reconnecting', () => console.warn('Redis reconnecting...'));
redisConnection.on('error', (e) => console.error('Redis error:', e.message));

class RedisClient {
  constructor() {
    this.redis = redisConnection;
  }

  // Set a key-value pair in Redis
  async set(key, value, expire = 300) {
    try {
      await this.redis.set(key, JSON.stringify(value), 'EX', expire);
    } catch (error) {
      console.error(`Error setting key '${key}' in Redis:`, error);
    }
  }

  // Get the value of a key from Redis
  async get(key) {
    try {
      const value = await this.redis.get(key);
      return JSON.parse(value);
    } catch (error) {
      console.error(
        `Error retrieving value for key '${key}' from Redis:`,
        error
      );
      return null;
    }
  }

  // Remove a key from Redis
  async remove(key) {
    try {
      const result = await this.redis.del(key);
      if (result === 1) {
        console.log(`Key '${key}' removed successfully from Redis.`);
      } else {
        console.log(`Key '${key}' does not exist in Redis.`);
      }
    } catch (error) {
      console.error(`Error removing key '${key}' from Redis:`, error);
    }
  }

  // Pop an item from a list in Redis
  async lpop(listKey) {
    try {
      const item = await this.redis.lpop(listKey);
      if (item) {
        console.log(`Item '${item}' popped from list '${listKey}'.`);
        return JSON.parse(item);
      } else {
        console.log(`List '${listKey}' is empty.`);
        return null;
      }
    } catch (error) {
      console.error(`Error popping item from list '${listKey}':`, error);
      return null;
    }
  }

  async llen(listKey) {
    try {
      const length = await this.redis.llen(listKey);
      console.log(`Length of list '${listKey}': ${length}`);
      return length;
    } catch (error) {
      console.error(`Error getting length of list '${listKey}':`, error);
      return 0;
    }
  }

  async rpush(listKey, item) {
    try {
      await this.redis.rpush(listKey, item);
      console.log(`Item '${item}' pushed to list '${listKey}'.`);
    } catch (error) {
      console.error(`Error pushing item to list '${listKey}':`, error);
    }
  }

  async close() {
    try {
      await this.redis.quit();
      console.log('Redis connection closed.');
    } catch (error) {
      console.error('Error closing Redis:', error.message);
      throw error;
    }
  }
}

const redis = new RedisClient();


module.exports = {
  redisConfig,
  redis,
};