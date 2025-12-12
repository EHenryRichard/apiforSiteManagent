import mysql from 'mysql2/promise';
import { serverConfig, dbConfig, createDbConfig } from '../config/dbConfigs.js';

class DatabaseChecker {
  constructor() {
    this.serverConfig = serverConfig;
  }

  // Check if database exists
  async databaseExists(dbName) {
    let connection;
    try {
      connection = await mysql.createConnection(this.serverConfig);
      const [rows] = await connection.execute(
        'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?',
        [dbName]
      );
      return rows.length > 0;
    } catch (error) {
      console.error('❌ Error checking database:', error.message);
      return false;
    } finally {
      if (connection) await connection.end();
    }
  }

  // Create database if it doesn't exist
  async ensureDatabase(dbName) {
    let connection;
    try {
      connection = await mysql.createConnection(this.serverConfig);

      const exists = await this.databaseExists(dbName);

      if (!exists) {
        // console.log(`🔧 Creating database '${dbName}'...`);
        await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
        // console.log(`✅ Database '${dbName}' created`);
      }

      return true;
    } catch (error) {
      console.error(`❌ Error ensuring database '${dbName}':`, error.message);
      return false;
    } finally {
      if (connection) await connection.end();
    }
  }

  // Test connection to specific database
  async testConnection(dbName) {
    let connection;
    try {
      const config = createDbConfig(dbName);
      connection = await mysql.createConnection(config);
      console.log(`✅ Connection to '${dbName}' successful`);
      return true;
    } catch (error) {
      console.error(`❌ Connection to '${dbName}' failed:`, error.message);
      return false;
    } finally {
      if (connection) await connection.end();
    }
  }

  // Full validation before pool creation
  async validateBeforePool(dbName) {
    console.log(`🔍 Validating database setup for '${dbName}'...`);

    // Step 1: Ensure database exists
    const dbReady = await this.ensureDatabase(dbName);
    if (!dbReady) {
      throw new Error(`Failed to ensure database '${dbName}' exists`);
    }

    // Step 2: Test connection
    const connectionWorks = await this.testConnection(dbName);
    if (!connectionWorks) {
      throw new Error(`Failed to connect to database '${dbName}'`);
    }

    console.log(`✅ Database '${dbName}' is ready for pool creation`);
    return true;
  }
}

export default DatabaseChecker;
