/**
 * Notification Controller
 *
 * Handles HTTP requests for user notifications and activity logs
 *
 * @module controllers/notificationController
 */

import * as notificationService from '../services/notificationService.js';

/**
 * Get all notifications for authenticated user
 *
 * GET /api/users/notifications
 *
 * Query params:
 * - limit: Number of notifications (default: 50)
 * - offset: Pagination offset (default: 0)
 * - unreadOnly: true/false (default: false)
 * - type: Filter by type (optional)
 */
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      limit = 50,
      offset = 0,
      unreadOnly = false,
      type,
    } = req.query;

    const options = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      unreadOnly: unreadOnly === 'true',
      type: type || null,
    };

    const result = await notificationService.getUserNotifications(userId, options);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.reason,
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

/**
 * Get a single notification by ID
 *
 * GET /api/users/notifications/:id
 */
export const getNotification = async (req, res) => {
  try {
    const userId = req.user.userId;
    const notificationId = parseInt(req.params.id);

    if (isNaN(notificationId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid notification ID',
      });
    }

    const result = await notificationService.getNotificationById(userId, notificationId);

    if (!result.success) {
      const statusCodes = {
        NOT_FOUND: 404,
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

/**
 * Mark notification(s) as read
 *
 * PATCH /api/users/notifications/read
 *
 * Body:
 * - notificationIds: number | number[] | 'all'
 */
export const markNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { notificationIds } = req.body;

    if (!notificationIds) {
      return res.status(400).json({
        success: false,
        error: 'notificationIds is required (number, array, or "all")',
      });
    }

    const result = await notificationService.markAsRead(userId, notificationIds);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.reason,
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

/**
 * Delete notification(s)
 *
 * DELETE /api/users/notifications
 *
 * Body:
 * - notificationIds: number | number[] | 'all'
 */
export const deleteNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { notificationIds } = req.body;

    if (!notificationIds) {
      return res.status(400).json({
        success: false,
        error: 'notificationIds is required (number, array, or "all")',
      });
    }

    const result = await notificationService.deleteNotifications(userId, notificationIds);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.reason,
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

/**
 * Get notification statistics
 *
 * GET /api/users/notifications/stats
 */
export const getNotificationStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await notificationService.getNotificationStats(userId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.reason,
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
