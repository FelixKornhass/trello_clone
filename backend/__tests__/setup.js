// Set test environment variables
process.env.JWT_SECRET = 'test-secret-key';
process.env.NODE_ENV = 'test';

// Mock console methods to keep test output clean
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Add Jest globals that might be missing
global.beforeAll = jest.fn((fn) => fn());
global.afterAll = jest.fn((fn) => fn());
global.beforeEach = jest.fn((fn) => fn());
global.afterEach = jest.fn((fn) => fn()); 