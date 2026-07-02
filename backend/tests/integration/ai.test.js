/**
 * tests/integration/ai.test.js
 *
 * WHY: Verifies AI endpoints enforce auth, validate input, and
 *      return structured AI responses.
 */

import { jest } from '@jest/globals';
import request from 'supertest';

jest.unstable_mockModule('../../src/config/database.js', () => ({
  default: { query: jest.fn() },
  connectDatabase: jest.fn(),
}));

jest.unstable_mockModule('../../src/config/redis.js', () => ({
  default: { get: jest.fn().mockResolvedValue(null), setex: jest.fn(), connect: jest.fn() },
  connectRedis: jest.fn(),
}));

jest.unstable_mockModule('../../src/repositories/userRepository.js', () => ({
  userRepository: {
    findById: jest.fn().mockResolvedValue({
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
    }),
    emailExists: jest.fn(),
    create: jest.fn(),
    findByEmail: jest.fn(),
  },
}));

jest.unstable_mockModule('../../src/repositories/tokenRepository.js', () => ({
  tokenRepository: { save: jest.fn(), findByToken: jest.fn(), deleteByToken: jest.fn() },
}));

const mockLeetcode = {
  getProblemBySlug: jest.fn().mockResolvedValue({
    title: 'Two Sum',
    difficulty: 'Easy',
    content: '<p>Find two numbers</p>',
  }),
};

jest.unstable_mockModule('../../src/services/leetcode/leetcodeService.js', () => ({
  leetcodeService: mockLeetcode,
}));

jest.unstable_mockModule('@anthropic-ai/sdk', () => ({
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{ text: 'AI analysis result here' }],
      }),
    },
  })),
}));

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    sign: jest.fn(() => 'mock.token'),
    verify: jest.fn(() => ({ sub: 'user-123' })),
    decode: jest.fn(() => ({ exp: Date.now() / 1000 + 600 })),
  },
}));

const app = (await import('../../src/app.js')).default;
const AUTH = { Authorization: 'Bearer mock.token' };

describe('AI API — Integration Tests', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('POST /api/v1/ai/problems/:titleSlug/explain', () => {
    it('200 — returns AI explanation when authenticated', async () => {
      const res = await request(app)
        .post('/api/v1/ai/problems/two-sum/explain')
        .set(AUTH);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('explanation');
      expect(res.body.data.problem).toHaveProperty('title');
    });

    it('401 — rejects unauthenticated request', async () => {
      const res = await request(app).post('/api/v1/ai/problems/two-sum/explain');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/ai/problems/:titleSlug/hints', () => {
    it('200 — returns progressive hints', async () => {
      const res = await request(app)
        .post('/api/v1/ai/problems/two-sum/hints')
        .set(AUTH);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('hints');
    });
  });

  describe('POST /api/v1/ai/analyze-code', () => {
    it('200 — returns code analysis', async () => {
      const res = await request(app)
        .post('/api/v1/ai/analyze-code')
        .set(AUTH)
        .send({ code: 'def solve(nums): return sorted(nums)', language: 'python' });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('analysis');
    });

    it('400 — rejects missing code field', async () => {
      const res = await request(app)
        .post('/api/v1/ai/analyze-code')
        .set(AUTH)
        .send({ language: 'python' });

      expect(res.status).toBe(400);
    });

    it('400 — rejects unsupported language', async () => {
      const res = await request(app)
        .post('/api/v1/ai/analyze-code')
        .set(AUTH)
        .send({ code: 'hello world', language: 'brainfuck' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/ai/time-complexity', () => {
    it('200 — returns complexity analysis', async () => {
      const res = await request(app)
        .post('/api/v1/ai/time-complexity')
        .set(AUTH)
        .send({ code: 'for i in range(n): pass', language: 'python' });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('analysis');
    });
  });

  describe('POST /api/v1/ai/space-complexity', () => {
    it('200 — returns space complexity analysis', async () => {
      const res = await request(app)
        .post('/api/v1/ai/space-complexity')
        .set(AUTH)
        .send({ code: 'arr = list(range(n))', language: 'python' });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('analysis');
    });
  });
});
