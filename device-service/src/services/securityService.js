import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';
import config from '../config/index.js';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load security service proto
const dockerSharedProtoPath = path.join('/shared-lib', 'protos', 'security.proto');
const localSharedProtoPath = path.join(__dirname, '..', '..', '..', 'shared-lib', 'protos', 'security.proto');
const localProtoPath = path.join(__dirname, '..', 'proto', 'security.proto');

let PROTO_PATH;
if (fs.existsSync(dockerSharedProtoPath)) {
  PROTO_PATH = dockerSharedProtoPath;
} else if (fs.existsSync(localSharedProtoPath)) {
  PROTO_PATH = localSharedProtoPath;
} else {
  PROTO_PATH = localProtoPath;
}

let securityProto;
try {
  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
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
    const client = new securityProto.SecurityService(
      config.services.security.url,
      grpc.credentials.createInsecure()
    );
    
    // Set deadline
    const deadline = new Date();
    deadline.setSeconds(deadline.getSeconds() + 5);
    
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
      return;
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
      location_data: eventData.location_data ? JSON.stringify(eventData.location_data) : '{}'
    };

    return new Promise((resolve, reject) => {
      client.submitEvent(request, (error, response) => {
        if (error) {
          logger.error('Failed to submit security event:', error);
          reject(error);
        } else {
          logger.info('Security event submitted successfully');
          resolve(response);
        }
      });
    });

  } catch (error) {
    logger.error('Error submitting security event:', error);
    // Don't throw error to avoid breaking device service functionality
  }
};

// Get user risk score
export const getUserRiskScore = async (userId) => {
  try {
    const client = initSecurityClient();
    if (!client) {
      logger.warn('Security client not available, returning default risk score');
      return { risk_score: 0 };
    }

    const request = { user_id: userId };

    return new Promise((resolve, reject) => {
      client.getUserRiskScore(request, (error, response) => {
        if (error) {
          logger.error('Failed to get user risk score:', error);
          resolve({ risk_score: 0 }); // Default to safe
        } else {
          resolve(response);
        }
      });
    });

  } catch (error) {
    logger.error('Error getting user risk score:', error);
    return { risk_score: 0 };
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
  health
}; 