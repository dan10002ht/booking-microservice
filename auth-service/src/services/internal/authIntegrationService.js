import * as authService from './authService.js';
import { integrationService } from '../integration/integrationService.js';
import { normalizeDeviceInfo, normalizeRequestInfo } from '../../helpers/deviceHelper.js';
import logger from '../../utils/logger.js';

/**
 * Xử lý enhanced login (bao gồm fallback, mapping, chuẩn hóa)
 */
export async function enhancedLogin({ email, password, ip_address, user_agent, device_info }) {
  // Kiểm tra external service
  const deviceServiceUrl = process.env.DEVICE_SERVICE_URL;
  const securityServiceUrl = process.env.SECURITY_SERVICE_URL;

  if (!deviceServiceUrl || !securityServiceUrl) {
    logger.warn('External services not configured, falling back to basic login');
    // Fallback basic login
    const sessionData = { ip_address, user_agent };
    const basicResult = await authService.login(email, password, sessionData);
    return {
      success: true,
      user: basicResult.user,
      access_token: basicResult.access_token,
      refresh_token: basicResult.refresh_token,
      message: 'Login successful (basic mode)',
      warning: 'Enhanced features temporarily unavailable',
    };
  }

  // Basic login trước để lấy user
  const sessionData = { ip_address, user_agent };
  const basicResult = await authService.login(email, password, sessionData);

  // Chuẩn hóa device info
  const deviceData = normalizeDeviceInfo(device_info);
  const requestInfo = normalizeRequestInfo(ip_address, user_agent);
  const loginData = { method: 'email', email, password };

  try {
    // Gọi integrationService
    const enhancedResult = await integrationService.handleUserLogin(
      basicResult.user,
      loginData,
      deviceData,
      requestInfo
    );
    logger.info(`Enhanced login completed for user: ${basicResult.user.id}`);
    return {
      success: true,
      user: enhancedResult.user,
      access_token: basicResult.access_token,
      refresh_token: basicResult.refresh_token,
      device: enhancedResult.device,
      session: enhancedResult.session,
      security: enhancedResult.security,
      message: 'Enhanced login successful',
    };
  } catch (integrationError) {
    logger.error('Integration service error, falling back to basic login:', integrationError);
    return {
      success: true,
      user: basicResult.user,
      access_token: basicResult.access_token,
      refresh_token: basicResult.refresh_token,
      message: 'Login successful (basic mode)',
      warning: 'Enhanced features temporarily unavailable',
    };
  }
}
