import { v4 as uuidv4 } from 'uuid';
import {
  getUserRepository,
  getRoleRepository,
  getUserRoleRepository,
  getOAuthAccountRepository,
  getRefreshTokenRepository,
  getUserSessionRepository,
} from '../../repositories/repositoryFactory.js';
import { checkDatabaseHealth } from '../../config/databaseConfig.js';
import { generateTokens, verifyAccessToken, verifyRefreshToken } from '../../utils/tokenUtils.js';
import { validateRegistration, validatePasswordChange } from '../../utils/validations.js';
import {
  sanitizeUserInput,
  sanitizeUserForResponse,
  sanitizeSessionData,
} from '../../utils/sanitizers.js';
import * as organizationManagementService from './organizationManagementService.js';
import * as oauthService from './oauthService.js';
import cacheService from './cacheService.js';
import logger from '../../utils/logger.js';
// import * as auditService from './auditService.js'; // TODO: Implement audit service

// Get repository instances from factory
const userRepository = getUserRepository();
const roleRepository = getRoleRepository();
const userRoleRepository = getUserRoleRepository();
const oauthAccountRepository = getOAuthAccountRepository();
const refreshTokenRepository = getRefreshTokenRepository();
const userSessionRepository = getUserSessionRepository();

// ========== HELPER FUNCTIONS ==========

/**
 * Create user session and refresh token in correct order
 * @param {number} userId - User ID
 * @param {object} sessionData - Session data
 * @param {object} refreshTokenData - Refresh token data
 */
async function createUserSessionAndRefreshToken(userId, sessionData, refreshTokenData) {
  // Tạo user_sessions trước để tránh foreign key constraint violation
  await userSessionRepository.createUserSession(userId, sessionData);

  // Sau đó mới tạo refresh_tokens
  await refreshTokenRepository.createRefreshTokenForSession(refreshTokenData);
}

// ========== REGISTRATION & LOGIN ==========

/**
 * Register new user with email and password
 */
