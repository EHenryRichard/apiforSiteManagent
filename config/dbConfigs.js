import dotenv from 'dotenv';
dotenv.config();

// Static config with fixed database
export const dbConfig = {
  host: process.env.HOST,
  port: process.env.DBPORT,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DBNAME, // ← Fixed database name
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Server config without database
export const serverConfig = {
  host: process.env.HOST,
  port: process.env.DBPORT,
  user: process.env.USER,
  password: process.env.PASSWORD,
  // No database specified
};

// FUNCTION to create config with custom database name
export const createDbConfig = (databaseName) => ({
  host: process.env.HOST,
  port: process.env.DBPORT,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: databaseName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
