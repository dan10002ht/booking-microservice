import * as authService from '../services/internal/authService.js';
import * as userManagementService from '../services/internal/userManagementService.js';
import * as adminService from '../services/internal/adminService.js';
import * as emailVerificationService from '../services/internal/emailVerificationService.js';
import * as pinCodeVerificationService from '../services/internal/pinCodeVerificationService.js';
import { sanitizePagination, sanitizeFilters } from '../utils/sanitizers.js';
import { verifyRefreshToken } from '../utils/tokenUtils.js';
import { integrationService } from '../services/integration/integrationService.js';
import logger from '../utils/logger.js';
import { enhancedLogin as enhancedLoginService } from '../services/internal/authIntegrationService.js';

/**
 * Register with email and password
 */
export async function registerWithEmail(call, callback) {
  try {
    const { email, password, first_name, last_name, phone, role, ip_address, user_agent } =
      call.request;

    if (!email || !password) {
      return callback({
        code: 3,
        message: 'Email and password are required',
      });
    }

    const userData = {
      email,
      password,
      first_name,
      last_name,
      phone,
      role: role || 'individual',
      ip_address,
      user_agent,
    };

    const result = await authService.registerWithEmail(userData);

    const response = {
      success: true,
      user: result.user,
      organization: result.organization,
      access_token: result.accessToken,
      refresh_token: result.refreshToken,
      auth_type: result.authType,
      message: 'Email registration successful',
    };

    callback(null, response);
  } catch (error) {
    console.error('Email registration error:', error);
    console.error('Error stack:', error.stack);
    callback({
      code: 13,
      message: error.message,
    });
  }
}

/**
 * Register with OAuth (Google, Facebook, etc.)
 */
export async function registerWithOAuth(call, callback) {
  try {
    const { provider, token, access_token, refresh_token, expires_at, ip_address, user_agent } =
      call.request;

    if (!provider || !token) {
      return callback({
        code: 3,
        message: 'Provider and token are required',
      });
    }

    const oauthData = {
      token,
      access_token,
      refresh_token,
      expires_at,
    };

    const sessionData = { ip_address, user_agent };
    const result = await authService.registerWithOAuth(provider, oauthData, sessionData);

    callback(null, {
      success: true,
      user: result.user,
      access_token: result.access_token,
      refresh_token: result.refresh_token,
      auth_type: result.authType,
      is_new_user: result.isNewUser || false,
      organization: result.organization,
      message: result.message || `${provider} registration successful`,
    });
  } catch (error) {
    console.error('OAuth registration error:', error);
    callback({
      code: 13,
      message: error.message,
    });
  }
}

/**
 * Legacy register function - redirects to registerWithEmail
 */
export async function register(call, callback) {
  return await registerWithEmail(call, callback);
}

/**
 * User login - Basic version
 */
