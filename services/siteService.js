import { getSiteModel, getClientModel } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * Create a new site
 * @param {Object} siteData - Site information
 * @param {string} userId - ID of the user creating this site
 * @returns {Object} Created site data
 */
export const createSite = async (siteData, userId) => {
  try {
    const Site = getSiteModel();
    const Client = getClientModel();

    // Ensure table exists
    await Site.sync({ alter: true });

    // Verify client exists and belongs to user
    const client = await Client.findOne({
      where: {
        clientId: siteData.clientId,
        userId,
      },
    });

    if (!client) {
      throw new Error('Client not found or you do not have permission to access it');
    }

    // Create new site
    const newSite = await Site.create({
      userId,
      clientId: siteData.clientId,
      siteName: siteData.siteName,
      siteUrl: siteData.siteUrl,
      adminEmail: siteData.adminEmail,
      adminPassword: siteData.adminPassword,
      cpanelUrl: siteData.cpanelUrl || null,
      cpanelUsername: siteData.cpanelUsername || null,
      cpanelPassword: siteData.cpanelPassword || null,
      webmailEmail: siteData.webmailEmail || null,
      webmailPassword: siteData.webmailPassword || null,
      hostingProvider: siteData.hostingProvider || null,
      hostingPlan: siteData.hostingPlan || null,
      expiryDate: siteData.expiryDate || null,
      sslProvider: siteData.sslProvider || null,
      sslExpiryDate: siteData.sslExpiryDate || null,
      status: siteData.status || 'active',
      notes: siteData.notes || null,
      nameservers: siteData.nameservers || [],
      ftpAccounts: siteData.ftpAccounts || [],
      databases: siteData.databases || [],
    });

    // Update client's website count
    client.websiteCount = (client.websiteCount || 0) + 1;
    await client.save();

    return {
      siteId: newSite.siteId,
      siteName: newSite.siteName,
      siteUrl: newSite.siteUrl,
      status: newSite.status,
      createdAt: newSite.created_at,
    };
  } catch (error) {
    // Handle validation errors
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map((err) => `${err.path}: ${err.message}`).join(', ');
      throw new Error(`Validation failed: ${validationErrors}`);
    }

    throw new Error(`Failed to create site: ${error.message}`);
  }
};

/**
 * Get all sites for a user
 * @param {string} userId - ID of the user from authenticated JWT
 * @param {Object} options - Query options (optional: clientId, status for filtering)
 * @returns {Object} List of all sites for the user
 */
export const getSites = async (userId, options = {}) => {
  try {
    const Site = getSiteModel();
    const { clientId = null, status = null } = options;

    const whereClause = { userId };

    // Filter by client
    if (clientId) {
      whereClause.clientId = clientId;
    }

    // Filter by status
    if (status) {
      whereClause.status = status;
    }

    const rows = await Site.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
    });

    return {
      sites: rows.map((site) => ({
        siteId: site.siteId,
        clientId: site.clientId,
        siteName: site.siteName,
        siteUrl: site.siteUrl,
        status: site.status,
        expiryDate: site.expiryDate,
        sslExpiryDate: site.sslExpiryDate,
        createdAt: site.created_at,
        updatedAt: site.updated_at,
      })),
    };
  } catch (error) {
    throw new Error(`Failed to fetch sites: ${error.message}`);
  }
};

/**
 * Get a single site by siteId
 * @param {string} siteId - Site ID
 * @param {string} userId - ID of the user (for ownership verification)
 * @returns {Object|null} Site data
 */
export const getSiteById = async (siteId, userId) => {
  try {
    const Site = getSiteModel();

    const site = await Site.findOne({
      where: {
        siteId,
        userId,
      },
    });

    if (!site) {
      return null;
    }

    return {
      siteId: site.siteId,
      clientId: site.clientId,
      siteName: site.siteName,
      siteUrl: site.siteUrl,
      adminEmail: site.adminEmail,
      adminPassword: site.adminPassword,
      cpanelUrl: site.cpanelUrl,
      cpanelUsername: site.cpanelUsername,
      cpanelPassword: site.cpanelPassword,
      webmailEmail: site.webmailEmail,
      webmailPassword: site.webmailPassword,
      hostingProvider: site.hostingProvider,
      hostingPlan: site.hostingPlan,
      expiryDate: site.expiryDate,
      sslProvider: site.sslProvider,
      sslExpiryDate: site.sslExpiryDate,
      status: site.status,
      notes: site.notes,
      nameservers: site.nameservers,
      ftpAccounts: site.ftpAccounts,
      databases: site.databases,
      backupStatus: site.backupStatus,
      backupStartDate: site.backupStartDate,
      backupEndDate: site.backupEndDate,
      lastSuccessfulBackup: site.lastSuccessfulBackup,
      backupFrequency: site.backupFrequency,
      nextScheduledBackup: site.nextScheduledBackup,
      backupLocation: site.backupLocation,
      backupSize: site.backupSize,
      backupType: site.backupType,
      backupErrorMessage: site.backupErrorMessage,
      autoBackupEnabled: site.autoBackupEnabled,
      createdAt: site.created_at,
      updatedAt: site.updated_at,
    };
  } catch (error) {
    throw new Error(`Failed to fetch site: ${error.message}`);
  }
};

/**
 * Update site information
 * @param {string} siteId - Site ID
 * @param {string} userId - ID of the user (for ownership verification)
 * @param {Object} updateData - Data to update
 * @returns {Object} Updated site data
 */
