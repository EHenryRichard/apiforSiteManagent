import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { dbConfig } from '../config/dbConfigs.js';

dotenv.config();

async function checkIndexes() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    console.log('Checking indexes on users table...\n');

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

    console.log('Indexes grouped by key name:');
    Object.keys(indexGroups).forEach(keyName => {
      console.log(`\n${keyName}:`);
      indexGroups[keyName].forEach(idx => {
        console.log(`  - Column: ${idx.Column_name}, Non_unique: ${idx.Non_unique}`);
      });
    });

  } catch (error) {
    console.error('Error checking indexes:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkIndexes();
