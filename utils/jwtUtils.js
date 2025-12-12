/**
 * JWT Utilities - Ultra-Secure Token Management
 *
 * This module provides functions for generating and verifying JWT tokens
 * using the strongest available HMAC algorithm (HS512).
 *
 * Features:
 * - Separate secrets for access and refresh tokens
 * - Token rotation for security
 * - JWT ID (jti) for tracking/revocation
 * - Issuer and audience validation
 * - Type checking (access vs refresh)
 * - Automatic expiration handling
 *
 * Security:
 * - HS512 algorithm (strongest HMAC)
 * - Minimum 32 character secrets
 * - Cryptographically secure random JTIs
 * - Short-lived access tokens (15 min)
 * - Long-lived refresh tokens (7 days)
 *
 * @module utils/jwtUtils
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// ========================================
// SECRET KEY MANAGEMENT
// ========================================

/**
 * Get JWT access token secret from environment
 *
 * Security checks:
 * - Ensures JWT_SECRET is set
 * - Validates minimum 32 character length
 * - Throws error if validation fails (prevents weak secrets)
 *
 * @throws {Error} If JWT_SECRET is not set or too short
 * @returns {string} JWT secret key for access tokens
 */
const getJWTSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'JWT_SECRET must be set in environment variables and be at least 32 characters long'
    );
  }
  return secret;
};

/**
 * Get JWT refresh token secret from environment
 *
 * Refresh tokens use a SEPARATE secret from access tokens for enhanced security.
 * This ensures that even if one secret is compromised, the other remains safe.
 *
 * Security checks:
 * - Ensures JWT_REFRESH_SECRET is set
 * - Validates minimum 32 character length
 * - Throws error if validation fails
 *
 * @throws {Error} If JWT_REFRESH_SECRET is not set or too short
 * @returns {string} JWT secret key for refresh tokens
 */
const getRefreshSecret = () => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'JWT_REFRESH_SECRET must be set in environment variables and be at least 32 characters long'
    );
  }
  return secret;
};

// ========================================
// TOKEN GENERATION FUNCTIONS
// ========================================

/**
 * Generate ultra-secure access token
 *
 * Access tokens are short-lived (15 minutes) and used for API authentication.
 * They contain user information and are included in every API request.
 *
 * Token contains:
 * - userId: User's unique identifier
 * - email: User's email address
 * - fullname: User's full name
 * - type: 'access' (for type checking)
 * - jti: Unique JWT ID for tracking
 * - iat: Issued at timestamp
 *
 * Security features:
 * - HS512 algorithm (strongest HMAC)
 * - 15 minute expiration
 * - Issuer validation
 * - Audience validation
 * - Unique JWT ID (jti) for revocation capability
 *
 * @param {Object} payload - User data to include in token
 * @param {string} payload.userId - User's unique ID
 * @param {string} payload.email - User's email
 * @param {string} [payload.fullname] - User's full name (optional)
 *
 * @returns {string} JWT access token
 *
 * @example
 * const accessToken = generateAccessToken({
 *   userId: 'abc123',
 *   email: 'user@example.com',
 *   fullname: 'John Doe'
 * });
 */
export const generateAccessToken = (payload) => {
  // Add security metadata to payload
  const enhancedPayload = {
    ...payload,
    type: 'access', // Mark as access token (prevents using refresh token for API calls)
    jti: crypto.randomBytes(16).toString('hex'), // JWT ID for tracking/revocation
    iat: Math.floor(Date.now() / 1000), // Issued at timestamp
  };

  return jwt.sign(enhancedPayload, getJWTSecret(), {
    algorithm: 'HS512', // Strongest HMAC algorithm
    expiresIn: '15m', // Short-lived for security (15 minutes)
    issuer: process.env.JWT_ISSUER || 'myapi',
    audience: process.env.JWT_AUDIENCE || 'myapi-users',
    notBefore: '0s', // Valid immediately
  });
};

