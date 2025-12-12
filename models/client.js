import { DataTypes } from 'sequelize';
import { getSequelizeSync } from '../config/database.js';
import crypto from 'crypto';

let Client = null;

const getClientModel = () => {
  if (!Client) {
    const sequelize = getSequelizeSync();

    // Check if model is already defined in sequelize
    if (sequelize.models.client) {
      Client = sequelize.models.client;
      return Client;
    }

    Client = sequelize.define(
      'client',
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        clientId: {
          type: DataTypes.STRING(100),
          allowNull: false,
          field: 'client_id',
          unique: true,
        },
        userId: {
          type: DataTypes.STRING(100),
          allowNull: false,
          field: 'user_id',
          references: {
            model: 'users',
            key: 'user_id',
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        name: {
          type: DataTypes.STRING(100),
          allowNull: false,
          validate: {
            notEmpty: true,
          },
        },
        email: {
          type: DataTypes.STRING(100),
          allowNull: false,
          validate: {
            isEmail: true,
          },
        },
        telegramName: {
          type: DataTypes.STRING(100),
          allowNull: true,
          field: 'telegram_name',
        },
        websiteCount: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          field: 'website_count',
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          field: 'is_active',
        },
      },
      {
        timestamps: true,
        createdAt: 'created_at',
        hooks: {
          beforeValidate: (instance) => {
            if (!instance.clientId) {
              instance.clientId = crypto.randomBytes(8).toString('hex');
            }
          },
        },
      }
    );
  }

  return Client;
};

export default getClientModel;
