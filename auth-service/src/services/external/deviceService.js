import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load device service proto
const dockerSharedProtoPath = path.join('/shared-lib', 'protos', 'device.proto');
const localSharedProtoPath = path.join(
  __dirname,
  '..',
  '..',
  '..',
  'shared-lib',
  'protos',
  'device.proto'
);
const localProtoPath = path.join(__dirname, '..', 'proto', 'device.proto');

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

let deviceProto;
try {
  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });
  deviceProto = grpc.loadPackageDefinition(packageDefinition).device;
} catch (error) {
  logger.warn('Device proto not found, using fallback implementation');
  deviceProto = null;
}

// Create device service client
let deviceClient = null;

const createDeviceClient = () => {
  if (!deviceProto) {
    logger.warn('Device proto not available, skipping client creation');
    return null;
  }

  try {
    const deviceServiceUrl = process.env.DEVICE_SERVICE_URL || 'localhost:50052';
    const client = new deviceProto.DeviceService(
      deviceServiceUrl,
      grpc.credentials.createInsecure()
    );

    return client;
  } catch (error) {
    logger.error('Failed to create device client:', error);
    return null;
  }
};

// Initialize client
const initDeviceClient = () => {
  if (!deviceClient) {
    deviceClient = createDeviceClient();
  }
  return deviceClient;
};

// Register device
export const registerDevice = async (deviceData) => {
  try {
    const client = initDeviceClient();
    if (!client) {
      logger.warn('Device client not available, skipping device registration');
      return { success: false, message: 'Device service unavailable' };
    }

    const request = {
      user_id: deviceData.user_id,
      device_hash: deviceData.device_hash,
      device_name: deviceData.device_name,
      device_type: deviceData.device_type,
      browser: deviceData.browser,
      browser_version: deviceData.browser_version,
      os: deviceData.os,
      os_version: deviceData.os_version,
      screen_resolution: deviceData.screen_resolution,
      timezone: deviceData.timezone,
      language: deviceData.language,
      ip_address: deviceData.ip_address,
      user_agent: deviceData.user_agent,
      location_data: Buffer.from(deviceData.location_data || '{}'),
      fingerprint_data: Buffer.from(deviceData.fingerprint_data || '{}'),
    };

    return new Promise((resolve) => {
      client.registerDevice(request, (error, response) => {
        if (error) {
          logger.error('Failed to register device:', error);
          resolve({ success: false, message: error.message });
        } else {
          logger.info('Device registered successfully');
          resolve(response);
        }
      });
    });
  } catch (error) {
    logger.error('Error registering device:', error);
    return { success: false, message: error.message };
  }
};

// Create session
export const createSession = async (sessionData) => {
  try {
    const client = initDeviceClient();
    if (!client) {
      logger.warn('Device client not available, skipping session creation');
      return { success: false, message: 'Device service unavailable' };
    }

    const request = {
      user_id: sessionData.user_id,
      device_id: sessionData.device_id,
      ip_address: sessionData.ip_address,
      user_agent: sessionData.user_agent,
      location_data: Buffer.from(sessionData.location_data || '{}'),
    };

    return new Promise((resolve) => {
      client.createSession(request, (error, response) => {
        if (error) {
          logger.error('Failed to create session:', error);
          resolve({ success: false, message: error.message });
        } else {
          logger.info('Session created successfully');
          resolve(response);
        }
      });
    });
  } catch (error) {
    logger.error('Error creating session:', error);
    return { success: false, message: error.message };
  }
};

// Validate device
export const validateDevice = async (deviceId, userId, ipAddress, userAgent) => {
  try {
    const client = initDeviceClient();
    if (!client) {
      logger.warn('Device client not available, skipping device validation');
      return { success: false, is_valid: false, message: 'Device service unavailable' };
    }

    const request = {
      device_id: deviceId,
      user_id: userId,
      ip_address: ipAddress,
      user_agent: userAgent,
    };

    return new Promise((resolve) => {
      client.validateDevice(request, (error, response) => {
        if (error) {
          logger.error('Failed to validate device:', error);
          resolve({ success: false, is_valid: false, message: error.message });
        } else {
          logger.info('Device validation completed');
          resolve(response);
        }
      });
    });
  } catch (error) {
    logger.error('Error validating device:', error);
    return { success: false, is_valid: false, message: error.message };
  }
};

