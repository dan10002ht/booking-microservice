import { deviceService } from '../external/deviceService.js';
import { securityService } from '../external/securityService.js';
import logger from '../../utils/logger.js';

/**
 * Integration Service
 * Handles business flows between Auth, Device, and Security services
 */

// User Login Flow
export const handleUserLogin = async (userData, loginData, deviceInfo, requestInfo) => {
  try {
    logger.info(`Starting login flow for user: ${userData.id}`);

    // Step 1: Check user risk score before login
    const riskCheck = await securityService.getUserRiskScore(userData.id);
    if (riskCheck.success && riskCheck.risk_level === 'high') {
      logger.warn(`High risk user attempting login: ${userData.id}`);

      // Submit security event for high risk login attempt
      await securityService.submitEvent({
        user_id: userData.id,
        service_name: 'auth-service',
        event_type: 'high_risk_login_attempt',
        event_category: 'authentication',
        severity: 'high',
        event_data: {
          risk_score: riskCheck.risk_score,
          risk_level: riskCheck.risk_level,
          risk_factors: riskCheck.risk_factors,
        },
        ip_address: requestInfo.ip_address,
        user_agent: requestInfo.user_agent,
      });
    }

    // Step 2: Register/Validate device
    const deviceRegistration = await deviceService.registerDevice({
      user_id: userData.id,
      device_hash: deviceInfo.device_hash,
      device_name: deviceInfo.device_name,
      device_type: deviceInfo.device_type,
      browser: deviceInfo.browser,
      browser_version: deviceInfo.browser_version,
      os: deviceInfo.os,
      os_version: deviceInfo.os_version,
      screen_resolution: deviceInfo.screen_resolution,
      timezone: deviceInfo.timezone,
      language: deviceInfo.language,
      ip_address: requestInfo.ip_address,
      user_agent: requestInfo.user_agent,
      location_data: deviceInfo.location_data,
      fingerprint_data: deviceInfo.fingerprint_data,
    });

    if (!deviceRegistration.success) {
      logger.error(`Device registration failed for user: ${userData.id}`);
      throw new Error('Device registration failed');
    }

    // Step 3: Create device session
    const sessionCreation = await deviceService.createSession({
      user_id: userData.id,
      device_id: deviceRegistration.device_id,
      ip_address: requestInfo.ip_address,
      user_agent: requestInfo.user_agent,
      location_data: deviceInfo.location_data,
    });

    if (!sessionCreation.success) {
      logger.error(`Session creation failed for user: ${userData.id}`);
      throw new Error('Session creation failed');
    }

    // Step 4: Submit login event to security service
    await securityService.submitEvent({
      user_id: userData.id,
      service_name: 'auth-service',
      event_type: 'user_login',
      event_category: 'authentication',
      severity: 'medium',
      event_data: {
        login_method: loginData.method,
        device_id: deviceRegistration.device_id,
        device_trust_score: deviceRegistration.trust_score,
        device_trust_level: deviceRegistration.trust_level,
        session_id: sessionCreation.session_id,
      },
      ip_address: requestInfo.ip_address,
      user_agent: requestInfo.user_agent,
      location_data: deviceInfo.location_data,
    });

    // Step 5: Detect threats
    const threatDetection = await securityService.detectThreat(
      userData.id,
      'user_login',
      {
        login_method: loginData.method,
        device_id: deviceRegistration.device_id,
        device_trust_score: deviceRegistration.trust_score,
      },
      requestInfo.ip_address,
      requestInfo.user_agent
    );

    if (threatDetection.success && threatDetection.threat_detected) {
      logger.warn(`Threat detected during login for user: ${userData.id}`);

      // Create security alert
      await securityService.createAlert(
        userData.id,
        'suspicious_login',
        threatDetection.threat_level,
        'Suspicious Login Detected',
        threatDetection.description,
        'auth-service'
      );

      // Update device trust score if threat detected
      if (deviceRegistration.trust_score > 30) {
        await deviceService.updateDeviceTrust(
          deviceRegistration.device_id,
          Math.max(0, deviceRegistration.trust_score - 20),
          'trusted',
          `Threat detected: ${threatDetection.threat_type}`
        );
      }
    }

    logger.info(`Login flow completed successfully for user: ${userData.id}`);

    return {
      success: true,
      user: userData,
      device: {
        device_id: deviceRegistration.device_id,
        trust_score: deviceRegistration.trust_score,
        trust_level: deviceRegistration.trust_level,
      },
      session: {
        session_id: sessionCreation.session_id,
        refresh_token: sessionCreation.refresh_token,
        expires_at: sessionCreation.expires_at,
      },
      security: {
        risk_score: riskCheck.risk_score,
        risk_level: riskCheck.risk_level,
        threat_detected: threatDetection.threat_detected,
        threat_level: threatDetection.threat_level,
      },
    };
  } catch (error) {
    logger.error(`Login flow failed for user: ${userData.id}`, error);

    // Submit failure event
    await securityService.submitEvent({
      user_id: userData.id,
      service_name: 'auth-service',
      event_type: 'login_failed',
      event_category: 'authentication',
      severity: 'medium',
      event_data: {
        error: error.message,
        login_method: loginData.method,
      },
      ip_address: requestInfo.ip_address,
      user_agent: requestInfo.user_agent,
    });

    throw error;
  }
};