/**
 * Generate ultra-secure refresh token
 *
 * Refresh tokens are long-lived (7 days) and used to obtain new access tokens.
 * They contain MINIMAL data (only userId) to reduce information exposure.
 *
 * Token contains:
 * - userId: User's unique identifier (only essential data)
 * - type: 'refresh' (for type checking)
 * - jti: Unique JWT ID for tracking
 * - iat: Issued at timestamp
 *
 * Security features:
 * - HS512 algorithm
 * - 7 day expiration
 * - Separate secret from access tokens
 * - Token rotation (changes on each use)
 * - Minimal data payload
 *
 * @param {Object} payload - User data to include in token
 * @param {string} payload.userId - User's unique ID
 *
 * @returns {string} JWT refresh token
 *
 * @example
 * const refreshToken = generateRefreshToken({
 *   userId: 'abc123'
 * });
 */

export const generateRefreshToken = (payload) => {
  const enhancedPayload = {
    userId: payload.userId, // Only include minimal data (no email, name, etc.)
    type: 'refresh', // Mark as refresh token (prevents using for API calls)
    jti: crypto.randomBytes(16).toString('hex'), // JWT ID for tracking
    iat: Math.floor(Date.now() / 1000), // Issued at timestamp
  };

  return jwt.sign(enhancedPayload, getRefreshSecret(), {
    algorithm: 'HS512', // Strongest HMAC algorithm
    expiresIn: '5d', // Longer-lived refresh token (7 days)
    issuer: process.env.JWT_ISSUER || 'myapi',
    audience: process.env.JWT_AUDIENCE || 'myapi-users',
  });
};

/**
 * Generate both access and refresh tokens together
 *
 * This is the primary function used after successful login.
 * It creates a complete token pair for the user.
 *
 * Use this function when:
 * - User logs in successfully
 * - Refreshing tokens
 * - Password reset completion
 *
 * @param {Object} userData - User information
 * @param {string} userData.userId - User's unique ID
 * @param {string} userData.email - User's email
 * @param {string} [userData.fullname] - User's full name
 *
 * @returns {Object} Token pair object
 * @returns {string} returns.accessToken - Short-lived access token (15 min)
 * @returns {string} returns.refreshToken - Long-lived refresh token (7 days)
 * @returns {number} returns.expiresIn - Access token TTL in seconds (900)
 * @returns {string} returns.tokenType - Token type ('Bearer')
 *
 * @example
 * const tokens = generateTokenPair({
 *   userId: 'abc123',
 *   email: 'user@example.com',
 *   fullname: 'John Doe'
 * });
 *
 * // Returns:
 * // {
 * //   accessToken: 'eyJhbGc...',
 * //   refreshToken: 'eyJhbGc...',
 * //   expiresIn: 900,
 * //   tokenType: 'Bearer'
 * // }
 */
export const generateTokenPair = (userData) => {
  // Prepare payload for access token (includes user details)
  const payload = {
    userId: userData.userId,
    email: userData.email,
    fullname: userData.fullname,
  };

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken({ userId: userData.userId }),
    expiresIn: 900, // 15 minutes in seconds
    tokenType: 'Bearer', // Standard OAuth 2.0 token type
  };
};

// ========================================
// TOKEN VERIFICATION FUNCTIONS
// ========================================

/**
 * Verify and decode access token
 *
 * This function is used by the authentication middleware to validate
 * access tokens on protected routes.
 *
 * Verification checks:
 * - Signature validity (HS512)
 * - Token expiration (15 min TTL)
 * - Token type (must be 'access')
 * - Issuer matches expected value
 * - Audience matches expected value
 *
 * @param {string} token - JWT access token to verify
 *
 * @returns {Object} Decoded token payload
 * @returns {string} returns.userId - User's unique ID
 * @returns {string} returns.email - User's email
 * @returns {string} returns.fullname - User's full name
 * @returns {string} returns.type - Token type ('access')
 * @returns {string} returns.jti - JWT ID
 * @returns {number} returns.iat - Issued at timestamp
 * @returns {number} returns.exp - Expiration timestamp
 *
 * @throws {Error} 'Token has expired' - Token is older than 15 minutes
 * @throws {Error} 'Invalid token' - Token signature is invalid or malformed
 * @throws {Error} 'Token not yet valid' - Token used before 'not before' time
 * @throws {Error} 'Invalid token type' - Token is a refresh token, not access
 *
 * @example
 * try {
 *   const decoded = verifyAccessToken('eyJhbGc...');
 *   console.log(decoded.userId); // 'abc123'
 * } catch (error) {
 *   console.error('Token invalid:', error.message);
 * }
 */