export async function registerWithEmail(registerData) {
  try {
    const { ip_address, user_agent, role: currentRole, ...userData } = registerData;
    const validation = validateRegistration(userData);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    const sanitizedData = sanitizeUserInput(userData);

    const existingUser = await userRepository.findByEmail(sanitizedData.email);
    if (existingUser) {
      throw new Error('Email is already in use');
    }

    const newUser = await userRepository.createUser({
      ...sanitizedData,
      auth_type: 'email',
      is_active: true,
    });

    const roleName = currentRole || 'individual';
    const role = await roleRepository.findByName(roleName);

    if (!role) {
      throw new Error(`Invalid role: ${roleName}`);
    }

    await userRoleRepository.assignRoleToUser(newUser.id, role.id);

    let organization = null;
    if (userData.organization) {
      try {
        organization = await organizationManagementService.createOrganizationForUser(
          newUser.public_id,
          userData.organization
        );
      } catch (orgError) {
        await userRepository.deleteUser(newUser.public_id);
        throw new Error(`Organization creation failed: ${orgError.message}`);
      }
    }

    const userWithRoles = await userRepository.findWithRoles(newUser.public_id);
    const primaryRole =
      userWithRoles.roles && userWithRoles.roles.length > 0 ? userWithRoles.roles[0] : role;

    const userProfile = sanitizeUserForResponse({ ...newUser, role: primaryRole.name });

    const tokens = generateTokens(newUser.public_id, {
      email: newUser.email,
      role: primaryRole.name,
    });

    const sessionData = {
      session_id: uuidv4(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      ip_address: ip_address,
      user_agent: user_agent,
    };

    // Prepare refresh token data
    const refreshTokenData = {
      user_id: newUser.id,
      session_id: sessionData.session_id, // Link với session
      token_hash: tokens.refreshToken,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      device_info: user_agent, // Device fingerprint
      ip_address: ip_address,
    };

    await createUserSessionAndRefreshToken(newUser.id, sessionData, refreshTokenData);

    // Song song hóa các thao tác cache/token/session
    await Promise.all([
      cacheService.cacheUserProfile(newUser.public_id, userProfile),
      cacheService.cacheUserRoles(newUser.public_id, userWithRoles.roles || []),
    ]);

    // Nếu có gửi email xác thực hoặc audit log thì nên fire-and-forget ở đây (chưa có)
    try {
      const backgroundService =
        require('../../../background/backgroundService.js').getBackgroundService();
      backgroundService
        .enqueueJob(
          'email_verification',
          {
            userId: newUser.id,
            userEmail: newUser.email,
            userName: newUser.first_name || newUser.email,
          },
          {
            priority: 'high',
            maxRetries: 3,
            timeout: 30000,
          }
        )
        .catch((err) => logger.warn('Enqueue job gửi email xác thực thất bại:', err));
    } catch (err) {
      logger.warn('Không thể enqueue job gửi email xác thực:', err);
    }

    return {
      user: userProfile,
      organization: organization,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      authType: 'email',
    };
  } catch (error) {
    throw new Error(`Email registration failed: ${error.message}`);
  }
}

/**
 * Register new user with OAuth (Google, Facebook, etc.)
 */
export async function registerWithOAuth(provider, oauthData, sessionData = {}) {
  try {
    const sanitizedSessionData = sanitizeSessionData(sessionData);

    // Verify OAuth token and get user info from provider
    const oauthUserInfo = await oauthService.verifyOAuthToken(provider, oauthData.token);

    if (!oauthUserInfo) {
      throw new Error(`Invalid ${provider} token`);
    }

    // Check if OAuth account already exists
    const existingOAuthAccount = await oauthAccountRepository.findByProvider(
      provider,
      oauthUserInfo.provider_user_id
    );

    if (existingOAuthAccount) {
      // OAuth account exists - login existing user
      const existingUser = await userRepository.findById(existingOAuthAccount.user_id);

      if (!existingUser || !existingUser.is_active) {
        throw new Error('Account is locked or not activated');
      }

      // Update OAuth tokens
      await oauthAccountRepository.updateOAuthAccount(existingOAuthAccount.id, {
        access_token: oauthData.access_token,
        refresh_token: oauthData.refresh_token,
        expires_at: oauthData.expires_at ? new Date(oauthData.expires_at * 1000) : null,
      });

      // Get user with roles for token generation
      const userWithRoles = await userRepository.findWithRoles(existingUser.public_id);
      const primaryRole =
        userWithRoles.roles && userWithRoles.roles.length > 0
          ? userWithRoles.roles[0]
          : { name: 'individual' };

      // Cache user profile and roles
      const userProfile = sanitizeUserForResponse({ ...existingUser, role: primaryRole.name });
      await cacheService.cacheUserProfile(existingUser.public_id, userProfile);
      await cacheService.cacheUserRoles(existingUser.public_id, userWithRoles.roles || []);

      // Generate tokens and create session
      const tokens = generateTokens(existingUser.public_id, {
        email: existingUser.email,
        role: primaryRole.name,
      });

      const sessionId = uuidv4();

      // Save refresh token to refresh_tokens table
      await Promise.all([
        cacheService.cacheUserProfile(existingUser.public_id, userProfile),
        cacheService.cacheUserRoles(existingUser.public_id, userWithRoles.roles || []),
      ]);

      await createUserSessionAndRefreshToken(
        existingUser.id,
        {
          session_id: sessionId,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          ip_address: sanitizedSessionData.ip_address,
          user_agent: sanitizedSessionData.user_agent,
        },
        {
          user_id: existingUser.id,
          session_id: sessionId,
          token_hash: tokens.refreshToken, // In production, hash this
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          device_info: sanitizedSessionData.user_agent,
          ip_address: sanitizedSessionData.ip_address,
        }
      );

      return {
        user: sanitizeUserForResponse({ ...existingUser, role: primaryRole.name }),
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        authType: 'oauth',
        isNewUser: false,
      };
    }

    // Check if email from OAuth already exists in our system
    const existingUserByEmail = await userRepository.findByEmail(oauthUserInfo.email);

    if (existingUserByEmail) {
      // Email exists but not linked to this OAuth provider
      // Link OAuth account to existing user
      await oauthAccountRepository.createOAuthAccount({
        user_id: existingUserByEmail.id,
        provider: provider,
        provider_user_id: oauthUserInfo.provider_user_id,
        access_token: oauthData.access_token,
        refresh_token: oauthData.refresh_token,
        expires_at: oauthData.expires_at ? new Date(oauthData.expires_at * 1000) : null,
      });

      // Get user with roles for token generation
      const userWithRoles = await userRepository.findWithRoles(existingUserByEmail.public_id);
      const primaryRole =
        userWithRoles.roles && userWithRoles.roles.length > 0
          ? userWithRoles.roles[0]
          : { name: 'individual' };

      // Cache user profile and roles
      const userProfile = sanitizeUserForResponse({
        ...existingUserByEmail,
        role: primaryRole.name,
      });
      await cacheService.cacheUserProfile(existingUserByEmail.public_id, userProfile);
      await cacheService.cacheUserRoles(existingUserByEmail.public_id, userWithRoles.roles || []);

      // Generate tokens and create session
      const tokens = generateTokens(existingUserByEmail.public_id, {
        email: existingUserByEmail.email,
        role: primaryRole.name,
      });

      const sessionId = uuidv4();

      // Save refresh token to refresh_tokens table
      await Promise.all([
        cacheService.cacheUserProfile(existingUserByEmail.public_id, userProfile),
        cacheService.cacheUserRoles(existingUserByEmail.public_id, userWithRoles.roles || []),
      ]);

      await createUserSessionAndRefreshToken(
        existingUserByEmail.id,
        {
          session_id: sessionId,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          ip_address: sanitizedSessionData.ip_address,
          user_agent: sanitizedSessionData.user_agent,
        },
        {
          user_id: existingUserByEmail.id,
          session_id: sessionId,
          token_hash: tokens.refreshToken, // In production, hash this
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          device_info: sanitizedSessionData.user_agent,
          ip_address: sanitizedSessionData.ip_address,
        }
      );

      return {
        user: sanitizeUserForResponse({ ...existingUserByEmail, role: primaryRole.name }),
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        authType: 'oauth',
        isNewUser: false,
        message: `Linked ${provider} account to existing email`,
      };
    }

    // Create new user with OAuth
    const newUser = await userRepository.createUser({
      email: oauthUserInfo.email,
      first_name: oauthUserInfo.first_name || '',
      last_name: oauthUserInfo.last_name || '',
      auth_type: 'oauth',
      is_active: true,
      email_verified_at: new Date(), // OAuth emails are pre-verified
    });

    // Assign default 'individual' role to OAuth users
    const defaultRole = await roleRepository.findByName('individual');
    if (defaultRole) {
      await userRoleRepository.assignRoleToUser(newUser.id, defaultRole.id);
    }

    // Create OAuth account
    await oauthAccountRepository.createOAuthAccount({
      user_id: newUser.id,
      provider: provider,
      provider_user_id: oauthUserInfo.provider_user_id,
      access_token: oauthData.access_token,
      refresh_token: oauthData.refresh_token,
      expires_at: oauthData.expires_at ? new Date(oauthData.expires_at * 1000) : null,
    });

    // Cache user profile and roles
    const userProfile = sanitizeUserForResponse({ ...newUser, role: 'individual' });
    await cacheService.cacheUserProfile(newUser.public_id, userProfile);
    await cacheService.cacheUserRoles(newUser.public_id, []);

    // Generate tokens and create session
    const tokens = generateTokens(newUser.public_id, {
      email: newUser.email,
      role: 'individual', // Default role for OAuth users
    });

    const sessionId = uuidv4();

    // Save refresh token to refresh_tokens table
    await Promise.all([
      cacheService.cacheUserProfile(newUser.public_id, userProfile),
      cacheService.cacheUserRoles(newUser.public_id, []),
    ]);

    await createUserSessionAndRefreshToken(
      newUser.id,
      {
        session_id: sessionId,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        ip_address: sanitizedSessionData.ip_address,
        user_agent: sanitizedSessionData.user_agent,
      },
      {
        user_id: newUser.id,
        session_id: sessionId,
        token_hash: tokens.refreshToken, // In production, hash this
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        device_info: sanitizedSessionData.user_agent,
        ip_address: sanitizedSessionData.ip_address,
      }
    );

    return {
      user: sanitizeUserForResponse({ ...newUser, role: 'individual' }),
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      authType: 'oauth',
      isNewUser: true,
    };
  } catch (error) {
    throw new Error(`OAuth registration failed: ${error.message}`);
  }
}

/**
 * Legacy register function - redirects to registerWithEmail for backward compatibility
 */
export async function register(userData) {
  return await registerWithEmail(userData);
}

/**
 * User login
 */
export async function login(email, password, sessionData = {}) {
  try {
    const sanitizedSessionData = sanitizeSessionData(sessionData);

    const user = await userRepository.verifyCredentials(email, password);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!user.is_active) {
      throw new Error('Account is locked or not activated');
    }

    await userRepository.updateLastLogin(user.public_id);

    const userWithRoles = await userRepository.findWithRoles(user.public_id);
    const primaryRole =
      userWithRoles.roles && userWithRoles.roles.length > 0
        ? userWithRoles.roles[0]
        : { name: 'individual' };

    const userProfile = sanitizeUserForResponse({ ...user, role: primaryRole.name });
    const tokens = generateTokens(user.public_id, {
      email: user.email,
      role: primaryRole.name,
    });

    const sessionId = uuidv4();
    const sessionInfo = {
      session_id: sessionId,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      ip_address: sanitizedSessionData.ip_address,
      user_agent: sanitizedSessionData.user_agent,
    };

    const refreshTokenData = {
      user_id: user.id,
      session_id: sessionId,
      token_hash: tokens.refreshToken,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      device_info: sanitizedSessionData.user_agent,
      ip_address: sanitizedSessionData.ip_address,
    };

    // Song song hóa các thao tác cache/token/session
    await Promise.all([
      cacheService.cacheUserProfile(user.public_id, userProfile),
      cacheService.cacheUserRoles(user.public_id, userWithRoles.roles || []),
    ]);

    await createUserSessionAndRefreshToken(user.id, sessionInfo, refreshTokenData);

    return {
      user: userProfile,
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    };
  } catch (error) {
    console.log('error', error.message);
    throw new Error(`Login failed: ${error.message}`);
  }
}

