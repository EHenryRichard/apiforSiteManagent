/**
 * User Routes
 *
 * This file defines all user-related API endpoints.
 * Routes follow the pattern: /api/users/*
 *
 * Flow: Route → Controller → Service → Model → Database
 *
 * @module routes/userRoute
 */

import express from 'express';
import * as userController from '../controllers/userController.js';
import * as notificationController from '../controllers/notificationController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// ========================================
// REGISTRATION ENDPOINTS
// ========================================

/**
 * POST /api/users/saveUser
 *
 * Register a new user account
 * - Creates user in database
 * - Generates email verification token
 * - Sends verification email with magic link
 * - Captures device info (IP, browser, OS, country)
 *
 * Request Body:
 * {
 *   "fullname": "John Doe",
 *   "email": "john@example.com",
 *   "password": "SecurePass123!",
 *   "phone": "+1234567890"
 * }
 *
 * Response: User data + validation token ID
 */
router.post('/saveUser', userController.saveUser);

/**
 * GET /api/users/magic_link/:id
 *
 * Verify email magic link status
 * - Checks if verification token is valid
 * - Returns token status (valid, expired, or used)
 * - Does NOT mark token as used (just checks status)
 *
 * URL Params:
 *   id - Validation token ID from email
 *
 * Response: Email, token type, expiration time
 */
router.get('/magic_link/:id', userController.fetchvalidationToken);

/**
 * POST /api/users/resend-verification/:id
 *
 * Resend verification email when expired
 * - Regenerates a new verification token
 * - Sends new magic link email
 * - Only works if token is expired (not used)
 *
 * URL Params:
 *   id - Original validation token ID
 *
 * Response: New validation ID
 */
router.post('/resend-verification/:id', userController.regenerateToken);

/**
 * POST /api/users/resend-verification
 *
 * Resend verification email by email address only
 * - No token ID required
 * - Deletes old tokens and creates fresh verification token
 * - Sends new magic link email
 * - Prevents spam by checking if valid token already exists
 *
 * Request Body:
 * {
 *   "email": "john@example.com"
 * }
 *
 * Response: New validation ID and expiration
 */
router.post('/resend-verification', userController.resendVerificationEmail);

// ========================================
// LOGIN ENDPOINTS
// ========================================

/**
 * POST /api/users/login
 *
 * Initiate login process
 * - Validates email and password
 * - Creates login verification token (expires in 15 min)
 * - Sends email with magic link + 6-digit code
 * - Includes device and location info in email
 *
 * Request Body:
 * {
 *   "email": "john@example.com",
 *   "password": "SecurePass123!"
 * }
 *
 * Response: Validation ID for next step
 */
router.post('/login', userController.loginUser);

/**
 * GET /api/users/login-verify/:id
 *
 * Auto-login via magic link
 * - Verifies the login validation token
 * - Marks token as used (one-time use)
 * - Generates JWT access + refresh tokens
 * - Returns user data and tokens
 *
 * URL Params:
 *   id - Validation token ID from email
 *
 * Response: User data + JWT tokens (access + refresh)
 */
router.get('/login-verify/:id', userController.fetchLoginValidationToken);

/**
 * POST /api/users/refresh-token
 *
 * Refresh expired access token
 * - Validates refresh token (7 day expiry)
 * - Generates NEW access token (15 min expiry)
 * - Generates NEW refresh token (token rotation for security)
 * - Old refresh token becomes invalid
 *
 * Request Body:
 * {
 *   "refreshToken": "eyJhbGciOiJIUzUxMi..."
 * }
 *
 * Response: New access + refresh tokens
 *
 * IMPORTANT: Client must update BOTH tokens after this call
 */
router.post('/refresh-token', userController.refreshAccessToken);

/**
 * POST /api/users/logout
 *
 * Logout current user
 * - REQUIRES authentication
 * - Clears the refresh token HTTP-only cookie
 * - Logs logout event in activity log
 * - Client should also discard the access token from memory
 * - User will need to login again to get new tokens
 *
 * Response: Success message
 */
router.post('/logout', authenticate, userController.logoutUser);

// ========================================
// PASSWORD RESET ENDPOINTS
// ========================================

