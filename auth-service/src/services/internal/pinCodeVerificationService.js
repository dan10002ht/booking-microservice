// crypto import removed as it's not used
import { getUserRepository } from '../../repositories/repositoryFactory.js';
import { sanitizeUserForResponse } from '../../utils/sanitizers.js';
import { validatePinCodeFromRedis } from '../../../background/jobs/emailVerificationJob.js';
import { getBackgroundService } from '../../../background/backgroundService.js';

const userRepository = getUserRepository();

// ========== PIN CODE VERIFICATION ==========

/**
 * Generate a random 6-digit PIN code
 */
function generatePinCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send verification email with PIN code
 */
export async function sendVerificationEmailWithPin(email) {
  try {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.is_verified) {
      throw new Error('Email is already verified');
    }

    // Generate 6-digit PIN code
    const pinCode = generatePinCode();

    // Enqueue background job to send email
    const backgroundService = getBackgroundService();
    await backgroundService.enqueueJob(
      'email_verification',
      {
        userId: user.id,
        userEmail: user.email,
        userName: user.first_name || user.email,
        pinCode,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      },
      {
        priority: 'high',
        maxRetries: 3,
        timeout: 30000, // 30 seconds
      }
    );

    // Return data for background processing
    return {
      message: 'Verification email queued successfully',
      userId: user.id,
      userEmail: user.email,
      pinCode, // For testing only - remove in production
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    };
  } catch (error) {
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
}

/**
 * Verify email with PIN code
 */
export async function verifyEmailWithPin(userId, inputPinCode) {
  try {
    // Get user
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.is_verified) {
      throw new Error('Email is already verified');
    }

    // Check PIN code from Redis
    const validationResult = await validatePinCodeFromRedis(userId, inputPinCode);

    if (!validationResult.valid) {
      throw new Error(validationResult.message);
    }

    // Update user verification status
    const updatedUser = await userRepository.updateUser(userId, {
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

/**
 * Resend verification email with new PIN code
 */
export async function resendVerificationEmail(email) {
  try {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.is_verified) {
      throw new Error('Email is already verified');
    }

    // Generate new 6-digit PIN code
    const newPinCode = generatePinCode();

    // Enqueue background job to send email
    const backgroundService = getBackgroundService();
    await backgroundService.enqueueJob(
      'email_verification',
      {
        userId: user.id,
        userEmail: user.email,
        userName: user.first_name || user.email,
        pinCode: newPinCode,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        isResend: true,
      },
      {
        priority: 'high',
        maxRetries: 3,
        timeout: 30000, // 30 seconds
      }
    );

    return {
      message: 'Verification email resent successfully',
      userId: user.id,
      userEmail: user.email,
      pinCode: newPinCode, // For testing only - remove in production
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    };
  } catch (error) {
    throw new Error(`Failed to resend verification email: ${error.message}`);
  }
}

/**
 * Validate PIN code (helper function for background service)
 */
export function validatePinCode(inputPin, storedPin, expiresAt) {
  // Check if PIN code matches
  if (inputPin !== storedPin) {
    return { valid: false, message: 'Invalid PIN code' };
  }

  // Check if PIN code has expired
  if (new Date() > new Date(expiresAt)) {
    return { valid: false, message: 'PIN code has expired' };
  }

  return { valid: true, message: 'PIN code is valid' };
}
