/**
 * Authentication Routes
 * 
 * This file defines the API routes for user authentication,
 * including registration and login endpoints.
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register a new user
router.post('/register', async (req, res) => {
  try {
    // Extract user data from request body
    const { name, email, password } = req.body;

    // Check if user already exists with the same email
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user in the database
    const user = await User.create({ name, email, password });

    // Generate JWT token for the new user
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Return token and user data (excluding password)
    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        boardsTitle: user.boardsTitle || 'My Boards'
      }
    });
  } catch (error) {
    // Handle any errors during registration
    res.status(500).json({ message: error.message });
  }
});

// Login an existing user
router.post('/login', async (req, res) => {
  try {
    // Extract credentials from request body
    const { email, password } = req.body;
    console.log('Login attempt for email:', email);

    // Find user by email
    const user = await User.findOne({ where: { email } });
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Verify password using the model's comparePassword method
    console.log('Comparing passwords...');
    const isMatch = await user.comparePassword(password);
    console.log('Password match:', isMatch);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token for the authenticated user
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Return token and user data (excluding password)
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        boardsTitle: user.boardsTitle || 'My Boards'
      }
    });
  } catch (error) {
    // Handle any errors during login
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 