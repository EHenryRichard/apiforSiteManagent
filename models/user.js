import { DataTypes } from 'sequelize';
import { getSequelizeSync } from '../config/database.js';
import useBcrypt from 'sequelize-bcrypt';
import crypto from 'crypto';

let User = null;

const getUserModel = () => {
  if (!User) {
    const sequelize = getSequelizeSync();

    // Check if model is already defined in sequelize
    if (sequelize.models.user) {
      User = sequelize.models.user;
      return User;
    }

    User = sequelize.define(
      'user',
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        fullname: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: false,
        },
        email: {
          type: DataTypes.STRING(100),
          allowNull: false,
          unique: true,
          validate: {
            isEmail: true,
          },
        },
        password: {
          type: DataTypes.STRING(255),
          allowNull: false,
          validate: {
            len: [8, 255],
            notEmpty: true,
          },
        },
        ipAddress: {
          type: DataTypes.STRING(55),
          allowNull: false,
          field: 'ip_address',
        },
        userAgent: {
          type: DataTypes.STRING(100),
          allowNull: false,
          field: 'user_agent',
        },
        userBrowser: {
          type: DataTypes.STRING(100),
          allowNull: false,
          field: 'user_browser',
        },
        userOs: {
          type: DataTypes.STRING(100),
          allowNull: false,
          field: 'user_os',
        },
        userDevice: {
          type: DataTypes.STRING(100),
          allowNull: false,
          field: 'user_device',
        },
        userCountry: {
          type: DataTypes.STRING(100),
          allowNull: false,
          field: 'user_country',
        },
        userId: {
          type: DataTypes.STRING(100),
          allowNull: false,
          field: 'user_id',
          unique: true,
        },
      },
      {
        timestamps: true, // Enable timestamps
        createdAt: true, // Keep createdAt
        updatedAt: false, // Disable updatedAt
        hooks: {
          beforeValidate: (instance) => {
            if (!instance.userId) {
              instance.userId = crypto
                .randomBytes(8)
                .toString('hex');
            }
          },
        },
      }
    );
    useBcrypt(User, {
      field: 'password',
      rounds: 12,
      compare: 'authenticate',
    });
  }
  User.prototype.generateToken = () =>
    crypto.randomBytes(8).toString('hex');
  return User;
};

export default getUserModel;
