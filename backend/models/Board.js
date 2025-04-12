/**
 * Board Model
 * 
 * This file defines the Board model using Sequelize ORM.
 * It includes fields for name, userId, and lists (stored as JSON).
 * The lists field has custom getter and setter methods to handle JSON serialization.
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Define the Board model with its attributes
const Board = sequelize.define('Board', {
  // Board name
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // Board description
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Custom title for the board (user-specific)
  customTitle: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Foreign key to the User who owns this board
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  // Position field to track the order of boards
  position: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  // JSON field to store lists and their cards
  lists: {
    type: DataTypes.JSON,
    defaultValue: [],
    // Custom getter to parse JSON string to object
    get() {
      const raw = this.getDataValue('lists');
      if (!raw) return [];
      try {
        return JSON.parse(raw);
      } catch (e) {
        console.error('Error parsing lists JSON:', e);
        return [];
      }
    },
    // Custom setter to stringify object to JSON
    set(value) {
      try {
        this.setDataValue('lists', JSON.stringify(value || []));
      } catch (e) {
        console.error('Error stringifying lists:', e);
        this.setDataValue('lists', JSON.stringify([]));
      }
    }
  }
});

module.exports = Board; 