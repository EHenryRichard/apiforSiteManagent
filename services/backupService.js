import { getSiteModel } from '../models/index.js';
import { getClientModel } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * Get all sites with backup information for a specific client
 * @param {string} clientId - Client ID
 * @param {number} userId - User ID for ownership verification
 * @param {Object} options - Query options (limit, offset, backupStatus)
 * @returns {Object} List of sites with backup info
 */
export const getClientBackups = async (clientId, userId, options = {}) => {
  try {
    const Site = getSiteModel();
    const Client = getClientModel();

    // Verify client ownership
    const client = await Client.findOne({
      where: { clientId, userId },
    });

    if (!client) {
      throw new Error('Client not found or you do not have permission to access it');
    }

    const { limit = 50, offset = 0, backupStatus = null } = options;

    const whereClause = {
      clientId,
      userId,
    };

    // Filter by backup status if provided
    if (backupStatus) {
      whereClause.backupStatus = backupStatus;
    }

    const { count, rows } = await Site.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['lastSuccessfulBackup', 'DESC NULLS LAST']],
    });

    return {
      client: {
        clientId: client.clientId,
        name: client.name,
        email: client.email,
      },
      sites: rows.map((site) => ({
        siteId: site.siteId,
        siteName: site.siteName,
        siteUrl: site.siteUrl,
        status: site.status,
        backupStatus: site.backupStatus,
        backupFrequency: site.backupFrequency,
        backupType: site.backupType,
        lastSuccessfulBackup: site.lastSuccessfulBackup,
        nextScheduledBackup: site.nextScheduledBackup,
        backupLocation: site.backupLocation,
        backupSize: site.backupSize,
        autoBackupEnabled: site.autoBackupEnabled,
        backupStartDate: site.backupStartDate,
        backupEndDate: site.backupEndDate,
        backupErrorMessage: site.backupErrorMessage,
      })),
      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: offset + rows.length < count,
      },
    };
  } catch (error) {
    throw new Error(`Failed to fetch client backups: ${error.message}`);
  }
};

/**
 * Get all clients with their backup statistics
 * @param {number} userId - User ID
 * @param {Object} options - Query options
 * @returns {Object} List of clients with backup stats
 */
export const getAllClientsWithBackupStats = async (userId, options = {}) => {
  try {
    const Client = getClientModel();
    const Site = getSiteModel();

    const { limit = 50, offset = 0, search = '' } = options;

    const whereClause = { userId };

    // Search by client name or email
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Client.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
    });

    // Get backup statistics for each client
    const clientsWithStats = await Promise.all(
      rows.map(async (client) => {
        const sites = await Site.findAll({
          where: { clientId: client.clientId, userId },
        });

        const totalSites = sites.length;
        const backedUpSites = sites.filter(
          (s) => s.backupStatus === 'completed'
        ).length;
        const failedBackups = sites.filter(
          (s) => s.backupStatus === 'failed'
        ).length;
        const inProgressBackups = sites.filter(
          (s) => s.backupStatus === 'in_progress'
        ).length;
        const neverBackedUp = sites.filter(
          (s) => s.backupStatus === 'never_backed_up'
        ).length;

        // Get total backup size
        const totalBackupSize = sites.reduce(
          (sum, site) => sum + (site.backupSize || 0),
          0
        );

        // Get last backup date across all sites
        const lastBackupDates = sites
          .map((s) => s.lastSuccessfulBackup)
          .filter(Boolean);
        const lastBackupDate =
          lastBackupDates.length > 0
            ? new Date(Math.max(...lastBackupDates.map((d) => new Date(d))))
            : null;

        return {
          clientId: client.clientId,
          name: client.name,
          email: client.email,
          telegramName: client.telegramName,
          isActive: client.isActive,
          backupStats: {
            totalSites,
            backedUpSites,
            failedBackups,
            inProgressBackups,
            neverBackedUp,
            totalBackupSize,
            lastBackupDate,
            backupPercentage:
              totalSites > 0
                ? Math.round((backedUpSites / totalSites) * 100)
                : 0,
          },
        };
      })
    );

    return {
      clients: clientsWithStats,
      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: offset + rows.length < count,
      },
    };
  } catch (error) {
    throw new Error(`Failed to fetch clients with backup stats: ${error.message}`);
  }
};

