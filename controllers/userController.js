import * as userService from '../services/userService.js';
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
        error: 'Token has expired',
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

    // Token is valid
    res.status(200).json({
      success: true,
      data: {
        email: validationData.email,
        type: validationData.type,
        expiresAt: validationData.expiresAt,
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

    // Successfully logged in - return JWT tokens
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
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required',
      });
    }

    const result = await userService.refreshAccessToken(refreshToken);

    if (!result.success) {
      return res.status(401).json({
        success: false,
        error: result.reason,
        code: result.code,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: result.data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
