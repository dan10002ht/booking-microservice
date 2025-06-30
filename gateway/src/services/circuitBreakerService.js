import CircuitBreaker from 'opossum';
import config from '../config/index.js';
import logger from '../utils/logger.js';

/**
 * Circuit Breaker Service using Opossum
 * Provides circuit breaker functionality for gRPC calls and external services
 */
class CircuitBreakerService {
  constructor() {
    this.breakers = new Map();
    this.defaultOptions = {
      timeout: config.circuitBreaker.timeout || 30000,
      errorThresholdPercentage: config.circuitBreaker.errorThresholdPercentage || 50,
      resetTimeout: config.circuitBreaker.resetTimeout || 30000,
      volumeThreshold: config.circuitBreaker.volumeThreshold || 5,
      rollingCountTimeout: 60000,
      rollingCountBuckets: 10,
    };
  }

  /**
   * Create a circuit breaker for a specific service/method
   * @param {string} name - Circuit breaker name
   * @param {Function} fn - Function to wrap with circuit breaker
   * @param {Object} options - Circuit breaker options
   * @returns {CircuitBreaker} Circuit breaker instance
   */
  createBreaker(name, fn, options = {}) {
    // Bypass circuit breaker in development mode
    if (!config.circuitBreaker.enabled) {
      logger.info(`Circuit breaker disabled for '${name}' in development mode`, {
        service: name,
        timestamp: new Date().toISOString(),
      });

      // Return a mock circuit breaker that just calls the function directly
      const mockBreaker = {
        fire: async (...args) => {
          try {
            return await fn(...args);
          } catch (error) {
            logger.error(`Direct call failed for '${name}'`, {
              service: name,
              error: error.message,
              timestamp: new Date().toISOString(),
            });
            throw error;
          }
        },
        stats: { totalCount: 0, errorCount: 0, errorPercentage: 0 },
        opened: false,
        close: () => {},
        open: () => {},
        on: () => {},
      };

      this.breakers.set(name, mockBreaker);
      return mockBreaker;
    }

    const breakerOptions = { ...this.defaultOptions, ...options };

    const breaker = new CircuitBreaker(fn, breakerOptions);

    // Add event listeners
    breaker.on('open', () => {
      logger.warn(`Circuit breaker '${name}' opened`, {
        service: name,
        timestamp: new Date().toISOString(),
      });
    });

    breaker.on('close', () => {
      logger.info(`Circuit breaker '${name}' closed`, {
        service: name,
        timestamp: new Date().toISOString(),
      });
    });

    breaker.on('halfOpen', () => {
      logger.info(`Circuit breaker '${name}' half-opened`, {
        service: name,
        timestamp: new Date().toISOString(),
      });
    });

    breaker.on('fallback', (result) => {
      logger.warn(`Circuit breaker '${name}' fallback executed`, {
        service: name,
        fallbackResult: result,
        timestamp: new Date().toISOString(),
      });
    });

    breaker.on('success', () => {
      logger.debug(`Circuit breaker '${name}' call succeeded`, {
        service: name,
        timestamp: new Date().toISOString(),
      });
    });

    breaker.on('timeout', () => {
      logger.warn(`Circuit breaker '${name}' call timed out`, {
        service: name,
        timeout: breakerOptions.timeout,
        timestamp: new Date().toISOString(),
      });
    });

    breaker.on('reject', (error) => {
      logger.error(`Circuit breaker '${name}' call rejected`, {
        service: name,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    });

    breaker.on('fire', () => {
      logger.debug(`Circuit breaker '${name}' call fired`, {
        service: name,
        timestamp: new Date().toISOString(),
      });
    });

    // Store breaker
    this.breakers.set(name, breaker);

    return breaker;
  }

  /**
   * Get existing circuit breaker
   * @param {string} name - Circuit breaker name
   * @returns {CircuitBreaker|null} Circuit breaker instance
   */
  getBreaker(name) {
    return this.breakers.get(name) || null;
  }

  /**
   * Create a circuit breaker for gRPC service calls
   * @param {string} serviceName - Service name
   * @param {string} methodName - Method name
   * @param {Function} grpcCall - gRPC call function
   * @param {Object} options - Circuit breaker options
   * @returns {CircuitBreaker} Circuit breaker instance
   */
  createGrpcBreaker(serviceName, methodName, grpcCall, options = {}) {
    const name = `${serviceName}.${methodName}`;

    // Create fallback function
    const fallback = (error) => {
      logger.warn(`gRPC fallback for ${name}`, {
        service: serviceName,
        method: methodName,
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      // Return a default response or throw a specific error
      throw new Error(`Service ${serviceName} is temporarily unavailable`);
    };

    const breakerOptions = {
      ...options,
      fallback,
    };

    return this.createBreaker(name, grpcCall, breakerOptions);
  }

  /**
   * Create a circuit breaker for HTTP calls
   * @param {string} serviceName - Service name
   * @param {string} endpoint - Endpoint name
   * @param {Function} httpCall - HTTP call function
   * @param {Object} options - Circuit breaker options
   * @returns {CircuitBreaker} Circuit breaker instance
   */
  createHttpBreaker(serviceName, endpoint, httpCall, options = {}) {
    const name = `${serviceName}.${endpoint}`;

    const fallback = (error) => {
      logger.warn(`HTTP fallback for ${name}`, {
        service: serviceName,
        endpoint,
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      throw new Error(`Service ${serviceName} is temporarily unavailable`);
    };

    const breakerOptions = {
      ...options,
      fallback,
    };

    return this.createBreaker(name, httpCall, breakerOptions);
  }

  /**
   * Get circuit breaker statistics
   * @param {string} name - Circuit breaker name (optional)
   * @returns {Object} Statistics
   */
  getStats(name = null) {
    if (name) {
      const breaker = this.breakers.get(name);
      return breaker ? breaker.stats : null;
    }

    const stats = {};
    for (const [breakerName, breaker] of this.breakers) {
      stats[breakerName] = breaker.stats;
    }
    return stats;
  }

  /**
   * Get health status of all circuit breakers
   * @returns {Object} Health status
   */
  getHealth() {
    const health = {
      status: 'healthy',
      breakers: {},
      timestamp: new Date().toISOString(),
    };

    for (const [name, breaker] of this.breakers) {
      const stats = breaker.stats;
      const isHealthy = breaker.opened === false;

      health.breakers[name] = {
        status: isHealthy ? 'healthy' : 'unhealthy',
        opened: breaker.opened,
        stats: {
          totalCount: stats.totalCount,
          errorCount: stats.errorCount,
          errorPercentage: stats.errorPercentage,
          latencyMean: stats.latencyMean,
          latencyPercentiles: stats.latencyPercentiles,
        },
      };

      if (!isHealthy) {
        health.status = 'degraded';
      }
    }

    return health;
  }

  /**
   * Reset a circuit breaker
   * @param {string} name - Circuit breaker name
   */
  resetBreaker(name) {
    const breaker = this.breakers.get(name);
    if (breaker) {
      breaker.close();
      logger.info(`Circuit breaker '${name}' reset`, {
        service: name,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Reset all circuit breakers
   */
  resetAllBreakers() {
    for (const breaker of this.breakers.values()) {
      breaker.close();
    }
    logger.info('All circuit breakers reset', {
      timestamp: new Date().toISOString(),
    });
  }
}

// Create singleton instance
const circuitBreakerService = new CircuitBreakerService();

export default circuitBreakerService;
