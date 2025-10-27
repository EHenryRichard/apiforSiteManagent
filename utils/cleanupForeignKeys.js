import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { dbConfig } from '../config/dbConfigs.js';

dotenv.config();

async function cleanupForeignKeys() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    console.log('Cleaning up foreign keys...\n');

    // Get all foreign key constraints on validations table
    const [constraints] = await connection.query(`
      SELECT
        CONSTRAINT_NAME,
        TABLE_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM
        INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE
        TABLE_SCHEMA = '${process.env.DBNAME}'
        AND TABLE_NAME = 'validations'
        AND REFERENCED_TABLE_NAME = 'users'
    `);

    console.log(`Found ${constraints.length} foreign key constraints\n`);

    // Drop all existing foreign keys
    for (const constraint of constraints) {
      try {
        console.log(`Dropping ${constraint.CONSTRAINT_NAME}...`);
        await connection.query(
          `ALTER TABLE validations DROP FOREIGN KEY \`${constraint.CONSTRAINT_NAME}\``
        );
        console.log(`✓ Dropped ${constraint.CONSTRAINT_NAME}`);
      } catch (error) {
        console.error(`✗ Failed to drop ${constraint.CONSTRAINT_NAME}:`, error.message);
      }
    }

    // Create a single, properly named foreign key
    console.log('\nCreating new foreign key constraint...');
    await connection.query(`
      ALTER TABLE validations
      ADD CONSTRAINT fk_validations_user_id
      FOREIGN KEY (user_id)
      REFERENCES users(user_id)
      ON DELETE CASCADE
      ON UPDATE CASCADE
    `);
    console.log('✓ Created fk_validations_user_id');

    // Verify final state
    const [finalFKs] = await connection.query(`
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

    console.log('\nFinal foreign keys:');
    finalFKs.forEach(fk => {
      console.log(`  - ${fk.CONSTRAINT_NAME}: ${fk.COLUMN_NAME} -> ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

cleanupForeignKeys();