// Get user sessions
export const getUserSessions = async (userId, activeOnly = true) => {
  try {
    const client = initDeviceClient();
    if (!client) {
      logger.warn('Device client not available, skipping session retrieval');
      return { success: false, sessions: [] };
    }

    const request = {
      user_id: userId,
      active_only: activeOnly,
    };

    return new Promise((resolve) => {
      client.getUserSessions(request, (error, response) => {
        if (error) {
          logger.error('Failed to get user sessions:', error);
          resolve({ success: false, sessions: [] });
        } else {
          logger.info('User sessions retrieved successfully');
          resolve(response);
        }
      });
    });
  } catch (error) {
    logger.error('Error getting user sessions:', error);
    return { success: false, sessions: [] };
  }
};

// Get device list
export const getDeviceList = async (userId, page = 1, limit = 10) => {
  try {
    const client = initDeviceClient();
    if (!client) {
      logger.warn('Device client not available, skipping device list retrieval');
      return { success: false, devices: [] };
    }

    const request = {
      user_id: userId,
      page: page,
      limit: limit,
    };

    return new Promise((resolve) => {
      client.getDeviceList(request, (error, response) => {
        if (error) {
          logger.error('Failed to get device list:', error);
          resolve({ success: false, devices: [] });
        } else {
          logger.info('Device list retrieved successfully');
          resolve(response);
        }
      });
    });
  } catch (error) {
    logger.error('Error getting device list:', error);
    return { success: false, devices: [] };
  }
};

// Update device trust
export const updateDeviceTrust = async (deviceId, trustScore, trustLevel, reason) => {
  try {
    const client = initDeviceClient();
    if (!client) {
      logger.warn('Device client not available, skipping trust update');
      return { success: false, message: 'Device service unavailable' };
    }

    const request = {
      device_id: deviceId,
      trust_score: trustScore,
      trust_level: trustLevel,
      reason: reason,
    };

    return new Promise((resolve) => {
      client.updateDeviceTrust(request, (error, response) => {
        if (error) {
          logger.error('Failed to update device trust:', error);
          resolve({ success: false, message: error.message });
        } else {
          logger.info('Device trust updated successfully');
          resolve(response);
        }
      });
    });
  } catch (error) {
    logger.error('Error updating device trust:', error);
    return { success: false, message: error.message };
  }
};

// Revoke device
export const revokeDevice = async (deviceId, reason) => {
  try {
    const client = initDeviceClient();
    if (!client) {
      logger.warn('Device client not available, skipping device revocation');
      return { success: false, message: 'Device service unavailable' };
    }

    const request = {
      device_id: deviceId,
      reason: reason,
    };

    return new Promise((resolve) => {
      client.revokeDevice(request, (error, response) => {
        if (error) {
          logger.error('Failed to revoke device:', error);
          resolve({ success: false, message: error.message });
        } else {
          logger.info('Device revoked successfully');
          resolve(response);
        }
      });
    });
  } catch (error) {
    logger.error('Error revoking device:', error);
    return { success: false, message: error.message };
  }
};

// Get device analytics
export const getDeviceAnalytics = async (userId, deviceId, startDate, endDate) => {
  try {
    const client = initDeviceClient();
    if (!client) {
      logger.warn('Device client not available, skipping analytics retrieval');
      return { success: false, analytics: null };
    }

    const request = {
      user_id: userId,
      device_id: deviceId,
      start_date: startDate,
      end_date: endDate,
    };

    return new Promise((resolve) => {
      client.getDeviceAnalytics(request, (error, response) => {
        if (error) {
          logger.error('Failed to get device analytics:', error);
          resolve({ success: false, analytics: null });
        } else {
          logger.info('Device analytics retrieved successfully');
          resolve(response);
        }
      });
    });
  } catch (error) {
    logger.error('Error getting device analytics:', error);
    return { success: false, analytics: null };
  }
};

// Health check
export const health = async () => {
  try {
    const client = initDeviceClient();
    if (!client) {
      return { status: 'unavailable' };
    }

    return new Promise((resolve) => {
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

export const deviceService = {
  registerDevice,
  createSession,
  validateDevice,
  getUserSessions,
  getDeviceList,
  updateDeviceTrust,
  revokeDevice,
  getDeviceAnalytics,
  health,
};
