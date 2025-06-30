import morgan from 'morgan';
import logger from '../utils/logger.js';
import requestLoggerMiddleware from './requestLogger.js';

/**
 * Logging middleware configuration
 */
export const loggingMiddleware = (app) => {
  // Morgan HTTP request logging
  app.use(
    morgan('combined', {
      stream: { write: (message) => logger.info(message.trim()) },
    })
  );

  // Custom request logger
  app.use(requestLoggerMiddleware);
};
