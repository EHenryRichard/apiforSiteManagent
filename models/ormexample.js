// services/userService.js
import User from '../models/User.js';
import { Op } from 'sequelize';

class UserService {
  // ==================== CREATE OPERATIONS ====================

  // Create a single user
  async createUser(userData) {
    try {
      const user = await User.create(userData);
      return user;
    } catch (error) {
      throw new Error(
        `Error creating user: ${error.message}`
      );
    }
  }

  // Create multiple users
  async createMultipleUsers(usersData) {
    try {
      const users = await User.bulkCreate(usersData, {
        validate: true, // Validates each record
        returning: true, // Returns created records
      });
      return users;
    } catch (error) {
      throw new Error(
        `Error creating users: ${error.message}`
      );
    }
  }

  // ==================== READ OPERATIONS ====================

  // Get all users
  async getAllUsers() {
    try {
      const users = await User.findAll({
        order: [['createdAt', 'DESC']],
      });
      return users;
    } catch (error) {
      throw new Error(
        `Error fetching users: ${error.message}`
      );
    }
  }

  // Get user by ID
  async getUserById(id) {
    try {
      const user = await User.findByPk(id);
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    } catch (error) {
      throw new Error(
        `Error fetching user: ${error.message}`
      );
    }
  }

  // Get user by email
  async getUserByEmail(email) {
    try {
      const user = await User.findOne({
        where: { email },
      });
      return user;
    } catch (error) {
      throw new Error(
        `Error fetching user: ${error.message}`
      );
    }
  }

  // Get users with conditions
  async getActiveUsers() {
    try {
      const users = await User.findAll({
        where: {
          isActive: true,
        },
        order: [['username', 'ASC']],
      });
      return users;
    } catch (error) {
      throw new Error(
        `Error fetching active users: ${error.message}`
      );
    }
  }

  // Advanced search with multiple conditions
  async searchUsers(searchParams) {
    try {
      const whereClause = {};

      if (searchParams.username) {
        whereClause.username = {
          [Op.like]: `%${searchParams.username}%`,
        };
      }

      if (searchParams.email) {
        whereClause.email = {
          [Op.like]: `%${searchParams.email}%`,
        };
      }

      if (searchParams.minAge) {
        whereClause.age = {
          [Op.gte]: searchParams.minAge,
        };
      }

      if (searchParams.maxAge) {
        whereClause.age = {
          ...whereClause.age,
          [Op.lte]: searchParams.maxAge,
        };
      }

      const users = await User.findAll({
        where: whereClause,
        limit: searchParams.limit || 10,
        offset: searchParams.offset || 0,
        order: [['createdAt', 'DESC']],
      });

      return users;
    } catch (error) {
      throw new Error(
        `Error searching users: ${error.message}`
      );
    }
  }

  // Get users with pagination
  async getUsersPaginated(page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;

      const { count, rows } = await User.findAndCountAll({
        limit,
        offset,
        order: [['createdAt', 'DESC']],
      });

      return {
        users: rows,
        totalUsers: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
      };
    } catch (error) {
      throw new Error(
        `Error fetching paginated users: ${error.message}`
      );
    }
  }

  // ==================== UPDATE OPERATIONS ====================

  // Update user by ID
  async updateUser(id, updateData) {
    try {
      const [updatedRowsCount] = await User.update(
        updateData,
        {
          where: { id },
        }
      );

      if (updatedRowsCount === 0) {
        throw new Error(
          'User not found or no changes made'
        );
      }

      // Get updated user
      const updatedUser = await User.findByPk(id);
      return updatedUser;
    } catch (error) {
      throw new Error(
        `Error updating user: ${error.message}`
      );
    }
  }

  // Update multiple users
  async updateMultipleUsers(whereCondition, updateData) {
    try {
      const [updatedRowsCount] = await User.update(
        updateData,
        {
          where: whereCondition,
        }
      );

      return {
        updatedCount: updatedRowsCount,
        message: `${updatedRowsCount} users updated successfully`,
      };
    } catch (error) {
      throw new Error(
        `Error updating users: ${error.message}`
      );
    }
  }

  // Increment/Decrement operations
  async incrementUserAge(id, incrementBy = 1) {
    try {
      const user = await User.findByPk(id);
      if (!user) {
        throw new Error('User not found');
      }

      await user.increment('age', { by: incrementBy });
      await user.reload(); // Refresh the instance
      return user;
    } catch (error) {
      throw new Error(
        `Error incrementing user age: ${error.message}`
      );
    }
  }

  // ==================== DELETE OPERATIONS ====================

  // Delete user by ID
  async deleteUser(id) {
    try {
      const deletedRowsCount = await User.destroy({
        where: { id },
      });

      if (deletedRowsCount === 0) {
        throw new Error('User not found');
      }

      return { message: 'User deleted successfully' };
    } catch (error) {
      throw new Error(
        `Error deleting user: ${error.message}`
      );
    }
  }

  // Soft delete (if you want to keep records but mark as inactive)
  async softDeleteUser(id) {
    try {
      const user = await this.updateUser(id, {
        isActive: false,
      });
      return {
        message: 'User deactivated successfully',
        user,
      };
    } catch (error) {
      throw new Error(
        `Error deactivating user: ${error.message}`
      );
    }
  }

  // Delete multiple users
  async deleteMultipleUsers(whereCondition) {
    try {
      const deletedRowsCount = await User.destroy({
        where: whereCondition,
      });

      return {
        deletedCount: deletedRowsCount,
        message: `${deletedRowsCount} users deleted successfully`,
      };
    } catch (error) {
      throw new Error(
        `Error deleting users: ${error.message}`
      );
    }
  }

  // Delete all inactive users
  async deleteInactiveUsers() {
    try {
      const deletedRowsCount = await User.destroy({
        where: {
          isActive: false,
        },
      });

      return {
        deletedCount: deletedRowsCount,
        message: `${deletedRowsCount} inactive users deleted`,
      };
    } catch (error) {
      throw new Error(
        `Error deleting inactive users: ${error.message}`
      );
    }
  }

  // ==================== UTILITY OPERATIONS ====================

  // Count users
  async getUserCount(whereCondition = {}) {
    try {
      const count = await User.count({
        where: whereCondition,
      });
      return count;
    } catch (error) {
      throw new Error(
        `Error counting users: ${error.message}`
      );
    }
  }

  // Check if user exists
  async userExists(email) {
    try {
      const user = await User.findOne({ where: { email } });
      return !!user;
    } catch (error) {
      throw new Error(
        `Error checking user existence: ${error.message}`
      );
    }
  }
}

export default new UserService();

// // Success responses
// res.status(200).json({...});  // OK
// res.status(201).json({...});  // Created
// res.status(204).send();       // No Content

// // Client error responses
// res.status(400).json({...});  // Bad Request
// res.status(401).json({...});  // Unauthorized
// res.status(403).json({...});  // Forbidden
// res.status(404).json({...});  // Not Found
// res.status(422).json({...});  // Unprocessable Entity

// // Server error responses
// res.status(500).json({...});  // Internal Server Error
// res.status(503).json({...});  // Service Unavailable