// Device Registration Flow
export const handleDeviceRegistration = async (userData, deviceInfo, requestInfo) => {
  try {
    logger.info(`Starting device registration for user: ${userData.id}`);

    // Step 1: Register device
    const deviceRegistration = await deviceService.registerDevice({
      user_id: userData.id,
      device_hash: deviceInfo.device_hash,
      device_name: deviceInfo.device_name,
      device_type: deviceInfo.device_type,
      browser: deviceInfo.browser,
      browser_version: deviceInfo.browser_version,
      os: deviceInfo.os,
      os_version: deviceInfo.os_version,
      screen_resolution: deviceInfo.screen_resolution,
      timezone: deviceInfo.timezone,
      language: deviceInfo.language,
      ip_address: requestInfo.ip_address,
      user_agent: requestInfo.user_agent,
      location_data: deviceInfo.location_data,
      fingerprint_data: deviceInfo.fingerprint_data,
    });

    if (!deviceRegistration.success) {
      throw new Error('Device registration failed');
    }

    // Step 2: Submit device event to security service
    await securityService.submitEvent({
      user_id: userData.id,
      service_name: 'auth-service',
      event_type: 'device_registered',
      event_category: 'device_management',
      severity: 'low',
      event_data: {
        device_id: deviceRegistration.device_id,
        device_name: deviceInfo.device_name,
        device_type: deviceInfo.device_type,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
      },
      ip_address: requestInfo.ip_address,
      user_agent: requestInfo.user_agent,
      location_data: deviceInfo.location_data,
    });

    // Step 3: Get device analytics for risk assessment
    const deviceAnalytics = await deviceService.getDeviceAnalytics(
      userData.id,
      deviceRegistration.device_id,
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
      new Date().toISOString()
    );

    // Step 4: Update user risk score based on device behavior
    if (deviceAnalytics.success && deviceAnalytics.analytics) {
      const analytics = deviceAnalytics.analytics;
      let riskAdjustment = 0;

      if (analytics.failed_attempts > 5) {
        riskAdjustment += 10;
      }

      if (analytics.ip_addresses && analytics.ip_addresses.length > 3) {
        riskAdjustment += 5;
      }

      if (riskAdjustment > 0) {
        const currentRisk = await securityService.getUserRiskScore(userData.id);
        if (currentRisk.success) {
          const newRiskScore = Math.min(100, currentRisk.risk_score + riskAdjustment);
          await securityService.updateUserRiskScore(
            userData.id,
            newRiskScore,
            'Device behavior analysis'
          );
        }
      }
    }

    logger.info(`Device registration completed for user: ${userData.id}`);

    return {
      success: true,
      device: {
        device_id: deviceRegistration.device_id,
        trust_score: deviceRegistration.trust_score,
        trust_level: deviceRegistration.trust_level,
      },
    };
  } catch (error) {
    logger.error(`Device registration failed for user: ${userData.id}`, error);
    throw error;
  }
};

// Security Monitoring Flow
export const handleSecurityMonitoring = async (userData, eventData, requestInfo) => {
  try {
    logger.info(`Starting security monitoring for user: ${userData.id}`);

    // Step 1: Submit security event
    const eventSubmission = await securityService.submitEvent({
      user_id: userData.id,
      service_name: eventData.service_name,
      event_type: eventData.event_type,
      event_category: eventData.event_category,
      severity: eventData.severity,
      event_data: eventData.event_data,
      ip_address: requestInfo.ip_address,
      user_agent: requestInfo.user_agent,
      location_data: eventData.location_data,
    });

    if (!eventSubmission.success) {
      logger.warn(`Failed to submit security event for user: ${userData.id}`);
    }

    // Step 2: Get user context from auth service (if needed)
    const userContext = {
      user_id: userData.id,
      email: userData.email,
      status: userData.status,
      created_at: userData.created_at,
    };

    // Step 3: Get device analytics
    const userSessions = await deviceService.getUserSessions(userData.id, true);
    let deviceAnalytics = null;

    if (userSessions.success && userSessions.sessions.length > 0) {
      const activeSession = userSessions.sessions[0];
      deviceAnalytics = await deviceService.getDeviceAnalytics(
        userData.id,
        activeSession.device_id,
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Last 7 days
        new Date().toISOString()
      );
    }

    // Step 4: Detect threats
    const threatDetection = await securityService.detectThreat(
      userData.id,
      eventData.event_type,
      eventData.event_data,
      requestInfo.ip_address,
      requestInfo.user_agent
    );

    // Step 5: Create alerts if threats detected
    if (threatDetection.success && threatDetection.threat_detected) {
      await securityService.createAlert(
        userData.id,
        'security_threat',
        threatDetection.threat_level,
        `Security Threat: ${threatDetection.threat_type}`,
        threatDetection.description,
        eventData.service_name
      );

      // Update user risk score
      const currentRisk = await securityService.getUserRiskScore(userData.id);
      if (currentRisk.success) {
        const riskIncrease = threatDetection.threat_level === 'high' ? 20 : 10;
        const newRiskScore = Math.min(100, currentRisk.risk_score + riskIncrease);

        await securityService.updateUserRiskScore(
          userData.id,
          newRiskScore,
          `Threat detected: ${threatDetection.threat_type}`
        );
      }
    }

    logger.info(`Security monitoring completed for user: ${userData.id}`);

    return {
      success: true,
      event_id: eventSubmission.event_id,
      threat_detected: threatDetection.threat_detected,
      threat_level: threatDetection.threat_level,
      user_context: userContext,
      device_analytics: deviceAnalytics,
    };
  } catch (error) {
    logger.error(`Security monitoring failed for user: ${userData.id}`, error);
    throw error;
  }
};

