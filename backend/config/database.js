/**
 * Database Configuration
 * 
 * This file configures the Sequelize ORM connection to the MySQL database.
 * It uses environment variables for configuration with fallback values.
 */

const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Create Sequelize instance with database connection parameters
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false
  }
);

// Überprüfung der erforderlichen Umgebungsvariablen
if (!process.env.DB_NAME || !process.env.DB_USER || !process.env.DB_PASSWORD) {
  throw new Error('Required database environment variables are missing');
}

// Export the Sequelize instance for use in other files
module.exports = sequelize; 