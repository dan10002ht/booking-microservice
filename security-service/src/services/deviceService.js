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
const localSharedProtoPath = path.join(__dirname, '..', '..', '..', 'shared-lib', 'protos', 'device.proto');
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
    oneofs: true
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

// Get device list
export const getDeviceList = async (userId) => {
  try {
    const client = initDeviceClient();
    if (!client) {
      logger.warn('Device client not available, skipping device list retrieval');
      return { success: false, devices: [] };
    }

    const request = { user_id: userId };

    return new Promise((resolve, reject) => {
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
      end_date: endDate
    };

    return new Promise((resolve, reject) => {
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
      reason: reason
    };

    return new Promise((resolve, reject) => {
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
      reason: reason
    };

    return new Promise((resolve, reject) => {
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

// Health check
export const health = async () => {
  try {
    const client = initDeviceClient();
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

export const deviceService = {
  getDeviceList,
  getDeviceAnalytics,
  updateDeviceTrust,
  revokeDevice,
  health
}; 