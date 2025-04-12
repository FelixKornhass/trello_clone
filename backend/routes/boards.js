/**
 * Board Routes
 * 
 * This file defines the API routes for board management,
 * including CRUD operations for boards, lists, and tasks.
 * All routes are protected by authentication middleware.
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Board } = require('../models/associations');

// Get all boards for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    console.log('Fetching boards for user:', req.user.id);
    const boards = await Board.findAll({ 
      where: { userId: req.user.id },
      order: [['position', 'ASC']] // Sort boards by position
    });
    console.log('Found boards:', boards);
    res.json(boards);
  } catch (error) {
    console.error('Error in GET /boards:', error);
    res.status(500).json({ 
      message: 'Error fetching boards',
      error: error.message,
      stack: error.stack
    });
  }
});

// Get a single board by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const board = await Board.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }
    res.json(board);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching board' });
  }
});

// Create a new board
router.post('/', auth, async (req, res) => {
  try {
    console.log('Creating board for user:', req.user.id);
    console.log('Board data:', req.body);
    
    if (!req.body.name) {
      console.log('Board name is required');
      return res.status(400).json({ message: 'Board name is required' });
    }

    const board = await Board.create({
      name: req.body.name,
      description: req.body.description || null,
      position: req.body.position || 0,
      userId: req.user.id,
      lists: [] // Explicitly set empty array
    });
    
    console.log('Board created successfully:', board.toJSON());
    res.status(201).json(board.toJSON());
  } catch (error) {
    console.error('Error in POST /boards:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      message: 'Error creating board',
      error: error.message,
      stack: error.stack
    });
  }
});

// Update an existing board
router.put('/:id', auth, async (req, res) => {
  try {
    const board = await Board.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }
    
    // Update only the fields that are provided
    const updateData = {};
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.position !== undefined) updateData.position = req.body.position;
    if (req.body.lists) updateData.lists = req.body.lists;
    
    await board.update(updateData);
    res.json(board);
  } catch (error) {
    console.error('Error updating board:', error);
    res.status(500).json({ message: 'Error updating board' });
  }
});

// Delete a board
router.delete('/:id', auth, async (req, res) => {
  try {
    const board = await Board.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }
    await board.destroy();
    res.json({ message: 'Board deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting board' });
  }
});

// Add a list to a board
router.post('/:id/lists', auth, async (req, res) => {
  try {
    const board = await Board.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }
    const lists = board.lists || [];
    const newList = {
      id: Date.now().toString(),
      title: req.body.title,
      tasks: []
    };
    lists.push(newList);
    board.lists = lists;
    await board.save();
    res.status(201).json(newList);
  } catch (error) {
    res.status(500).json({ message: 'Error adding list' });
  }
});

// Update a list in a board
router.put('/:id/lists/:listId', auth, async (req, res) => {
  try {
    const board = await Board.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }
    const lists = board.lists || [];
    const listIndex = lists.findIndex(list => list.id === req.params.listId);
    if (listIndex === -1) {
      return res.status(404).json({ message: 'List not found' });
    }
    lists[listIndex] = { ...lists[listIndex], ...req.body };
    board.lists = lists;
    await board.save();
    res.json(lists[listIndex]);
  } catch (error) {
    res.status(500).json({ message: 'Error updating list' });
  }
});

// Delete a list from a board
router.delete('/:id/lists/:listId', auth, async (req, res) => {
  try {
    const board = await Board.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }
    const lists = board.lists || [];
    const listIndex = lists.findIndex(list => list.id === req.params.listId);
    if (listIndex === -1) {
      return res.status(404).json({ message: 'List not found' });
    }
    lists.splice(listIndex, 1);
    board.lists = lists;
    await board.save();
    res.json({ message: 'List deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting list' });
  }
});

// Add a task to a list
router.post('/:id/lists/:listId/tasks', auth, async (req, res) => {
  try {
    const board = await Board.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }
    const lists = board.lists || [];
    const listIndex = lists.findIndex(list => list.id === req.params.listId);
    if (listIndex === -1) {
      return res.status(404).json({ message: 'List not found' });
    }
    const newTask = {
      id: Date.now().toString(),
      title: req.body.title,
      description: req.body.description || '',
      completed: false
    };
    lists[listIndex].tasks.push(newTask);
    board.lists = lists;
    await board.save();
    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ message: 'Error adding task' });
  }
});

// Update a task in a list
router.put('/:id/lists/:listId/tasks/:taskId', auth, async (req, res) => {
  try {
    const board = await Board.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }
    const lists = board.lists || [];
    const listIndex = lists.findIndex(list => list.id === req.params.listId);
    if (listIndex === -1) {
      return res.status(404).json({ message: 'List not found' });
    }
    const taskIndex = lists[listIndex].tasks.findIndex(task => task.id === req.params.taskId);
    if (taskIndex === -1) {
      return res.status(404).json({ message: 'Task not found' });
    }
    lists[listIndex].tasks[taskIndex] = { ...lists[listIndex].tasks[taskIndex], ...req.body };
    board.lists = lists;
    await board.save();
    res.json(lists[listIndex].tasks[taskIndex]);
  } catch (error) {
    res.status(500).json({ message: 'Error updating task' });
  }
});

// Delete a task from a list
router.delete('/:id/lists/:listId/tasks/:taskId', auth, async (req, res) => {
  try {
    const board = await Board.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }
    const lists = board.lists || [];
    const listIndex = lists.findIndex(list => list.id === req.params.listId);
    if (listIndex === -1) {
      return res.status(404).json({ message: 'List not found' });
    }
    const taskIndex = lists[listIndex].tasks.findIndex(task => task.id === req.params.taskId);
    if (taskIndex === -1) {
      return res.status(404).json({ message: 'Task not found' });
    }
    lists[listIndex].tasks.splice(taskIndex, 1);
    board.lists = lists;
    await board.save();
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting task' });
  }
});

// Update a board's position
router.put('/:id/position', auth, async (req, res) => {
  try {
    const board = await Board.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }
    
    // Update the position
    await board.update({ position: req.body.position });
    
    res.json({ message: 'Board position updated', board });
  } catch (error) {
    console.error('Error updating board position:', error);
    res.status(500).json({ message: 'Error updating board position' });
  }
});

// Update a board's description
router.put('/:id/description', auth, async (req, res) => {
  try {
    const board = await Board.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }
    
    // Update the description
    await board.update({ description: req.body.description });
    
    res.json({ message: 'Board description updated', board });
  } catch (error) {
    console.error('Error updating board description:', error);
    res.status(500).json({ message: 'Error updating board description' });
  }
});

module.exports = router; 