import { DataTypes } from 'sequelize';
import { getSequelizeSync } from '../config/database.js';
import crypto from 'crypto';

let Site = null;

const getSiteModel = () => {
  if (!Site) {
    const sequelize = getSequelizeSync();

    if (sequelize.models.site) {
      Site = sequelize.models.site;
      return Site;
    }

    Site = sequelize.define(
      'site',
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        siteId: {
          type: DataTypes.STRING(100),
          allowNull: false,
          field: 'site_id',
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
        clientId: {
          type: DataTypes.STRING(100),
          allowNull: false,
          field: 'client_id',
          references: {
            model: 'clients',
            key: 'client_id',
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        siteName: {
          type: DataTypes.STRING(255),
          allowNull: false,
          field: 'site_name',
        },
        siteUrl: {
          type: DataTypes.STRING(500),
          allowNull: false,
          field: 'site_url',
        },
        adminEmail: {
          type: DataTypes.STRING(255),
          allowNull: false,
          field: 'admin_email',
        },
        adminPassword: {
          type: DataTypes.TEXT,
          allowNull: false,
          field: 'admin_password',
        },
        cpanelUrl: {
          type: DataTypes.STRING(500),
          allowNull: true,
          field: 'cpanel_url',
        },
        cpanelUsername: {
          type: DataTypes.STRING(255),
          allowNull: true,
          field: 'cpanel_username',
        },
        cpanelPassword: {
          type: DataTypes.TEXT,
          allowNull: true,
          field: 'cpanel_password',
        },
        webmailEmail: {
          type: DataTypes.STRING(255),
          allowNull: true,
          field: 'webmail_email',
        },
        webmailPassword: {
          type: DataTypes.TEXT,
          allowNull: true,
          field: 'webmail_password',
        },
        hostingProvider: {
          type: DataTypes.STRING(255),
          allowNull: true,
          field: 'hosting_provider',
        },
        hostingPlan: {
          type: DataTypes.STRING(255),
          allowNull: true,
          field: 'hosting_plan',
        },
        expiryDate: {
          type: DataTypes.DATEONLY,
          allowNull: true,
          field: 'expiry_date',
        },
        sslProvider: {
          type: DataTypes.STRING(255),
          allowNull: true,
          field: 'ssl_provider',
        },
        sslExpiryDate: {
          type: DataTypes.DATEONLY,
          allowNull: true,
          field: 'ssl_expiry_date',
        },
        status: {
          type: DataTypes.ENUM('active', 'inactive', 'maintenance', 'expired'),
          allowNull: false,
          defaultValue: 'active',
        },
        notes: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        nameservers: {
          type: DataTypes.JSON,
          allowNull: true,
          defaultValue: [],
        },
        ftpAccounts: {
          type: DataTypes.JSON,
          allowNull: true,
          defaultValue: [],
          field: 'ftp_accounts',
        },
        databases: {
          type: DataTypes.JSON,
          allowNull: true,
          defaultValue: [],
        },
        backupStatus: {
          type: DataTypes.ENUM('never_backed_up', 'in_progress', 'completed', 'failed', 'scheduled'),
          allowNull: false,
          defaultValue: 'never_backed_up',
          field: 'backup_status',
        },
        backupStartDate: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'backup_start_date',
        },
        backupEndDate: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'backup_end_date',
        },
        lastSuccessfulBackup: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'last_successful_backup',
        },
        backupFrequency: {
          type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'manual'),
          allowNull: false,
          defaultValue: 'manual',
          field: 'backup_frequency',
        },
        nextScheduledBackup: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'next_scheduled_backup',
        },
        backupLocation: {
          type: DataTypes.STRING(500),
          allowNull: true,
          field: 'backup_location',
        },
        backupSize: {
          type: DataTypes.BIGINT,
          allowNull: true,
          field: 'backup_size',
        },
        backupType: {
          type: DataTypes.ENUM('full', 'files', 'database', 'both'),
          allowNull: false,
          defaultValue: 'both',
          field: 'backup_type',
        },
        backupErrorMessage: {
          type: DataTypes.TEXT,
          allowNull: true,
          field: 'backup_error_message',
        },
        autoBackupEnabled: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          field: 'auto_backup_enabled',
        },
      },
      {
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        hooks: {
          beforeValidate: (instance) => {
            if (!instance.siteId) {
              instance.siteId = crypto.randomBytes(8).toString('hex');
            }
          },
        },
      }
    );
  }

  return Site;
};

export default getSiteModel;
