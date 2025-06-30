import dotenv from 'dotenv';

dotenv.config();

const config = {
  server: {
    port: process.env.PORT || 50053,
  },
  grpc: {
    port: process.env.PORT || 50053,
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'booking_system_security',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    db: process.env.REDIS_DB || 2,
  },
  elasticsearch: {
    node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
    username: process.env.ELASTICSEARCH_USERNAME,
    password: process.env.ELASTICSEARCH_PASSWORD,
    index: process.env.ELASTICSEARCH_INDEX || 'security-events',
  },
  security: {
    threatDetectionEnabled: process.env.THREAT_DETECTION_ENABLED === 'true',
    anomalyDetectionEnabled: process.env.ANOMALY_DETECTION_ENABLED === 'true',
    riskScoringEnabled: process.env.RISK_SCORING_ENABLED === 'true',
    alertEnabled: process.env.ALERT_ENABLED === 'true',
  },
  threatDetection: {
    patternRetentionDays: parseInt(process.env.THREAT_PATTERN_RETENTION_DAYS) || 90,
    anomalyThreshold: parseFloat(process.env.ANOMALY_THRESHOLD) || 0.8,
    riskScoreWeights: JSON.parse(process.env.RISK_SCORE_WEIGHTS || '{"location":0.3,"behavior":0.4,"device":0.3}'),
  },
  alert: {
    retentionDays: parseInt(process.env.ALERT_RETENTION_DAYS) || 30,
    escalationThreshold: parseInt(process.env.ALERT_ESCALATION_THRESHOLD) || 3,
    cooldownMinutes: parseInt(process.env.ALERT_COOLDOWN_MINUTES) || 15,
  },
  machineLearning: {
    modelPath: process.env.ML_MODEL_PATH || './models/threat-detection',
    trainingIntervalHours: parseInt(process.env.ML_TRAINING_INTERVAL_HOURS) || 24,
    predictionConfidenceThreshold: parseFloat(process.env.ML_PREDICTION_CONFIDENCE_THRESHOLD) || 0.7,
  },
  services: {
    auth: {
      url: process.env.AUTH_SERVICE_URL || 'localhost:50051',
    },
    device: {
      url: process.env.DEVICE_SERVICE_URL || 'localhost:50052',
    },
    notification: {
      url: process.env.NOTIFICATION_SERVICE_URL || 'localhost:50054',
    },
  },
  event: {
    batchSize: parseInt(process.env.EVENT_BATCH_SIZE) || 100,
    processingIntervalMs: parseInt(process.env.EVENT_PROCESSING_INTERVAL_MS) || 5000,
    retentionDays: parseInt(process.env.EVENT_RETENTION_DAYS) || 365,
  },
  incident: {
    autoResponseEnabled: process.env.INCIDENT_AUTO_RESPONSE_ENABLED === 'true',
    escalationEnabled: process.env.INCIDENT_ESCALATION_ENABLED === 'true',
    responseTimeoutMinutes: parseInt(process.env.INCIDENT_RESPONSE_TIMEOUT_MINUTES) || 30,
  },
  health: {
    interval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000,
    timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT) || 5000,
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/security-service.log',
  },
};

export default config; 