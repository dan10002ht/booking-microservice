import {
  getRefreshTokenRepository,
  getPasswordResetTokenRepository,
  getEmailVerificationTokenRepository,
} from '../../repositories/repositoryFactory.js';

/**
 * Token Cleanup Service
 * Xử lý cleanup tất cả các loại tokens expired
 */
class TokenCleanupService {
  constructor() {
    this.refreshTokenRepo = getRefreshTokenRepository();
    this.passwordResetTokenRepo = getPasswordResetTokenRepository();
    this.emailVerificationTokenRepo = getEmailVerificationTokenRepository();
  }

  /**
   * Cleanup tất cả expired tokens
   */
  async cleanupAllExpiredTokens() {
    try {
      const results = await Promise.all([
        this.refreshTokenRepo.deleteExpired(),
        this.passwordResetTokenRepo.deleteExpired(),
        this.emailVerificationTokenRepo.deleteExpired(),
      ]);

      return {
        refreshTokens: results[0],
        passwordResetTokens: results[1],
        emailVerificationTokens: results[2],
        totalDeleted: results.reduce((sum, count) => sum + count, 0),
      };
    } catch (error) {
      console.error('Error cleaning up expired tokens:', error);
      throw error;
    }
  }

  /**
   * Cleanup chỉ refresh tokens
   */
  async cleanupExpiredRefreshTokens() {
    try {
      return await this.refreshTokenRepo.deleteExpired();
    } catch (error) {
      console.error('Error cleaning up expired refresh tokens:', error);
      throw error;
    }
  }

  /**
   * Cleanup chỉ password reset tokens
   */
  async cleanupExpiredPasswordResetTokens() {
    try {
      return await this.passwordResetTokenRepo.deleteExpired();
    } catch (error) {
      console.error('Error cleaning up expired password reset tokens:', error);
      throw error;
    }
  }

  /**
   * Cleanup chỉ email verification tokens
   */
  async cleanupExpiredEmailVerificationTokens() {
    try {
      return await this.emailVerificationTokenRepo.deleteExpired();
    } catch (error) {
      console.error('Error cleaning up expired email verification tokens:', error);
      throw error;
    }
  }
}

export default TokenCleanupService;
