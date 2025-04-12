const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const { User } = require('../models/associations');

// Mock the User model
jest.mock('../models/associations', () => ({
  User: {
    findByPk: jest.fn()
  }
}));

describe('Auth Middleware', () => {
  let mockReq;
  let mockRes;
  let nextFunction;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup mock request object
    mockReq = {
      header: jest.fn()
    };

    // Setup mock response object
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Setup mock next function
    nextFunction = jest.fn();

    // Set default JWT secret for testing
    process.env.JWT_SECRET = 'test-secret-key';
  });

  it('should return 401 if no token is provided', async () => {
    mockReq.header.mockReturnValue(null);

    await auth(mockReq, mockRes, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'No authentication token, access denied'
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 401 if token is invalid', async () => {
    mockReq.header.mockReturnValue('Bearer invalid-token');

    await auth(mockReq, mockRes, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Token verification failed, authorization denied',
      error: expect.any(String)
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 401 if user is not found', async () => {
    const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET);
    mockReq.header.mockReturnValue(`Bearer ${token}`);
    User.findByPk.mockResolvedValue(null);

    await auth(mockReq, mockRes, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'User not found'
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should attach user to request and call next if authentication is successful', async () => {
    const mockUser = { id: 1, name: 'Test User' };
    const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET);
    
    mockReq.header.mockReturnValue(`Bearer ${token}`);
    User.findByPk.mockResolvedValue(mockUser);

    await auth(mockReq, mockRes, nextFunction);

    expect(mockReq.user).toBe(mockUser);
    expect(nextFunction).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });

  it('should handle malformed Bearer token', async () => {
    mockReq.header.mockReturnValue('Bearer');

    await auth(mockReq, mockRes, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Token verification failed, authorization denied',
      error: expect.any(String)
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should handle expired tokens', async () => {
    const token = jwt.sign(
      { id: 1 },
      process.env.JWT_SECRET,
      { expiresIn: '1ms' }
    );
    
    // Wait for token to expire
    await new Promise(resolve => setTimeout(resolve, 10));
    
    mockReq.header.mockReturnValue(`Bearer ${token}`);

    await auth(mockReq, mockRes, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Token verification failed, authorization denied',
      error: expect.any(String)
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });
}); 