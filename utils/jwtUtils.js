import jwt from 'jsonwebtoken';
import crypto from 'crypto';

/**
 * Ultra-secure JWT utility
 * Uses strong encryption and multiple layers of security
 */

// Generate a strong secret key from environment variable
// If not set, throw error (never use default in production)
const getJWTSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'JWT_SECRET must be set in environment variables and be at least 32 characters long'
    );
  }
  return secret;
};

// Generate a refresh token secret (separate from access token)
const getRefreshSecret = () => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'JWT_REFRESH_SECRET must be set in environment variables and be at least 32 characters long'
    );
  }
  return secret;
};

/**
 * Generate ultra-secure access token
 * @param {Object} payload - User data to include in token
 * @param {string} payload.userId - User's unique ID
 * @param {string} payload.email - User's email
 * @returns {string} JWT access token
 */
export const generateAccessToken = (payload) => {
  // Add security metadata
  const enhancedPayload = {
    ...payload,
    type: 'access',
    jti: crypto.randomBytes(16).toString('hex'), // JWT ID for tracking
    iat: Math.floor(Date.now() / 1000), // Issued at
  };

  return jwt.sign(enhancedPayload, getJWTSecret(), {
    algorithm: 'HS512', // Strongest HMAC algorithm
    expiresIn: '15m', // Short-lived access token
    issuer: process.env.JWT_ISSUER || 'myapi',
    audience: process.env.JWT_AUDIENCE || 'myapi-users',
    notBefore: '0s', // Valid immediately
  });
};

/**
 * Generate ultra-secure refresh token
 * @param {Object} payload - User data to include in token
 * @param {string} payload.userId - User's unique ID
 * @returns {string} JWT refresh token
 */
export const generateRefreshToken = (payload) => {
  const enhancedPayload = {
    userId: payload.userId, // Only include minimal data
    type: 'refresh',
    jti: crypto.randomBytes(16).toString('hex'),
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(enhancedPayload, getRefreshSecret(), {
    algorithm: 'HS512',
    expiresIn: '7d', // Longer-lived refresh token
    issuer: process.env.JWT_ISSUER || 'myapi',
    audience: process.env.JWT_AUDIENCE || 'myapi-users',
  });
};

/**
 * Generate both access and refresh tokens
 * @param {Object} userData - User data
 * @returns {Object} Object containing both tokens
 */
export const generateTokenPair = (userData) => {
  const payload = {
    userId: userData.userId,
    email: userData.email,
    fullname: userData.fullname,
  };

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken({ userId: userData.userId }),
    expiresIn: 900, // 15 minutes in seconds
    tokenType: 'Bearer',
  };
};

/**
 * Verify and decode access token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded payload
 * @throws {Error} If token is invalid or expired
 */
export const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, getJWTSecret(), {
      algorithms: ['HS512'],
      issuer: process.env.JWT_ISSUER || 'myapi',
      audience: process.env.JWT_AUDIENCE || 'myapi-users',
    });

    // Verify token type
    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else if (error.name === 'NotBeforeError') {
      throw new Error('Token not yet valid');
    }
    throw error;
  }
};

/**
 * Verify and decode refresh token
 * @param {string} token - JWT refresh token to verify
 * @returns {Object} Decoded payload
 * @throws {Error} If token is invalid or expired
 */
export const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, getRefreshSecret(), {
      algorithms: ['HS512'],
      issuer: process.env.JWT_ISSUER || 'myapi',
      audience: process.env.JWT_AUDIENCE || 'myapi-users',
    });

    // Verify token type
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid refresh token');
    }
    throw error;
  }
};

/**
 * Decode token without verification (for debugging only)
 * WARNING: Never use this for authentication
 * @param {string} token - JWT token
 * @returns {Object} Decoded payload
 */
export const decodeToken = (token) => {
  return jwt.decode(token);
};

/**
 * Generate a cryptographically secure random string for JWT secrets
 * Use this to generate secrets for your .env file
 * @param {number} length - Length of the secret (minimum 32)
 * @returns {string} Random hex string
 */
export const generateSecret = (length = 64) => {
  if (length < 32) {
    throw new Error('Secret must be at least 32 characters');
  }
  return crypto.randomBytes(length).toString('hex');
};

export default {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  generateSecret,
};
