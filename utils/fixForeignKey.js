import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { dbConfig } from '../config/dbConfigs.js';

dotenv.config();

async function fixForeignKey() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    console.log('Fixing foreign key constraints...\n');

    // Check if validations table exists
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'validations'"
    );

    if (tables.length === 0) {
      console.log('Validations table does not exist yet. Nothing to fix.');
      return;
    }

    // Get foreign key constraints
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

    console.log('Found foreign key constraints:');
    constraints.forEach(c => {
      console.log(`  - ${c.CONSTRAINT_NAME}: ${c.TABLE_NAME}.${c.COLUMN_NAME} -> ${c.REFERENCED_TABLE_NAME}.${c.REFERENCED_COLUMN_NAME}`);
    });

    // Drop each foreign key constraint
    for (const constraint of constraints) {
      try {
        console.log(`\nDropping foreign key: ${constraint.CONSTRAINT_NAME}`);
        await connection.query(
          `ALTER TABLE validations DROP FOREIGN KEY \`${constraint.CONSTRAINT_NAME}\``
        );
        console.log(`✓ Dropped ${constraint.CONSTRAINT_NAME}`);
      } catch (error) {
        console.error(`✗ Failed to drop ${constraint.CONSTRAINT_NAME}:`, error.message);
      }
    }

    // Now drop the user_id_31 index
    try {
      console.log('\nDropping index: user_id_31');
      await connection.query(
        'ALTER TABLE users DROP INDEX `user_id_31`'
      );
      console.log('✓ Dropped user_id_31');
    } catch (error) {
      console.error('✗ Failed to drop user_id_31:', error.message);
    }

    // Verify users table indexes
    const [finalIndexes] = await connection.query(
      'SHOW INDEX FROM users'
    );

    console.log(`\n✓ Done! Final index count on users table: ${finalIndexes.length}`);
    console.log('\nRemaining indexes:');
    const finalGroups = {};
    finalIndexes.forEach(index => {
      if (!finalGroups[index.Key_name]) {
        finalGroups[index.Key_name] = [];
      }
      finalGroups[index.Key_name].push(index);
    });

    Object.keys(finalGroups).forEach(keyName => {
      console.log(`  - ${keyName}`);
    });

  } catch (error) {
    console.error('Error fixing foreign key:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixForeignKey();
