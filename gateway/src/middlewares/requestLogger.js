import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';

const requestLogger = (req, res, next) => {
  // Generate correlation ID if not present
  const correlationId = req.headers['x-correlation-id'] || uuidv4();
  req.correlationId = correlationId;

  // Add correlation ID to response headers
  res.setHeader('X-Correlation-ID', correlationId);

  // Log request start
  const startTime = Date.now();

  logger.info('Request started', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    correlationId,
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = (chunk, encoding) => {
    const responseTime = Date.now() - startTime;

    logger.info('Request completed', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      contentLength: res.get('Content-Length'),
      correlationId,
    });

    originalEnd.call(res, chunk, encoding);
  };

  next();
};

export default requestLogger;
