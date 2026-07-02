/**
 * tests/integration/problems.test.js
 *
 * WHY: Verifies the full problems API request cycle including
 *      routing, optional auth, validation, and LeetCode service calls.
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
  userRepository: { findById: jest.fn(), emailExists: jest.fn(), create: jest.fn(), findByEmail: jest.fn() },
}));

jest.unstable_mockModule('../../src/repositories/tokenRepository.js', () => ({
  tokenRepository: { save: jest.fn(), findByToken: jest.fn(), deleteByToken: jest.fn() },
}));

jest.unstable_mockModule('../../src/repositories/searchHistoryRepository.js', () => ({
  searchHistoryRepository: {
    save: jest.fn().mockResolvedValue({}),
    upsertRecentlyViewed: jest.fn().mockResolvedValue({}),
  },
}));

const mockLeetcode = {
  searchProblems: jest.fn(),
  getProblemBySlug: jest.fn(),
  getDailyChallenge: jest.fn(),
  getContests: jest.fn(),
  getUserStats: jest.fn(),
};

jest.unstable_mockModule('../../src/services/leetcode/leetcodeService.js', () => ({
  leetcodeService: mockLeetcode,
}));

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    sign: jest.fn(() => 'mock.token'),
    verify: jest.fn(() => ({ sub: 'user-123' })),
    decode: jest.fn(() => ({ exp: Date.now() / 1000 + 600 })),
  },
}));

const app = (await import('../../src/app.js')).default;

const MOCK_PROBLEM = {
  questionId: '1',
  questionFrontendId: '1',
  title: 'Two Sum',
  titleSlug: 'two-sum',
  content: '<p>Find two indices.</p>',
  difficulty: 'Easy',
  acRate: 49.5,
  topicTags: [{ name: 'Array', slug: 'array' }],
  hints: ['Use a hash map'],
};

describe('Problems API — Integration Tests', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /api/v1/problems', () => {
    it('200 — returns problems list with pagination meta', async () => {
      mockLeetcode.searchProblems.mockResolvedValue({
        total: 1,
        questions: [{ title: 'Two Sum', titleSlug: 'two-sum', difficulty: 'Easy' }],
      });

      const res = await request(app).get('/api/v1/problems?q=two+sum');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toHaveProperty('total', 1);
      expect(res.body.meta).toHaveProperty('page', 1);
    });

    it('400 — rejects invalid difficulty parameter', async () => {
      const res = await request(app).get('/api/v1/problems?difficulty=extreme');
      expect(res.status).toBe(400);
    });

    it('400 — rejects page < 1', async () => {
      const res = await request(app).get('/api/v1/problems?page=0');
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/problems/:titleSlug', () => {
    it('200 — returns full problem details', async () => {
      mockLeetcode.getProblemBySlug.mockResolvedValue(MOCK_PROBLEM);

      const res = await request(app).get('/api/v1/problems/two-sum');

      expect(res.status).toBe(200);
      expect(res.body.data.titleSlug).toBe('two-sum');
      expect(res.body.data.title).toBe('Two Sum');
    });

    it('400 — rejects slug with uppercase/special chars', async () => {
      const res = await request(app).get('/api/v1/problems/INVALID_SLUG!');
      expect(res.status).toBe(400);
    });

    it('propagates 404 from LeetCode service', async () => {
      const { AppError } = await import('../../src/utils/AppError.js');
      mockLeetcode.getProblemBySlug.mockRejectedValue(new AppError('Problem not found', 404));

      const res = await request(app).get('/api/v1/problems/nonexistent-problem');
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/v1/problems/daily', () => {
    it('200 — returns daily challenge', async () => {
      mockLeetcode.getDailyChallenge.mockResolvedValue({
        date: '2024-01-15',
        question: MOCK_PROBLEM,
      });

      const res = await request(app).get('/api/v1/problems/daily');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('question');
    });
  });

  describe('GET /api/v1/problems/contests', () => {
    it('200 — returns contest list', async () => {
      mockLeetcode.getContests.mockResolvedValue([
        { title: 'Weekly Contest 400', startTime: 1700000000 },
      ]);

      const res = await request(app).get('/api/v1/problems/contests');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
