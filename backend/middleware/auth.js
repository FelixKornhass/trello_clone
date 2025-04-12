/**
 * Authentication Middleware
 * 
 * This middleware verifies JWT tokens for protected routes.
 * It extracts the token from the Authorization header, verifies it,
 * and attaches the user to the request object if valid.
 */

const jwt = require('jsonwebtoken');
const { User } = require('../models/associations');

// Middleware function to authenticate requests
module.exports = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    // Check if token exists
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    // Verify the token using JWT
    console.log('Verifying token...');
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('Token verified:', verified);

    // Find the user in the database using the ID from the token
    const user = await User.findByPk(verified.id);
    if (!user) {
      console.log('User not found in database');
      return res.status(401).json({ message: 'User not found' });
    }

    // Attach the user to the request object and proceed
    console.log('User found:', user.id);
    req.user = user;
    next();
  } catch (err) {
    // Handle any errors during authentication
    console.error('Auth middleware error:', err);
    res.status(401).json({ 
      message: 'Token verification failed, authorization denied',
      error: err.message
    });
  }
}; 