/**
 * User logout - Best Practices Implementation
 * @param {string} userId - User ID
 * @param {string} sessionId - Optional: specific session to logout (selective logout)
 * @param {object} requestInfo - Optional: request information for audit
 */
export async function logout(userId, sessionId = null, requestInfo = {}) {
  try {
    const operations = [];
    const auditData = {
      user_id: userId,
      action: 'logout',
      resource_type: 'session',
      ip_address: requestInfo.ip_address,
      user_agent: requestInfo.user_agent,
      event_data: {
        logout_type: sessionId ? 'selective' : 'global',
        session_id: sessionId,
        timestamp: new Date().toISOString(),
      },
    };

    if (sessionId) {
      // Selective logout - logout specific session only
      operations.push(
        userSessionRepository.deleteBySessionId(sessionId),
        refreshTokenRepository.revokeBySessionId(sessionId) // Need to implement this
      );

      auditData.resource_id = sessionId;
      auditData.event_data.logout_scope = 'single_session';
    } else {
      // Global logout - logout all sessions and revoke all refresh tokens
      operations.push(
        userSessionRepository.deleteAllByUserId(userId),
        refreshTokenRepository.revokeAllUserTokens(userId)
      );

      auditData.event_data.logout_scope = 'all_sessions';
    }

    // Invalidate user cache
    operations.push(cacheService.invalidateUserCache(userId));

    // Execute all operations in parallel for better performance
    await Promise.all(operations);

    // Log audit trail (async - fire-and-forget)
    // TODO: Implement audit service
    // auditService.logAuditEvent(auditData).catch((error) => {
    //   console.error('Failed to log logout audit event:', error);
    // });

    return {
      message: 'Logout successful',
      logout_type: sessionId ? 'selective' : 'global',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    throw new Error(`Logout failed: ${error.message}`);
  }
}

// ========== TOKEN MANAGEMENT ==========

/**
 * Generate access token and refresh token
 */
export async function generateTokensForUser(userId) {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new Error('User does not exist');
  }

  // Get user with roles for token generation
  const userWithRoles = await userRepository.findWithRoles(user.public_id);
  const primaryRole =
    userWithRoles.roles && userWithRoles.roles.length > 0
      ? userWithRoles.roles[0]
      : { name: 'individual' };

  return await generateTokens(user.public_id, {
    email: user.email,
    role: primaryRole.name,
  });
}

