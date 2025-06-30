import { getUserRepository, getTokenRepository } from '../../repositories/repositoryFactory.js';
import { sanitizeUserForResponse } from '../../utils/sanitizers.js';
import crypto from 'crypto';

// Get repository instances from factory
const userRepository = getUserRepository();
const tokenRepository = getTokenRepository();

// ========== EMAIL VERIFICATION ==========

/**
 * Send verification email
 */
export async function sendVerificationEmail(email) {
  try {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.is_verified) {
      throw new Error('Email is already verified');
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');

    // Create verification token record
    await tokenRepository.createEmailVerificationToken({
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    // TODO: Send email via email service
    // await emailService.sendVerificationEmail(user.email, verificationToken);

    return {
      message: 'Verification email sent successfully',
      verification_token: verificationToken, // For testing only
    };
  } catch (error) {
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
}

/**
 * Verify email with token
 */
export async function verifyEmail(token) {
  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find valid verification token
    const verificationToken = await tokenRepository
      .findValidEmailVerificationTokens()
      .where('token_hash', tokenHash)
      .first();

    if (!verificationToken) {
      throw new Error('Invalid or expired verification token');
    }

    // Mark token as used
    await tokenRepository.markEmailVerificationTokenAsUsed(verificationToken.id);

    // Update user verification status
    const updatedUser = await userRepository.updateUser(verificationToken.user_id, {
      is_verified: true,
      email_verified_at: new Date(),
      updated_at: new Date(),
    });

    return {
      message: 'Email verified successfully',
      user: sanitizeUserForResponse(updatedUser),
    };
  } catch (error) {
    throw new Error(`Email verification failed: ${error.message}`);
  }
}

// ========== FORGOT PASSWORD ==========

/**
 * Send forgot password email
 */
export async function forgotPassword(email) {
  try {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists or not
      return {
        message: 'If the email exists, a password reset link has been sent',
      };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Create password reset token record
    await tokenRepository.createPasswordResetToken({
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour
    });

    // TODO: Send email via email service
    // await emailService.sendPasswordResetEmail(user.email, resetToken);

    return {
      message: 'If the email exists, a password reset link has been sent',
      reset_token: resetToken, // For testing only
    };
  } catch (error) {
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
}

/**
 * Reset password with token
 */
export async function resetPassword(token, newPassword) {
  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find valid reset token
    const resetToken = await tokenRepository
      .findValidPasswordResetTokens()
      .where('token_hash', tokenHash)
      .first();

    if (!resetToken) {
      throw new Error('Invalid or expired reset token');
    }

    // Mark token as used
    await tokenRepository.markPasswordResetTokenAsUsed(resetToken.id);

    // Update user password
    await userRepository.updatePassword(resetToken.user_id, newPassword);

    // Delete all user sessions to force re-login
    await userRepository.deleteAllUserSessions(resetToken.user_id);

    return {
      message: 'Password reset successfully',
    };
  } catch (error) {
    throw new Error(`Password reset failed: ${error.message}`);
  }
}

// ========== TOKEN CLEANUP ==========

/**
 * Clean up expired tokens
 */
export async function cleanupExpiredTokens() {
  try {
    // Delete expired email verification tokens
    await tokenRepository.deleteExpiredEmailVerificationTokens();

    // Delete expired password reset tokens
    await tokenRepository.deleteExpiredPasswordResetTokens();

    return {
      message: 'Expired tokens cleaned up successfully',
    };
  } catch (error) {
    throw new Error(`Token cleanup failed: ${error.message}`);
  }
}
