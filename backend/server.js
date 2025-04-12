/**
 * Main Server File
 * 
 * This file initializes the Express server, sets up middleware,
 * connects to the database, and defines API routes.
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const boardRoutes = require('./routes/boards');
const userRoutes = require('./routes/users');
const sequelize = require('./config/database');

// Import models and set up associations
const { User, Board } = require('./models/associations');

// Load environment variables from .env file
dotenv.config();

// Initialize Express application
const app = express();

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse JSON request bodies

// Test database connection and sync models
const startServer = async () => {
  try {
    // Test connection to the database
    console.log('Attempting to connect to database...');
    await sequelize.authenticate();
    console.log('Connected to MySQL database');

    // Sync models (alter: true will update table structure without dropping data)
    console.log('Starting database synchronization...');
    await sequelize.sync({ alter: true });
    console.log('Database synchronized');

    // Check if test user exists, create if not
    const testUser = await User.findOne({ where: { email: 'test@example.com' } });
    if (!testUser) {
      const newTestUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
      console.log('Test user created:', newTestUser.id);
    } else {
      console.log('Test user already exists:', testUser.id);
    }

    // Start server on specified port
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    // Log detailed error information if server startup fails
    console.error('Server startup error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
};

// API Routes
app.use('/api/auth', authRoutes); // Authentication routes
app.use('/api/boards', boardRoutes); // Board management routes
app.use('/api/users', userRoutes); // User management routes

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Application error:', err);
  console.error('Error stack:', err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: err.message,
    stack: err.stack
  });
});

// Start the server
startServer(); 