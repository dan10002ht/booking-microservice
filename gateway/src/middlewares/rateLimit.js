import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import config from '../config/index.js';

/**
 * Rate limiting middleware configuration
 * @returns {Object} Rate limiting middleware objects
 */
export const rateLimitMiddleware = () => {
  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });

  const speedLimiter = slowDown({
    windowMs: config.rateLimit.windowMs,
    delayAfter: config.rateLimit.delayAfter,
    delayMs: (used) => {
      const delayAfter = config.rateLimit.delayAfter;
      const delayMs = config.rateLimit.delayMs;
      return (used - delayAfter) * delayMs;
    },
  });

  return { limiter, speedLimiter };
};
