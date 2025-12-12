/**
 * Site Routes
 *
 * This file defines all site/website-related API endpoints.
 * Routes follow the pattern: /api/sites/*
 *
 * Flow: Route → Controller → Service → Model → Database
 *
 * @module routes/siteRoute
 */

import express from 'express';
import * as siteController from '../controllers/siteController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// ========================================
// ALL ROUTES REQUIRE AUTHENTICATION
// ========================================

/**
 * POST /api/sites
 *
 * Create a new site/website
 * - REQUIRES authentication
 * - Creates a new site associated with a client
 * - Automatically increments client's website count
 *
 * Request Body:
 * {
 *   "clientId": "f7b01528763c0e45",
 *   "siteName": "ERS Code",
 *   "siteUrl": "https://erscode.com",
 *   "adminEmail": "admin@gmail.com",
 *   "adminPassword": "SecurePass123!",
 *   "cpanelUrl": "https://cpanel.example.com",
 *   "cpanelUsername": "ersssci",
 *   "cpanelPassword": "CpanelPass123!",
 *   "webmailEmail": "support@erscode.com",
 *   "webmailPassword": "WebmailPass123!",
 *   "hostingProvider": "other",
 *   "hostingPlan": "shared",
 *   "expiryDate": "2025-11-02",
 *   "sslProvider": "other-ssl",
 *   "sslExpiryDate": "2025-12-01",
 *   "status": "active",
 *   "notes": "Optional notes",
 *   "nameservers": ["ns10.asurahosting.com", "ns20.asurahosting.com"],
 *   "ftpAccounts": [],
 *   "databases": [
 *     {
 *       "databaseHost": "localhost",
 *       "databaseName": "erdb",
 *       "databaseUsername": "erdb",
 *       "databasePassword": "DbPass123!"
 *     }
 *   ]
 * }
 *
 * Response: Site data with siteId
 */
router.post('/', authenticate, siteController.createSite);

/**
 * GET /api/sites
 *
 * Get all sites for authenticated user
 * - REQUIRES authentication
 * - Returns paginated list of sites
 * - Supports search and filtering
 *
 * Query Params:
 *   ?limit=50                           - Number of sites to return (default: 50)
 *   ?offset=0                           - Pagination offset (default: 0)
 *   ?search=erscode                     - Search by site name, URL, or admin email
 *   ?clientId=f7b01528763c0e45          - Filter by specific client
 *   ?status=active                      - Filter by status (active/inactive/maintenance/expired)
 *
 * Response: List of sites with pagination metadata
 */
router.get('/', authenticate, siteController.getSites);

/**
 * GET /api/sites/stats
 *
 * Get site statistics for authenticated user
 * - REQUIRES authentication
 * - Returns total sites, status counts, expiring sites, etc.
 *
 * Response: Statistics object
 */
router.get('/stats', authenticate, siteController.getSiteStats);

/**
 * GET /api/sites/:siteId
 *
 * Get a single site by ID with full details
 * - REQUIRES authentication
 * - User can only access their own sites
 * - Returns all site information including passwords
 *
 * URL Params:
 *   siteId - Site ID
 *
 * Response: Complete site details
 */
router.get('/:siteId', authenticate, siteController.getSite);

/**
 * PUT /api/sites/:siteId
 *
 * Update site information (full update)
 * - REQUIRES authentication
 * - User can only update their own sites
 *
 * URL Params:
 *   siteId - Site ID
 *
 * Request Body:
 * {
 *   "siteName": "ers code",
 *   "siteUrl": "https://erscode.com",
 *   "adminEmail": "admin@gmail.com",
 *   "adminPassword": "a211,,.::lo",
 *   "clientId": "f7b01528763c0e45",
 *   "cpanelUrl": "https://asuralogindetails",
 *   "cpanelUsername": "ersssci",
 *   "cpanelPassword": "Lolwaswas5_",
 *   "webmailEmail": "support@erscode.com",
 *   "webmailPassword": "1234567890",
 *   "hostingProvider": "other",
 *   "hostingPlan": "shared",
 *   "expiryDate": "2025-11-02",
 *   "sslProvider": "other-ssl",
 *   "sslExpiryDate": "",
 *   "status": "active",
 *   "notes": "",
 *   "nameservers": ["ns10.asurahosting.com", "ns20.asurahosting.com"],
 *   "ftpAccounts": [],
 *   "databases": [{databaseHost: "localhost", databaseName: "erdb", databaseUsername: "erdb", databasePassword: "password"}]
 * }
 *
 * Response: Updated site data
 */
router.put('/:siteId', authenticate, siteController.updateSite);

/**
 * PATCH /api/sites/:siteId
 *
 * Update site information (partial update)
 * - REQUIRES authentication
 * - User can only update their own sites
 *
 * URL Params:
 *   siteId - Site ID
 *
 * Request Body (all fields optional):
 * {
 *   "siteName": "Updated Site Name",
 *   "siteUrl": "https://newurl.com",
 *   "status": "maintenance",
 *   "expiryDate": "2026-01-01",
 *   ... (any other site fields)
 * }
 *
 * Response: Updated site data
 */
router.patch('/:siteId', authenticate, siteController.updateSite);

/**
 * DELETE /api/sites/:siteId
 *
 * Delete a site
 * - REQUIRES authentication
 * - User can only delete their own sites
 * - Automatically decrements client's website count
 * - Permanently removes site from database
 *
 * URL Params:
 *   siteId - Site ID
 *
 * Response: Success message
 */
router.delete('/:siteId', authenticate, siteController.deleteSite);

// ========================================
// BACKUP ROUTES
// ========================================

/**
 * POST /api/sites/:siteId/backup/start
 *
 * Start a backup for a specific site
 * - REQUIRES authentication
 * - Initiates backup process for the site
 * - Updates backup status to 'in_progress'
 *
 * URL Params:
 *   siteId - Site ID
 *
 * Request Body (optional):
 * {
 *   "backupType": "both"  // Options: 'full', 'files', 'database', 'both'
 * }
 *
 * Response: Backup initiation confirmation
 */
router.post('/:siteId/backup/start', authenticate, siteController.startBackup);

export default router;
