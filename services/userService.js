import { getUserModel, getValidationModel } from '../models/index.js';
import {
  sendVerificationEmail,
  sendLoginVerificationEmail,
  sendPasswordResetEmail,
} from './emailService.js';
import { generateTokenPair } from '../utils/jwtUtils.js';
import * as notificationService from './notificationService.js';

export const createUser = async (userData) => {
  try {
    const User = getUserModel();
    const validation = getValidationModel();
    // Ensure tables exist before creating user
    await User.sync({ alter: true });
    await validation.sync({ alter: true });

    const newUser = await User.create(userData);
    if (newUser) {
      const newValidation = await validation.create({
        userId: newUser.userId,
        email: newUser.email,
        type: 'email_verification',
      });

      // Send verification email
      const emailResult = await sendVerificationEmail({
        email: newUser.email,
        token: newValidation.token,
        recipientName: newUser.fullname,
        expiresIn: '24 hours',
        verificationLink: `${process.env.LINK}magic-link/${newValidation.validationId}`,
      });

      // Log email status (don't fail registration if email fails)
      if (!emailResult.success) {
        console.error('Failed to send verification email:', emailResult.error);
      }

      // Log account creation
      await notificationService.logAccountCreation(newUser.userId, {
        ipAddress: userData.ipAddress,
        userAgent: userData.userAgent,
        device: userData.userDevice,
        browser: userData.userBrowser,
        os: userData.userOs,
        country: userData.userCountry,
      });

      // Return only safe, non-sensitive user data
      return {
        fullname: newUser.fullname,
        email: newUser.email,
        createdAt: newUser.createdAt,
        usertoken: newUser.userId,
        valToken: newValidation.validationId,
      };
    }
    return null;
  } catch (error) {
    // Handle unique constraint violations
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors[0]?.path || 'unknown field';
      const value = error.errors[0]?.value || 'unknown value';
      throw new Error(`A user with this ${field} (${value}) already exists`);
    }

    // Handle validation errors
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map((err) => `${err.path}: ${err.message}`).join(', ');
      throw new Error(`Validation failed: ${validationErrors}`);
    }

    // Generic error handler
    throw new Error(`Failed to create user: ${error.message}`);
  }
};

// Fetch validation token data by ID
export const getValidationData = async (id) => {
  try {
    const validation = getValidationModel();
    const validationData = await validation.findOne({
      where: { validationId: id },
    });
    return validationData;
  } catch (error) {
    throw new Error(`Failed to fetch validation data: ${error.message}`);
  }
};

// Mark user's email as verified
export const markEmailAsVerified = async (userId) => {
  try {
    const User = getUserModel();
    const user = await User.findOne({ where: { userId: userId } });

    if (!user) {
      return {
        success: false,
        reason: 'User not found',
      };
    }

    // Update isEmailVerified to true
    await user.update({ isEmailVerified: true });

    // Log email verification
    await notificationService.logEmailVerification(userId);

    return {
      success: true,
    };
  } catch (error) {
    throw new Error(`Failed to mark email as verified: ${error.message}`);
  }
};

// Verify validation token and count attempts
export const verifyValidationToken = async (validationId, providedToken) => {
  try {
    const Validation = getValidationModel();
    const validationData = await Validation.findOne({
      where: { validationId: validationId },
    });

    if (!validationData) {
      return {
        success: false,
        reason: 'Token not found',
        code: 'NOT_FOUND',
      };
    }

    // Check if expired BEFORE incrementing attempts
    if (validationData.isExpired()) {
      return {
        success: false,
        reason: 'Token has expired request for another',
        code: 'EXPIRED',
        expiredAt: validationData.expiresAt,
      };
    }

    // Check if already used
    if (validationData.isUsed()) {
      return {
        success: false,
        reason: 'Token has already been used',
        code: 'ALREADY_USED',
        usedAt: validationData.usedAt,
      };
    }

    // Check if can attempt
    if (!validationData.canAttempt()) {
      return {
        success: false,
        reason: 'Maximum attempts exceeded',
        code: 'MAX_ATTEMPTS_EXCEEDED',
        attempts: validationData.attempts,
        maxAttempts: validationData.maxAttempts,
      };
    }

    // Increment attempts counter
    await validationData.incrementAttempts();

    // Check if the provided token matches
    if (validationData.token !== providedToken) {
      return {
        success: false,
        reason: 'Invalid token code',
        code: 'INVALID_TOKEN',
        attemptsRemaining: validationData.maxAttempts - validationData.attempts,
      };
    }

    // Token is valid - mark as used
    await validationData.markAsUsed();

    return {
      success: true,
      data: {
        userId: validationData.userId,
        email: validationData.email,
        type: validationData.type,
      },
    };
  } catch (error) {
    throw new Error(`Failed to verify validation token: ${error.message}`);
  }
};

