import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';
import { db } from '../config/databaseConfig.js';
import { redisClient } from '../config/redisConfig.js';
import { sessionRepository } from '../repositories/sessionRepository.js';
import { securityService } from '../services/securityService.js';
import config from '../config/index.js';

export const getUserSessions = async (call, callback) => {
  try {
    const { user_id, active_only = true } = call.request;

    logger.info(`Getting sessions for user: ${user_id}`);

    const sessions = await sessionRepository.findByUserId(user_id, { active_only });

    logger.info(`Found ${sessions.length} sessions for user: ${user_id}`);

    callback(null, {
      success: true,
      sessions: sessions.map(session => ({
        id: session.id,
        user_id: session.user_id,
        device_id: session.device_id,
        session_id: session.session_id,
        ip_address: session.ip_address,
        user_agent: session.user_agent,
        location_data: Buffer.from(session.location_data || '{}'),
        is_active: session.is_active,
        expires_at: session.expires_at,
        created_at: session.created_at,
        updated_at: session.updated_at
      })),
      message: 'User sessions retrieved successfully'
    });

  } catch (error) {
    logger.error('Error getting user sessions:', error);
    callback({
      code: 13, // INTERNAL
      message: 'Failed to get user sessions'
    });
  }
};

export const createSession = async (call, callback) => {
  try {
    const { user_id, device_id, ip_address, user_agent, location_data } = call.request;

    logger.info(`Creating session for user: ${user_id}, device: ${device_id}`);

    // Check session limit
    const activeSessions = await sessionRepository.countActiveByUserId(user_id);
    if (activeSessions >= config.device.maxSessionsPerUser) {
      // Revoke oldest session
      const oldestSession = await sessionRepository.findOldestByUserId(user_id);
      if (oldestSession) {
        await sessionRepository.revoke(oldestSession.id);
        logger.info(`Revoked oldest session: ${oldestSession.id}`);
      }
    }

    // Create new session
    const sessionId = uuidv4();
    const refreshToken = uuidv4();
    const expiresAt = new Date(Date.now() + config.device.sessionExpiryHours * 60 * 60 * 1000);

    const session = await sessionRepository.create({
      id: uuidv4(),
      user_id,
      device_id,
      session_id: sessionId,
      refresh_token_hash: refreshToken, // In production, hash this
      ip_address,
      user_agent,
      location_data: JSON.stringify(location_data),
      expires_at: expiresAt
    });

    // Cache session in Redis
    await redisClient.setEx(
      `session:${sessionId}`,
      config.device.sessionExpiryHours * 3600,
      JSON.stringify(session)
    );

    // Submit security event
    await securityService.submitEvent({
      user_id,
      service_name: 'device-service',
      event_type: 'session_created',
      event_category: 'authentication',
      severity: 'low',
      event_data: {
        session_id: sessionId,
        device_id,
        ip_address
      },
      ip_address
    });

    logger.info(`Session created successfully: ${sessionId}`);

    callback(null, {
      success: true,
      session_id: sessionId,
      refresh_token: refreshToken,
      expires_at: expiresAt.toISOString(),
      message: 'Session created successfully'
    });

  } catch (error) {
    logger.error('Error creating session:', error);
    callback({
      code: 13, // INTERNAL
      message: 'Failed to create session'
    });
  }
};

export const revokeSession = async (call, callback) => {
  try {
    const { session_id, reason } = call.request;

    logger.info(`Revoking session: ${session_id}`);

    const session = await sessionRepository.findBySessionId(session_id);
    if (!session) {
      return callback({
        code: 5, // NOT_FOUND
        message: 'Session not found'
      });
    }

    // Revoke session
    await sessionRepository.revoke(session_id);

    // Clear cache
    await redisClient.del(`session:${session_id}`);

    // Submit security event
    await securityService.submitEvent({
      user_id: session.user_id,
      service_name: 'device-service',
      event_type: 'session_revoked',
      event_category: 'authentication',
      severity: 'medium',
      event_data: {
        session_id,
        reason
      }
    });

    logger.info(`Session revoked: ${session_id}`);

    callback(null, {
      success: true,
      message: 'Session revoked successfully'
    });

  } catch (error) {
    logger.error('Error revoking session:', error);
    callback({
      code: 13, // INTERNAL
      message: 'Failed to revoke session'
    });
  }
}; 