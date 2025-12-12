import { getClientModel } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * Create a new client
 * @param {Object} clientData - Client information
 * @param {number} userId - ID of the user creating this client
 * @returns {Object} Created client data
 */
export const createClient = async (clientData, userId) => {
  try {
    const Client = getClientModel();

    // Ensure table exists
    await Client.sync({ alter: true });

    // Check if client with same email already exists for this user
    const existingClient = await Client.findOne({
      where: {
        userId,
        email: clientData.email,
      },
    });

    if (existingClient) {
      throw new Error('A client with this email already exists in your account');
    }

    // Create new client
    const newClient = await Client.create({
      userId,
      name: clientData.name,
      email: clientData.email,
      telegramName: clientData.telegramName || null,
    });

    return {
      clientId: newClient.clientId,
      name: newClient.name,
      email: newClient.email,
      telegramName: newClient.telegramName,
      isActive: newClient.isActive,
      createdAt: newClient.created_at,
    };
  } catch (error) {
    // Handle unique constraint violations
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new Error('A client with this email already exists');
    }

    // Handle validation errors
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map((err) => `${err.path}: ${err.message}`).join(', ');
      throw new Error(`Validation failed: ${validationErrors}`);
    }

    throw new Error(`Failed to create client: ${error.message}`);
  }
};

/**
 * Get all clients for a user
 * @param {number} userId - ID of the user
 * @param {Object} options - Query options (limit, offset, search, activeOnly)
 * @returns {Object} List of clients with pagination
 */
export const getClients = async (userId, options = {}) => {
  try {
    const Client = getClientModel();
    const { limit = 50, offset = 0, search = '', activeOnly = false } = options;

    const whereClause = { userId };

    // Filter by active status
    if (activeOnly) {
      whereClause.isActive = true;
    }

    // Search by name or email
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { telegramName: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Client.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
    });

    return {
      clients: rows.map((client) => ({
        clientId: client.clientId,
        name: client.name,
        email: client.email,
        telegramName: client.telegramName,
        websiteCount: client.websiteCount,
        isActive: client.isActive,
        createdAt: client.created_at,
        updatedAt: client.updated_at,
      })),
      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: offset + rows.length < count,
      },
    };
  } catch (error) {
    throw new Error(`Failed to fetch clients: ${error.message}`);
  }
};

/**
 * Get a single client by clientId
 * @param {string} clientId - Client ID
 * @param {number} userId - ID of the user (for ownership verification)
 * @returns {Object|null} Client data
 */
export const getClientById = async (clientId, userId) => {
  try {
    const Client = getClientModel();

    const client = await Client.findOne({
      where: {
        clientId,
        userId, // Ensure user can only access their own clients
      },
    });

    if (!client) {
      return null;
    }

    return {
      clientId: client.clientId,
      name: client.name,
      email: client.email,
      telegramName: client.telegramName,
      websiteCount: client.websiteCount,
      isActive: client.isActive,
      createdAt: client.created_at,
      updatedAt: client.updated_at,
    };
  } catch (error) {
    throw new Error(`Failed to fetch client: ${error.message}`);
  }
};

/**
 * Update client information
 * @param {string} clientId - Client ID
 * @param {number} userId - ID of the user (for ownership verification)
 * @param {Object} updateData - Data to update
 * @returns {Object} Updated client data
 */
export const updateClient = async (clientId, userId, updateData) => {
  try {
    const Client = getClientModel();

    const client = await Client.findOne({
      where: {
        clientId,
        userId,
      },
    });

    if (!client) {
      return {
        success: false,
        reason: 'Client not found or you do not have permission to update it',
        code: 'NOT_FOUND',
      };
    }

    // Update allowed fields
    const allowedFields = ['name', 'email', 'telegramName', 'websiteCount', 'isActive'];
    Object.keys(updateData).forEach((key) => {
      if (allowedFields.includes(key) && updateData[key] !== undefined) {
        client[key] = updateData[key];
      }
    });

    await client.save();

    return {
      success: true,
      data: {
        clientId: client.clientId,
        name: client.name,
        email: client.email,
        telegramName: client.telegramName,
        websiteCount: client.websiteCount,
        isActive: client.isActive,
        updatedAt: client.updated_at,
      },
    };
  } catch (error) {
    // Handle validation errors
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map((err) => `${err.path}: ${err.message}`).join(', ');
      throw new Error(`Validation failed: ${validationErrors}`);
    }

    throw new Error(`Failed to update client: ${error.message}`);
  }
};

/**
 * Delete a client
 * @param {string} clientId - Client ID
 * @param {number} userId - ID of the user (for ownership verification)
 * @returns {Object} Success status
 */
export const deleteClient = async (clientId, userId) => {
  try {
    const Client = getClientModel();

    const result = await Client.destroy({
      where: {
        clientId,
        userId,
      },
    });

    if (result === 0) {
      return {
        success: false,
        reason: 'Client not found or you do not have permission to delete it',
        code: 'NOT_FOUND',
      };
    }

    return {
      success: true,
      message: 'Client deleted successfully',
    };
  } catch (error) {
    throw new Error(`Failed to delete client: ${error.message}`);
  }
};

/**
 * Get client statistics for a user
 * @param {number} userId - ID of the user
 * @returns {Object} Client statistics
 */
export const getClientStats = async (userId) => {
  try {
    const Client = getClientModel();

    const totalClients = await Client.count({ where: { userId } });
    const activeClients = await Client.count({ where: { userId, isActive: true } });
    const inactiveClients = await Client.count({ where: { userId, isActive: false } });

    // Get total websites across all clients
    const result = await Client.findAll({
      where: { userId },
      attributes: [
        [Client.sequelize.fn('SUM', Client.sequelize.col('website_count')), 'totalWebsites'],
      ],
      raw: true,
    });

    const totalWebsites = result[0]?.totalWebsites || 0;

    return {
      totalClients,
      activeClients,
      inactiveClients,
      totalWebsites,
    };
  } catch (error) {
    throw new Error(`Failed to fetch client statistics: ${error.message}`);
  }
};
