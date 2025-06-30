import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load security service proto
const dockerSharedProtoPath = path.join('/shared-lib', 'protos', 'security.proto');
const localSharedProtoPath = path.join(
  __dirname,
  '..',
  '..',
  '..',
  'shared-lib',
  'protos',
  'security.proto'
);
const localProtoPath = path.join(__dirname, '..', 'proto', 'security.proto');

let PROTO_PATH;
if (fs.existsSync(dockerSharedProtoPath)) {
  PROTO_PATH = dockerSharedProtoPath;
  logger.info(`Using docker shared proto: ${PROTO_PATH}`);
} else if (fs.existsSync(localSharedProtoPath)) {
  PROTO_PATH = localSharedProtoPath;
  logger.info(`Using local shared proto: ${PROTO_PATH}`);
} else {
  PROTO_PATH = localProtoPath;
  logger.info(`Using local proto: ${PROTO_PATH}`);
}

let securityProto;
try {
  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });
  securityProto = grpc.loadPackageDefinition(packageDefinition).security;
} catch (error) {
  logger.warn('Security proto not found, using fallback implementation');
  securityProto = null;
}

// Create security service client
let securityClient = null;

const createSecurityClient = () => {
  if (!securityProto) {
    logger.warn('Security proto not available, skipping client creation');
    return null;
  }

  try {
    const securityServiceUrl = process.env.SECURITY_SERVICE_URL || 'localhost:50053';
    const client = new securityProto.SecurityService(
      securityServiceUrl,
      grpc.credentials.createInsecure()
    );

    return client;
  } catch (error) {
    logger.error('Failed to create security client:', error);
    return null;
  }
};

// Initialize client
const initSecurityClient = () => {
  if (!securityClient) {
    securityClient = createSecurityClient();
  }
  return securityClient;
};

// Submit security event
export const submitEvent = async (eventData) => {
  try {
    const client = initSecurityClient();
    if (!client) {
      logger.warn('Security client not available, skipping event submission');
      return { success: false, message: 'Security service unavailable' };
    }

    const request = {
      user_id: eventData.user_id,
      service_name: eventData.service_name,
      event_type: eventData.event_type,
      event_category: eventData.event_category,
      severity: eventData.severity,
      event_data: JSON.stringify(eventData.event_data),
      ip_address: eventData.ip_address,
      user_agent: eventData.user_agent || '',
      location_data: eventData.location_data ? JSON.stringify(eventData.location_data) : '{}',
    };

    return new Promise((resolve, reject) => {
      client.submitEvent(request, (error, response) => {
        if (error) {
          logger.error('Failed to submit security event:', error);
          resolve({ success: false, message: error.message });
        } else {
          logger.info('Security event submitted successfully');
          resolve(response);
        }
      });
    });
  } catch (error) {
    logger.error('Error submitting security event:', error);
    return { success: false, message: error.message };
  }
};

// Get user risk score
export const getUserRiskScore = async (userId) => {
  try {
    const client = initSecurityClient();
    if (!client) {
      logger.warn('Security client not available, skipping risk score retrieval');
      return { success: false, risk_score: 0, risk_level: 'unknown' };
    }

    const request = {
      user_id: userId,
    };

    return new Promise((resolve, reject) => {
      client.getUserRiskScore(request, (error, response) => {
        if (error) {
          logger.error('Failed to get user risk score:', error);
          resolve({ success: false, risk_score: 0, risk_level: 'unknown' });
        } else {
          logger.info('User risk score retrieved successfully');
          resolve(response);
        }
      });
    });
  } catch (error) {
    logger.error('Error getting user risk score:', error);
    return { success: false, risk_score: 0, risk_level: 'unknown' };
  }
};

// Update user risk score
export const updateUserRiskScore = async (userId, riskScore, reason) => {
  try {
    const client = initSecurityClient();
    if (!client) {
      logger.warn('Security client not available, skipping risk score update');
      return { success: false, message: 'Security service unavailable' };
    }

    const request = {
      user_id: userId,
      risk_score: riskScore,
      reason: reason,
    };

    return new Promise((resolve, reject) => {
      client.updateUserRiskScore(request, (error, response) => {
        if (error) {
          logger.error('Failed to update user risk score:', error);
          resolve({ success: false, message: error.message });
        } else {
          logger.info('User risk score updated successfully');
          resolve(response);
        }
      });
    });
  } catch (error) {
    logger.error('Error updating user risk score:', error);
    return { success: false, message: error.message };
  }
};

// Detect threat
export const detectThreat = async (userId, eventType, eventData, ipAddress, userAgent) => {
  try {
    const client = initSecurityClient();
    if (!client) {
      logger.warn('Security client not available, skipping threat detection');
      return { success: false, threat_detected: false, message: 'Security service unavailable' };
    }

    const request = {
      user_id: userId,
      event_type: eventType,
      event_data: JSON.stringify(eventData),
      ip_address: ipAddress,
      user_agent: userAgent,
    };

    return new Promise((resolve, reject) => {
      client.detectThreat(request, (error, response) => {
        if (error) {
          logger.error('Failed to detect threat:', error);
          resolve({ success: false, threat_detected: false, message: error.message });
        } else {
          logger.info('Threat detection completed');
          resolve(response);
        }
      });
    });
  } catch (error) {
    logger.error('Error detecting threat:', error);
    return { success: false, threat_detected: false, message: error.message };
  }
};

