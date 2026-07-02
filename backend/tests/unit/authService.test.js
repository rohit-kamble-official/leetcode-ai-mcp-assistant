/**
 * tests/unit/authService.test.js
 *
 * WHY: Tests the authentication business logic in isolation.
 *      We mock the repositories so we don't need a real database.
 * HOW: jest.unstable_mockModule replaces ES modules with mock implementations.
 */

import { jest } from '@jest/globals';

// --- Mock dependencies BEFORE importing the module under test ---
const mockUserRepo = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  emailExists: jest.fn(),
};

const mockTokenRepo = {
  save: jest.fn(),
  findByToken: jest.fn(),
  deleteByToken: jest.fn(),
  deleteAllForUser: jest.fn(),
};

const mockJwt = {
  sign: jest.fn(() => 'mock_token_123'),
  verify: jest.fn(),
  decode: jest.fn(() => ({ sub: 'user-id-123', exp: Math.floor(Date.now() / 1000) + 604800 })),
};

const mockBcrypt = {
  hash: jest.fn().mockResolvedValue('$2b$12$hashedpassword'),
  compare: jest.fn(),
};

jest.unstable_mockModule('../../src/repositories/userRepository.js', () => ({
  userRepository: mockUserRepo,
}));

jest.unstable_mockModule('../../src/repositories/tokenRepository.js', () => ({
  tokenRepository: mockTokenRepo,
}));

jest.unstable_mockModule('jsonwebtoken', () => ({ default: mockJwt }));
jest.unstable_mockModule('bcryptjs', () => ({ default: mockBcrypt }));

// Import AFTER mocking
const { authService } = await import('../../src/services/authService.js');

describe('authService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('register()', () => {
    const validUser = { name: 'Alice', email: 'alice@test.com', password: 'Password123' };

    it('should register a new user and return tokens', async () => {
      mockUserRepo.emailExists.mockResolvedValue(false);
      mockUserRepo.create.mockResolvedValue({
        id: 'user-id-123',
        name: 'Alice',
        email: 'alice@test.com',
        created_at: new Date(),
      });
      mockTokenRepo.save.mockResolvedValue(undefined);

      const result = await authService.register(validUser);

      expect(mockUserRepo.emailExists).toHaveBeenCalledWith('alice@test.com');
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw 409 if email already exists', async () => {
      mockUserRepo.emailExists.mockResolvedValue(true);

      await expect(authService.register(validUser)).rejects.toMatchObject({
        statusCode: 409,
        message: 'Email is already registered',
      });
    });
  });

  describe('login()', () => {
    it('should login with correct credentials', async () => {
      mockUserRepo.findByEmail.mockResolvedValue({
        id: 'user-id-123',
        name: 'Alice',
        email: 'alice@test.com',
        password_hash: '$2b$12$hashedpassword',
      });
      mockBcrypt.compare.mockResolvedValue(true);
      mockTokenRepo.save.mockResolvedValue(undefined);

      const result = await authService.login({ email: 'alice@test.com', password: 'Password123' });

      expect(result).toHaveProperty('accessToken');
      expect(result.user).not.toHaveProperty('password_hash');
    });

    it('should throw 401 if user not found', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({ email: 'notfound@test.com', password: 'pass' })
      ).rejects.toMatchObject({ statusCode: 401 });
    });

    it('should throw 401 if password is wrong', async () => {
      mockUserRepo.findByEmail.mockResolvedValue({
        id: 'user-id-123',
        password_hash: '$2b$12$hash',
      });
      mockBcrypt.compare.mockResolvedValue(false);

      await expect(
        authService.login({ email: 'alice@test.com', password: 'wrongpassword' })
      ).rejects.toMatchObject({ statusCode: 401 });
    });
  });

  describe('verifyAccessToken()', () => {
    it('should return decoded payload for valid token', () => {
      mockJwt.verify.mockReturnValue({ sub: 'user-id-123' });

      const payload = authService.verifyAccessToken('valid_token');
      expect(payload).toHaveProperty('sub', 'user-id-123');
    });

    it('should throw 401 for invalid token', () => {
      mockJwt.verify.mockImplementation(() => { throw new Error('invalid'); });

      expect(() => authService.verifyAccessToken('bad_token')).toThrow();
    });
  });
});