export const updateSite = async (siteId, userId, updateData) => {
  try {
    const Site = getSiteModel();

    const site = await Site.findOne({
      where: {
        siteId,
        userId,
      },
    });

    if (!site) {
      return {
        success: false,
        reason: 'Site not found or you do not have permission to update it',
        code: 'NOT_FOUND',
      };
    }

    // Update allowed fields
    const allowedFields = [
      'siteName',
      'siteUrl',
      'adminEmail',
      'adminPassword',
      'cpanelUrl',
      'cpanelUsername',
      'cpanelPassword',
      'webmailEmail',
      'webmailPassword',
      'hostingProvider',
      'hostingPlan',
      'expiryDate',
      'sslProvider',
      'sslExpiryDate',
      'status',
      'notes',
      'nameservers',
      'ftpAccounts',
      'databases',
      'backupStatus',
      'backupStartDate',
      'backupEndDate',
      'lastSuccessfulBackup',
      'backupFrequency',
      'nextScheduledBackup',
      'backupLocation',
      'backupSize',
      'backupType',
      'backupErrorMessage',
      'autoBackupEnabled',
    ];

    Object.keys(updateData).forEach((key) => {
      if (allowedFields.includes(key) && updateData[key] !== undefined) {
        site[key] = updateData[key];
      }
    });

    await site.save();

    return {
      success: true,
      data: {
        siteId: site.siteId,
        siteName: site.siteName,
        siteUrl: site.siteUrl,
        status: site.status,
        updatedAt: site.updated_at,
      },
    };
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map((err) => `${err.path}: ${err.message}`).join(', ');
      throw new Error(`Validation failed: ${validationErrors}`);
    }

    throw new Error(`Failed to update site: ${error.message}`);
  }
};

/**
 * Delete a site
 * @param {string} siteId - Site ID
 * @param {string} userId - ID of the user (for ownership verification)
 * @returns {Object} Success status
 */
export const deleteSite = async (siteId, userId) => {
  try {
    const Site = getSiteModel();
    const Client = getClientModel();

    // Find the site first
    const site = await Site.findOne({
      where: {
        siteId,
        userId,
      },
    });

    if (!site) {
      return {
        success: false,
        reason: 'Site not found or you do not have permission to delete it',
        code: 'NOT_FOUND',
      };
    }

    // Get the client to update website count
    const client = await Client.findOne({
      where: {
        clientId: site.clientId,
        userId,
      },
    });

    // Delete the site
    await site.destroy();

    // Update client's website count
    if (client && client.websiteCount > 0) {
      client.websiteCount = client.websiteCount - 1;
      await client.save();
    }

    return {
      success: true,
      message: 'Site deleted successfully',
    };
  } catch (error) {
    throw new Error(`Failed to delete site: ${error.message}`);
  }
};

/**
 * Get site statistics for a user
 * @param {string} userId - ID of the user
 * @returns {Object} Site statistics
 */
export const getSiteStats = async (userId) => {
  try {
    const Site = getSiteModel();

    const totalSites = await Site.count({ where: { userId } });
    const activeSites = await Site.count({ where: { userId, status: 'active' } });
    const inactiveSites = await Site.count({ where: { userId, status: 'inactive' } });
    const maintenanceSites = await Site.count({ where: { userId, status: 'maintenance' } });
    const expiredSites = await Site.count({ where: { userId, status: 'expired' } });

    // Get sites expiring soon (within 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringSoon = await Site.count({
      where: {
        userId,
        expiryDate: {
          [Op.between]: [new Date(), thirtyDaysFromNow],
        },
      },
    });

    const sslExpiringSoon = await Site.count({
      where: {
        userId,
        sslExpiryDate: {
          [Op.between]: [new Date(), thirtyDaysFromNow],
        },
      },
    });

    return {
      totalSites,
      activeSites,
      inactiveSites,
      maintenanceSites,
      expiredSites,
      expiringSoon,
      sslExpiringSoon,
    };
  } catch (error) {
    throw new Error(`Failed to fetch site statistics: ${error.message}`);
  }
};

/**
 * Start a backup for a site
 * @param {string} siteId - Site ID
 * @param {string} userId - ID of the user (for ownership verification)
 * @param {string} backupType - Type of backup (optional)
 * @returns {Object} Backup start result
 */
export const startBackup = async (siteId, userId, backupType) => {
  try {
    const Site = getSiteModel();

    const site = await Site.findOne({
      where: {
        siteId,
        userId,
      },
    });

    if (!site) {
      return {
        success: false,
        reason: 'Site not found or you do not have permission to access it',
        code: 'NOT_FOUND',
      };
    }

    // Check if backup is already in progress
    if (site.backupStatus === 'in_progress') {
      return {
        success: false,
        reason: 'Backup is already in progress for this site',
        code: 'BACKUP_IN_PROGRESS',
      };
    }

    // Update backup fields
    site.backupStatus = 'in_progress';
    site.backupStartDate = new Date();
    site.backupEndDate = null;
    site.backupErrorMessage = null;

    // Set backup type if provided
    if (backupType && ['full', 'files', 'database', 'both'].includes(backupType)) {
      site.backupType = backupType;
    }

    await site.save();

    return {
      success: true,
      data: {
        siteId: site.siteId,
        siteName: site.siteName,
        backupStatus: site.backupStatus,
        backupStartDate: site.backupStartDate,
        backupType: site.backupType,
      },
    };
  } catch (error) {
    throw new Error(`Failed to start backup: ${error.message}`);
  }
};