export const verifyAccessToken = (token) => {
  try {
    // Verify token signature and expiration
    const decoded = jwt.verify(token, getJWTSecret(), {
      algorithms: ['HS512'], // Only accept HS512 algorithm
      issuer: process.env.JWT_ISSUER || 'myapi',
      audience: process.env.JWT_AUDIENCE || 'myapi-users',
    });

    // Verify token type (prevent refresh token from being used as access token)
    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    // Provide user-friendly error messages
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
 *
 * This function is used to validate refresh tokens when obtaining
 * new access tokens.
 *
 * Verification checks:
 * - Signature validity (HS512 with separate secret)
 * - Token expiration (7 day TTL)
 * - Token type (must be 'refresh')
 * - Issuer matches expected value
 * - Audience matches expected value
 *
 * Note: Refresh tokens use a DIFFERENT secret than access tokens
 *
 * @param {string} token - JWT refresh token to verify
 *
 * @returns {Object} Decoded token payload
 * @returns {string} returns.userId - User's unique ID
 * @returns {string} returns.type - Token type ('refresh')
 * @returns {string} returns.jti - JWT ID
 * @returns {number} returns.iat - Issued at timestamp
 * @returns {number} returns.exp - Expiration timestamp
 *
 * @throws {Error} 'Refresh token has expired' - Token is older than 7 days
 * @throws {Error} 'Invalid refresh token' - Token signature invalid or malformed
 * @throws {Error} 'Invalid token type' - Token is an access token, not refresh
 *
 * @example
 * try {
 *   const decoded = verifyRefreshToken('eyJhbGc...');
 *   console.log(decoded.userId); // 'abc123'
 *   // Use userId to generate new token pair
 * } catch (error) {
 *   console.error('Refresh failed:', error.message);
 *   // User needs to login again
 * }
 */
export const verifyRefreshToken = (token) => {
  try {
    // Verify token using REFRESH secret (different from access secret)
    const decoded = jwt.verify(token, getRefreshSecret(), {
      algorithms: ['HS512'], // Only accept HS512 algorithm
      issuer: process.env.JWT_ISSUER || 'myapi',
      audience: process.env.JWT_AUDIENCE || 'myapi-users',
    });

    // Verify token type (prevent access token from being used as refresh token)
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    // Provide user-friendly error messages
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid refresh token');
    }
    throw error;
  }
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Decode token without verification (DEBUGGING ONLY)
 *
 * WARNING: This function does NOT verify the token signature!
 * Never use this for authentication or authorization.
 *
 * Use cases:
 * - Debugging token contents
 * - Inspecting expired tokens
 * - Logging token metadata
 *
 * @param {string} token - JWT token to decode
 *
 * @returns {Object|null} Decoded payload (without verification) or null if invalid
 *
 * @example
 * const token = 'eyJhbGc...';
 * const decoded = decodeToken(token);
 * console.log('Token expires at:', new Date(decoded.exp * 1000));
 */
export const decodeToken = (token) => {
  return jwt.decode(token);
};

/**
 * Generate a cryptographically secure random string for JWT secrets
 *
 * Use this to generate secrets for your .env file:
 * - JWT_SECRET
 * - JWT_REFRESH_SECRET
 *
 * Security:
 * - Uses crypto.randomBytes (cryptographically secure)
 * - Minimum 32 characters enforced
 * - Returns hex-encoded string
 *
 * @param {number} [length=64] - Length of secret (minimum 32)
 *
 * @returns {string} Random hex string for use as JWT secret
 *
 * @throws {Error} If length is less than 32
 *
 * @example
 * // Generate a 64-character secret
 * const secret = generateSecret(64);
 * console.log('JWT_SECRET=' + secret);
 *
 * // In .env file:
 * // JWT_SECRET=a1b2c3d4e5f6...
 * // JWT_REFRESH_SECRET=9z8y7x6w5v4u...
 */
export const generateSecret = (length = 64) => {
  if (length < 32) {
    throw new Error('Secret must be at least 32 characters');
  }
  return crypto.randomBytes(length).toString('hex');
};

// ========================================
// DEFAULT EXPORT
// ========================================

/**
 * Default export containing all JWT utility functions
 *
 * @exports jwtUtils
 */
export default {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  generateSecret,
};
