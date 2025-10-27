import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import DatabaseChecker from '../models/DatabaseChecker.js';
import { Sequelize } from 'sequelize';
import { dbConfig } from './dbConfigs.js';

dotenv.config();

let pool = null;
let sequelize = null;

// initialize both mysql2 and sequelize
const initializeDatabase = async () => {
  try {
    //use class to check if  database exists if it does not it creates it before pool creation (connecting to the database)

    const checker = new DatabaseChecker();
    await checker.validateBeforePool(process.env.DBNAME);

    // create mysql2 pool (for raw databse queries)
    pool = mysql.createPool(dbConfig);

    //create sequelize instance (for ORM and table creation)
    sequelize = new Sequelize(
      process.env.DBNAME,
      process.env.USER,
      process.env.PASSWORD,
      {
        host: process.env.HOST,
        port: process.env.DBPORT,
        dialect: 'mysql',
        logging: false,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Auto-detect system timezone
        dialectOptions: {
          timezone: 'local', // Use local timezone for MySQL connection
        },
        pool: {
          max: dbConfig.connectionLimit || 10,
          min: 0,
          acquire: 30000,
          idle: 10000,
        },
      }
    );

    // INITIAIZE CONNECTIONS

    //To start the mysql  connection. (raw connections)
    const connection = await pool.getConnection();
    connection.release();

    // To initialize the sequencie connection (ORM)
    await sequelize.authenticate();
    console.log(
      'Both database connections has been established successfully'
    );

    // Import and sync all models
    const getUserModel = (await import('../models/user.js'))
      .default;
    getUserModel(); // Initialize the User model

    const getValidationModel = (
      await import('../models/validation.js')
    ).default;

    //initialize the validationModel
    getValidationModel();

    // Sync all models with database (creates tables if they don't exist)
    // Using force: false to only create tables if they don't exist
    // This prevents duplicate indexes from being created
    await sequelize.sync({ force: false });
    console.log(
      'Database tables synchronized successfully'
    );

    return { pool, sequelize };
  } catch (error) {
    console.error('database initialization failed', error);
    process.exit(1);
  }
};

export const getPool = async () => {
  if (!pool) {
    await initializeDatabase();
  }
  return pool;
};

export const getSequelize = async () => {
  if (!sequelize) {
    await initializeDatabase();
  }
  return sequelize;
};

export const getPoolSync = () => {
  if (!pool) {
    throw new Error(
      'Database pool not initialized call initializeDatabase() first. '
    );
  }
  return pool;
};
export const getSequelizeSync = () => {
  if (!sequelize) {
    throw new Error(
      'Sequelize not initialized.  call initializeDatabase() first. '
    );
  }
  return sequelize;
};

export default initializeDatabase;
