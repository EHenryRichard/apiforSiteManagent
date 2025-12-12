/**
 * Notification Service
 *
 * Handles creating and retrieving user activity logs/notifications
 *
 * @module services/notificationService
 */

import getNotificationModel from '../models/notification.js';

/**
 * Create a notification/activity log
 *
 * @param {Object} data - Notification data
 * @param {string} data.userId - User's unique ID
 * @param {string} data.type - Type of activity
 * @param {string} data.title - Short title
 * @param {string} [data.message] - Detailed message
 * @param {Object} [data.metadata] - Additional data
 * @param {string} [data.ipAddress] - IP address
 * @param {string} [data.userAgent] - User agent string
 * @param {string} [data.device] - Device type
 * @param {string} [data.browser] - Browser name
 * @param {string} [data.os] - Operating system
 * @param {string} [data.location] - Location/country
 * @param {string} [data.severity] - Severity level (info, warning, error, success)
 *
 * @returns {Object} Created notification
 */
export const createNotification = async (data) => {
  try {
    const Notification = getNotificationModel();

    // Ensure table exists
    await Notification.sync({ alter: true });

    const notification = await Notification.create({
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message || null,
      metadata: data.metadata || null,
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
      device: data.device || null,
      browser: data.browser || null,
      os: data.os || null,
      location: data.location || null,
      severity: data.severity || 'info',
      isRead: false,
    });

    return {
      success: true,
      data: notification,
    };
  } catch (error) {
    console.error('Failed to create notification:', error.message);
    return {
      success: false,
      reason: error.message,
    };
  }
};

/**
 * Get all notifications for a user
 *
 * @param {string} userId - User's unique ID
 * @param {Object} [options] - Query options
 * @param {number} [options.limit=50] - Max number of notifications
 * @param {number} [options.offset=0] - Offset for pagination
 * @param {boolean} [options.unreadOnly=false] - Only unread notifications
 * @param {string} [options.type] - Filter by notification type
 *
 * @returns {Object} Notifications and metadata
 */
export const getUserNotifications = async (userId, options = {}) => {
  try {
    const Notification = getNotificationModel();

    const {
      limit = 50,
      offset = 0,
      unreadOnly = false,
      type = null,
    } = options;

    // Build where clause
    const where = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }
    if (type) {
      where.type = type;
    }

    // Get notifications
    const { rows: notifications, count } = await Notification.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      attributes: {
        exclude: ['userAgent'], // Exclude sensitive data from list
      },
    });

    // Get unread count
    const unreadCount = await Notification.count({
      where: { userId, isRead: false },
    });

    return {
      success: true,
      data: {
        notifications,
        total: count,
        unreadCount,
        limit,
        offset,
      },
    };
  } catch (error) {
    return {
      success: false,
      reason: error.message,
    };
  }
};

/**
 * Get a single notification by ID
 *
 * @param {string} userId - User's unique ID
 * @param {number} notificationId - Notification ID
 *
 * @returns {Object} Notification data
 */
