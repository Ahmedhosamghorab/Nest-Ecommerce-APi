export const createMockAuthService = () => ({
  register: jest.fn(),
  login: jest.fn(),
  hashPassword: jest.fn(),
  comparePasswords: jest.fn(),
  generateToken: jest.fn(),
});
