import winston from 'winston';
import config from '../config/index.js';

// Custom format for structured logging
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      service: 'gateway',
      ...meta
    });
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: { service: 'gateway' },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // File transport for production
    ...(config.server.nodeEnv === 'production' ? [
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        maxsize: 5242880, // 5MB
        maxFiles: 5
      })
    ] : [])
  ]
});

// Add correlation ID to logs
logger.addCorrelationId = (correlationId) => {
  return logger.child({ correlationId });
};

// Log levels
logger.levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Helper methods for different log types
logger.logRequest = (req, res, responseTime) => {
  logger.info('HTTP Request', {
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    correlationId: req.correlationId
  });
};

logger.logError = (error, req = null) => {
  logger.error('Application Error', {
    message: error.message,
    stack: error.stack,
    correlationId: req?.correlationId,
    url: req?.originalUrl,
    method: req?.method,
    ip: req?.ip
  });
};

logger.logGrpcCall = (service, method, duration, success, error = null) => {
  const logData = {
    service,
    method,
    duration: `${duration}ms`,
    success
  };

  if (error) {
    logData.error = error.message;
    logData.errorCode = error.code;
  }

  if (success) {
    logger.info('gRPC Call Success', logData);
  } else {
    logger.error('gRPC Call Failed', logData);
  }
};

export default logger; 