/**
 * Refresh access token
 */
export async function refreshToken(refreshToken) {
  try {
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Check if refresh token exists in refresh_tokens table
    const tokenRecord = await refreshTokenRepository.findRefreshTokenByHash(refreshToken);

    if (!tokenRecord || tokenRecord.is_revoked || tokenRecord.expires_at < new Date()) {
      throw new Error('Invalid refresh token');
    }

    const user = await userRepository.findByPublicId(decoded.userId);
    if (!user || !user.is_active) {
      throw new Error('Invalid user');
    }

    // Generate new tokens
    const tokens = await generateTokensForUser(user.id);

    // Create new session ID for the refreshed token
    const newSessionId = uuidv4();

    // Prepare new refresh token data
    const newRefreshTokenData = {
      user_id: user.id,
      session_id: newSessionId,
      token_hash: tokens.refreshToken, // In production, hash this
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      device_info: tokenRecord.device_info || 'unknown',
      ip_address: tokenRecord.ip_address || 'unknown',
    };

    // Song song hóa revoke token cũ và tạo token mới
    await Promise.all([refreshTokenRepository.revokeRefreshToken(tokenRecord.id)]);

    // Tạo session và refresh token mới
    await createUserSessionAndRefreshToken(
      user.id,
      {
        session_id: newSessionId,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        ip_address: tokenRecord.ip_address || 'unknown',
        user_agent: tokenRecord.device_info || 'unknown',
      },
      newRefreshTokenData
    );

    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    };
  } catch (error) {
    throw new Error(`Refresh token failed: ${error.message}`);
  }
}

