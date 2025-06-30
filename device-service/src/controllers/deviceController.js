import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';
import { db } from '../config/databaseConfig.js';
import { redisClient } from '../config/redisConfig.js';
import { deviceRepository } from '../repositories/deviceRepository.js';
import { deviceFingerprintingService } from '../services/deviceFingerprintingService.js';
import { securityService } from '../services/securityService.js';
import config from '../config/index.js';

// Device Management Controllers
export const registerDevice = async (call, callback) => {
  try {
    const {
      user_id,
      device_hash,
      device_name,
      device_type,
      browser,
      browser_version,
      os,
      os_version,
      screen_resolution,
      timezone,
      language,
      ip_address,
      user_agent,
      location_data,
      fingerprint_data
    } = call.request;

    logger.info(`Registering device for user: ${user_id}`);

    // Check if device already exists
    const existingDevice = await deviceRepository.findByHash(device_hash);
    if (existingDevice) {
      logger.info(`Device already exists: ${device_hash}`);
      return callback(null, {
        success: true,
        device_id: existingDevice.id,
        trust_score: existingDevice.trust_score,
        trust_level: existingDevice.trust_level,
        message: 'Device already registered'
      });
    }

    // Generate device fingerprint
    const fingerprint = await deviceFingerprintingService.generateFingerprint({
      device_hash,
      user_agent,
      screen_resolution,
      timezone,
      language,
      fingerprint_data
    });

    // Calculate initial trust score
    const trustScore = await deviceFingerprintingService.calculateTrustScore({
      ip_address,
      location_data,
      fingerprint,
      user_id
    });

    // Determine trust level
    const trustLevel = deviceFingerprintingService.getTrustLevel(trustScore);

    // Create device record
    const deviceId = uuidv4();
    const device = await deviceRepository.create({
      id: deviceId,
      user_id,
      device_hash,
      device_name,
      device_type,
      browser,
      browser_version,
      os,
      os_version,
      screen_resolution,
      timezone,
      language,
      ip_address,
      location_data: JSON.stringify(location_data),
      fingerprint_data: JSON.stringify(fingerprint_data),
      trust_score: trustScore,
      trust_level: trustLevel
    });

    await redisClient.setEx(
      `device:${deviceId}`,
      3600,
      JSON.stringify(device)
    );

    // Submit security event
    await securityService.submitEvent({
      user_id,
      service_name: 'device-service',
      event_type: 'device_registered',
      event_category: 'authentication',
      severity: 'low',
      event_data: {
        device_id: deviceId,
        device_hash,
        trust_score: trustScore,
        trust_level: trustLevel
      },
      ip_address
    });

    logger.info(`Device registered successfully: ${deviceId}`);

    callback(null, {
      success: true,
      device_id: deviceId,
      trust_score: trustScore,
      trust_level: trustLevel,
      message: 'Device registered successfully'
    });

  } catch (error) {
    logger.error('Error registering device:', error);
    callback({
      code: 13, // INTERNAL
      message: 'Failed to register device'
    });
  }
};

export const getDeviceList = async (call, callback) => {
  try {
    const { user_id, page = 1, limit = 10 } = call.request;

    logger.info(`Getting device list for user: ${user_id}`);

    const offset = (page - 1) * limit;
    const devices = await deviceRepository.findByUserId(user_id, { limit, offset });
    const total = await deviceRepository.countByUserId(user_id);

    logger.info(`Found ${devices.length} devices for user: ${user_id}`);

    callback(null, {
      success: true,
      devices: devices.map(device => ({
        id: device.id,
        user_id: device.user_id,
        device_hash: device.device_hash,
        device_name: device.device_name,
        device_type: device.device_type,
        browser: device.browser,
        browser_version: device.browser_version,
        os: device.os,
        os_version: device.os_version,
        screen_resolution: device.screen_resolution,
        timezone: device.timezone,
        language: device.language,
        ip_address: device.ip_address,
        location_data: Buffer.from(device.location_data || '{}'),
        fingerprint_data: Buffer.from(device.fingerprint_data || '{}'),
        trust_score: device.trust_score,
        trust_level: device.trust_level,
        is_active: device.is_active,
        last_used_at: device.last_used_at,
        created_at: device.created_at,
        updated_at: device.updated_at
      })),
      total,
      page,
      limit,
      message: 'Device list retrieved successfully'
    });

  } catch (error) {
    logger.error('Error getting device list:', error);
    callback({
      code: 13, // INTERNAL
      message: 'Failed to get device list'
    });
  }
};