/**
 * POST /api/users/forgot-password
 *
 * Request password reset link
 * - Validates email exists (doesn't reveal if user exists)
 * - Creates password reset token (expires in 1 hour)
 * - Sends email with magic link
 * - Always returns success (prevents email enumeration)
 *
 * Request Body:
 * {
 *   "email": "john@example.com"
 * }
 *
 * Response: Generic success message
 */
router.post('/forgot-password', userController.forgotPassword);

/**
 * GET /api/users/reset-password/:id
 *
 * Verify password reset link
 * - Checks if reset token is valid
 * - Returns token status (valid, expired, or used)
 * - Does NOT reset password yet (just verifies link)
 *
 * URL Params:
 *   id - Validation token ID from email
 *
 * Response: Email + validation ID for next step
 */
router.get('/reset-password/:id', userController.verifyPasswordResetLink);

/**
 * POST /api/users/reset-password/:id
 *
 * Submit new password
 * - Validates reset token again
 * - Updates user password (auto-hashed with bcrypt)
 * - Marks token as used (one-time use)
 * - User can login with new password
 *
 * URL Params:
 *   id - Validation token ID from email
 *
 * Request Body:
 * {
 *   "password": "NewSecurePass456!"
 * }
 *
 * Response: Success message
 */
router.post('/reset-password', userController.resetPassword);

// ========================================
// PROTECTED ROUTES (Require Authentication)
// ========================================

/**
 * GET /api/users/
 *
 * Get current authenticated user profile
 * - REQUIRES valid JWT access token in Authorization header
 * - Token must be prefixed with "Bearer "
 * - Returns user data (excludes password)
 *
 * Headers:
 *   Authorization: Bearer <accessToken>
 *
 * Response: User profile (userId, fullname, email, createdAt, updatedAt)
 *
 * Errors:
 *   401 - No token, invalid token, or expired token
 *   404 - User not found
 */
router.get('/', authenticate, userController.getUser);

// ========================================
// NOTIFICATION/ACTIVITY LOG ENDPOINTS
// ========================================

/**
 * GET /api/users/notifications
 *
 * Get all notifications for authenticated user
 * - REQUIRES authentication
 * - Returns paginated list of notifications
 * - Supports filtering by read status and type
 *
 * Query Params:
 *   ?limit=50           - Number of notifications to return
 *   ?offset=0           - Pagination offset
 *   ?unreadOnly=true    - Only return unread notifications
 *   ?type=login_success - Filter by notification type
 *
 * Response: List of notifications with pagination metadata
 */
router.get('/notifications', authenticate, notificationController.getNotifications);

/**
 * GET /api/users/notifications/stats
 *
 * Get notification statistics
 * - REQUIRES authentication
 * - Returns counts by type, severity, read status
 *
 * Response: Statistics object
 */
router.get('/notifications/stats', authenticate, notificationController.getNotificationStats);

/**
 * GET /api/users/notifications/:id
 *
 * Get a single notification by ID
 * - REQUIRES authentication
 * - User can only access their own notifications
 *
 * URL Params:
 *   id - Notification ID
 *
 * Response: Notification details
 */
router.get('/notifications/:id', authenticate, notificationController.getNotification);

/**
 * PATCH /api/users/notifications/read
 *
 * Mark notification(s) as read
 * - REQUIRES authentication
 *
 * Request Body:
 * {
 *   "notificationIds": 123          // Single ID
 *   // OR
 *   "notificationIds": [1, 2, 3]   // Multiple IDs
 *   // OR
 *   "notificationIds": "all"        // Mark all as read
 * }
 *
 * Response: Number of notifications marked as read
 */
router.patch('/notifications/read', authenticate, notificationController.markNotificationsAsRead);

/**
 * DELETE /api/users/notifications
 *
 * Delete notification(s)
 * - REQUIRES authentication
 *
 * Request Body:
 * {
 *   "notificationIds": 123          // Single ID
 *   // OR
 *   "notificationIds": [1, 2, 3]   // Multiple IDs
 *   // OR
 *   "notificationIds": "all"        // Delete all
 * }
 *
 * Response: Number of notifications deleted
 */
router.delete('/notifications', authenticate, notificationController.deleteNotifications);

export default router;
