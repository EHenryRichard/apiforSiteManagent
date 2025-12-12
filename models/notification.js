/**
 * Notification/Activity Log Model
 *
 * Stores all user activities and system notifications:
 * - Login attempts (success/failure)
 * - Password changes
 * - Email verification
 * - Account updates
 * - Security events
 *
 * @module models/notification
 */

import { DataTypes } from 'sequelize';
import { getSequelizeSync } from '../config/database.js';
import getUserModel from './user.js';

let Notification = null;

const getNotificationModel = () => {
  if (!Notification) {
    const sequelize = getSequelizeSync();

    // Check if model is already defined
    if (sequelize.models.notification) {
      Notification = sequelize.models.notification;
      return Notification;
    }

    Notification = sequelize.define(
      'notification',
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        userId: {
          type: DataTypes.STRING(100),
          allowNull: false,
          field: 'user_id',
          references: {
            model: 'users',
            key: 'user_id',
          },
        },
        type: {
          type: DataTypes.ENUM(
            'login_success',
            'login_failed',
            'logout',
            'password_changed',
            'password_reset_requested',
            'password_reset_completed',
            'email_verified',
            'email_verification_sent',
            'account_created',
            'account_updated',
            'token_refreshed',
            'security_alert',
            'session_expired'
          ),
          allowNull: false,
          comment: 'Type of activity/notification',
        },
        title: {
          type: DataTypes.STRING(255),
          allowNull: false,
          comment: 'Short title/summary of the event',
        },
        message: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'Detailed message about the event',
        },
        metadata: {
          type: DataTypes.JSON,
          allowNull: true,
          comment: 'Additional data (IP, device, location, etc.)',
        },
        ipAddress: {
          type: DataTypes.STRING(55),
          allowNull: true,
          field: 'ip_address',
        },
        userAgent: {
          type: DataTypes.TEXT,
          allowNull: true,
          field: 'user_agent',
        },
        device: {
          type: DataTypes.STRING(100),
          allowNull: true,
          comment: 'Device type (mobile, desktop, tablet)',
        },
        browser: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        os: {
          type: DataTypes.STRING(100),
          allowNull: true,
          comment: 'Operating system',
        },
        location: {
          type: DataTypes.STRING(100),
          allowNull: true,
          comment: 'Country/City from IP',
        },
        isRead: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          field: 'is_read',
          comment: 'Whether user has read this notification',
        },
        severity: {
          type: DataTypes.ENUM('info', 'warning', 'error', 'success'),
          allowNull: false,
          defaultValue: 'info',
          comment: 'Severity level for UI display',
        },
      },
      {
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false, // Notifications are immutable once created
        indexes: [
          {
            fields: ['user_id'],
          },
          {
            fields: ['type'],
          },
          {
            fields: ['is_read'],
          },
          {
            fields: ['created_at'],
          },
        ],
      }
    );

    // Define association with User model
    const User = getUserModel();
    Notification.belongsTo(User, {
      foreignKey: 'userId',
      targetKey: 'userId',
    });
    User.hasMany(Notification, {
      foreignKey: 'userId',
      sourceKey: 'userId',
    });
  }

  return Notification;
};

export default getNotificationModel;
