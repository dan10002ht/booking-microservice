import { createClient } from 'redis';
import config from './index.js';
import logger from '../utils/logger.js';

// Create Redis client
const redisClient = createClient({
  socket: {
    host: config.redis.host,
    port: config.redis.port,
  },
  password: config.redis.password,
  database: config.redis.db,
});

// Connect to Redis
const connectRedis = async () => {
  try {
    await redisClient.connect();
    logger.info('✅ Redis connection established');
    return true;
  } catch (error) {
    logger.error('❌ Redis connection failed:', error);
    return false;
  }
};

// Close Redis connection
const closeRedisConnection = async () => {
  try {
    await redisClient.quit();
    logger.info('✅ Redis connection closed');
  } catch (error) {
    logger.error('❌ Error closing Redis connection:', error);
  }
};

// Health check for Redis
const healthCheck = async () => {
  try {
    await redisClient.ping();
    return { status: 'healthy', service: 'redis' };
  } catch (error) {
    logger.error('Redis health check failed:', error);
    return { status: 'unhealthy', service: 'redis', error: error.message };
  }
};

// Redis event handlers
redisClient.on('error', (err) => {
  logger.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  logger.info('Redis Client Connected');
});

redisClient.on('ready', () => {
  logger.info('Redis Client Ready');
});

redisClient.on('end', () => {
  logger.info('Redis Client Disconnected');
});

export { redisClient, connectRedis, closeRedisConnection, healthCheck }; 