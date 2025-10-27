import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { dbConfig } from '../config/dbConfigs.js';

dotenv.config();

async function fixIndexes() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    console.log('Fixing indexes on users table...\n');

    // Get all indexes
    const [indexes] = await connection.query(
      'SHOW INDEX FROM users'
    );

    console.log(`Total indexes found: ${indexes.length}\n`);

    // Group indexes by key name
    const indexGroups = {};
    indexes.forEach(index => {
      if (!indexGroups[index.Key_name]) {
        indexGroups[index.Key_name] = [];
      }
      indexGroups[index.Key_name].push(index);
    });

    // Drop all duplicate indexes (keep only the first one of each)
    const indexesToDrop = [];

    Object.keys(indexGroups).forEach(keyName => {
      // Skip PRIMARY key
      if (keyName === 'PRIMARY') return;

      // If this is a duplicate (email_2, email_3, etc. or user_id_2, user_id_3, etc.)
      if (keyName.includes('_')) {
        indexesToDrop.push(keyName);
      }
    });

    console.log(`Found ${indexesToDrop.length} duplicate indexes to drop\n`);

    // Drop each duplicate index
    for (const indexName of indexesToDrop) {
      try {
        console.log(`Dropping index: ${indexName}`);
        await connection.query(
          `ALTER TABLE users DROP INDEX \`${indexName}\``
        );
        console.log(`✓ Dropped ${indexName}`);
      } catch (error) {
        console.error(`✗ Failed to drop ${indexName}:`, error.message);
      }
    }

    // Verify final count
    const [finalIndexes] = await connection.query(
      'SHOW INDEX FROM users'
    );
    console.log(`\n✓ Done! Final index count: ${finalIndexes.length}`);

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
    console.error('Error fixing indexes:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixIndexes();