// Regenerate expired validation token
export const regenerateExpiredToken = async (validationId) => {
  try {
    const Validation = getValidationModel();

    // Find the existing expired token
    const existingToken = await Validation.findOne({
      where: { validationId: validationId },
    });

    if (!existingToken) {
      return {
        success: false,
        reason: 'Original token not found',
        code: 'NOT_FOUND',
      };
    }

    // Check if it's actually expired
    if (!existingToken.isExpired()) {
      return {
        success: false,
        reason: 'Token is still valid, cannot regenerate',
        code: 'TOKEN_NOT_EXPIRED',
        expiresAt: existingToken.expiresAt,
      };
    }

    // Check if it was already used
    if (existingToken.isUsed()) {
      return {
        success: false,
        reason: 'Token was already used, cannot regenerate',
        code: 'ALREADY_USED',
      };
    }

    // Get user details for email
    const User = getUserModel();
    const user = await User.findOne({ where: { userId: existingToken.userId } });
    // console.log('Looking for userId:', existingToken.userId);
    // console.log('Found user:', user ? user.email : 'NOT FOUND');

    if (!user) {
      return {
        success: false,
        reason: 'User not found',
        code: 'USER_NOT_FOUND',
      };
    }

    // Delete the old expired token before creating a new one
    await existingToken.destroy();

    // Create a new validation token with the same details
    // Use minimal metadata to avoid "packet bigger than max_allowed_packet" error
    const newToken = await Validation.create({
      userId: existingToken.userId,
      email: existingToken.email,
      type: existingToken.type,
      newEmail: existingToken.newEmail,
      phoneNumber: existingToken.phoneNumber,
      ipAddress: existingToken.ipAddress,
      userAgent: existingToken.userAgent,
      metadata: {
        regeneratedFrom: existingToken.validationId,
        regeneratedAt: new Date().toISOString(),
      },
    });

    // Send appropriate email based on token type (same format as registration)
    if (existingToken.type === 'email_verification') {
      await sendVerificationEmail({
        email: newToken.email,
        token: newToken.token,
        recipientName: user.fullname,
        expiresIn: '24 hours',
        verificationLink: `${process.env.LINK}magic-link/${newToken.validationId}`,
      });
    } else if (existingToken.type === 'login_verification') {
      await sendLoginVerificationEmail({
        email: newToken.email,
        token: newToken.token,
        recipientName: user.fullname,
        expiresIn: '15 minutes',
        validationId: newToken.validationId,
        deviceInfo: existingToken.metadata,
      });
    } else if (existingToken.type === 'password_reset') {
      await sendPasswordResetEmail({
        email: newToken.email,
        token: newToken.token,
        recipientName: user.fullname,
        expiresIn: '1 hour',
        validationId: newToken.validationId,
      });
    }

    return {
      success: true,
      message: 'Verification email has been resent successfully',
      data: {
        validationId: newToken.validationId,
        token: newToken.token,
        expiresAt: newToken.expiresAt,
        type: newToken.type,
      },
    };
  } catch (error) {
    throw new Error(`Failed to regenerate token: ${error.message}`);
  }
};

// Resend verification email by email address only (no token ID required)
export const resendVerificationByEmail = async (email) => {
  try {
    const User = getUserModel();
    const Validation = getValidationModel();

    // Find user by email
    const user = await User.findOne({ where: { email: email } });

    if (!user) {
      return {
        success: false,
        reason: 'No account found with this email address',
        code: 'USER_NOT_FOUND',
      };
    }

    // Find the most recent email_verification token for this user
    const existingToken = await Validation.findOne({
      where: {
        email: email,
        type: 'email_verification',
      },
      order: [['createdAt', 'DESC']],
    });

    // If there's an existing token that's not expired and not used, return error
    if (existingToken && !existingToken.isExpired() && !existingToken.isUsed()) {
      return {
        success: false,
        reason:
          'A verification email was already sent. Please check your inbox or wait for it to expire.',
        code: 'TOKEN_STILL_VALID',
        expiresAt: existingToken.expiresAt,
      };
    }

    // Delete old tokens for this user and type
    await Validation.destroy({
      where: {
        email: email,
        type: 'email_verification',
      },
    });

    // Create a new validation token
    const newToken = await Validation.create({
      userId: user.userId,
      email: user.email,
      type: 'email_verification',
    });

    // Send verification email
    await sendVerificationEmail({
      email: newToken.email,
      token: newToken.token,
      recipientName: user.fullname,
      expiresIn: '24 hours',
      verificationLink: `${process.env.LINK}magic-link/${newToken.validationId}`,
    });

    return {
      success: true,
      message: 'Verification email has been sent successfully',
      data: {
        validationId: newToken.validationId,
        expiresAt: newToken.expiresAt,
      },
    };
  } catch (error) {
    throw new Error(`Failed to resend verification: ${error.message}`);
  }
};

