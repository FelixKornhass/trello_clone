const Board = require('../models/Board');

describe('Board Model', () => {
  describe('Validation', () => {
    it('should require a name', async () => {
      const boardData = {
        userId: 1
        // name missing
      };

      await expect(Board.create(boardData)).rejects.toThrow();
    });

    it('should require a userId', async () => {
      const boardData = {
        name: 'Test Board'
        // userId missing
      };

      await expect(Board.create(boardData)).rejects.toThrow();
    });

    it('should set default position to 0', async () => {
      const boardData = {
        name: 'Test Board',
        userId: 1
      };

      const board = await Board.create(boardData);

      expect(board.position).toBe(0);
    });

    it('should allow custom position', async () => {
      const boardData = {
        name: 'Test Board',
        userId: 1,
        position: 2
      };

      const board = await Board.create(boardData);

      expect(board.position).toBe(2);
    });
  });

  describe('Lists JSON Handling', () => {
    it('should initialize with empty lists array', async () => {
      const boardData = {
        name: 'Test Board',
        userId: 1
      };

      const board = await Board.create(boardData);

      expect(board.lists).toEqual([]);
    });

    it('should store and retrieve lists correctly', async () => {
      const boardData = {
        name: 'Test Board',
        userId: 1,
        lists: [
          {
            id: 'list1',
            title: 'List 1',
            tasks: []
          }
        ]
      };

      const board = await Board.create(boardData);

      expect(board.lists).toEqual(boardData.lists);
    });

    it('should handle invalid JSON in lists getter', async () => {
      const board = await Board.create({
        name: 'Test Board',
        userId: 1
      });

      // Manually set invalid JSON
      board.setDataValue('lists', 'invalid-json');

      expect(board.lists).toEqual([]);
    });

    it('should handle invalid JSON in lists setter', async () => {
      const board = await Board.create({
        name: 'Test Board',
        userId: 1
      });

      // Try to set invalid value
      board.lists = null;

      expect(board.getDataValue('lists')).toBe('[]');
    });

    it('should handle complex list structures', async () => {
      const complexLists = [
        {
          id: 'list1',
          title: 'List 1',
          tasks: [
            {
              id: 'task1',
              title: 'Task 1',
              description: 'Description 1',
              completed: false
            }
          ]
        },
        {
          id: 'list2',
          title: 'List 2',
          tasks: [
            {
              id: 'task2',
              title: 'Task 2',
              description: 'Description 2',
              completed: true
            }
          ]
        }
      ];

      const board = await Board.create({
        name: 'Test Board',
        userId: 1,
        lists: complexLists
      });

      expect(board.lists).toEqual(complexLists);
    });
  });

  describe('Description and Custom Title', () => {
    it('should allow null description', async () => {
      const boardData = {
        name: 'Test Board',
        userId: 1,
        description: null
      };

      const board = await Board.create(boardData);

      expect(board.description).toBeNull();
    });

    it('should allow null customTitle', async () => {
      const boardData = {
        name: 'Test Board',
        userId: 1,
        customTitle: null
      };

      const board = await Board.create(boardData);

      expect(board.customTitle).toBeNull();
    });

    it('should store and retrieve description', async () => {
      const description = 'This is a test board description';
      const boardData = {
        name: 'Test Board',
        userId: 1,
        description
      };

      const board = await Board.create(boardData);

      expect(board.description).toBe(description);
    });

    it('should store and retrieve customTitle', async () => {
      const customTitle = 'My Custom Board Title';
      const boardData = {
        name: 'Test Board',
        userId: 1,
        customTitle
      };

      const board = await Board.create(boardData);

      expect(board.customTitle).toBe(customTitle);
    });
  });
}); 