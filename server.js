import dotenv from 'dotenv';
import app from './app.js';
import initializeDatabase from './config/database.js';

dotenv.config();

const port = process.env.PORT || 8000;

// Initialize database before starting server
const startServer = async () => {
  try {
    // Initialize database pool
    await initializeDatabase();

    // Start server
    app.listen(port, () => {
      console.log(
        `🚀 Server is running successfully on port ${port}`
      );
    });
  } catch (error) {
    console.error(
      '❌ Failed to start server:',
      error.message
    );
    process.exit(1);
  }
};

startServer();