// Login user with email and password - creates/reuses validation token and sends email
export const loginUser = async (email, password, clientInfo = {}) => {
  try {
    const User = getUserModel();
    const Validation = getValidationModel();

    // Find user by email
    const user = await User.findOne({
      where: { email: email },
    });

    if (!user) {
      return {
        success: false,
        reason: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      };
    }

    // Verify password using bcrypt authenticate method
    const isPasswordValid = await user.authenticate(password);

    if (!isPasswordValid) {
      // Log failed login attempt
      await notificationService.logLogin(user.userId, false, clientInfo, 'Invalid password');

      return {
        success: false,
        reason: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      };
    }

    // Delete ALL existing login_verification tokens for this user
    // This ensures only the latest login attempt is valid
    await Validation.destroy({
      where: {
        userId: user.userId,
        type: 'login_verification',
      },
    });

    // Create new login verification token
    const validationToken = await Validation.create({
      userId: user.userId,
      email: user.email,
      type: 'login_verification',
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      metadata: {
        browser: clientInfo.browser,
        os: clientInfo.os,
        device: clientInfo.device,
        country: clientInfo.country,
      },
    });

    // Send login verification email (DO NOT include token, IP, device, or location - security risk!)
    const emailResult = await sendLoginVerificationEmail({
      email: user.email,
      recipientName: user.fullname,
      expiresIn: '15 minutes',
      verificationLink: `${process.env.LINK}magic-login/${validationToken.validationId}`,
    });

    // Log email status
    if (!emailResult.success) {
      console.error('Failed to send login verification email:', emailResult.error);
    }

    // Return validation info (not the actual token or JWT yet!)
    return {
      success: true,
      message: 'Login verification email sent',
      data: {
        validationId: validationToken.validationId,
        email: user.email,
        expiresAt: validationToken.expiresAt,
        emailSent: emailResult.success,
      },
    };
  } catch (error) {
    throw new Error(`Failed to login user: ${error.message}`);
  }
};

