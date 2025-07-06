import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import logger from './logger.js';

/**
 * Background Service Template - Best Practices Structure
 *
 * This is a clean template with basic functionality for testing
 * No complex business logic, just core background processing features
 *
 * Features:
 * - Fire and forget operations
 * - Queue-based job processing
 * - Retry mechanisms with exponential backoff
 * - Dead letter queue handling
 * - Priority-based job processing
 * - Circuit breaker pattern
 * - Metrics and monitoring
 * - Graceful shutdown
 * - Error handling and logging
 */

class BackgroundService {
  constructor(config = {}) {
    this.config = {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        db: process.env.REDIS_BG_DB || 6,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      },
      job: {
        defaultRetries: 3,
        defaultTimeout: 30000, // 30 seconds
        retryDelay: 5000, // 5 seconds
        maxRetryDelay: 300000, // 5 minutes
        deadLetterQueue: 'dead-letter-queue',
        priorityQueues: ['high', 'normal', 'low'],
      },
      circuitBreaker: {
        failureThreshold: 5,
        recoveryTimeout: 60000, // 1 minute
        expectedErrors: ['ValidationError', 'TimeoutError'],
      },
      ...config,
    };

    this.redis = null;
    this.isShuttingDown = false;
    this.activeJobs = new Map();
    this.circuitBreakers = new Map();
    this.metrics = {
      jobsProcessed: 0,
      jobsFailed: 0,
      jobsRetried: 0,
      averageProcessingTime: 0,
      queueLengths: {},
    };

