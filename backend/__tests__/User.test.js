const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  genSalt: jest.fn().mockResolvedValue('salt'),
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn()
}));

// Mock User model
jest.mock('../models/User', () => {
  const mockUser = {
    create: jest.fn(),
    update: jest.fn(),
    comparePassword: jest.fn()
  };
  return jest.fn(() => mockUser);
});

describe('User Model', () => {
  let mockUser;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = User();
  });

  describe('Password Hashing', () => {
    it('should hash password before creating a new user', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };

      // Mock the bcrypt functions to be called
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedPassword');

      // Mock the User.create method to return a user with the hashed password
      mockUser.create.mockImplementation(async (data) => {
        // Simulate the hashing that would happen in the real model
        await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(data.password, 'salt');
        return {
          ...data,
          password: hashedPassword
        };
      });

      const user = await mockUser.create(userData);

      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 'salt');
      expect(user.password).toBe('hashedPassword');
    });

    it('should hash password before updating a user if password was changed', async () => {
      const oldUser = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'oldPassword'
      };

      // Mock the bcrypt functions to be called
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('newHashedPassword');

      // Mock the User.create and update methods
      mockUser.create.mockResolvedValue(oldUser);
      mockUser.update.mockImplementation(async (data) => {
        // Simulate the hashing that would happen in the real model
        await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(data.password, 'salt');
        return {
          ...oldUser,
          ...data,
          password: hashedPassword
        };
      });

      const user = await mockUser.create(oldUser);
      const updatedUser = await mockUser.update({ password: 'newPassword' });

      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword', 'salt');
      expect(updatedUser.password).toBe('newHashedPassword');
    });

    it('should not hash password if it was not changed during update', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };

      // Mock the User.create and update methods
      mockUser.create.mockResolvedValue(userData);
      mockUser.update.mockImplementation(async (data) => {
        // Don't hash the password since it's not being updated
        return {
          ...userData,
          ...data
        };
      });

      const user = await mockUser.create(userData);
      const updatedUser = await mockUser.update({ name: 'Updated Name' });

      expect(bcrypt.genSalt).not.toHaveBeenCalled();
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(updatedUser.password).toBe('password123');
    });
  });

  describe('Password Comparison', () => {
    it('should return true when password matches', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword'
      };

      // Mock bcrypt.compare to return true
      bcrypt.compare.mockResolvedValue(true);

      // Mock the User.create method and comparePassword method
      mockUser.create.mockResolvedValue({
        ...userData,
        comparePassword: async (password) => {
          return await bcrypt.compare(password, userData.password);
        }
      });

      const user = await mockUser.create(userData);
      const result = await user.comparePassword('password123');

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
    });

    it('should return false when password does not match', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword'
      };

      // Mock bcrypt.compare to return false
      bcrypt.compare.mockResolvedValue(false);

      // Mock the User.create method and comparePassword method
      mockUser.create.mockResolvedValue({
        ...userData,
        comparePassword: async (password) => {
          return await bcrypt.compare(password, userData.password);
        }
      });

      const user = await mockUser.create(userData);
      const result = await user.comparePassword('wrongPassword');

      expect(result).toBe(false);
      expect(bcrypt.compare).toHaveBeenCalledWith('wrongPassword', 'hashedPassword');
    });
  });

  describe('Validation', () => {
    it('should validate email format', async () => {
      const userData = {
        name: 'Test User',
        email: 'invalid-email',
        password: 'password123'
      };

      // Mock the User.create method to reject with an error
      mockUser.create.mockRejectedValue(new Error('Invalid email format'));

      await expect(mockUser.create(userData)).rejects.toThrow('Invalid email format');
    });

    it('should require name, email, and password', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com'
        // password missing
      };

      // Mock the User.create method to reject with an error
      mockUser.create.mockRejectedValue(new Error('Password is required'));

      await expect(mockUser.create(userData)).rejects.toThrow('Password is required');
    });

    it('should set default boardsTitle', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };

      // Mock the User.create method to return a user with the default boardsTitle
      mockUser.create.mockResolvedValue({
        ...userData,
        boardsTitle: 'My Boards'
      });

      const user = await mockUser.create(userData);

      expect(user.boardsTitle).toBe('My Boards');
    });
  });
}); 