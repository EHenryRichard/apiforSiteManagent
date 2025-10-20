import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import DatabaseChecker from '../models/DatabaseChecker.js';
import { dbConfig } from './dbConfigs.js';

dotenv.config();

let pool = null;

// Initialize database with validation
const initializeDatabase = async () => {
  try {
    // Step 1: Use class to check before pool creation
    const checker = new DatabaseChecker();
    await checker.validateBeforePool(process.env.DBNAME);

    // Step 2: Only create pool after validation passes
    pool = mysql.createPool(dbConfig);

    // Step 3: Test the pool
    const connection = await pool.getConnection();
    connection.release();
    return pool;
  } catch (error) {
    process.exit(1);
  }
};

// Export the pool getter function
export const getPool = async () => {
  if (!pool) {
    await initializeDatabase();
  }
  return pool;
};

// Direct access to pool (must be initialized first)
export const getPoolSync = () => {
  if (!pool) {
    throw new Error(
      'Database pool not initialized. Call initializeDatabase() first.'
    );
  }
  return pool;
};

// Export initialization function
export { initializeDatabase };