export const getNotificationById = async (userId, notificationId) => {
  try {
    const Notification = getNotificationModel();

    const notification = await Notification.findOne({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      return {
        success: false,
        reason: 'Notification not found',
        code: 'NOT_FOUND',
      };
    }

    return {
      success: true,
      data: notification,
    };
  } catch (error) {
    return {
      success: false,
      reason: error.message,
    };
  }
};

/**
 * Mark notification(s) as read
 *
 * @param {string} userId - User's unique ID
 * @param {number|number[]|'all'} notificationIds - Notification ID(s) or 'all'
 *
 * @returns {Object} Result
 */
export const markAsRead = async (userId, notificationIds) => {
  try {
    const Notification = getNotificationModel();

    let where = { userId };

    if (notificationIds === 'all') {
      // Mark all as read
      where.isRead = false;
    } else if (Array.isArray(notificationIds)) {
      // Mark multiple as read
      where.id = notificationIds;
    } else {
      // Mark single as read
      where.id = notificationIds;
    }

    const [updatedCount] = await Notification.update(
      { isRead: true },
      { where }
    );

    return {
      success: true,
      message: `${updatedCount} notification(s) marked as read`,
      data: { updatedCount },
    };
  } catch (error) {
    return {
      success: false,
      reason: error.message,
    };
  }
};

/**
 * Delete notification(s)
 *
 * @param {string} userId - User's unique ID
 * @param {number|number[]|'all'} notificationIds - Notification ID(s) or 'all'
 *
 * @returns {Object} Result
 */
export const deleteNotifications = async (userId, notificationIds) => {
  try {
    const Notification = getNotificationModel();

    let where = { userId };

    if (notificationIds === 'all') {
      // Delete all
      // Optionally, only delete read ones: where.isRead = true;
    } else if (Array.isArray(notificationIds)) {
      where.id = notificationIds;
    } else {
      where.id = notificationIds;
    }

    const deletedCount = await Notification.destroy({ where });

    return {
      success: true,
      message: `${deletedCount} notification(s) deleted`,
      data: { deletedCount },
    };
  } catch (error) {
    return {
      success: false,
      reason: error.message,
    };
  }
};

/**
 * Get notification statistics for a user
 *
 * @param {string} userId - User's unique ID
 *
 * @returns {Object} Statistics
 */
export const getNotificationStats = async (userId) => {
  try {
    const Notification = getNotificationModel();

    const total = await Notification.count({ where: { userId } });
    const unread = await Notification.count({
      where: { userId, isRead: false },
    });

    // Count by type
    const byType = await Notification.findAll({
      where: { userId },
      attributes: [
        'type',
        [Notification.sequelize.fn('COUNT', Notification.sequelize.col('id')), 'count'],
      ],
      group: ['type'],
      raw: true,
    });

    // Count by severity
    const bySeverity = await Notification.findAll({
      where: { userId },
      attributes: [
        'severity',
        [Notification.sequelize.fn('COUNT', Notification.sequelize.col('id')), 'count'],
      ],
      group: ['severity'],
      raw: true,
    });

    return {
      success: true,
      data: {
        total,
        unread,
        read: total - unread,
        byType,
        bySeverity,
      },
    };
  } catch (error) {
    return {
      success: false,
      reason: error.message,
    };
  }
};

/**
 * Helper: Log user login
 */
export const logLogin = async (userId, success, clientInfo, failureReason = null) => {
  return createNotification({
    userId,
    type: success ? 'login_success' : 'login_failed',
    title: success ? 'Successful Login' : 'Failed Login Attempt',
    message: success
      ? `You logged in from ${clientInfo.device || 'unknown device'}`
      : `Failed login attempt: ${failureReason}`,
    ipAddress: clientInfo.ipAddress,
    userAgent: clientInfo.userAgent,
    device: clientInfo.device,
    browser: clientInfo.browser,
    os: clientInfo.os,
    location: clientInfo.country,
    severity: success ? 'success' : 'warning',
  });
};

/**
 * Helper: Log logout
 */
export const logLogout = async (userId, clientInfo) => {
  return createNotification({
    userId,
    type: 'logout',
    title: 'Logged Out',
    message: 'You logged out successfully',
    ipAddress: clientInfo.ipAddress,
    device: clientInfo.device,
    browser: clientInfo.browser,
    severity: 'info',
  });
};

/**
 * Helper: Log password change
 */
export const logPasswordChange = async (userId, clientInfo) => {
  return createNotification({
    userId,
    type: 'password_changed',
    title: 'Password Changed',
    message: 'Your password was changed successfully',
    ipAddress: clientInfo.ipAddress,
    device: clientInfo.device,
    browser: clientInfo.browser,
    os: clientInfo.os,
    location: clientInfo.country,
    severity: 'success',
  });
};

/**
 * Helper: Log password reset request
 */
export const logPasswordResetRequest = async (userId, clientInfo) => {
  return createNotification({
    userId,
    type: 'password_reset_requested',
    title: 'Password Reset Requested',
    message: 'A password reset link was sent to your email',
    ipAddress: clientInfo.ipAddress,
    severity: 'info',
  });
};

/**
 * Helper: Log account creation
 */
export const logAccountCreation = async (userId, clientInfo) => {
  return createNotification({
    userId,
    type: 'account_created',
    title: 'Welcome!',
    message: 'Your account was created successfully',
    ipAddress: clientInfo.ipAddress,
    device: clientInfo.device,
    browser: clientInfo.browser,
    os: clientInfo.os,
    location: clientInfo.country,
    severity: 'success',
  });
};

/**
 * Helper: Log email verification
 */
export const logEmailVerification = async (userId) => {
  return createNotification({
    userId,
    type: 'email_verified',
    title: 'Email Verified',
    message: 'Your email address has been verified successfully',
    severity: 'success',
  });
};
