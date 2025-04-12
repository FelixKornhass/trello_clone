const request = require('supertest');
const express = require('express');
const { Board } = require('../models/associations');

// Mock Board model
jest.mock('../models/associations', () => ({
  Board: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  }
}));

// Mock auth middleware
jest.mock('../middleware/auth', () => (req, res, next) => {
  req.user = { id: 1 };
  next();
});

const app = express();
app.use(express.json());
app.use('/api/boards', require('../routes/boards'));

describe('Board Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/boards', () => {
    it('should return all boards for the authenticated user', async () => {
      const mockBoards = [
        { id: 1, name: 'Board 1', userId: 1 },
        { id: 2, name: 'Board 2', userId: 1 }
      ];
      Board.findAll.mockResolvedValue(mockBoards);

      const response = await request(app)
        .get('/api/boards')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockBoards);
      expect(Board.findAll).toHaveBeenCalledWith({
        where: { userId: 1 },
        order: [['position', 'ASC']]
      });
    });

    it('should handle errors when fetching boards', async () => {
      Board.findAll.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/boards')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Error fetching boards');
    });
  });

  describe('GET /api/boards/:id', () => {
    it('should return a single board by ID', async () => {
      const mockBoard = { id: 1, name: 'Board 1', userId: 1 };
      Board.findOne.mockResolvedValue(mockBoard);

      const response = await request(app)
        .get('/api/boards/1')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockBoard);
      expect(Board.findOne).toHaveBeenCalledWith({
        where: { id: '1', userId: 1 }
      });
    });

    it('should return 404 if board not found', async () => {
      Board.findOne.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/boards/999')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Board not found');
    });
  });

  describe('POST /api/boards', () => {
    it('should create a new board', async () => {
      const newBoard = {
        name: 'New Board',
        description: 'Board description',
        position: 0,
        userId: 1,
        lists: [],
        toJSON: () => ({
          name: 'New Board',
          description: 'Board description',
          position: 0,
          userId: 1,
          lists: []
        })
      };
      Board.create.mockResolvedValue(newBoard);

      const response = await request(app)
        .post('/api/boards')
        .set('Authorization', 'Bearer mock-token')
        .send({
          name: 'New Board',
          description: 'Board description'
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(newBoard.toJSON());
      expect(Board.create).toHaveBeenCalledWith({
        name: 'New Board',
        description: 'Board description',
        position: 0,
        userId: 1,
        lists: []
      });
    });

    it('should return 400 if board name is missing', async () => {
      const response = await request(app)
        .post('/api/boards')
        .set('Authorization', 'Bearer mock-token')
        .send({
          description: 'Board description'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Board name is required');
    });
  });

  describe('PUT /api/boards/:id', () => {
    it('should update an existing board', async () => {
      const mockBoard = {
        id: 1,
        name: 'Updated Board',
        userId: 1,
        update: jest.fn().mockResolvedValue(true)
      };
      Board.findOne.mockResolvedValue(mockBoard);

      const response = await request(app)
        .put('/api/boards/1')
        .set('Authorization', 'Bearer mock-token')
        .send({
          name: 'Updated Board',
          description: 'Updated description'
        });

      expect(response.status).toBe(200);
      expect(mockBoard.update).toHaveBeenCalledWith({
        name: 'Updated Board',
        description: 'Updated description'
      });
    });

    it('should return 404 if board not found', async () => {
      Board.findOne.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/boards/999')
        .set('Authorization', 'Bearer mock-token')
        .send({
          name: 'Updated Board'
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Board not found');
    });
  });

  describe('DELETE /api/boards/:id', () => {
    it('should delete an existing board', async () => {
      const mockBoard = {
        id: 1,
        userId: 1,
        destroy: jest.fn().mockResolvedValue(true)
      };
      Board.findOne.mockResolvedValue(mockBoard);

      const response = await request(app)
        .delete('/api/boards/1')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Board deleted');
      expect(mockBoard.destroy).toHaveBeenCalled();
    });

    it('should return 404 if board not found', async () => {
      Board.findOne.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/boards/999')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Board not found');
    });
  });

  describe('List Management', () => {
    const mockBoard = {
      id: 1,
      userId: 1,
      lists: [],
      save: jest.fn().mockResolvedValue(true)
    };

    beforeEach(() => {
      Board.findOne.mockResolvedValue(mockBoard);
    });

    describe('POST /api/boards/:id/lists', () => {
      it('should add a new list to a board', async () => {
        const response = await request(app)
          .post('/api/boards/1/lists')
          .set('Authorization', 'Bearer mock-token')
          .send({
            title: 'New List'
          });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('title', 'New List');
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('tasks');
        expect(mockBoard.save).toHaveBeenCalled();
      });
    });

    describe('PUT /api/boards/:id/lists/:listId', () => {
      it('should update an existing list', async () => {
        mockBoard.lists = [{
          id: 'list1',
          title: 'Old Title',
          tasks: []
        }];

        const response = await request(app)
          .put('/api/boards/1/lists/list1')
          .set('Authorization', 'Bearer mock-token')
          .send({
            title: 'Updated Title'
          });

        expect(response.status).toBe(200);
        expect(response.body.title).toBe('Updated Title');
        expect(mockBoard.save).toHaveBeenCalled();
      });

      it('should return 404 if list not found', async () => {
        mockBoard.lists = [];

        const response = await request(app)
          .put('/api/boards/1/lists/nonexistent')
          .set('Authorization', 'Bearer mock-token')
          .send({
            title: 'Updated Title'
          });

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('message', 'List not found');
      });
    });

    describe('DELETE /api/boards/:id/lists/:listId', () => {
      it('should delete an existing list', async () => {
        mockBoard.lists = [{
          id: 'list1',
          title: 'List to Delete',
          tasks: []
        }];

        const response = await request(app)
          .delete('/api/boards/1/lists/list1')
          .set('Authorization', 'Bearer mock-token');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'List deleted');
        expect(mockBoard.lists).toHaveLength(0);
        expect(mockBoard.save).toHaveBeenCalled();
      });
    });
  });

  describe('Task Management', () => {
    const mockBoard = {
      id: 1,
      userId: 1,
      lists: [{
        id: 'list1',
        title: 'Test List',
        tasks: []
      }],
      save: jest.fn().mockResolvedValue(true)
    };

    beforeEach(() => {
      Board.findOne.mockResolvedValue(mockBoard);
    });

    describe('POST /api/boards/:id/lists/:listId/tasks', () => {
      it('should add a new task to a list', async () => {
        const response = await request(app)
          .post('/api/boards/1/lists/list1/tasks')
          .set('Authorization', 'Bearer mock-token')
          .send({
            title: 'New Task',
            description: 'Task description'
          });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('title', 'New Task');
        expect(response.body).toHaveProperty('description', 'Task description');
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('completed', false);
        expect(mockBoard.save).toHaveBeenCalled();
      });
    });

    describe('PUT /api/boards/:id/lists/:listId/tasks/:taskId', () => {
      it('should update an existing task', async () => {
        mockBoard.lists[0].tasks = [{
          id: 'task1',
          title: 'Old Task',
          description: 'Old description',
          completed: false
        }];

        const response = await request(app)
          .put('/api/boards/1/lists/list1/tasks/task1')
          .set('Authorization', 'Bearer mock-token')
          .send({
            title: 'Updated Task',
            completed: true
          });

        expect(response.status).toBe(200);
        expect(response.body.title).toBe('Updated Task');
        expect(response.body.completed).toBe(true);
        expect(mockBoard.save).toHaveBeenCalled();
      });

      it('should return 404 if task not found', async () => {
        const response = await request(app)
          .put('/api/boards/1/lists/list1/tasks/nonexistent')
          .set('Authorization', 'Bearer mock-token')
          .send({
            title: 'Updated Task'
          });

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('message', 'Task not found');
      });
    });
  });
}); 