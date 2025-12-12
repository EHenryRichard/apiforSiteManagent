/**
 * Client Routes
 *
 * This file defines all client-related API endpoints.
 * Routes follow the pattern: /api/clients/*
 *
 * Flow: Route → Controller → Service → Model → Database
 *
 * @module routes/clientRoute
 */

import express from 'express';
import * as clientController from '../controllers/clientController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// ========================================
// ALL ROUTES REQUIRE AUTHENTICATION
// ========================================

/**
 * POST /api/clients
 *
 * Create a new client
 * - REQUIRES authentication
 * - Creates a new client associated with the authenticated user
 *
 * Request Body:
 * {
 *   "name": "John's Business",
 *   "email": "john@business.com",
 *   "telegramName": "@johnbiz",       // Optional
 *   "websiteCount": 2                 // Optional, defaults to 0
 * }
 *
 * Response: Client data with clientId
 */
router.post('/', authenticate, clientController.createClient);

/**
 * GET /api/clients
 *
 * Get all clients for authenticated user
 * - REQUIRES authentication
 * - Returns paginated list of clients
 * - Supports search and filtering
 *
 * Query Params:
 *   ?limit=50           - Number of clients to return (default: 50)
 *   ?offset=0           - Pagination offset (default: 0)
 *   ?search=john        - Search by name, email, or telegram name
 *   ?activeOnly=true    - Only return active clients
 *
 * Response: List of clients with pagination metadata
 */
router.get('/', authenticate, clientController.getClients);

/**
 * GET /api/clients/stats
 *
 * Get client statistics for authenticated user
 * - REQUIRES authentication
 * - Returns total clients, active/inactive counts, total websites
 *
 * Response: Statistics object
 */
router.get('/stats', authenticate, clientController.getClientStats);

/**
 * GET /api/clients/user/:userId
 *
 * Get all clients for a specific user
 * - REQUIRES authentication
 * - Returns all clients belonging to the specified userId
 *
 * URL Params:
 *   userId - User ID
 *
 * Response: List of clients with pagination
 */
router.get('/user/:userId', authenticate, clientController.getClientsByUserId);

/**
 * GET /api/clients/:clientId
 *
 * Get a single client by ID
 * - REQUIRES authentication
 * - User can only access their own clients
 *
 * URL Params:
 *   clientId - Client ID
 *
 * Response: Client details
 */
router.get('/:clientId', authenticate, clientController.getClient);
/**
 * PATCH /api/clients/:clientId
 *
 * Update client information
 * - REQUIRES authentication
 * - User can only update their own clients
 *
 * URL Params:
 *   clientId - Client ID
 *
 * Request Body (all fields optional):
 * {
 *   "name": "Updated Business Name",
 *   "email": "newemail@business.com",
 *   "telegramName": "@newhandle",
 *   "websiteCount": 3,
 *   "isActive": false
 * }
 *
 * Response: Updated client data
 */
router.patch('/:clientId', authenticate, clientController.updateClient);

/**
 * DELETE /api/clients/:clientId
 *
 * Delete a client
 * - REQUIRES authentication
 * - User can only delete their own clients
 * - Permanently removes client from database
 *
 * URL Params:
 *   clientId - Client ID
 *
 * Response: Success message
 */
router.delete('/:clientId', authenticate, clientController.deleteClient);

export default router;