// Device Validation Flow
export const handleDeviceValidation = async (userData, deviceId, requestInfo) => {
  try {
    logger.info(`Starting device validation for user: ${userData.id}, device: ${deviceId}`);

    // Step 1: Validate device
    const deviceValidation = await deviceService.validateDevice(
      deviceId,
      userData.id,
      requestInfo.ip_address,
      requestInfo.user_agent
    );

    if (!deviceValidation.success) {
      throw new Error('Device validation failed');
    }

    // Step 2: Submit validation event
    await securityService.submitEvent({
      user_id: userData.id,
      service_name: 'auth-service',
      event_type: 'device_validated',
      event_category: 'device_management',
      severity: 'low',
      event_data: {
        device_id: deviceId,
        is_valid: deviceValidation.is_valid,
        trust_score: deviceValidation.trust_score,
        trust_level: deviceValidation.trust_level,
      },
      ip_address: requestInfo.ip_address,
      user_agent: requestInfo.user_agent,
    });

    // Step 3: Check for suspicious activity
    if (deviceValidation.trust_score < 30) {
      const threatDetection = await securityService.detectThreat(
        userData.id,
        'device_validation',
        {
          device_id: deviceId,
          trust_score: deviceValidation.trust_score,
          trust_level: deviceValidation.trust_level,
        },
        requestInfo.ip_address,
        requestInfo.user_agent
      );

      if (threatDetection.success && threatDetection.threat_detected) {
        await securityService.createAlert(
          userData.id,
          'suspicious_device',
          threatDetection.threat_level,
          'Suspicious Device Activity',
          threatDetection.description,
          'auth-service'
        );
      }
    }

    logger.info(`Device validation completed for user: ${userData.id}`);

    return {
      success: true,
      is_valid: deviceValidation.is_valid,
      trust_score: deviceValidation.trust_score,
      trust_level: deviceValidation.trust_level,
    };
  } catch (error) {
    logger.error(`Device validation failed for user: ${userData.id}`, error);
    throw error;
  }
};

// Logout Flow
export const handleUserLogout = async (userData, sessionId, deviceId, requestInfo) => {
  try {
    logger.info(`Starting logout flow for user: ${userData.id}`);

    // Step 1: Revoke session
    const sessionRevocation = await deviceService.revokeSession(sessionId, 'user_logout');

    if (!sessionRevocation.success) {
      logger.warn(`Failed to revoke session: ${sessionId}`);
    }

    // Step 2: Submit logout event
    await securityService.submitEvent({
      user_id: userData.id,
      service_name: 'auth-service',
      event_type: 'user_logout',
      event_category: 'authentication',
      severity: 'low',
      event_data: {
        session_id: sessionId,
        device_id: deviceId,
        logout_reason: 'user_initiated',
      },
      ip_address: requestInfo.ip_address,
      user_agent: requestInfo.user_agent,
    });

    logger.info(`Logout flow completed for user: ${userData.id}`);

    return {
      success: true,
      session_revoked: sessionRevocation.success,
    };
  } catch (error) {
    logger.error(`Logout flow failed for user: ${userData.id}`, error);
    throw error;
  }
};

// Health Check Flow
export const checkServiceHealth = async () => {
  try {
    logger.info('Starting service health check');

    const deviceHealth = await deviceService.health();
    const securityHealth = await securityService.health();

    const healthStatus = {
      auth_service: { status: 'healthy' },
      device_service: deviceHealth,
      security_service: securityHealth,
      overall_status: 'healthy',
    };

    // Check if any service is unhealthy
    if (deviceHealth.status !== 'healthy' || securityHealth.status !== 'healthy') {
      healthStatus.overall_status = 'degraded';
    }

    logger.info('Service health check completed');

    return healthStatus;
  } catch (error) {
    logger.error('Service health check failed', error);
    return {
      auth_service: { status: 'healthy' },
      device_service: { status: 'error', error: error.message },
      security_service: { status: 'error', error: error.message },
      overall_status: 'unhealthy',
    };
  }
};

export const integrationService = {
  handleUserLogin,
  handleDeviceRegistration,
  handleSecurityMonitoring,
  handleDeviceValidation,
  handleUserLogout,
  checkServiceHealth,
};