// Verify login magic link and auto-login (no code required)
export const verifyLoginLink = async (validationId) => {
  try {
    const User = getUserModel();
    const Validation = getValidationModel();

    const validationData = await Validation.findOne({
      where: { validationId: validationId },
    });

    if (!validationData) {
      return {
        success: false,
        reason: 'Validation link not found',
        code: 'NOT_FOUND',
      };
    }

    // Check if it's a login_verification type
    if (validationData.type !== 'login_verification') {
      return {
        success: false,
        reason: 'Invalid validation type',
        code: 'INVALID_TYPE',
      };
    }

    // Check if expired
    if (validationData.isExpired()) {
      return {
        success: false,
        reason: 'Login link has expired',
        code: 'EXPIRED',
        expiredAt: validationData.expiresAt,
      };
    }

    // Check if already used
    if (validationData.isUsed()) {
      return {
        success: false,
        reason: 'Login link has already been used',
        code: 'ALREADY_USED',
        usedAt: validationData.usedAt,
      };
    }

    // Get user data
    const user = await User.findOne({
      where: { userId: validationData.userId },
    });

    if (!user) {
      return {
        success: false,
        reason: 'User not found',
        code: 'USER_NOT_FOUND',
      };
    }

    // Mark validation link as used
    await validationData.markAsUsed();

    // Log successful login
    await notificationService.logLogin(user.userId, true, {
      ipAddress: validationData.ipAddress,
      userAgent: validationData.userAgent,
      device: validationData.metadata?.device,
      browser: validationData.metadata?.browser,
      os: validationData.metadata?.os,
      country: validationData.metadata?.country,
    });

    // Generate JWT token pair
    const tokens = generateTokenPair({
      userId: user.userId,
      email: user.email,
      fullname: user.fullname,
    });

    return {
      success: true,
      message: 'Login successful',
      data: {
        user: {
          userId: user.userId,
          email: user.email,
          fullname: user.fullname,
          createdAt: user.createdAt,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };
  } catch (error) {
    throw new Error(`Failed to verify login link: ${error.message}`);
  }
};

// Get current authenticated user by userId
export const getCurrentUser = async (userId) => {
  try {
    const User = getUserModel();

    const user = await User.findOne({
      where: { userId: userId },
      attributes: ['userId', 'fullname', 'email', 'createdAt'], // Don't return password
    });

    if (!user) {
      return null;
    }

    return {
      userId: user.userId,
      fullname: user.fullname,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  } catch (error) {
    throw new Error(`Failed to fetch user: ${error.message}`);
  }
};

// Forgot password - send reset link via email
export const forgotPassword = async (email) => {
  try {
    const User = getUserModel();
    const Validation = getValidationModel();

    // Find user by email
    const user = await User.findOne({
      where: { email: email },
    });

    // Don't reveal if email exists (security best practice)
    if (!user) {
      return {
        success: false,
        message: 'If an account with that email exists, a password reset link has been sent',
      };
    }

    // Check for existing password_reset token
    const existingToken = await Validation.findOne({
      where: {
        userId: user.userId,
        type: 'password_reset',
        usedAt: null,
      },
      order: [['createdAt', 'DESC']],
    });

    let validationToken;

    // If token exists and not expired, reuse it
    if (existingToken && !existingToken.isExpired()) {
      validationToken = existingToken;
    }
    // Create new token
    else {
      validationToken = await Validation.create({
        userId: user.userId,
        email: user.email,
        type: 'password_reset',
      });
    }

    // Send password reset email (NO CODE - just magic link like signup/login)
    const emailResult = await sendPasswordResetEmail({
      email: user.email,
      recipientName: user.fullname,
      expiresIn: '1 hour',
      resetLink: `${process.env.LINK}reset-password/${validationToken.token}`,
    });

    // Log email status
    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error);
    }

    return {
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent',
      data: {
        emailSent: emailResult.success,
      },
    };
  } catch (error) {
    throw new Error(`Failed to process forgot password: ${error.message}`);
  }
};

// Verify password reset link (when user clicks the magic link)
export const verifyPasswordResetLink = async (validationId) => {
  try {
    const Validation = getValidationModel();

    const validationData = await Validation.findOne({
      where: { token: validationId },
    });

    if (!validationData) {
      return {
        success: false,
        reason: 'Reset link not found',
        code: 'NOT_FOUND',
      };
    }

    // Check if it's a password_reset type
    if (validationData.type !== 'password_reset') {
      return {
        success: false,
        reason: 'Invalid reset link type',
        code: 'INVALID_TYPE',
      };
    }

    // Check if expired
    if (validationData.isExpired()) {
      return {
        success: false,
        reason: 'Reset link has expired',
        code: 'EXPIRED',
        expiredAt: validationData.expiresAt,
      };
    }

    // Check if already used
    if (validationData.isUsed()) {
      return {
        success: false,
        reason: 'Reset link has already been used',
        code: 'ALREADY_USED',
        usedAt: validationData.usedAt,
      };
    }

    // Link is valid
    return {
      success: true,
      data: {
        userid: validationData.userId,
        validationId: validationData.validationId,
        expiresAt: validationData.expiresAt,
      },
    };
  } catch (error) {
    throw new Error(`Failed to verify reset link: ${error.message}`);
  }
};

// Reset password with new password
export const resetPassword = async (Id, newPassword) => {
  try {
    const User = getUserModel();

    // Get user
    const user = await User.findOne({
      where: { userId: Id },
    });

    if (!user) {
      return {
        success: false,
        reason: 'User not found',
        code: 'USER_NOT_FOUND',
      };
    }

    // Update password (bcrypt hook will hash it automatically)
    await user.update({
      password: newPassword,
    });

    // Log password change
    await notificationService.logPasswordChange(user.userId, {
      ipAddress: null, // Reset via email link, IP not available
    });

    return {
      success: true,
      message: 'Password has been reset successfully',
    };
  } catch (error) {
    throw new Error(`Failed to reset password: ${error.message}`);
  }
};

// Refresh access token using refresh token
export const refreshAccessToken = async (refreshToken) => {
  try {
    const { verifyRefreshToken } = await import('../utils/jwtUtils.js');

    // Verify the refresh token
    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded || !decoded.userId) {
      return {
        success: false,
        reason: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN',
      };
    }

    // Get user data
    const User = getUserModel();
    const user = await User.findOne({
      where: { userId: decoded.userId },
      attributes: ['userId', 'fullname', 'email'],
    });

    if (!user) {
      return {
        success: false,
        reason: 'User not found',
        code: 'USER_NOT_FOUND',
      };
    }

    // Generate new token pair
    const tokens = generateTokenPair({
      userId: user.userId,
    });

    return {
      success: true,
      data: tokens,
    };
  } catch (error) {
    // Handle token verification errors
    return {
      success: false,
      reason: error.message || 'Failed to refresh token',
      code: 'REFRESH_TOKEN_ERROR',
    };
  }
};
