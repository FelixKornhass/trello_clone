const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { User } = require('../models/associations');

// Get user by ID
router.get('/:userId', auth, async (req, res) => {
  try {
    // Ensure user can only access their own data
    if (req.user.id !== parseInt(req.params.userId)) {
      return res.status(403).json({ message: 'Not authorized to access this user data' });
    }

    const user = await User.findByPk(req.params.userId, {
      attributes: ['id', 'name', 'email', 'boardsTitle'] // Exclude password
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Error fetching user data' });
  }
});

// Update user
router.put('/:userId', auth, async (req, res) => {
  try {
    // Ensure user can only update their own data
    if (req.user.id !== parseInt(req.params.userId)) {
      return res.status(403).json({ message: 'Not authorized to update this user data' });
    }

    const user = await User.findByPk(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update allowed fields
    const allowedFields = ['name', 'email', 'boardsTitle'];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    }

    await user.save();
    
    // Return updated user without password
    const updatedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      boardsTitle: user.boardsTitle
    };
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error updating user data' });
  }
});

module.exports = router; 