import { getPoolSync } from '../config/database.js';

export const getUser = async () => {
  try {
    const pool = getPoolSync();
    const [rows] = await pool.execute(
      'SELECT * FROM registertable'
    );
    return rows;
  } catch (error) {
    throw new Error('Failed to fetch users: ' + error.message);
  }
};