    this.jobHandlers = new Map();
    this.middleware = [];
  }

  /**
   * Initialize background service
   */
  async initialize() {
    try {
      // Initialize Redis
      this.redis = new Redis(this.config.redis);

      // Test Redis connection
      await this.redis.ping();
      logger.info('Background service Redis connected');

      // Initialize metrics
      await this.initializeMetrics();

      // Start background workers
      await this.startWorkers();

      logger.info('Background service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize background service:', error);
      throw error;
    }
  }

  /**
   * Initialize metrics collection
   */
  async initializeMetrics() {
    // Initialize queue length metrics
    for (const priority of this.config.job.priorityQueues) {
      this.metrics.queueLengths[priority] = 0;
    }

    // Start metrics collection
    setInterval(() => this.collectMetrics(), 30000); // Every 30 seconds
  }

  /**
   * Start background workers
   */
  async startWorkers() {
    // Start workers for each priority queue
    for (const priority of this.config.job.priorityQueues) {
      this.startWorker(priority);
    }

    // Start dead letter queue processor
    this.startDeadLetterProcessor();

    // Start cleanup worker
    this.startCleanupWorker();
  }

  /**
   * Start worker for specific priority queue
   */
  startWorker(priority) {
    const worker = async () => {
      while (!this.isShuttingDown) {
        try {
          const job = await this.dequeueJob(priority);
          if (job) {
            await this.processJob(job);
          } else {
            // No jobs available, wait a bit
            await this.sleep(1000);
          }
        } catch (error) {
          logger.error(`Worker error for priority ${priority}:`, error);
          await this.sleep(5000);
        }
      }
    };

    // Start multiple workers per priority
    const workerCount = priority === 'high' ? 3 : priority === 'normal' ? 2 : 1;
    for (let i = 0; i < workerCount; i++) {
      setImmediate(worker);
    }

    logger.info(`Started ${workerCount} workers for priority: ${priority}`);
  }

  /**
   * Start dead letter queue processor
   */
  startDeadLetterProcessor() {
    const processor = async () => {
      while (!this.isShuttingDown) {
        try {
          const failedJob = await this.redis.rpop(this.config.job.deadLetterQueue);
          if (failedJob) {
            const job = JSON.parse(failedJob);
            await this.handleDeadLetterJob(job);
          } else {
            await this.sleep(10000); // Check every 10 seconds
          }
        } catch (error) {
          logger.error('Dead letter processor error:', error);
          await this.sleep(5000);
        }
      }
    };

    setImmediate(processor);
    logger.info('Dead letter queue processor started');
  }

  /**
   * Start cleanup worker
   */
  startCleanupWorker() {
    const cleanup = async () => {
      while (!this.isShuttingDown) {
        try {
          // Clean up completed jobs older than 24 hours
          const cutoff = Date.now() - 24 * 60 * 60 * 1000;

          for (const [jobId, jobData] of this.activeJobs.entries()) {
            if (jobData.completedAt && jobData.completedAt < cutoff) {
              this.activeJobs.delete(jobId);
            }
          }

          // Clean up circuit breakers
          for (const [key, breaker] of this.circuitBreakers.entries()) {
            if (
              breaker.lastFailureTime &&
              Date.now() - breaker.lastFailureTime > this.config.circuitBreaker.recoveryTimeout
            ) {
              this.circuitBreakers.delete(key);
            }
          }

          await this.sleep(300000); // Run every 5 minutes
        } catch (error) {
          logger.error('Cleanup worker error:', error);
          await this.sleep(60000);
        }
      }
    };

    setImmediate(cleanup);
    logger.info('Cleanup worker started');
  }

  /**
   * Fire and forget operation
   */
  async fireAndForget(operation, data, options = {}) {
    const jobId = uuidv4();
    const job = {
      id: jobId,
      type: 'fire-and-forget',
      operation: operation.name || 'anonymous',
      data,
      priority: options.priority || 'low',
      retries: 0,
      maxRetries: options.maxRetries || 0,
      timeout: options.timeout || this.config.job.defaultTimeout,
      createdAt: new Date().toISOString(),
      ...options,
    };

    // Execute immediately in background
    setImmediate(async () => {
      try {
        await this.executeJob(job);
      } catch (error) {
        logger.error(`Fire and forget job ${jobId} failed:`, error);
      }
    });

    return { jobId, status: 'queued' };
  }

  /**
   * Enqueue job for background processing
   */
  async enqueueJob(jobType, data, options = {}) {
    try {
      const jobId = uuidv4();
      const job = {
        id: jobId,
        type: jobType,
        data,
        priority: options.priority || 'normal',
        retries: 0,
        maxRetries: options.maxRetries || this.config.job.defaultRetries,
        timeout: options.timeout || this.config.job.defaultTimeout,
        delay: options.delay || 0, // Delay in milliseconds
        createdAt: new Date().toISOString(),
        ...options,
      };

      // Add to active jobs map
      this.activeJobs.set(jobId, {
        ...job,
        status: 'queued',
        queuedAt: new Date(),
      });

      // Enqueue with delay if specified
      if (job.delay > 0) {
        setTimeout(() => {
          this.addToQueue(job);
        }, job.delay);
      } else {
        await this.addToQueue(job);
      }

      logger.debug(`Job ${jobId} enqueued with priority ${job.priority}`);
      return { jobId, status: 'queued' };
    } catch (error) {
      logger.error(`Failed to enqueue job ${jobType}:`, error);
      throw error; // Re-throw để caller có thể handle nếu cần
    }
  }

  /**
   * Add job to Redis queue
   */
  async addToQueue(job) {
    const queueKey = `jobs:${job.priority}`;
    await this.redis.lpush(queueKey, JSON.stringify(job));

    // Update metrics
    this.metrics.queueLengths[job.priority] = (this.metrics.queueLengths[job.priority] || 0) + 1;
  }

  /**
   * Dequeue job from Redis queue
   */
  async dequeueJob(priority) {
    const queueKey = `jobs:${priority}`;
    const jobData = await this.redis.rpop(queueKey);

    if (jobData) {
      const job = JSON.parse(jobData);

      // Update metrics
      this.metrics.queueLengths[priority] = Math.max(
        0,
        (this.metrics.queueLengths[priority] || 0) - 1
      );

      return job;
    }

    return null;
  }

  /**
   * Process a job
   */
  async processJob(job) {
    const startTime = Date.now();

    try {
      // Update job status
      this.activeJobs.set(job.id, {
        ...job,
        status: 'processing',
        startedAt: new Date(),
      });

      // Check circuit breaker
      if (this.isCircuitBreakerOpen(job.type)) {
        throw new Error('Circuit breaker is open');
      }

      // Execute job
      await this.executeJob(job);

      // Update metrics
      const processingTime = Date.now() - startTime;
      this.updateMetrics(job, processingTime, true);

      // Mark job as completed
      this.activeJobs.set(job.id, {
        ...job,
        status: 'completed',
        completedAt: new Date(),
        processingTime,
      });

      logger.debug(`Job ${job.id} completed successfully in ${processingTime}ms`);
    } catch (error) {
      // Handle job failure
      await this.handleJobFailure(job, error, startTime);
    }
  }

  /**
   * Execute a job
   */
  async executeJob(job) {
    const handler = this.jobHandlers.get(job.type);
    if (!handler) {
      throw new Error(`No handler registered for job type: ${job.type}`);
    }

    // Apply middleware
    let result = job.data;
    for (const middleware of this.middleware) {
      result = await middleware(job, result);
    }

    // Execute handler with timeout
    return await this.withTimeout(handler(result, job), job.timeout);
  }

  /**
   * Handle job failure
   */
  async handleJobFailure(job, error, startTime) {
    const processingTime = Date.now() - startTime;

    // Update circuit breaker
    this.updateCircuitBreaker(job.type, error);

    // Check if job should be retried
    if (job.retries < job.maxRetries) {
      job.retries++;
      const delay = this.calculateRetryDelay(job.retries);

      logger.warn(
        `Job ${job.id} failed, retrying in ${delay}ms (attempt ${job.retries}/${job.maxRetries})`
      );

      // Update metrics
      this.metrics.jobsRetried++;

      // Schedule retry
      setTimeout(() => {
        this.addToQueue(job);
      }, delay);

      // Update job status
      this.activeJobs.set(job.id, {
        ...job,
        status: 'retrying',
        lastError: error.message,
        lastRetryAt: new Date(),
      });
    } else {
      // Max retries exceeded, move to dead letter queue
      logger.error(`Job ${job.id} failed permanently after ${job.maxRetries} retries`);

      await this.moveToDeadLetterQueue(job, error);

      // Update metrics
      this.metrics.jobsFailed++;
      this.updateMetrics(job, processingTime, false);

      // Update job status
      this.activeJobs.set(job.id, {
        ...job,
        status: 'failed',
        failedAt: new Date(),
        finalError: error.message,
        processingTime,
      });
    }
  }

  /**
   * Move job to dead letter queue
   */
  async moveToDeadLetterQueue(job, error) {
    const deadLetterJob = {
      ...job,
      finalError: error.message,
      failedAt: new Date().toISOString(),
    };

    await this.redis.lpush(this.config.job.deadLetterQueue, JSON.stringify(deadLetterJob));
  }

  /**
   * Handle dead letter job
   */
  async handleDeadLetterJob(job) {
    logger.error(`Processing dead letter job ${job.id}:`, {
      type: job.type,
      error: job.finalError,
      retries: job.retries,
    });

    // Could implement notification, alerting, or manual review here
    // For now, just log the failure
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  calculateRetryDelay(retryCount) {
    const delay = Math.min(
      this.config.job.retryDelay * Math.pow(2, retryCount - 1),
      this.config.job.maxRetryDelay
    );

    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * delay;
    return delay + jitter;
  }

  /**
   * Circuit breaker implementation
   */
  isCircuitBreakerOpen(jobType) {
    const breaker = this.circuitBreakers.get(jobType);
    if (!breaker) return false;

    if (breaker.state === 'open') {
      const timeSinceLastFailure = Date.now() - breaker.lastFailureTime;
      if (timeSinceLastFailure > this.config.circuitBreaker.recoveryTimeout) {
        breaker.state = 'half-open';
        return false;
      }
      return true;
    }

    return false;
  }

  /**
   * Update circuit breaker
   */
  updateCircuitBreaker(jobType, error) {
    let breaker = this.circuitBreakers.get(jobType);
    if (!breaker) {
      breaker = {
        state: 'closed',
        failureCount: 0,
        lastFailureTime: null,
      };
      this.circuitBreakers.set(jobType, breaker);
    }

    if (this.config.circuitBreaker.expectedErrors.includes(error.name)) {
      breaker.failureCount++;
      breaker.lastFailureTime = Date.now();

      if (breaker.failureCount >= this.config.circuitBreaker.failureThreshold) {
        breaker.state = 'open';
        logger.warn(`Circuit breaker opened for job type: ${jobType}`);
      }
    } else {
      // Reset on success
      breaker.failureCount = 0;
      breaker.state = 'closed';
    }
  }

  /**
   * Register job handler
   */
  registerHandler(jobType, handler) {
    this.jobHandlers.set(jobType, handler);
    logger.info(`Registered handler for job type: ${jobType}`);
  }

  /**
   * Add middleware
   */
  use(middleware) {
    this.middleware.push(middleware);
  }

  /**
   * Utility: Execute with timeout
   */
  async withTimeout(promise, timeout) {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Operation timeout')), timeout)),
    ]);
  }

  /**
   * Utility: Sleep
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Update metrics
   */
  updateMetrics(job, processingTime, success) {
    this.metrics.jobsProcessed++;

    if (success) {
      // Job succeeded
      this.metrics.jobsFailed = Math.max(0, this.metrics.jobsFailed - 1);
    } else {
      // Job failed
      this.metrics.jobsFailed++;
    }

    // Update average processing time
    const currentAvg = this.metrics.averageProcessingTime;
    const totalJobs = this.metrics.jobsProcessed;
    this.metrics.averageProcessingTime =
      (currentAvg * (totalJobs - 1) + processingTime) / totalJobs;
  }

  /**
   * Collect metrics
   */
  async collectMetrics() {
    try {
      // Get queue lengths from Redis
      for (const priority of this.config.job.priorityQueues) {
        const length = await this.redis.llen(`jobs:${priority}`);
        this.metrics.queueLengths[priority] = length;
      }

      // Log metrics
      logger.info('Background service metrics:', this.metrics);
    } catch (error) {
      logger.error('Failed to collect metrics:', error);
    }
  }

  /**
   * Get job status
   */
  getJobStatus(jobId) {
    return this.activeJobs.get(jobId) || null;
  }

  /**
   * Get service health
   */
  async getHealth() {
    try {
      const redisHealth = await this.redis.ping();

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        redis: redisHealth === 'PONG' ? 'connected' : 'disconnected',
        activeJobs: this.activeJobs.size,
        circuitBreakers: this.circuitBreakers.size,
        metrics: this.metrics,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    logger.info('Starting background service shutdown...');
    this.isShuttingDown = true;

    try {
      // Wait for active jobs to complete (with timeout)
      const shutdownTimeout = setTimeout(() => {
        logger.warn('Shutdown timeout reached, forcing exit');
        process.exit(1);
      }, 30000);

      // Wait for active jobs
      while (this.activeJobs.size > 0) {
        const activeJobs = Array.from(this.activeJobs.values()).filter(
          (job) => job.status === 'processing'
        );

        if (activeJobs.length === 0) break;

        logger.info(`Waiting for ${activeJobs.length} active jobs to complete...`);
        await this.sleep(1000);
      }

      clearTimeout(shutdownTimeout);

      // Close Redis connection
      if (this.redis) {
        await this.redis.quit();
      }

      logger.info('Background service shutdown completed');
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// Create singleton instance
let backgroundServiceInstance = null;

export function getBackgroundService(config) {
  if (!backgroundServiceInstance) {
    backgroundServiceInstance = new BackgroundService(config);
  }
  return backgroundServiceInstance;
}

export default BackgroundService;
