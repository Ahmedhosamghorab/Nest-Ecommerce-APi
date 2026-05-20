export const createMockUserService = () => ({
  register: jest.fn(),
  login: jest.fn(),
  getCurrentUser: jest.fn(),
  getAll: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  setProfileImage: jest.fn(),
  deleteProfileImage: jest.fn(),
  verifyEmail: jest.fn(),
});
