import Redis from 'ioredis';
import logger from '../../utils/logger.js';

// Redis client configuration
const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  db: process.env.REDIS_DB || 0,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

// Cache configuration
const CACHE_TTL = {
  USER_PROFILE: 300, // 5 minutes
  USER_ROLES: 600, // 10 minutes
  TOKEN_VALIDATION: 60, // 1 minute
  PERMISSIONS: 1800, // 30 minutes
  ORGANIZATION: 900, // 15 minutes
  SESSION: 300, // 5 minutes
};

// Cache keys
const CACHE_KEYS = {
  USER_PROFILE: (userId) => `user:profile:${userId}`,
  USER_ROLES: (userId) => `user:roles:${userId}`,
  TOKEN_VALIDATION: (token) => `token:validation:${token}`,
  PERMISSIONS: (roleId) => `role:permissions:${roleId}`,
  ORGANIZATION: (orgId) => `org:${orgId}`,
  SESSION: (sessionId) => `session:${sessionId}`,
  USER_SESSIONS: (userId) => `user:sessions:${userId}`,
};

/**
 * Cache service for auth operations
 */
class CacheService {
  constructor() {
    this.redis = redisClient;
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.redis.on('connect', () => {
      logger.info('Redis cache connected');
    });

    this.redis.on('error', (error) => {
      logger.error('Redis cache error:', error);
    });

    this.redis.on('close', () => {
      logger.warn('Redis cache connection closed');
    });
  }

  /**
   * Set cache with TTL
   */
  async set(key, value, ttl = 300) {
    try {
      const serializedValue = JSON.stringify(value);
      await this.redis.setex(key, ttl, serializedValue);
      logger.debug(`Cache set: ${key}`);
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
    }
  }

  /**
   * Get cache value
   */
  async get(key) {
    try {
      const value = await this.redis.get(key);
      if (value) {
        logger.debug(`Cache hit: ${key}`);
        return JSON.parse(value);
      }
      logger.debug(`Cache miss: ${key}`);
      return null;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Delete cache key
   */
  async del(key) {
    try {
      await this.redis.del(key);
      logger.debug(`Cache deleted: ${key}`);
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
    }
  }

  /**
   * Delete multiple cache keys
   */
  async delMultiple(keys) {
    try {
      if (keys.length > 0) {
        await this.redis.del(...keys);
        logger.debug(`Cache deleted multiple keys: ${keys.join(', ')}`);
      }
    } catch (error) {
      logger.error(`Cache delete multiple error:`, error);
    }
  }

  /**
   * Invalidate user-related cache
   */
  async invalidateUserCache(userId) {
    const keys = [
      CACHE_KEYS.USER_PROFILE(userId),
      CACHE_KEYS.USER_ROLES(userId),
      CACHE_KEYS.USER_SESSIONS(userId),
    ];
    await this.delMultiple(keys);
  }

  /**
   * Invalidate organization cache
   */
  async invalidateOrganizationCache(orgId) {
    await this.del(CACHE_KEYS.ORGANIZATION(orgId));
  }

  /**
   * Invalidate token cache
   */
  async invalidateTokenCache(token) {
    await this.del(CACHE_KEYS.TOKEN_VALIDATION(token));
  }

  /**
   * Cache user profile
   */
  async cacheUserProfile(userId, userData) {
    await this.set(CACHE_KEYS.USER_PROFILE(userId), userData, CACHE_TTL.USER_PROFILE);
  }

  /**
   * Get cached user profile
   */
  async getCachedUserProfile(userId) {
    return await this.get(CACHE_KEYS.USER_PROFILE(userId));
  }

  /**
   * Cache user roles
   */
  async cacheUserRoles(userId, roles) {
    await this.set(CACHE_KEYS.USER_ROLES(userId), roles, CACHE_TTL.USER_ROLES);
  }

  /**
   * Get cached user roles
   */
  async getCachedUserRoles(userId) {
    return await this.get(CACHE_KEYS.USER_ROLES(userId));
  }

  /**
   * Cache token validation
   */
  async cacheTokenValidation(token, validationData) {
    await this.set(CACHE_KEYS.TOKEN_VALIDATION(token), validationData, CACHE_TTL.TOKEN_VALIDATION);
  }

  /**
   * Get cached token validation
   */
  async getCachedTokenValidation(token) {
    return await this.get(CACHE_KEYS.TOKEN_VALIDATION(token));
  }

  /**
   * Cache organization data
   */
  async cacheOrganization(orgId, orgData) {
    await this.set(CACHE_KEYS.ORGANIZATION(orgId), orgData, CACHE_TTL.ORGANIZATION);
  }

  /**
   * Get cached organization
   */
  async getCachedOrganization(orgId) {
    return await this.get(CACHE_KEYS.ORGANIZATION(orgId));
  }

  /**
   * Cache session data
   */
  async cacheSession(sessionId, sessionData) {
    await this.set(CACHE_KEYS.SESSION(sessionId), sessionData, CACHE_TTL.SESSION);
  }

  /**
   * Get cached session
   */
  async getCachedSession(sessionId) {
    return await this.get(CACHE_KEYS.SESSION(sessionId));
  }

  /**
   * Health check for cache
   */
  async healthCheck() {
    try {
      await this.redis.ping();
      return { status: 'healthy', service: 'cache' };
    } catch (error) {
      return { status: 'unhealthy', service: 'cache', error: error.message };
    }
  }

  /**
   * Close cache connection
   */
  async close() {
    try {
      await this.redis.quit();
      logger.info('Cache connection closed');
    } catch (error) {
      logger.error('Error closing cache connection:', error);
    }
  }
}

// Export singleton instance
const cacheService = new CacheService();
export default cacheService;
