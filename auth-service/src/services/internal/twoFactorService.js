import { getUserRepository } from '../../repositories/repositoryFactory.js';
import { sanitizeUserForResponse } from '../../utils/sanitizers.js';
import crypto from 'crypto';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

// Get user repository instance from factory
const userRepository = getUserRepository();

// ========== TWO-FACTOR AUTHENTICATION ==========

/**
 * Enable 2FA for user
 */
export async function enable2FA(userId) {
  try {
    const user = await userRepository.findByPublicId(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.two_factor_enabled) {
      throw new Error('2FA is already enabled');
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `BookingSystem (${user.email})`,
      issuer: 'BookingSystem',
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    // Store secret temporarily (not enabled yet)
    await userRepository.updateUser(user.id, {
      two_factor_secret: secret.base32,
      updated_at: new Date(),
    });

    return {
      secret: secret.base32,
      qr_code_url: qrCodeUrl,
      otpauth_url: secret.otpauth_url,
      message: '2FA setup initiated. Verify with a code to enable.',
    };
  } catch (error) {
    throw new Error(`Failed to enable 2FA: ${error.message}`);
  }
}

/**
 * Verify and enable 2FA
 */
export async function verifyAndEnable2FA(userId, token) {
  try {
    const user = await userRepository.findByPublicId(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.two_factor_secret) {
      throw new Error('2FA setup not initiated');
    }

    if (user.two_factor_enabled) {
      throw new Error('2FA is already enabled');
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: token,
      window: 2, // Allow 2 time steps for clock skew
    });

    if (!verified) {
      throw new Error('Invalid 2FA code');
    }

    // Enable 2FA
    await userRepository.updateUser(user.id, {
      two_factor_enabled: true,
      updated_at: new Date(),
    });

    return {
      message: '2FA enabled successfully',
    };
  } catch (error) {
    throw new Error(`Failed to verify and enable 2FA: ${error.message}`);
  }
}

/**
 * Disable 2FA
 */
export async function disable2FA(userId, token) {
  try {
    const user = await userRepository.findByPublicId(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.two_factor_enabled) {
      throw new Error('2FA is not enabled');
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: token,
      window: 2,
    });

    if (!verified) {
      throw new Error('Invalid 2FA code');
    }

    // Disable 2FA
    await userRepository.updateUser(user.id, {
      two_factor_enabled: false,
      two_factor_secret: null,
      updated_at: new Date(),
    });

    return {
      message: '2FA disabled successfully',
    };
  } catch (error) {
    throw new Error(`Failed to disable 2FA: ${error.message}`);
  }
}

/**
 * Verify 2FA code
 */
export async function verify2FA(userId, token) {
  try {
    const user = await userRepository.findByPublicId(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.two_factor_enabled) {
      throw new Error('2FA is not enabled');
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: token,
      window: 2,
    });

    if (!verified) {
      throw new Error('Invalid 2FA code');
    }

    return {
      message: '2FA verification successful',
      user: sanitizeUserForResponse(user),
    };
  } catch (error) {
    throw new Error(`2FA verification failed: ${error.message}`);
  }
}

/**
 * Generate backup codes
 */
export async function generateBackupCodes(userId) {
  try {
    const user = await userRepository.findByPublicId(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.two_factor_enabled) {
      throw new Error('2FA must be enabled to generate backup codes');
    }

    // Generate 10 backup codes
    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      backupCodes.push(code);
    }

    // Hash and store backup codes
    const hashedCodes = backupCodes.map((code) =>
      crypto.createHash('sha256').update(code).digest('hex')
    );

    await userRepository.updateUser(user.id, {
      two_factor_backup_codes: JSON.stringify(hashedCodes),
      updated_at: new Date(),
    });

    return {
      backup_codes: backupCodes,
      message: 'Backup codes generated successfully. Store them securely.',
    };
  } catch (error) {
    throw new Error(`Failed to generate backup codes: ${error.message}`);
  }
}

/**
 * Verify backup code
 */
export async function verifyBackupCode(userId, backupCode) {
  try {
    const user = await userRepository.findByPublicId(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.two_factor_enabled) {
      throw new Error('2FA is not enabled');
    }

    if (!user.two_factor_backup_codes) {
      throw new Error('No backup codes available');
    }

    // Hash the provided code
    const hashedCode = crypto.createHash('sha256').update(backupCode).digest('hex');

    // Check if code exists
    const backupCodes = JSON.parse(user.two_factor_backup_codes);
    const codeIndex = backupCodes.indexOf(hashedCode);

    if (codeIndex === -1) {
      throw new Error('Invalid backup code');
    }

    // Remove used backup code
    backupCodes.splice(codeIndex, 1);
    await userRepository.updateUser(user.id, {
      two_factor_backup_codes: JSON.stringify(backupCodes),
      updated_at: new Date(),
    });

    return {
      message: 'Backup code verified successfully',
      remaining_codes: backupCodes.length,
    };
  } catch (error) {
    throw new Error(`Backup code verification failed: ${error.message}`);
  }
}

/**
 * Get 2FA status
 */
export async function get2FAStatus(userId) {
  try {
    const user = await userRepository.findByPublicId(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      enabled: user.two_factor_enabled || false,
      has_backup_codes: !!user.two_factor_backup_codes,
      backup_codes_count: user.two_factor_backup_codes
        ? JSON.parse(user.two_factor_backup_codes).length
        : 0,
    };
  } catch (error) {
    throw new Error(`Failed to get 2FA status: ${error.message}`);
  }
}