export const updateDeviceTrust = async (call, callback) => {
  try {
    const { device_id, trust_score, trust_level, reason } = call.request;

    logger.info(`Updating device trust: ${device_id}`);

    const device = await deviceRepository.findById(device_id);
    if (!device) {
      return callback({
        code: 5, // NOT_FOUND
        message: 'Device not found'
      });
    }

    // Update device trust
    await deviceRepository.updateTrust(device_id, trust_score, trust_level);

    // Clear cache
    await redisClient.del(`device:${device_id}`);

    // Submit security event
    await securityService.submitEvent({
      user_id: device.user_id,
      service_name: 'device-service',
      event_type: 'device_trust_updated',
      event_category: 'security',
      severity: trust_score < config.device.suspiciousThreshold ? 'high' : 'medium',
      event_data: {
        device_id,
        old_trust_score: device.trust_score,
        new_trust_score: trust_score,
        old_trust_level: device.trust_level,
        new_trust_level: trust_level,
        reason
      }
    });

    logger.info(`Device trust updated: ${device_id}`);

    callback(null, {
      success: true,
      message: 'Device trust updated successfully'
    });

  } catch (error) {
    logger.error('Error updating device trust:', error);
    callback({
      code: 13, // INTERNAL
      message: 'Failed to update device trust'
    });
  }
};

export const revokeDevice = async (call, callback) => {
  try {
    const { device_id, reason } = call.request;

    logger.info(`Revoking device: ${device_id}`);

    const device = await deviceRepository.findById(device_id);
    if (!device) {
      return callback({
        code: 5, // NOT_FOUND
        message: 'Device not found'
      });
    }

    // Revoke device
    await deviceRepository.revoke(device_id);

    // Clear cache
    await redisClient.del(`device:${device_id}`);

    // Revoke all sessions for this device
    await db('device_sessions')
      .where({ device_id })
      .update({ is_active: false });

    // Submit security event
    await securityService.submitEvent({
      user_id: device.user_id,
      service_name: 'device-service',
      event_type: 'device_revoked',
      event_category: 'security',
      severity: 'high',
      event_data: {
        device_id,
        reason
      }
    });

    logger.info(`Device revoked: ${device_id}`);

    callback(null, {
      success: true,
      message: 'Device revoked successfully'
    });

  } catch (error) {
    logger.error('Error revoking device:', error);
    callback({
      code: 13, // INTERNAL
      message: 'Failed to revoke device'
    });
  }
};

export const validateDevice = async (call, callback) => {
  try {
    const { device_id, user_id, ip_address, user_agent } = call.request;

    logger.info(`Validating device: ${device_id}`);

    const device = await deviceRepository.findById(device_id);
    if (!device) {
      return callback(null, {
        success: true,
        is_valid: false,
        trust_score: 0,
        trust_level: 'blocked',
        message: 'Device not found'
      });
    }

    // Check if device belongs to user
    if (device.user_id !== user_id) {
      return callback(null, {
        success: true,
        is_valid: false,
        trust_score: 0,
        trust_level: 'blocked',
        message: 'Device does not belong to user'
      });
    }

    // Check if device is active
    if (!device.is_active) {
      return callback(null, {
        success: true,
        is_valid: false,
        trust_score: device.trust_score,
        trust_level: device.trust_level,
        message: 'Device is not active'
      });
    }

    // Update last used timestamp
    await deviceRepository.updateLastUsed(device_id);

    logger.info(`Device validated: ${device_id}`);

    callback(null, {
      success: true,
      is_valid: true,
      trust_score: device.trust_score,
      trust_level: device.trust_level,
      message: 'Device is valid'
    });

  } catch (error) {
    logger.error('Error validating device:', error);
    callback({
      code: 13, // INTERNAL
      message: 'Failed to validate device'
    });
  }
};

export const health = async (call, callback) => {
  try {
    const { db } = await import('../config/databaseConfig.js');
    const { redisClient } = await import('../config/redisConfig.js');

    // Check database health
    await db.raw('SELECT 1');
    
    // Check Redis health
    await redisClient.ping();

    callback(null, {
      status: 'SERVING',
      message: 'Device service is healthy',
      details: {
        database: 'healthy',
        redis: 'healthy',
        service: 'device-service'
      }
    });

  } catch (error) {
    logger.error('Health check failed:', error);
    callback(null, {
      status: 'NOT_SERVING',
      message: 'Device service is unhealthy',
      details: {
        error: error.message
      }
    });
  }
}; 