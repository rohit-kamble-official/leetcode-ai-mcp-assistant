/**
 * tests/integration/auth.test.js
 *
 * WHY: Integration tests verify the full Express request→response cycle
 *      including routing, middleware, validation, controllers, and services.
 * HOW: supertest makes real HTTP requests to our app in-process.
 *      All DB/Redis/external calls are mocked via jest.unstable_mockModule.
 */

import { jest } from '@jest/globals';
import request from 'supertest';

// --- Infrastructure mocks ---
jest.unstable_mockModule('../../src/config/database.js', () => ({
  default: { query: jest.fn() },
  connectDatabase: jest.fn().mockResolvedValue(undefined),
}));

jest.unstable_mockModule('../../src/config/redis.js', () => ({
  default: {
    get: jest.fn().mockResolvedValue(null),
    setex: jest.fn().mockResolvedValue('OK'),
    connect: jest.fn().mockResolvedValue(undefined),
  },
  connectRedis: jest.fn().mockResolvedValue(undefined),
}));

// --- Repository mocks ---
const mockUserRepo = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  emailExists: jest.fn(),
};

const mockTokenRepo = {
  save: jest.fn().mockResolvedValue(undefined),
  findByToken: jest.fn(),
  deleteByToken: jest.fn().mockResolvedValue(true),
  deleteAllForUser: jest.fn(),
};

jest.unstable_mockModule('../../src/repositories/userRepository.js', () => ({
  userRepository: mockUserRepo,
}));

jest.unstable_mockModule('../../src/repositories/tokenRepository.js', () => ({
  tokenRepository: mockTokenRepo,
}));

// --- JWT and bcrypt mocks ---
jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    sign: jest.fn(() => 'mock.jwt.token'),
    verify: jest.fn(() => ({ sub: 'user-123', exp: Date.now() / 1000 + 900 })),
    decode: jest.fn(() => ({ sub: 'user-123', exp: Date.now() / 1000 + 604800 })),
  },
}));

const mockBcrypt = {
  hash: jest.fn().mockResolvedValue('$2b$12$hashed'),
  compare: jest.fn(),
};

jest.unstable_mockModule('bcryptjs', () => ({ default: mockBcrypt }));

// Import app after mocks are registered
const app = (await import('../../src/app.js')).default;

const MOCK_USER = {
  id: 'user-123',
  name: 'Test User',
  email: 'test@example.com',
  created_at: new Date().toISOString(),
};

describe('Auth API — Integration Tests', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('POST /api/v1/auth/register', () => {
    const payload = { name: 'Test User', email: 'test@example.com', password: 'Password123' };

    it('201 — creates user and returns tokens', async () => {
      mockUserRepo.emailExists.mockResolvedValue(false);
      mockUserRepo.create.mockResolvedValue(MOCK_USER);

      const res = await request(app).post('/api/v1/auth/register').send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.data.user).not.toHaveProperty('password_hash');
    });

    it('400 — rejects invalid email', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({ ...payload, email: 'bad' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('400 — rejects weak password (too short)', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({ ...payload, password: 'weak' });
      expect(res.status).toBe(400);
    });

    it('409 — rejects duplicate email', async () => {
      mockUserRepo.emailExists.mockResolvedValue(true);
      const res = await request(app).post('/api/v1/auth/register').send(payload);
      expect(res.status).toBe(409);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('200 — returns tokens for valid credentials', async () => {
      mockUserRepo.findByEmail.mockResolvedValue({ ...MOCK_USER, password_hash: '$2b$12$hashed' });
      mockBcrypt.compare.mockResolvedValue(true);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'Password123' });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('accessToken');
    });

    it('401 — rejects wrong password', async () => {
      mockUserRepo.findByEmail.mockResolvedValue({ ...MOCK_USER, password_hash: '$2b$12$hashed' });
      mockBcrypt.compare.mockResolvedValue(false);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpass' });

      expect(res.status).toBe(401);
    });

    it('401 — rejects unknown email', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@example.com', password: 'Password123' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /health', () => {
    it('200 — returns status ok', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('404 handler', () => {
    it('returns 404 for unknown routes', async () => {
      const res = await request(app).get('/api/v1/doesnotexist');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
