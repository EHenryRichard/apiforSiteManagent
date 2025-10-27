import {
  getUserModel,
  getValidationModel,
} from '../models/index.js';

export const createUser = async (userData) => {
  try {
    const User = getUserModel();
    const validation = getValidationModel();
    // Ensure tables exist before creating user
    await User.sync({ alter: true });
    await validation.sync({ alter: true });

    const newUser = await User.create(userData);
    if (newUser) {
      const newValidation = await validation.create({
        userId: newUser.userId,
        email: newUser.email,
        type: 'email_verification',
      });

      // Return only safe, non-sensitive user data
      return {
        id: newUser.id,
        fullname: newUser.fullname,
        email: newUser.email,
        createdAt: newUser.createdAt,
        usertoken: newUser.userId,
        valToken: newValidation.validationId,
      };
    }
    return null;
  } catch (error) {
    // Handle unique constraint violations
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field =
        error.errors[0]?.path || 'unknown field';
      const value =
        error.errors[0]?.value || 'unknown value';
      throw new Error(
        `A user with this ${field} (${value}) already exists`
      );
    }

    // Handle validation errors
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors
        .map((err) => `${err.path}: ${err.message}`)
        .join(', ');
      throw new Error(
        `Validation failed: ${validationErrors}`
      );
    }

    // Generic error handler
    throw new Error(
      `Failed to create user: ${error.message}`
    );
  }
};

// export const getUser = async () => {
//   try {
//     const pool = getPoolSync();
//     const [rows] = await pool.execute(
//       'SELECT * FROM registertable'
//     );
//     return rows;
//   } catch (error) {
//     throw new Error(
//       'Failed to fetch users: ' + error.message
//     );
//   }
// };
