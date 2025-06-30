import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Configuration constants
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

/**
 * Token utility functions
 */

/**
 * Generate access token
 */
export function generateAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Generate refresh token with random factor to ensure uniqueness
 */
export function generateRefreshToken(userId) {
  // Add random factor to ensure uniqueness
  const randomFactor = crypto.randomBytes(32).toString('hex');
  const timestamp = Date.now();

  return jwt.sign(
    {
      userId,
      type: 'refresh',
      random: randomFactor,
      timestamp: timestamp,
    },
    JWT_SECRET,
    {
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    }
  );
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokens(userId, additionalPayload = {}) {
  const payload = {
    userId,
    ...additionalPayload,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(userId);

  return { accessToken, refreshToken };
}

/**
 * Verify access token
 */
export function verifyAccessToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Ensure it's not a refresh token
    if (decoded.type === 'refresh') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    throw new Error(`Invalid access token: ${error.message}`);
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    throw new Error(`Invalid refresh token: ${error.message}`);
  }
}

/**
 * Decode token without verification (for debugging)
 */
export function decodeToken(token) {
  try {
    return jwt.decode(token);
  } catch (error) {
    throw new Error(`Failed to decode token: ${error.message}`);
  }
}

/**
 * Get token expiration time
 */
export function getTokenExpiration(token) {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return null;
    }

    return new Date(decoded.exp * 1000);
  } catch (error) {
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token) {
  const expiration = getTokenExpiration(token);
  if (!expiration) {
    return true;
  }

  return new Date() > expiration;
}

/**
 * Get token payload without verification
 */
export function getTokenPayload(token) {
  try {
    const decoded = jwt.decode(token);
    if (!decoded) {
      throw new Error('Invalid token format');
    }

    return decoded;
  } catch (error) {
    throw new Error(`Failed to get token payload: ${error.message}`);
  }
}

/**
 * Extract user ID from token
 */
export function extractUserIdFromToken(token) {
  try {
    const payload = getTokenPayload(token);
    return payload.userId;
  } catch (error) {
    throw new Error(`Failed to extract user ID: ${error.message}`);
  }
}

/**
 * Create token with custom expiration
 */
export function createTokenWithExpiration(payload, expiresIn) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Validate token format (without verification)
 */
export function validateTokenFormat(token) {
  if (!token || typeof token !== 'string') {
    return false;
  }

  const parts = token.split('.');
  return parts.length === 3;
}
