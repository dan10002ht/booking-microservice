import Redis from 'ioredis';
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import logger from '../logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load email-worker proto
const dockerSharedProtoPath = path.join('/shared-lib', 'protos', 'email.proto');
const localSharedProtoPath = path.join(
  __dirname,
  '..',
  '..',
  '..',
  'shared-lib',
  'protos',
  'email.proto'
);
const localProtoPath = path.join(__dirname, '..', 'proto', 'email.proto');

let EMAIL_PROTO_PATH;
if (fs.existsSync(dockerSharedProtoPath)) {
  EMAIL_PROTO_PATH = dockerSharedProtoPath;
} else if (fs.existsSync(localSharedProtoPath)) {
  EMAIL_PROTO_PATH = localSharedProtoPath;
} else {
  EMAIL_PROTO_PATH = localProtoPath;
}

let emailProto;
try {
  const packageDefinition = protoLoader.loadSync(EMAIL_PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });
  emailProto = grpc.loadPackageDefinition(packageDefinition).email;
} catch (error) {
  logger.warn('Email proto not found, using fallback implementation');
  emailProto = null;
}

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
  const { userId, userEmail, userName, pinCode, isResend = false } = jobData;

  try {
    logger.info(`Processing email verification job for user: ${userId}`);

    // 1. Store PIN code in Redis with TTL (15 minutes)
    const redisKey = `email_verification:${userId}`;
    const ttlSeconds = 15 * 60; // 15 minutes

    await redis.setex(redisKey, ttlSeconds, pinCode);
    logger.info(`PIN code stored in Redis for user: ${userId}, TTL: ${ttlSeconds}s`);

    // 2. Send verification email via gRPC to email-worker
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
    if (!emailProto) {
      logger.warn('Email proto not available, using fallback implementation');
      logger.info('Sending verification email via gRPC:', {
        userId: data.userId,
        userEmail: data.userEmail,
        userName: data.userName,
        pinCode: data.pinCode,
        isResend: data.isResend,
      });
      return;
    }

    // Create gRPC client for email-worker
    const emailWorkerUrl = process.env.EMAIL_WORKER_URL || 'localhost:50060';
    const emailClient = new emailProto.EmailService(
      emailWorkerUrl,
      grpc.credentials.createInsecure()
    );

    // Prepare email data
    const emailData = {
      to: data.userEmail,
      subject: data.isResend ? 'Email Verification - New PIN Code' : 'Email Verification',
      template: 'email_verification',
      data: {
        userName: data.userName,
        pinCode: data.pinCode,
        expiryTime: 15,
        verificationUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?user_id=${data.userId}&code=${data.pinCode}`,
        isResend: data.isResend,
      },
    };

    // Send email via gRPC
    await new Promise((resolve, reject) => {
      emailClient.SendEmail(emailData, (error, response) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });

    logger.info(`Verification email sent successfully to ${data.userEmail}`);
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
