import cacheService from '../services/internal/cacheService.js';
import logger from './logger.js';

/**
 * Handler cho job cache user profile
 */
export async function cacheUserProfileHandler(data) {
  try {
    await cacheService.cacheUserProfile(data.userId, data.userProfile);
    logger.info(`Cached user profile for userId=${data.userId}`);
  } catch (error) {
    logger.error(`Failed to cache user profile for userId=${data.userId}:`, error);
    throw error;
  }
}

/**
 * Handler cho job cache user roles
 */
export async function cacheUserRolesHandler(data) {
  try {
    await cacheService.cacheUserRoles(data.userId, data.roles);
    logger.info(`Cached user roles for userId=${data.userId}`);
  } catch (error) {
    logger.error(`Failed to cache user roles for userId=${data.userId}:`, error);
    throw error;
  }
}

/**
 * Đăng ký các handler với background service
 */
export function registerAuthBackgroundHandlers(backgroundService) {
  backgroundService.registerHandler('cache-user-profile', cacheUserProfileHandler);
  backgroundService.registerHandler('cache-user-roles', cacheUserRolesHandler);
}
