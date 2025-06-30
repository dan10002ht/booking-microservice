import logger from '../utils/logger.js';

const errorHandler = (err, req, res, next) => {
  // Log error
  logger.logError(err, req);

  // Set correlation ID in response
  if (req.correlationId) {
    res.setHeader('X-Correlation-ID', req.correlationId);
  }

  // Handle different types of errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message,
      details: err.details,
      correlationId: req.correlationId
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing authentication token',
      correlationId: req.correlationId
    });
  }

  if (err.name === 'ForbiddenError') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Access denied',
      correlationId: req.correlationId
    });
  }

  if (err.name === 'NotFoundError') {
    return res.status(404).json({
      error: 'Not Found',
      message: err.message || 'Resource not found',
      correlationId: req.correlationId
    });
  }

  if (err.name === 'RateLimitError') {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded',
      correlationId: req.correlationId
    });
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : message,
    correlationId: req.correlationId,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export default errorHandler; 