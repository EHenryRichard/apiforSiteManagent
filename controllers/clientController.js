import * as clientService from '../services/clientService.js';

/**
 * Create a new client
 * POST /api/clients
 */
export const createClient = async (req, res) => {
  try {
    const userId = req.user.userId; // From authenticate middleware
    const { name, email, telegramName } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: 'Client name and email are required',
      });
    }

    const newClient = await clientService.createClient(
      {
        name,
        email,
        telegramName,
      },
      userId
    );

    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      data: newClient,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get all clients for authenticated user
 * GET /api/clients
 */
export const getClients = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit, offset, search, activeOnly } = req.query;

    const result = await clientService.getClients(userId, {
      limit,
      offset,
      search,
      activeOnly: activeOnly === 'true',
    });

    res.status(200).json({
      success: true,
      data: result.clients,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get a single client by ID
 * GET /api/clients/:clientId
 */
export const getClient = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { clientId } = req.params;

    const client = await clientService.getClientById(clientId, userId);

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Client not found',
      });
    }

    res.status(200).json({
      success: true,
      data: client,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get all clients for a specific user by userId
 * GET /api/clients/user/:userId
 */
export const getClientsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit, offset, search, activeOnly } = req.query;

    const result = await clientService.getClients(userId, {
      limit,
      offset,
      search,
      activeOnly: activeOnly === 'true',
    });

    res.status(200).json({
      success: true,
      data: result.clients,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Update client information
 * PATCH /api/clients/:clientId
 */
export const updateClient = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { clientId } = req.params;
    const updateData = req.body;

    const result = await clientService.updateClient(clientId, userId, updateData);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.reason,
        code: result.code,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Client updated successfully',
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
 * Delete a client
 * DELETE /api/clients/:clientId
 */
export const deleteClient = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { clientId } = req.params;

    const result = await clientService.deleteClient(clientId, userId);

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
 * Get client statistics
 * GET /api/clients/stats
 */
export const getClientStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    const stats = await clientService.getClientStats(userId);

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
