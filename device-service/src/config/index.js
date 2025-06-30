import dotenv from 'dotenv';

dotenv.config();

const config = {
  server: {
    port: process.env.PORT || 50052,
  },
  grpc: {
    port: process.env.PORT || 50052,
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'booking_system_device',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    db: process.env.REDIS_DB || 1,
  },
  device: {
    maxSessionsPerUser: parseInt(process.env.MAX_SESSIONS_PER_USER) || 5,
    sessionExpiryHours: parseInt(process.env.SESSION_EXPIRY_HOURS) || 24,
    trustThreshold: parseInt(process.env.DEVICE_TRUST_THRESHOLD) || 70,
    suspiciousThreshold: parseInt(process.env.DEVICE_SUSPICIOUS_THRESHOLD) || 30,
    fingerprintSalt: process.env.FINGERPRINT_SALT || 'default-salt',
    geoipEnabled: process.env.GEOIP_ENABLED === 'true',
  },
  session: {
    cleanupInterval: parseInt(process.env.SESSION_CLEANUP_INTERVAL) || 3600000,
    cleanupBatchSize: parseInt(process.env.SESSION_CLEANUP_BATCH_SIZE) || 100,
  },
  services: {
    security: {
      url: process.env.SECURITY_SERVICE_URL || 'localhost:50053',
      timeout: parseInt(process.env.SECURITY_SERVICE_TIMEOUT) || 5000,
    },
    auth: {
      url: process.env.AUTH_SERVICE_URL || 'localhost:50051',
      timeout: parseInt(process.env.AUTH_SERVICE_TIMEOUT) || 5000,
    },
  },
  analytics: {
    enabled: process.env.ANALYTICS_ENABLED === 'true',
    retentionDays: parseInt(process.env.ANALYTICS_RETENTION_DAYS) || 90,
  },
  health: {
    interval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000,
    timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT) || 5000,
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/device-service.log',
  },
};

export default config; 