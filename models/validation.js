// models/validation.js
import { DataTypes } from 'sequelize';
import crypto from 'crypto';
import { getSequelizeSync } from '../config/database.js';

let validation = null;

const getValidationModel = () => {
  if (!validation) {
    const sequelize = getSequelizeSync();

    // Check if model is already defined in sequelize
    if (sequelize.models.validation) {
      validation = sequelize.models.validation;
      return validation;
    }

    validation = sequelize.define(
      'validation',
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
        email: {
          type: DataTypes.STRING(255),
          allowNull: false,
          validate: {
            isEmail: true,
          },
        },
        token: {
          type: DataTypes.STRING(255),
          allowNull: true,
          unique: true,
        },
        type: {
          type: DataTypes.ENUM(
            'email_verification',
            'password_reset',
            'email_change',
            'phone_verification',
            'two_factor',
            'account_recovery'
          ),
          allowNull: false,
        },
        newEmail: {
          type: DataTypes.STRING(255),
          field: 'new_email',
          validate: {
            isEmail: true,
          },
        },
        phoneNumber: {
          type: DataTypes.STRING(20),
          field: 'phone_number',
        },
        expiresAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'expires_at',
        },
        usedAt: {
          type: DataTypes.DATE,
          field: 'used_at',
        },
        attempts: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
        },
        maxAttempts: {
          type: DataTypes.INTEGER,
          defaultValue: 3,
          field: 'max_attempts',
        },
        ipAddress: {
          type: DataTypes.STRING(45),
          field: 'ip_address',
        },
        userAgent: {
          type: DataTypes.TEXT,
          field: 'user_agent',
        },
        validationId: {
          type: DataTypes.STRING(255),
          field: 'validation_id',
        },
        metadata: {
          type: DataTypes.JSON,
          defaultValue: {},
        },
      },

      {
        tableName: 'validations',
        timestamps: true,
        createdAt: true,
        updatedAt: false,
        hooks: {
          beforeValidate: (instance) => {
            // Generate token if not provided
            if (!instance.token) {
              instance.token = instance.generateToken();
            }
            if (!instance.validationId) {
              instance.validationId =
                instance.validationToken();
            }

            // Set expiration based on type
            if (!instance.expiresAt) {
              instance.expiresAt =
                instance.getExpirationTime();
            }

            // Set max attempts based on type
            if (
              instance.maxAttempts === undefined ||
              instance.maxAttempts === null
            ) {
              instance.maxAttempts =
                instance.getMaxAttempts();
            }
          },
        },
      }
    );

    // Instance methods
    validation.prototype.generateToken = function () {
      switch (this.type) {
        case 'email_verification':
          return Math.floor(
            100000 + Math.random() * 900000
          ).toString();
        case 'email_change':
        case 'account_recovery':
          return crypto.randomBytes(32).toString('hex'); // 64 chars

        case 'password_reset':
          return crypto.randomBytes(32).toString('hex'); // 64 chars

        case 'phone_verification':
        case 'two_factor':
          return Math.floor(
            100000 + Math.random() * 900000
          ).toString(); // 6 digits

        default:
          return crypto.randomBytes(32).toString('hex');
      }
    };

    validation.prototype.getExpirationTime = function () {
      const now = new Date();

      switch (this.type) {
        case 'email_verification':
          return new Date(
            now.getTime() + 24 * 60 * 60 * 1000
          ); // 24 hours

        case 'password_reset':
          return new Date(
            now.getTime() + 1 * 60 * 60 * 1000
          ); // 1 hour

        case 'email_change':
          return new Date(
            now.getTime() + 2 * 60 * 60 * 1000
          ); // 2 hours

        case 'phone_verification':
          return new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes

        case 'two_factor':
          return new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes

        case 'account_recovery':
          return new Date(
            now.getTime() + 48 * 60 * 60 * 1000
          ); // 48 hours

        default:
          return new Date(
            now.getTime() + 24 * 60 * 60 * 1000
          ); // 24 hours
      }
    };

    validation.prototype.getMaxAttempts = function () {
      switch (this.type) {
        case 'phone_verification':
        case 'two_factor':
          return 5;
        case 'password_reset':
          return 3;
        default:
          return 1; // Email validations are typically one-time use
      }
    };

    validation.prototype.isExpired = function () {
      return new Date() > this.expiresAt;
    };

    validation.prototype.validationToken = function () {
      return crypto.randomBytes(32).toString('hex');
    };
    validation.prototype.isUsed = function () {
      return !!this.usedAt;
    };

    validation.prototype.canAttempt = function () {
      return (
        this.attempts < this.maxAttempts &&
        !this.isExpired() &&
        !this.isUsed()
      );
    };

    validation.prototype.incrementAttempts =
      async function () {
        this.attempts += 1;
        await this.save();
        return this;
      };

    validation.prototype.markAsUsed = async function () {
      this.usedAt = new Date();
      await this.save();
      return this;
    };
  }
  return validation;
};
export default getValidationModel;
