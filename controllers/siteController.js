import * as siteService from '../services/siteService.js';

/**
 * Create a new site
 * POST /api/sites
 */
export const createSite = async (req, res) => {
  try {
    const userId = req.user.userId;
    const siteData = req.body;

    // Validate required fields
    if (!siteData.siteName || !siteData.siteUrl || !siteData.clientId) {
      return res.status(400).json({
        success: false,
        error: 'Site name, site URL, and client ID are required',
      });
    }

    if (!siteData.adminEmail || !siteData.adminPassword) {
      return res.status(400).json({
        success: false,
        error: 'Admin email and password are required',
      });
    }

    const newSite = await siteService.createSite(siteData, userId);

    res.status(201).json({
      success: true,
      message: 'Site created successfully',
      data: newSite,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get all sites for authenticated user
 * GET /api/sites
 */
export const getSites = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { clientId, status } = req.query;

    const result = await siteService.getSites(userId, {
      clientId,
      status,
    });

    res.status(200).json({
      success: true,
      data: result.sites,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get a single site by ID
 * GET /api/sites/:siteId
 */
export const getSite = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { siteId } = req.params;

    const site = await siteService.getSiteById(siteId, userId);

    if (!site) {
      return res.status(404).json({
        success: false,
        error: 'Site not found',
      });
    }

    res.status(200).json({
      success: true,
      data: site,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Update site information
 * PATCH /api/sites/:siteId
 */
export const updateSite = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { siteId } = req.params;
    const updateData = req.body;

    const result = await siteService.updateSite(siteId, userId, updateData);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.reason,
        code: result.code,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Site updated successfully',
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
 * Delete a site
 * DELETE /api/sites/:siteId
 */
export const deleteSite = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { siteId } = req.params;

    const result = await siteService.deleteSite(siteId, userId);

    if (!result.success) {
      return res.status(404).json({
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

/**
 * Get site statistics
 * GET /api/sites/stats
 */
export const getSiteStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    const stats = await siteService.getSiteStats(userId);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Start a backup for a site
 * POST /api/sites/:siteId/backup/start
 */
export const startBackup = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { siteId } = req.params;
    const { backupType } = req.body;

    const result = await siteService.startBackup(siteId, userId, backupType);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.reason,
        code: result.code,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Backup started successfully',
      data: result.data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
