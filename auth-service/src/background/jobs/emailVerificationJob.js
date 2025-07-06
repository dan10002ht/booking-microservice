import Redis from 'ioredis';
import logger from '../../utils/logger.js';
import { grpcClients } from '../../grpc/clients.js';

// Initialize Redis client for PIN code storage
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  db: process.env.REDIS_PIN_DB || 7, // Use separate DB for PIN codes
});

/**
 * Email Verification Job Handler
 *
 * This job handles:
 * 1. Storing PIN code in Redis with TTL
 * 2. Sending verification email via gRPC to email-worker
 * 3. Managing PIN code lifecycle
 */

export async function handleEmailVerificationJob(jobData) {
  const { userId, userEmail, userName, isResend = false } = jobData;

  try {
    logger.info(`Processing email verification job for user: ${userId}`);

    // 1. Generate PIN code (6 digits)
    const pinCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. Store PIN code in Redis with TTL (15 minutes)
    const redisKey = `email_verification:${userId}`;
    const ttlSeconds = 15 * 60; // 15 minutes

    await redis.setex(redisKey, ttlSeconds, pinCode);
    logger.info(`PIN code stored in Redis for user: ${userId}, TTL: ${ttlSeconds}s`);

    // 3. Send verification email via gRPC to email-worker
    await sendVerificationEmailViaGrpc({
      userId,
      userEmail,
      userName,
      pinCode,
      isResend,
    });

    logger.info(`Email verification job completed for user: ${userId}`);

    return {
      success: true,
      message: 'Email verification processed successfully',
      userId,
      pinCode, // For testing only
    };
  } catch (error) {
    logger.error(`Email verification job failed for user ${userId}:`, error);

    // Remove PIN code from Redis if email sending failed
    try {
      await redis.del(`email_verification:${userId}`);
    } catch (redisError) {
      logger.error(`Failed to remove PIN code from Redis:`, redisError);
    }

    throw error;
  }
}

/**
 * Send verification email via gRPC to email-worker
 */
async function sendVerificationEmailViaGrpc(data) {
  try {
    // Prepare verification email data
    const verificationData = {
      user_id: data.userId,
      user_email: data.userEmail,
      user_name: data.userName,
      pin_code: data.pinCode,
      is_resend: data.isResend,
      expiry_minutes: 15,
      verification_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?user_id=${data.userId}&code=${data.pinCode}`,
    };

    const response =
      await grpcClients.emailVerificationService.sendVerificationEmail(verificationData);
    logger.info(`Verification email sent successfully to ${data.userEmail}`, response);
  } catch (error) {
    logger.error('Failed to send verification email via gRPC:', error);
    throw new Error(`Email sending failed: ${error.message}`);
  }
}

/**
 * Validate PIN code from Redis
 */
export async function validatePinCodeFromRedis(userId, inputPinCode) {
  try {
    const redisKey = `email_verification:${userId}`;
    const storedPinCode = await redis.get(redisKey);

    if (!storedPinCode) {
      return {
        valid: false,
        message: 'PIN code not found or expired',
        expired: true,
      };
    }

    if (storedPinCode !== inputPinCode) {
      return {
        valid: false,
        message: 'Invalid PIN code',
        expired: false,
      };
    }

    // PIN code is valid, remove it from Redis
    await redis.del(redisKey);

    return {
      valid: true,
      message: 'PIN code is valid',
      expired: false,
    };
  } catch (error) {
    logger.error(`Failed to validate PIN code for user ${userId}:`, error);
    return {
      valid: false,
      message: 'Failed to validate PIN code',
      expired: false,
    };
  }
}

/**
 * Clean up expired PIN codes (optional cleanup job)
 */
export async function cleanupExpiredPinCodes() {
  try {
    // Redis automatically handles TTL, but we can add additional cleanup if needed
    logger.info('PIN code cleanup completed (handled by Redis TTL)');
  } catch (error) {
    logger.error('Failed to cleanup expired PIN codes:', error);
  }
}