/**
 * Initiate a backup for a specific site
 * @param {string} siteId - Site ID
 * @param {number} userId - User ID for ownership verification
 * @param {Object} backupOptions - Backup configuration options
 * @returns {Object} Backup initiation result
 */
export const initiateBackup = async (siteId, userId, backupOptions = {}) => {
  try {
    const Site = getSiteModel();

    const site = await Site.findOne({
      where: { siteId, userId },
    });

    if (!site) {
      throw new Error('Site not found or you do not have permission to access it');
    }

    // Check if backup is already in progress
    if (site.backupStatus === 'in_progress') {
      throw new Error('Backup is already in progress for this site');
    }

    // Update site backup status
    site.backupStatus = 'in_progress';
    site.backupStartDate = new Date();
    site.backupEndDate = null;
    site.backupErrorMessage = null;

    // Update backup type if provided
    if (backupOptions.backupType) {
      site.backupType = backupOptions.backupType;
    }

    await site.save();

    // TODO: Implement actual backup logic here
    // This could involve:
    // - Connecting to cPanel API
    // - Creating database dump
    // - Archiving files
    // - Uploading to cloud storage
    // - Updating backup location and size

    return {
      success: true,
      message: 'Backup initiated successfully',
      siteId: site.siteId,
      siteName: site.siteName,
      backupStatus: site.backupStatus,
      backupStartDate: site.backupStartDate,
    };
  } catch (error) {
    throw new Error(`Failed to initiate backup: ${error.message}`);
  }
};

/**
 * Update backup status for a site (called by backup process)
 * @param {string} siteId - Site ID
 * @param {string} status - New backup status
 * @param {Object} backupData - Backup result data
 * @returns {Object} Update result
 */
export const updateBackupStatus = async (siteId, status, backupData = {}) => {
  try {
    const Site = getSiteModel();

    const site = await Site.findOne({
      where: { siteId },
    });

    if (!site) {
      throw new Error('Site not found');
    }

    site.backupStatus = status;
    site.backupEndDate = new Date();

    if (status === 'completed') {
      site.lastSuccessfulBackup = new Date();
      site.backupLocation = backupData.location || site.backupLocation;
      site.backupSize = backupData.size || site.backupSize;
      site.backupErrorMessage = null;

      // Calculate next scheduled backup if auto-backup is enabled
      if (site.autoBackupEnabled && site.backupFrequency !== 'manual') {
        site.nextScheduledBackup = calculateNextBackupDate(
          site.backupFrequency
        );
      }
    } else if (status === 'failed') {
      site.backupErrorMessage = backupData.errorMessage || 'Backup failed';
    }

    await site.save();

    return {
      success: true,
      siteId: site.siteId,
      backupStatus: site.backupStatus,
      lastSuccessfulBackup: site.lastSuccessfulBackup,
    };
  } catch (error) {
    throw new Error(`Failed to update backup status: ${error.message}`);
  }
};

/**
 * Configure backup settings for a site
 * @param {string} siteId - Site ID
 * @param {number} userId - User ID for ownership verification
 * @param {Object} settings - Backup settings
 * @returns {Object} Updated site backup settings
 */
export const configureBackupSettings = async (siteId, userId, settings) => {
  try {
    const Site = getSiteModel();

    const site = await Site.findOne({
      where: { siteId, userId },
    });

    if (!site) {
      throw new Error('Site not found or you do not have permission to access it');
    }

    // Update backup settings
    if (settings.backupFrequency !== undefined) {
      site.backupFrequency = settings.backupFrequency;
    }

    if (settings.backupType !== undefined) {
      site.backupType = settings.backupType;
    }

    if (settings.autoBackupEnabled !== undefined) {
      site.autoBackupEnabled = settings.autoBackupEnabled;
    }

    // Calculate next backup if auto-backup is enabled
    if (site.autoBackupEnabled && site.backupFrequency !== 'manual') {
      site.nextScheduledBackup = calculateNextBackupDate(site.backupFrequency);
    } else {
      site.nextScheduledBackup = null;
    }

    await site.save();

    return {
      success: true,
      siteId: site.siteId,
      siteName: site.siteName,
      backupFrequency: site.backupFrequency,
      backupType: site.backupType,
      autoBackupEnabled: site.autoBackupEnabled,
      nextScheduledBackup: site.nextScheduledBackup,
    };
  } catch (error) {
    throw new Error(`Failed to configure backup settings: ${error.message}`);
  }
};

