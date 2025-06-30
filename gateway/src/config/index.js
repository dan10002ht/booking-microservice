import dotenv from 'dotenv';

dotenv.config();

const config = {
  // Server Configuration
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  },

  // Redis Configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    database: process.env.REDIS_DATABASE || 0,
    url:
      process.env.REDIS_URL ||
      `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_key',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your_refresh_secret_key',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // Rate Limiting Configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    delayAfter: parseInt(process.env.RATE_LIMIT_DELAY_AFTER) || 50,
    delayMs: parseInt(process.env.RATE_LIMIT_DELAY_MS) || 500,
  },

  // gRPC Service Configuration
  grpc: {
    authService: {
      url: process.env.GRPC_AUTH_SERVICE_URL || '127.0.0.1:50051',
      maxReceiveMessageLength: parseInt(process.env.GRPC_MAX_RECEIVE_MESSAGE_LENGTH) || 4194304,
      maxSendMessageLength: parseInt(process.env.GRPC_MAX_SEND_MESSAGE_LENGTH) || 4194304,
      keepaliveTimeMs: parseInt(process.env.GRPC_KEEPALIVE_TIME_MS) || 30000,
      keepaliveTimeoutMs: parseInt(process.env.GRPC_KEEPALIVE_TIMEOUT_MS) || 5000,
    },
    userService: {
      url: process.env.GRPC_USER_SERVICE_URL || 'user-profile-service:50052',
    },
    eventService: {
      url: process.env.GRPC_EVENT_SERVICE_URL || 'event-management-service:50053',
    },
    bookingService: {
      url: process.env.GRPC_BOOKING_SERVICE_URL || 'booking-service:50054',
    },
    paymentService: {
      url: process.env.GRPC_PAYMENT_SERVICE_URL || 'payment-service:50055',
    },
    ticketService: {
      url: process.env.GRPC_TICKET_SERVICE_URL || 'ticket-service:50056',
    },
  },

  // Circuit Breaker Configuration
  circuitBreaker: {
    threshold: parseInt(process.env.CIRCUIT_BREAKER_THRESHOLD),
    timeout: parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT),
    resetTimeout: parseInt(process.env.CIRCUIT_BREAKER_RESET_TIMEOUT),
    errorThresholdPercentage: parseInt(process.env.CIRCUIT_BREAKER_ERROR_PERCENTAGE),
    volumeThreshold: parseInt(process.env.CIRCUIT_BREAKER_VOLUME_THRESHOLD),
    enabled:
      process.env.CIRCUIT_BREAKER_ENABLED !== 'false' && process.env.NODE_ENV !== 'development',
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },

  // Monitoring Configuration
  monitoring: {
    prometheus: {
      port: process.env.PROMETHEUS_PORT || 9090,
    },
  },

  // Security Configuration
  security: {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true,
    },
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
    },
  },
};

export default config;
