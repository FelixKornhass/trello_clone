const request = require('supertest');
const express = require('express');
const { User } = require('../models/associations');

// Mock User model
jest.mock('../models/associations', () => ({
  User: {
    findByPk: jest.fn()
  }
}));

// Mock auth middleware
jest.mock('../middleware/auth', () => (req, res, next) => {
  req.user = { id: 1 };
  next();
});

const app = express();
app.use(express.json());
app.use('/api/users', require('../routes/users'));

describe('User Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/users/:userId', () => {
    it('should return user data for authenticated user', async () => {
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        boardsTitle: 'My Boards'
      };
      User.findByPk.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/users/1')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUser);
      expect(User.findByPk).toHaveBeenCalledWith('1', {
        attributes: ['id', 'name', 'email', 'boardsTitle']
      });
    });

    it('should return 403 if user tries to access another user\'s data', async () => {
      const response = await request(app)
        .get('/api/users/2')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Not authorized to access this user data');
    });

    it('should return 404 if user not found', async () => {
      User.findByPk.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/users/1')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'User not found');
    });
  });

  describe('PUT /api/users/:userId', () => {
    it('should update user data for authenticated user', async () => {
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        boardsTitle: 'My Boards',
        save: jest.fn().mockResolvedValue(true)
      };
      User.findByPk.mockResolvedValue(mockUser);

      const response = await request(app)
        .put('/api/users/1')
        .set('Authorization', 'Bearer mock-token')
        .send({
          name: 'Updated Name',
          boardsTitle: 'Updated Boards'
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Name');
      expect(response.body.boardsTitle).toBe('Updated Boards');
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should return 403 if user tries to update another user\'s data', async () => {
      const response = await request(app)
        .put('/api/users/2')
        .set('Authorization', 'Bearer mock-token')
        .send({
          name: 'Updated Name'
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Not authorized to update this user data');
    });

    it('should return 404 if user not found', async () => {
      User.findByPk.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/users/1')
        .set('Authorization', 'Bearer mock-token')
        .send({
          name: 'Updated Name'
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'User not found');
    });

    it('should only update allowed fields', async () => {
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        boardsTitle: 'My Boards',
        save: jest.fn().mockResolvedValue(true)
      };
      User.findByPk.mockResolvedValue(mockUser);

      const response = await request(app)
        .put('/api/users/1')
        .set('Authorization', 'Bearer mock-token')
        .send({
          name: 'Updated Name',
          password: 'newpassword', // This should be ignored
          role: 'admin' // This should be ignored
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Name');
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('role');
      expect(mockUser.save).toHaveBeenCalled();
    });
  });
}); 