import 'reflect-metadata';

// Global test setup
beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.DB_HOST = 'localhost';
  process.env.DB_PORT = '3306';
  process.env.DB_USERNAME = 'test';
  process.env.DB_PASSWORD = 'test';
  process.env.DB_NAME = 'test_db';
  process.env.PAYMOB_SECRET_KEY = 'test-paymob-secret';
  process.env.PAYMOB_PUBLIC_KEY = 'test-paymob-public';
  process.env.PAYMOB_INTEGRATION_ID = '123456';
  process.env.PAYMOB_WEBHOOK_URL = 'http://localhost:3000/webhook';
  process.env.FRONTEND_URL = 'http://localhost:3001';
  process.env.MAIL_HOST = 'smtp.mailtrap.io';
  process.env.MAIL_PORT = '2525';
  process.env.MAIL_USER = 'test';
  process.env.MAIL_PASS = 'test';
});

// Global test teardown
afterAll(() => {
  // Clean up any global resources
});

// Mock console methods in tests to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
