import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { dbConfig } from '../config/dbConfigs.js';

dotenv.config();

async function dropEmail2() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    console.log('Dropping email_2 index...\n');

    await connection.query('ALTER TABLE users DROP INDEX `email_2`');
    console.log('✓ Dropped email_2');

    // Verify final indexes
    const [indexes] = await connection.query('SHOW INDEX FROM users');
    console.log(`\nFinal index count: ${indexes.length}`);
    console.log('\nRemaining indexes:');

    const groups = {};
    indexes.forEach(index => {
      if (!groups[index.Key_name]) {
        groups[index.Key_name] = [];
      }
      groups[index.Key_name].push(index);
    });

    Object.keys(groups).forEach(keyName => {
      console.log(`  - ${keyName}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

dropEmail2();
