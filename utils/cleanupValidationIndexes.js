import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { dbConfig } from '../config/dbConfigs.js';

dotenv.config();

async function cleanupValidationIndexes() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    console.log('Cleaning up validations table indexes...\n');

    // Get all indexes
    const [indexes] = await connection.query('SHOW INDEX FROM validations');
    console.log(`Current index count: ${indexes.length}\n`);

    // Find all duplicate token indexes (token_2, token_3, etc.)
    const indexesToDrop = new Set();
    indexes.forEach(index => {
      const keyName = index.Key_name;
      // Drop any index starting with "token_" followed by a number
      if (/^token_\d+$/.test(keyName)) {
        indexesToDrop.add(keyName);
      }
    });

    console.log(`Found ${indexesToDrop.size} duplicate indexes to drop:\n`);
    indexesToDrop.forEach(idx => console.log(`  - ${idx}`));

    // Drop each duplicate index
    for (const indexName of indexesToDrop) {
      try {
        console.log(`\nDropping ${indexName}...`);
        await connection.query(`ALTER TABLE validations DROP INDEX \`${indexName}\``);
        console.log(`✓ Dropped ${indexName}`);
      } catch (error) {
        console.error(`✗ Failed to drop ${indexName}:`, error.message);
      }
    }

    // Verify final state
    const [finalIndexes] = await connection.query('SHOW INDEX FROM validations');
    console.log(`\n✓ Done! Final index count: ${finalIndexes.length}`);

    console.log('\nFinal indexes:');
    const groups = {};
    finalIndexes.forEach(index => {
      if (!groups[index.Key_name]) {
        groups[index.Key_name] = [];
      }
      groups[index.Key_name].push(index);
    });

    Object.keys(groups).forEach(keyName => {
      const columns = groups[keyName].map(i => i.Column_name).join(', ');
      const unique = groups[keyName][0].Non_unique === 0 ? 'UNIQUE' : 'NON-UNIQUE';
      console.log(`  - ${keyName}: ${columns} (${unique})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

cleanupValidationIndexes();
