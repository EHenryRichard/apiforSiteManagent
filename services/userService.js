import getUserModel from '../models/user.js';

export const createUser = async (userData) => {
  try {
    const User = getUserModel();
    const newUser = await User.create(userData);
    return newUser;
  } catch (error) {
    throw new Error(`AN ERROR OCCURRED ::: ${error}`);
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
