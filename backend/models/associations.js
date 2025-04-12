/**
 * Model Associations
 * 
 * This file defines the relationships between models in the application.
 * It sets up the one-to-many relationship between Users and Boards.
 */

const User = require('./User');
const Board = require('./Board');

// Set up associations between User and Board models
// A User can have many Boards (one-to-many relationship)
User.hasMany(Board, {
  foreignKey: 'userId',
  as: 'boards'
});

// A Board belongs to one User
Board.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Export both models for use in other files
module.exports = {
  User,
  Board
}; 