// Get threat patterns
export const getThreatPatterns = async (userId, patternType, startDate, endDate) => {
  try {
    const client = initSecurityClient();
    if (!client) {
      logger.warn('Security client not available, skipping threat patterns retrieval');
      return { success: false, patterns: [] };
    }

    const request = {
      user_id: userId,
      pattern_type: patternType,
      start_date: startDate,
      end_date: endDate,
    };

    return new Promise((resolve, reject) => {
      client.getThreatPatterns(request, (error, response) => {
        if (error) {
          logger.error('Failed to get threat patterns:', error);
          resolve({ success: false, patterns: [] });
        } else {
          logger.info('Threat patterns retrieved successfully');
          resolve(response);
        }
      });
    });
  } catch (error) {
    logger.error('Error getting threat patterns:', error);
    return { success: false, patterns: [] };
  }
};

// Create security alert
export const createAlert = async (userId, alertType, severity, title, description, source) => {
  try {
    const client = initSecurityClient();
    if (!client) {
      logger.warn('Security client not available, skipping alert creation');
      return { success: false, message: 'Security service unavailable' };
    }

    const request = {
      user_id: userId,
      alert_type: alertType,
      severity: severity,
      title: title,
      description: description,
      source: source,
    };

    return new Promise((resolve, reject) => {
      client.createAlert(request, (error, response) => {
        if (error) {
          logger.error('Failed to create alert:', error);
          resolve({ success: false, message: error.message });
        } else {
          logger.info('Security alert created successfully');
          resolve(response);
        }
      });
    });
  } catch (error) {
    logger.error('Error creating security alert:', error);
    return { success: false, message: error.message };
  }
};

// Get security alerts
export const getAlerts = async (userId, status, severity, page = 1, limit = 10) => {
  try {
    const client = initSecurityClient();
    if (!client) {
      logger.warn('Security client not available, skipping alerts retrieval');
      return { success: false, alerts: [] };
    }

    const request = {
      user_id: userId,
      status: status,
      severity: severity,
      page: page,
      limit: limit,
    };

    return new Promise((resolve, reject) => {
      client.getAlerts(request, (error, response) => {
        if (error) {
          logger.error('Failed to get alerts:', error);
          resolve({ success: false, alerts: [] });
        } else {
          logger.info('Security alerts retrieved successfully');
          resolve(response);
        }
      });
    });
  } catch (error) {
    logger.error('Error getting security alerts:', error);
    return { success: false, alerts: [] };
  }
};

// Update security alert
export const updateAlert = async (alertId, status, notes) => {
  try {
    const client = initSecurityClient();
    if (!client) {
      logger.warn('Security client not available, skipping alert update');
      return { success: false, message: 'Security service unavailable' };
    }

    const request = {
      alert_id: alertId,
      status: status,
      notes: notes,
    };

    return new Promise((resolve, reject) => {
      client.updateAlert(request, (error, response) => {
        if (error) {
          logger.error('Failed to update alert:', error);
          resolve({ success: false, message: error.message });
        } else {
          logger.info('Security alert updated successfully');
          resolve(response);
        }
      });
    });
  } catch (error) {
    logger.error('Error updating security alert:', error);
    return { success: false, message: error.message };
  }
};

// Get security events
export const getSecurityEvents = async (
  userId,
  serviceName,
  eventType,
  severity,
  startDate,
  endDate,
  page = 1,
  limit = 10
) => {
  try {
    const client = initSecurityClient();
    if (!client) {
      logger.warn('Security client not available, skipping events retrieval');
      return { success: false, events: [] };
    }

    const request = {
      user_id: userId,
      service_name: serviceName,
      event_type: eventType,
      severity: severity,
      start_date: startDate,
      end_date: endDate,
      page: page,
      limit: limit,
    };

    return new Promise((resolve, reject) => {
      client.getSecurityEvents(request, (error, response) => {
        if (error) {
          logger.error('Failed to get security events:', error);
          resolve({ success: false, events: [] });
        } else {
          logger.info('Security events retrieved successfully');
          resolve(response);
        }
      });
    });
  } catch (error) {
    logger.error('Error getting security events:', error);
    return { success: false, events: [] };
  }
};

// Health check
export const health = async () => {
  try {
    const client = initSecurityClient();
    if (!client) {
      return { status: 'unavailable' };
    }

    return new Promise((resolve, reject) => {
      client.health({}, (error, response) => {
        if (error) {
          resolve({ status: 'unhealthy', error: error.message });
        } else {
          resolve({ status: 'healthy', response });
        }
      });
    });
  } catch (error) {
    return { status: 'error', error: error.message };
  }
};

export const securityService = {
  submitEvent,
  getUserRiskScore,
  updateUserRiskScore,
  detectThreat,
  getThreatPatterns,
  createAlert,
  getAlerts,
  updateAlert,
  getSecurityEvents,
  health,
};
