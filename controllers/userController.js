import * as userService from '../services/userService.js';
import * as notificationService from '../services/notificationService.js';
import getClientInfo from '../utils/deviceInfo.js';

export const saveUser = async (req, res) => {
  try {
    const data = req.body;
    const clientInfo = await getClientInfo(req);
    data.ipAddress = clientInfo.ipAddress;
    data.userAgent = clientInfo.userAgent;
    data.userBrowser = clientInfo.browser;
    data.userOs = clientInfo.os;
    data.userDevice = clientInfo.device;
    data.userCountry = clientInfo.country;

    const savedUser = await userService.createUser(data);

    res.status(201).json({
      success: true,
      message: 'registration Successful',
      data: savedUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Check token status (for magic link click)
export const fetchvalidationToken = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Validation ID is required',
      });
    }

    const validationData = await userService.getValidationData(id);

    if (!validationData) {
      return res.status(404).json({
        success: false,
        error: 'Validation token not found',
      });
    }

    // Check if expired
    if (validationData.isExpired()) {
      return res.status(410).json({
        success: false,
        error: 'Token has expired request for a new one ',
        code: 'EXPIRED',
      });
    }

    // Check if used
    if (validationData.isUsed()) {
      return res.status(410).json({
        success: false,
        error: 'Token already used',
        code: 'ALREADY_USED',
      });
    }

    // Update user's email verification status if this is email verification
    if (validationData.type === 'email_verification') {
      const result = await userService.markEmailAsVerified(validationData.userId);
      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.reason,
        });
      }
    }

    // Token is valid - delete it from database after successful verification
    await validationData.destroy();

    // Token is valid
    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: {
        email: validationData.email,
        type: validationData.type,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Verify token code (user submits 6-digit code)
export const verifyToken = async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.body;

    if (!id || !token) {
      return res.status(400).json({
        success: false,
        error: 'Validation ID and token are required',
      });
    }

    const result = await userService.verifyValidationToken(id, token);

    if (!result.success) {
      const statusCodes = {
        NOT_FOUND: 404,
        EXPIRED: 410,
        ALREADY_USED: 410,
        MAX_ATTEMPTS_EXCEEDED: 429,
        INVALID_TOKEN: 401,
      };

      return res.status(statusCodes[result.code] || 400).json({
        success: false,
        error: result.reason,
        code: result.code,
        ...(result.attemptsRemaining !== undefined && {
          attemptsRemaining: result.attemptsRemaining,
        }),
      });
    }

    res.status(200).json({
      success: true,
      message: 'Token verified successfully',
      data: result.data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Regenerate expired token (user clicks retry)
export const regenerateToken = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Validation ID is required',
      });
    }

    const result = await userService.regenerateExpiredToken(id);

    if (!result.success) {
      const statusCodes = {
        NOT_FOUND: 404,
        TOKEN_NOT_EXPIRED: 400,
        ALREADY_USED: 410,
      };

      return res.status(statusCodes[result.code] || 400).json({
        success: false,
        error: result.reason,
        code: result.code,
      });
    }

    res.status(201).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Resend verification by email only (no token ID required)
export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email address is required',
      });
    }

    const result = await userService.resendVerificationByEmail(email);

    if (!result.success) {
      const statusCodes = {
        USER_NOT_FOUND: 404,
        TOKEN_STILL_VALID: 400,
      };

      return res.status(statusCodes[result.code] || 400).json({
        success: false,
        error: result.reason,
        code: result.code,
        ...(result.expiresAt && { expiresAt: result.expiresAt }),
      });
    }

    res.status(201).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Login user - sends verification email
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    // Get client info
    const clientInfo = await getClientInfo(req);

    const result = await userService.loginUser(email, password, clientInfo);

    if (!result.success) {
      return res.status(401).json({
        success: false,
        error: result.reason,
        code: result.code,
      });
    }

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Auto-login via magic link (when user clicks the login verification link)
export const fetchLoginValidationToken = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Validation ID is required',
      });
    }

    // Verify the login link and get JWT tokens
    const result = await userService.verifyLoginLink(id);

    if (!result.success) {
      const statusCodes = {
        NOT_FOUND: 404,
        INVALID_TYPE: 400,
        EXPIRED: 410,
        ALREADY_USED: 410,
        USER_NOT_FOUND: 404,
      };

      return res.status(statusCodes[result.code] || 400).json({
        success: false,
        error: result.reason,
        code: result.code,
      });
    }

    //set refresh token as HTTP-only cookie
    res.cookie('refreshToken', result.data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', //https only in product
      sameSite: 'strict',
      maxAge: 5 * 24 * 60 * 60 * 1000, // for 5 days
    });

    // Successfully logged in - return only access token
    res.status(200).json({
      success: true,
      message: result.message,
      data: { accessToken: result.data.accessToken },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get current authenticated user (requires Bearer token)
export const getUser = async (req, res) => {
  try {
    // req.user is set by authenticate middleware
    const userId = req.user.userId;

    const user = await userService.getCurrentUser(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Forgot password - send reset link
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
      });
    }

    const result = await userService.forgotPassword(email);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Verify password reset link (when user clicks magic link)
export const verifyPasswordResetLink = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Validation ID is required',
      });
    }

    const result = await userService.verifyPasswordResetLink(id);

    if (!result.success) {
      const statusCodes = {
        NOT_FOUND: 404,
        INVALID_TYPE: 400,
        EXPIRED: 410,
        ALREADY_USED: 410,
      };

      return res.status(statusCodes[result.code] || 400).json({
        success: false,
        error: result.reason,
        code: result.code,
      });
    }

    res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Reset password with new password
export const resetPassword = async (req, res) => {
  try {
    // const { id } = req.params;
    const { id, password } = req.body;

    if (!id || !password) {
      return res.status(400).json({
        success: false,
        error: 'Validation ID and new password are required',
      });
    }

    const result = await userService.resetPassword(id, password);

    if (!result.success) {
      const statusCodes = {
        NOT_FOUND: 404,
        INVALID_TYPE: 400,
        EXPIRED: 410,
        ALREADY_USED: 410,
        USER_NOT_FOUND: 404,
      };

      return res.status(statusCodes[result.code] || 400).json({
        success: false,
        error: result.reason,
        code: result.code,
      });
    }

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Refresh access token
export const refreshAccessToken = async (req, res) => {
  try {
    // get refresh token fron the HTTP-only cookie
    const { refreshToken } = req.cookies;

    // console.log(req.cookies);
    // check if the token is valid
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required',
      });
    }

    // get the refresh token from the userservice
    const result = await userService.refreshAccessToken(refreshToken);

    // if token not successful
    if (!result.success) {
      return res.status(403).json({
        // 403 forbidden for invalid/expired token
        success: false,
        error: result.reason,
        code: result.code,
      });
    }

    // if service returns a new refresh token, update the coookie
    // if (result.data.refreshToken) {
    //   res.cookies;
    // }

    //Return only access token (don't  touch refresh token cookie)
    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: { accessToken: result.data.accessToken },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Logout user - clear refresh token cookie
export const logoutUser = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get client info
    const clientInfo = await getClientInfo(req);

    // Log logout event
    await notificationService.logLogout(userId, clientInfo);

    // Clear the refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