/**
 * Get backup history and statistics for a site
 * @param {string} siteId - Site ID
 * @param {number} userId - User ID for ownership verification
 * @returns {Object} Backup history and statistics
 */
export const getSiteBackupHistory = async (siteId, userId) => {
  try {
    const Site = getSiteModel();

    const site = await Site.findOne({
      where: { siteId, userId },
    });

    if (!site) {
      throw new Error('Site not found or you do not have permission to access it');
    }

    return {
      siteId: site.siteId,
      siteName: site.siteName,
      siteUrl: site.siteUrl,
      currentBackupStatus: site.backupStatus,
      backupConfiguration: {
        backupFrequency: site.backupFrequency,
        backupType: site.backupType,
        autoBackupEnabled: site.autoBackupEnabled,
        nextScheduledBackup: site.nextScheduledBackup,
      },
      lastBackup: {
        status: site.backupStatus,
        startDate: site.backupStartDate,
        endDate: site.backupEndDate,
        lastSuccessfulBackup: site.lastSuccessfulBackup,
        location: site.backupLocation,
        size: site.backupSize,
        errorMessage: site.backupErrorMessage,
      },
    };
  } catch (error) {
    throw new Error(`Failed to fetch backup history: ${error.message}`);
  }
};

/**
 * Get sites that need backup (scheduled or overdue)
 * @param {number} userId - User ID
 * @returns {Object} List of sites needing backup
 */
export const getSitesDueForBackup = async (userId) => {
  try {
    const Site = getSiteModel();

    const sites = await Site.findAll({
      where: {
        userId,
        autoBackupEnabled: true,
        backupStatus: { [Op.ne]: 'in_progress' },
        nextScheduledBackup: { [Op.lte]: new Date() },
      },
      order: [['nextScheduledBackup', 'ASC']],
    });

    return {
      count: sites.length,
      sites: sites.map((site) => ({
        siteId: site.siteId,
        siteName: site.siteName,
        siteUrl: site.siteUrl,
        clientId: site.clientId,
        backupFrequency: site.backupFrequency,
        nextScheduledBackup: site.nextScheduledBackup,
        lastSuccessfulBackup: site.lastSuccessfulBackup,
      })),
    };
  } catch (error) {
    throw new Error(`Failed to fetch sites due for backup: ${error.message}`);
  }
};

/**
 * Delete backup data for a site
 * @param {string} siteId - Site ID
 * @param {number} userId - User ID for ownership verification
 * @returns {Object} Deletion result
 */
export const deleteBackupData = async (siteId, userId) => {
  try {
    const Site = getSiteModel();

    const site = await Site.findOne({
      where: { siteId, userId },
    });

    if (!site) {
      throw new Error('Site not found or you do not have permission to access it');
    }

    // TODO: Implement actual backup file deletion from storage
    // This should delete the backup files from wherever they are stored

    // Reset backup-related fields
    site.backupStatus = 'never_backed_up';
    site.backupLocation = null;
    site.backupSize = null;
    site.lastSuccessfulBackup = null;
    site.backupStartDate = null;
    site.backupEndDate = null;
    site.backupErrorMessage = null;

    await site.save();

    return {
      success: true,
      message: 'Backup data deleted successfully',
      siteId: site.siteId,
    };
  } catch (error) {
    throw new Error(`Failed to delete backup data: ${error.message}`);
  }
};

/**
 * Helper function to calculate next backup date based on frequency
 * @param {string} frequency - Backup frequency (daily, weekly, monthly)
 * @returns {Date} Next backup date
 */
const calculateNextBackupDate = (frequency) => {
  const now = new Date();
  const nextBackup = new Date();

  switch (frequency) {
    case 'daily':
      nextBackup.setDate(now.getDate() + 1);
      break;
    case 'weekly':
      nextBackup.setDate(now.getDate() + 7);
      break;
    case 'monthly':
      nextBackup.setMonth(now.getMonth() + 1);
      break;
    default:
      return null;
  }

  return nextBackup;
};
