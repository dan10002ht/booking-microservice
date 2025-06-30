import swaggerJsdoc from 'swagger-jsdoc';
import config from '../config/index.js';

// Import all swagger documentation files
import '../swagger/auth.js';
import '../swagger/user.js';
import '../swagger/booking.js';
import '../swagger/event.js';
import '../swagger/payment.js';
import '../swagger/health.js';

/**
 * Initialize Swagger documentation
 * @returns {Object} Swagger specification
 */
export const initializeSwagger = () => {
  const swaggerOptions = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Booking System API Gateway',
        version: '1.0.0',
        description: 'API Gateway for Booking System Microservices',
        contact: {
          name: 'API Support',
          email: 'support@bookingsystem.com',
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT',
        },
      },
      servers: [
        {
          url: `http://localhost:${config.server.port}/api`,
          description: 'Development server',
        },
        {
          url: 'https://api.bookingsystem.com/api',
          description: 'Production server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'JWT token for authentication',
          },
        },
      },
      tags: [
        {
          name: 'Auth',
          description: 'Authentication and authorization endpoints',
        },
        {
          name: 'Users',
          description: 'User profile and address management',
        },
        {
          name: 'Events',
          description: 'Event management and discovery',
        },
        {
          name: 'Bookings',
          description: 'Booking creation and management',
        },
        {
          name: 'Payments',
          description: 'Payment processing and management',
        },
        {
          name: 'Health',
          description: 'Health check and monitoring endpoints',
        },
      ],
    },
    apis: ['./src/routes/*.js', './src/swagger/*.js'],
  };

  const spec = swaggerJsdoc(swaggerOptions);

  return spec;
};
