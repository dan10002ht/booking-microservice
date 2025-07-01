import UserRepository from './userRepository.js';
import RoleRepository from './roleRepository.js';
import UserRoleRepository from './userRoleRepository.js';
import PermissionRepository from './permissionRepository.js';
import RefreshTokenRepository from './refreshTokenRepository.js';
import PasswordResetTokenRepository from './passwordResetTokenRepository.js';
import EmailVerificationTokenRepository from './emailVerificationTokenRepository.js';
import UserSessionRepository from './userSessionRepository.js';
import UserProfileRepository from './userProfileRepository.js';
import OAuthAccountRepository from './oauthAccountRepository.js';
import OrganizationRepository from './organizationRepository.js';

// Singleton instances for master-slave pattern
let userRepositoryInstance = null;
let roleRepositoryInstance = null;
let userRoleRepositoryInstance = null;
let permissionRepositoryInstance = null;
let refreshTokenRepositoryInstance = null;
let passwordResetTokenRepositoryInstance = null;
let emailVerificationTokenRepositoryInstance = null;
let userSessionRepositoryInstance = null;
let userProfileRepositoryInstance = null;
let oauthAccountRepositoryInstance = null;
let organizationRepositoryInstance = null;

/**
 * Get UserRepository singleton instance
 */
export function getUserRepository() {
  if (!userRepositoryInstance) {
    userRepositoryInstance = new UserRepository();
  }
  return userRepositoryInstance;
}

/**
 * Get RoleRepository singleton instance
 */
export function getRoleRepository() {
  if (!roleRepositoryInstance) {
    roleRepositoryInstance = new RoleRepository();
  }
  return roleRepositoryInstance;
}

/**
 * Get UserRoleRepository singleton instance
 */
export function getUserRoleRepository() {
  if (!userRoleRepositoryInstance) {
    userRoleRepositoryInstance = new UserRoleRepository();
  }
  return userRoleRepositoryInstance;
}

/**
 * Get PermissionRepository singleton instance
 */
export function getPermissionRepository() {
  if (!permissionRepositoryInstance) {
    permissionRepositoryInstance = new PermissionRepository();
  }
  return permissionRepositoryInstance;
}

/**
 * Get RefreshTokenRepository singleton instance
 */
export function getRefreshTokenRepository() {
  if (!refreshTokenRepositoryInstance) {
    refreshTokenRepositoryInstance = new RefreshTokenRepository();
  }
  return refreshTokenRepositoryInstance;
}

/**
 * Get PasswordResetTokenRepository singleton instance
 */
export function getPasswordResetTokenRepository() {
  if (!passwordResetTokenRepositoryInstance) {
    passwordResetTokenRepositoryInstance = new PasswordResetTokenRepository();
  }
  return passwordResetTokenRepositoryInstance;
}

/**
 * Get EmailVerificationTokenRepository singleton instance
 */
export function getEmailVerificationTokenRepository() {
  if (!emailVerificationTokenRepositoryInstance) {
    emailVerificationTokenRepositoryInstance = new EmailVerificationTokenRepository();
  }
  return emailVerificationTokenRepositoryInstance;
}

/**
 * Get UserSessionRepository singleton instance
 */
export function getUserSessionRepository() {
  if (!userSessionRepositoryInstance) {
    userSessionRepositoryInstance = new UserSessionRepository();
  }
  return userSessionRepositoryInstance;
}

/**
 * Get UserProfileRepository singleton instance
 */
export function getUserProfileRepository() {
  if (!userProfileRepositoryInstance) {
    userProfileRepositoryInstance = new UserProfileRepository();
  }
  return userProfileRepositoryInstance;
}

/**
 * Get OAuthAccountRepository singleton instance
 */
export function getOAuthAccountRepository() {
  if (!oauthAccountRepositoryInstance) {
    oauthAccountRepositoryInstance = new OAuthAccountRepository();
  }
  return oauthAccountRepositoryInstance;
}

/**
 * Get OrganizationRepository singleton instance
 */
export function getOrganizationRepository() {
  if (!organizationRepositoryInstance) {
    organizationRepositoryInstance = new OrganizationRepository();
  }
  return organizationRepositoryInstance;
}

/**
 * Reset all repository instances (for testing)
 */
export function resetRepositories() {
  userRepositoryInstance = null;
  roleRepositoryInstance = null;
  userRoleRepositoryInstance = null;
  permissionRepositoryInstance = null;
  refreshTokenRepositoryInstance = null;
  passwordResetTokenRepositoryInstance = null;
  emailVerificationTokenRepositoryInstance = null;
  userSessionRepositoryInstance = null;
  userProfileRepositoryInstance = null;
  oauthAccountRepositoryInstance = null;
  organizationRepositoryInstance = null;
}

/**
 * Get all repository instances (for bulk operations)
 */
export function getAllRepositories() {
  return {
    user: getUserRepository(),
    role: getRoleRepository(),
    userRole: getUserRoleRepository(),
    permission: getPermissionRepository(),
    refreshToken: getRefreshTokenRepository(),
    passwordResetToken: getPasswordResetTokenRepository(),
    emailVerificationToken: getEmailVerificationTokenRepository(),
    userSession: getUserSessionRepository(),
    userProfile: getUserProfileRepository(),
    oauthAccount: getOAuthAccountRepository(),
    organization: getOrganizationRepository(),
  };
}
