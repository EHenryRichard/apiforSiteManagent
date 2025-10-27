import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { dbConfig } from '../config/dbConfigs.js';

dotenv.config();

async function recreateForeignKey() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    console.log('Recreating foreign key constraint...\n');

    // Check if validations table exists
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'validations'"
    );

    if (tables.length === 0) {
      console.log('Validations table does not exist. Skipping foreign key creation.');
      return;
    }

    // Check if foreign key already exists
    const [existingFKs] = await connection.query(`
      SELECT
        CONSTRAINT_NAME
      FROM
        INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE
        TABLE_SCHEMA = '${process.env.DBNAME}'
        AND TABLE_NAME = 'validations'
        AND REFERENCED_TABLE_NAME = 'users'
        AND REFERENCED_COLUMN_NAME = 'user_id'
    `);

    if (existingFKs.length > 0) {
      console.log('Foreign key already exists:');
      existingFKs.forEach(fk => console.log(`  - ${fk.CONSTRAINT_NAME}`));
      return;
    }

    // Create the foreign key constraint
    console.log('Adding foreign key constraint...');
    await connection.query(`
      ALTER TABLE validations
      ADD CONSTRAINT fk_validations_user_id
      FOREIGN KEY (user_id)
      REFERENCES users(user_id)
      ON DELETE CASCADE
      ON UPDATE CASCADE
    `);

    console.log('✓ Foreign key constraint created successfully');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

recreateForeignKey();