/**
 * Verify access token
 */
export async function verifyToken(token) {
  try {
    // Check cache first
    const cachedValidation = await cacheService.getCachedTokenValidation(token);
    if (cachedValidation) {
      return cachedValidation;
    }

    const decoded = verifyAccessToken(token);

    // Check if user exists and is active
    const user = await userRepository.findByPublicId(decoded.userId);
    if (!user || !user.is_active) {
      throw new Error('Invalid user');
    }

    // Get user with roles
    const userWithRoles = await userRepository.findWithRoles(decoded.userId);
    const primaryRole =
      userWithRoles.roles && userWithRoles.roles.length > 0
        ? userWithRoles.roles[0]
        : { name: 'individual' };

    const validationData = {
      userId: decoded.userId,
      email: decoded.email,
      role: primaryRole.name,
      user: sanitizeUserForResponse({ ...user, role: primaryRole.name }),
    };

    // Cache the validation result (fire-and-forget)
    cacheService.cacheTokenValidation(token, validationData).catch(() => {});

    return validationData;
  } catch (error) {
    throw new Error(`Invalid token: ${error.message}`);
  }
}

// ========== PASSWORD MANAGEMENT ==========

/**
 * Change password
 */
export async function changePassword(userId, currentPassword, newPassword) {
  try {
    // Validate password change
    const validation = validatePasswordChange(currentPassword, newPassword);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    // Verify current password
    const isValidPassword = await userRepository.verifyPassword(userId, currentPassword);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Update password
    await userRepository.updatePassword(userId, newPassword);

    // Execute cleanup operations in parallel
    await Promise.all([
      userSessionRepository.deleteAllUserSessions(userId),
      cacheService.invalidateUserCache(userId),
    ]);

    return { message: 'Password changed successfully' };
  } catch (error) {
    throw new Error(`Password change failed: ${error.message}`);
  }
}

// ========== HEALTH CHECK ==========

/**
 * System health check
 */
export async function healthCheck() {
  try {
    const dbHealth = await checkDatabaseHealth();
    const cacheHealth = await cacheService.healthCheck();

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbHealth,
      cache: cacheHealth,
      service: 'auth-service',
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      service: 'auth-service',
    };
  }
}
