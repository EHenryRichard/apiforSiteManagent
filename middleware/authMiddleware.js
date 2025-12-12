/**
 * Authentication Middleware
 *
 * This middleware protects routes by verifying JWT access tokens.
 * It extracts the token from the Authorization header, validates it,
 * and attaches user information to the request object.
 *
 * Usage:
 *   router.get('/protected', authenticate, controller.action);
 *
 * @module middleware/authMiddleware
 */

import { verifyAccessToken } from '../utils/jwtUtils.js';

/**
 * Middleware to authenticate requests using Bearer token
 *
 * Flow:
 * 1. Extract Authorization header
 * 2. Validate Bearer token format
 * 3. Verify JWT signature and expiration
 * 4. Attach user data to req.user
 * 5. Call next() to proceed to route handler
 *
 * Expected Header Format:
 *   Authorization: Bearer <access_token>
 *
 * On Success:
 *   - Adds req.user object with userId
 *   - Calls next() to continue to route handler
 *
 * On Failure:
 *   - Returns 401 Unauthorized with error details
 *   - Does NOT call next() (request stops here)
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 *
 * @returns {void} Calls next() on success, or sends error response
 *
 * @example
 * // In routes file
 * import { authenticate } from '../middleware/authMiddleware.js';
 * router.get('/profile', authenticate, getProfile);
 *
 * // In controller (req.user is now available)
 * export const getProfile = (req, res) => {
 *   const userId = req.user.userId;
 *   // ... fetch user data
 * };
 */
export const authenticate = async (req, res, next) => {
  try {
    // ========================================
    // Step 1: Extract Authorization Header
    // ========================================
    const authHeader = req.headers.authorization;

    // Check if Authorization header exists
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'No authorization token provided',
        code: 'NO_TOKEN',
      });
    }

    // ========================================
    // Step 2: Validate Bearer Token Format
    // ========================================
    // Expected format: "Bearer <token>"
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Invalid authorization format. Use: Bearer <token>',
        code: 'INVALID_FORMAT',
      });
    }

    // ========================================
    // Step 3: Extract Token
    // ========================================
    // Remove 'Bearer ' prefix (7 characters)
    const token = authHeader.substring(7);

    // Check if token is not empty after prefix removal
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token is empty',
        code: 'EMPTY_TOKEN',
      });
    }

    // ========================================
    // Step 4: Verify JWT Token
    // ========================================
    // verifyAccessToken checks:
    // - Signature validity (HS512 algorithm)
    // - Token expiration (15 minute TTL)
    // - Token type (must be 'access', not 'refresh')
    // - Issuer and audience match
    const decoded = verifyAccessToken(token);

    // Additional check (should never be null if verifyAccessToken succeeded)
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN',
      });
    }

    // ========================================
    // Step 5: Attach User Info to Request
    // ========================================
    // The decoded token contains:
    // - userId: Unique user identifier
    // - email: User's email address
    // - fullname: User's full name
    // - type: Token type ('access')
    // - jti: JWT ID for tracking
    // - iat: Issued at timestamp
    // - exp: Expiration timestamp
    //
    // We only attach userId to keep req.user minimal
    // Full user data can be fetched from database if needed
    req.user = {
      userId: decoded.userId,
    };

    // ========================================
    // Step 6: Proceed to Route Handler
    // ========================================
    // Authentication successful, continue to next middleware/controller
    next();
  } catch (error) {
    // ========================================
    // Error Handling
    // ========================================
    // Catches errors from verifyAccessToken:
    // - TokenExpiredError: Token has expired (> 15 minutes old)
    // - JsonWebTokenError: Invalid token signature or format
    // - NotBeforeError: Token used before its 'not before' time
    return res.status(401).json({
      success: false,
      error: 'Authentication failed',
      code: 'AUTH_FAILED',
      details: error.message,
    });
  }
};
