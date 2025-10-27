import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { dbConfig } from '../config/dbConfigs.js';

dotenv.config();

async function verifyDatabaseState() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    console.log('='.repeat(50));
    console.log('DATABASE STATE VERIFICATION');
    console.log('='.repeat(50));

    // Check users table indexes
    console.log('\n1. USERS TABLE INDEXES:');
    const [userIndexes] = await connection.query('SHOW INDEX FROM users');
    console.log(`   Total: ${userIndexes.length} indexes`);

    const userGroups = {};
    userIndexes.forEach(index => {
      if (!userGroups[index.Key_name]) {
        userGroups[index.Key_name] = [];
      }
      userGroups[index.Key_name].push(index);
    });

    Object.keys(userGroups).forEach(keyName => {
      const columns = userGroups[keyName].map(i => i.Column_name).join(', ');
      const unique = userGroups[keyName][0].Non_unique === 0 ? 'UNIQUE' : 'NON-UNIQUE';
      console.log(`   - ${keyName}: ${columns} (${unique})`);
    });

    // Check if validations table exists
    const [tables] = await connection.query("SHOW TABLES LIKE 'validations'");

    if (tables.length > 0) {
      // Check validations table foreign keys
      console.log('\n2. VALIDATIONS TABLE FOREIGN KEYS:');
      const [validationFKs] = await connection.query(`
        SELECT
          CONSTRAINT_NAME,
          COLUMN_NAME,
          REFERENCED_TABLE_NAME,
          REFERENCED_COLUMN_NAME
        FROM
          INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE
          TABLE_SCHEMA = '${process.env.DBNAME}'
          AND TABLE_NAME = 'validations'
          AND REFERENCED_TABLE_NAME IS NOT NULL
      `);

      console.log(`   Total: ${validationFKs.length} foreign keys`);
      validationFKs.forEach(fk => {
        console.log(`   - ${fk.CONSTRAINT_NAME}: ${fk.COLUMN_NAME} -> ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
      });

      // Check validations table indexes
      console.log('\n3. VALIDATIONS TABLE INDEXES:');
      const [validationIndexes] = await connection.query('SHOW INDEX FROM validations');
      console.log(`   Total: ${validationIndexes.length} indexes`);

      const validationGroups = {};
      validationIndexes.forEach(index => {
        if (!validationGroups[index.Key_name]) {
          validationGroups[index.Key_name] = [];
        }
        validationGroups[index.Key_name].push(index);
      });

      Object.keys(validationGroups).forEach(keyName => {
        const columns = validationGroups[keyName].map(i => i.Column_name).join(', ');
        const unique = validationGroups[keyName][0].Non_unique === 0 ? 'UNIQUE' : 'NON-UNIQUE';
        console.log(`   - ${keyName}: ${columns} (${unique})`);
      });
    } else {
      console.log('\n2. VALIDATIONS TABLE: Not yet created');
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    if (userIndexes.length <= 3) {
      console.log('✓ Database state looks good!');
      console.log('✓ Ready to start the server');
    } else {
      console.log('⚠ Warning: Still has duplicate indexes');
      console.log('⚠ You may need to run cleanup again');
    }
    console.log('='.repeat(50));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

verifyDatabaseState();
