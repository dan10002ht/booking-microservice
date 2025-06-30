import { errorHandlerMiddleware } from '../middlewares/index.js';
import config from '../config/index.js';

/**
 * Initialize error handling and root routes
 * @param {express.Application} app - Express app instance
 */
export const initializeErrorHandling = (app) => {
  // Root route
  app.get('/', (req, res) => {
    res.json({
      message: 'Booking System API Gateway',
      version: '1.0.0',
      status: 'running',
      timestamp: new Date().toISOString(),
      services: {
        auth: config.grpc.authService.url,
        user: config.grpc.userService.url,
        event: config.grpc.eventService.url,
        booking: config.grpc.bookingService.url,
        payment: config.grpc.paymentService.url,
      },
    });
  });

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      error: 'Route not found',
      path: req.originalUrl,
      method: req.method,
    });
  });

  // Error handling middleware
  app.use(errorHandlerMiddleware);
};
