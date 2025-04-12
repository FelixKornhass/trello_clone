/**
 * User Model
 * 
 * This file defines the User model using Sequelize ORM.
 * It includes fields for name, email, and password, with password hashing
 * using bcrypt for security.
 */

const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

// Define the User model with its attributes
const User = sequelize.define('User', {
  // User's full name
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // User's email address (must be unique and valid)
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  // User's password (will be hashed before storage)
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  boardsTitle: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'My Boards'
  }
}, {
  // Hooks to automatically hash password before saving
  hooks: {
    // Hash password before creating a new user
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    // Hash password before updating a user if password was changed
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Instance method to check if a provided password matches the stored hash
User.prototype.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = User; 