export async function login(call, callback) {
  try {
    const { email, password, ip_address, user_agent } = call.request;

    if (!email || !password) {
      return callback({
        code: 3,
        message: 'Email and password are required',
      });
    }

    const sessionData = { ip_address, user_agent };
    const result = await authService.login(email, password, sessionData);

    callback(null, {
      success: true,
      user: result.user,
      access_token: result.access_token,
      refresh_token: result.refresh_token,
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Login error:', error);
    callback({
      code: 13,
      message: error.message,
    });
  }
}

/**
 * Enhanced login with device management and security monitoring
 * TODO: Implement when device-service and security-service are available
 */
export async function enhancedLogin(call, callback) {
  try {
    const { email, password, ip_address, user_agent, device_info } = call.request;

    if (!email || !password) {
      return callback({
        code: 3,
        message: 'Email and password are required',
      });
    }

    // Gọi service xử lý toàn bộ logic
    const result = await enhancedLoginService({
      email,
      password,
      ip_address,
      user_agent,
      device_info,
    });

    callback(null, result);
  } catch (error) {
    console.error('Enhanced login error:', error);
    callback({
      code: 13,
      message: error.message,
    });
  }
}

/**
 * Device registration endpoint
 * TODO: Implement when device-service is available
 */
export async function registerDevice(call, callback) {
  try {
    const { user_id, device_info, ip_address, user_agent } = call.request;

    if (!user_id || !device_info) {
      return callback({
        code: 3,
        message: 'User ID and device info are required',
      });
    }

    // TODO: Check if device-service is available
    const deviceServiceUrl = process.env.DEVICE_SERVICE_URL;
    if (!deviceServiceUrl) {
      return callback({
        code: 14, // Unavailable
        message: 'Device service not available',
      });
    }

    const requestInfo = {
      ip_address: ip_address || 'unknown',
      user_agent: user_agent || 'unknown',
    };

    try {
      const result = await integrationService.handleDeviceRegistration(
        { id: user_id },
        device_info,
        requestInfo
      );

      callback(null, {
        success: true,
        device: result.device,
        message: 'Device registered successfully',
      });
    } catch (error) {
      logger.error('Device registration error:', error);
      callback({
        code: 13,
        message: 'Device registration failed',
      });
    }
  } catch (error) {
    console.error('Register device error:', error);
    callback({
      code: 13,
      message: error.message,
    });
  }
}

/**
 * Enhanced logout with device and security integration
 * TODO: Implement when device-service and security-service are available
 */
export async function enhancedLogout(call, callback) {
  try {
    const { refresh_token, device_id } = call.request;

    if (!refresh_token) {
      return callback({
        code: 3,
        message: 'Refresh token is required',
      });
    }

    // Extract user_id from refresh token
    const decoded = verifyRefreshToken(refresh_token);
    if (!decoded || !decoded.userId) {
      return callback({
        code: 3,
        message: 'Invalid refresh token',
      });
    }

    // TODO: Check if external services are available
    const deviceServiceUrl = process.env.DEVICE_SERVICE_URL;
    const securityServiceUrl = process.env.SECURITY_SERVICE_URL;

    if (!deviceServiceUrl || !securityServiceUrl) {
      logger.warn('External services not configured, using basic logout');
      await authService.logout(decoded.userId);

      callback(null, {
        success: true,
        message: 'Logout successful (basic mode)',
        warning: 'Enhanced logout features temporarily unavailable',
      });
      return;
    }

    const requestInfo = {
      ip_address: 'unknown', // TODO: Extract from request context
      user_agent: 'unknown', // TODO: Extract from request context
    };

    try {
      // Enhanced logout flow
      await integrationService.handleUserLogout(
        { id: decoded.userId },
        decoded.sessionId, // TODO: Extract session ID from token
        device_id,
        requestInfo
      );

      // Basic logout
      const result = await authService.logout(decoded.userId);

      callback(null, {
        success: true,
        message: 'Enhanced logout successful',
        details: result.message,
      });
    } catch (integrationError) {
      logger.error('Integration service error during logout:', integrationError);

      // Fallback to basic logout
      await authService.logout(decoded.userId);

      callback(null, {
        success: true,
        message: 'Logout successful (basic mode)',
        warning: 'Enhanced logout features temporarily unavailable',
      });
    }
  } catch (error) {
    console.error('Enhanced logout error:', error);
    callback({
      code: 13,
      message: error.message,
    });
  }
}

export async function logout(call, callback) {
  try {
    const { refresh_token } = call.request;

    if (!refresh_token) {
      return callback({
        code: 3,
        message: 'Refresh token is required',
      });
    }

    // Extract user_id from refresh token
    const decoded = verifyRefreshToken(refresh_token);
    if (!decoded || !decoded.userId) {
      return callback({
        code: 3,
        message: 'Invalid refresh token',
      });
    }

    const result = await authService.logout(decoded.userId);

    callback(null, {
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('Logout error:', error);
    callback({
      code: 13,
      message: error.message,
    });
  }
}

export async function refreshToken(call, callback) {
  try {
    const { refresh_token } = call.request;

    if (!refresh_token) {
      return callback({
        code: 3,
        message: 'Refresh token is required',
      });
    }

    const result = await authService.refreshToken(refresh_token);

    callback(null, {
      success: true,
      access_token: result.access_token,
      refresh_token: result.refresh_token,
      message: 'Token refresh successful',
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    callback({
      code: 13,
      message: error.message,
    });
  }
}

export async function validateToken(call, callback) {
  try {
    const { token } = call.request;

    if (!token) {
      return callback({
        code: 3,
        message: 'Token is required',
      });
    }

    const result = await authService.verifyToken(token);

    callback(null, {
      valid: true,
      user: result.user,
    });
  } catch (error) {
    console.error('Validate token error:', error);
    callback({
      code: 13,
      message: error.message,
    });
  }
}

export async function changePassword(call, callback) {
  try {
    const { user_id, current_password, new_password } = call.request;

    if (!user_id || !current_password || !new_password) {
      return callback({
        code: 3,
        message: 'User ID, current password and new password are required',
      });
    }

    const result = await authService.changePassword(user_id, current_password, new_password);

    callback(null, {
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('Change password error:', error);
    callback({
      code: 13,
      message: error.message,
    });
  }
}

/**
 * Forgot password - send reset email
 */
export async function forgotPassword(call, callback) {
  try {
    const { email } = call.request;

    if (!email) {
      return callback({
        code: 3,
        message: 'Email is required',
      });
    }

    const result = await emailVerificationService.forgotPassword(email);

    callback(null, {
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    callback({
      code: 13,
      message: error.message,
    });
  }
}

/**
 * Reset password with token
 */
export async function resetPassword(call, callback) {
  try {
    const { token, new_password } = call.request;

    if (!token || !new_password) {
      return callback({
        code: 3,
        message: 'Token and new password are required',
      });
    }

    const result = await emailVerificationService.resetPassword(token, new_password);

    callback(null, {
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('Reset password error:', error);
    callback({
      code: 13,
      message: error.message,
    });
  }
}

export async function getUserProfile(call, callback) {
  try {
    const { user_id } = call.request;

    if (!user_id) {
      return callback({
        code: 3,
        message: 'User ID is required',
      });
    }

    const result = await userManagementService.getUserProfile(user_id);

    callback(null, {
      success: true,
      user: result,
      message: 'User profile retrieved successfully',
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    callback({
      code: 13,
      message: error.message,
    });
  }
}

export async function updateUserProfile(call, callback) {
  try {
    const {
      user_id,
      first_name,
      last_name,
      phone,
      address,
      city,
      state,
      country,
      postal_code,
      profile_picture_url,
    } = call.request;

    if (!user_id) {
      return callback({
        code: 3,
        message: 'User ID is required',
      });
    }

    const updateData = {
      first_name,
      last_name,
      phone,
      address,
      city,
      state,
      country,
      postal_code,
      profile_picture_url,
    };

    const result = await userManagementService.updateUserProfile(user_id, updateData);

    callback(null, {
      success: true,
      user: result,
      message: 'User profile updated successfully',
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    callback({
      code: 13,
      message: error.message,
    });
  }
}

export async function getUserSessions(call, callback) {
  try {
    const { user_id } = call.request;

    if (!user_id) {
      return callback({
        code: 3,
        message: 'User ID is required',
      });
    }

    const result = await userManagementService.getUserSessions(user_id);

    callback(null, {
      success: true,
      sessions: result,
      message: 'User sessions retrieved successfully',
    });
  } catch (error) {
    console.error('Get user sessions error:', error);
    callback({
      code: 13,
      message: error.message,
    });
  }
}

export async function getUsers(call, callback) {
  try {
    const { page, limit, filters } = call.request;

    const sanitizedPagination = sanitizePagination({ page, limit });
    const sanitizedFilters = sanitizeFilters(filters);

    const result = await adminService.getUsers(
      sanitizedPagination.page,
      sanitizedPagination.limit,
      sanitizedFilters
    );

    callback(null, {
      success: true,
      users: result.users,
      pagination: result.pagination,
      message: 'Users retrieved successfully',
    });
  } catch (error) {
    console.error('Get users error:', error);
    callback({
      code: 13,
      message: error.message,
    });
  }
}

export async function searchUsers(call, callback) {
  try {
    const { search_term, page, limit } = call.request;

    if (!search_term) {
      return callback({
        code: 3,
        message: 'Search term is required',
      });
    }

    const sanitizedPagination = sanitizePagination({ page, limit });
    const result = await adminService.searchUsers(
      search_term,
      sanitizedPagination.page,
      sanitizedPagination.limit
    );

    callback(null, {
      success: true,
      users: result.data,
      pagination: result.pagination,
      message: 'Users search completed successfully',
    });
  } catch (error) {
    console.error('Search users error:', error);
    callback({
      code: 13,
      message: error.message,
    });
  }
}

export async function updateUserStatus(call, callback) {
  try {
    const { user_id, status } = call.request;

    if (!user_id || !status) {
      return callback({
        code: 3,
        message: 'User ID and status are required',
      });
    }

    const result = await adminService.updateUserStatus(user_id, status);

    callback(null, {
      success: true,
      user: result,
      message: 'User status updated successfully',
    });
  } catch (error) {
    console.error('Update user status error:', error);
    callback({
      code: 13,
      message: error.message,
    });
  }
}

export async function health(call, callback) {
  try {
    const result = await authService.healthCheck();

    callback(null, {
      status: result.status,
      message: result.status === 'healthy' ? 'Service is healthy' : 'Service is unhealthy',
      details: {
        timestamp: result.timestamp,
        database: result.database,
        service: result.service,
      },
    });
  } catch (error) {
    console.error('Health check error:', error);
    callback({
      code: 13,
      message: error.message,
    });
  }
}

// ========== PIN CODE VERIFICATION METHODS ==========

/**
 * Send verification email with PIN code
 */
export async function sendVerificationEmail(call, callback) {
  try {
    const { email } = call.request;

    if (!email) {
      return callback({
        code: 3,
        message: 'Email is required',
      });
    }

    const result = await pinCodeVerificationService.sendVerificationEmailWithPin(email);

    callback(null, {
      success: true,
      message: result.message,
      user_id: result.userId,
      user_email: result.userEmail,
      pin_code: process.env.NODE_ENV === 'development' ? result.pinCode : undefined,
      expires_at: result.expiresAt,
    });
  } catch (error) {
    console.error('Send verification email error:', error);
    callback({
      code: 13,
      message: error.message,
    });
  }
}

/**
 * Verify email with PIN code
 */
export async function verifyEmailWithPin(call, callback) {
  try {
    const { user_id, pin_code } = call.request;

    if (!user_id || !pin_code) {
      return callback({
        code: 3,
        message: 'User ID and PIN code are required',
      });
    }

    const result = await pinCodeVerificationService.verifyEmailWithPin(user_id, pin_code);

    callback(null, {
      success: true,
      message: result.message,
      user: result.user,
    });
  } catch (error) {
    console.error('Verify email error:', error);
    callback({
      code: 13,
      message: error.message,
    });
  }
}

/**
 * Resend verification email with new PIN code
 */
export async function resendVerificationEmail(call, callback) {
  try {
    const { email } = call.request;

    if (!email) {
      return callback({
        code: 3,
        message: 'Email is required',
      });
    }

    const result = await pinCodeVerificationService.resendVerificationEmail(email);

    callback(null, {
      success: true,
      message: result.message,
      user_id: result.userId,
      user_email: result.userEmail,
      pin_code: process.env.NODE_ENV === 'development' ? result.pinCode : undefined,
      expires_at: result.expiresAt,
    });
  } catch (error) {
    console.error('Resend verification email error:', error);
    callback({
      code: 13,
      message: error.message,
    });
  }
}
