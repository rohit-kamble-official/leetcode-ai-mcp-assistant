/**
 * tests/integration/daily.test.js
 *
 * WHY: Regression coverage for a real bug found during audit: GET /daily
 *      returned a DIFFERENT response shape on a cache hit (raw DB row:
 *      { challenge_date, problem_title, ... }) vs a cache miss
 *      (LeetCode shape: { date, question: { title, ... } }).
 *      The frontend always reads `data.question`, so every cache hit
 *      silently produced undefined title/difficulty/slug across the
 *      Dashboard and Daily Challenge pages. It also meant `problem_title`
 *      (a NOT NULL column) could be written as NULL on first fetch,
 *      since the original DAILY_CHALLENGE_QUERY never requested `title`
 *      from LeetCode's GraphQL API — a guaranteed Postgres constraint
 *      violation in production.
 *
 * This test locks in the fix: both cache-hit and cache-miss paths must
 * return the identical { date, question: { title, titleSlug, ... } } shape.
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

const mockDailyRepo = {
  findByDate: jest.fn(),
  upsert: jest.fn(),
  findHistory: jest.fn(),
};

jest.unstable_mockModule('../../src/repositories/dailyChallengeRepository.js', () => ({
  dailyChallengeRepository: mockDailyRepo,
}));

const mockLeetcode = {
  getDailyChallenge: jest.fn(),
  getProblemBySlug: jest.fn(),
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

const LEETCODE_SHAPE = {
  date: '2026-06-30',
  userStatus: 'NotStart',
  link: '/problems/two-sum/',
  question: {
    acRate: 49.5,
    difficulty: 'Easy',
    frontendQuestionId: '1',
    isFavor: false,
    isPaidOnly: false,
    status: null,
    title: 'Two Sum',
    titleSlug: 'two-sum',
    topicTags: [{ name: 'Array', id: '1', slug: 'array' }],
  },
};

describe('Daily Challenge API — response shape consistency (regression)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('cache MISS — returns { date, question } shape from LeetCode', async () => {
    mockDailyRepo.findByDate.mockResolvedValue(null);
    mockLeetcode.getDailyChallenge.mockResolvedValue(LEETCODE_SHAPE);
    mockDailyRepo.upsert.mockResolvedValue({});

    const res = await request(app).get('/api/v1/problems/daily');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('question');
    expect(res.body.data.question.title).toBe('Two Sum');
    expect(res.body.data.question.titleSlug).toBe('two-sum');
  });

  it('cache HIT (via /api/v1/daily) — returns the SAME shape as cache miss, not the raw DB row', async () => {
    // Simulate what's actually stored: the DB row wraps the original
    // LeetCode payload in problem_data (jsonb).
    mockDailyRepo.findByDate.mockResolvedValue({
      id: 'uuid-1',
      challenge_date: '2026-06-30',
      problem_slug: 'two-sum',
      problem_title: 'Two Sum',
      problem_difficulty: 'Easy',
      problem_data: LEETCODE_SHAPE, // jsonb column — pg returns it already parsed
      created_at: new Date().toISOString(),
    });

    const res = await request(app).get('/api/v1/daily');

    expect(res.status).toBe(200);
    // This is the critical assertion: must NOT be the raw row shape
    // (no top-level `problem_title`/`challenge_date`), must match
    // the LeetCode { date, question: {...} } contract the frontend expects.
    expect(res.body.data).toHaveProperty('question');
    expect(res.body.data).not.toHaveProperty('problem_title');
    expect(res.body.data).not.toHaveProperty('challenge_date');
    expect(res.body.data.question.title).toBe('Two Sum');
    expect(res.body.data.question.titleSlug).toBe('two-sum');
    expect(res.body.data.question.difficulty).toBe('Easy');
  });

  it('upsert is always called with a non-null problemTitle (NOT NULL column safety)', async () => {
    mockDailyRepo.findByDate.mockResolvedValue(null);
    mockLeetcode.getDailyChallenge.mockResolvedValue(LEETCODE_SHAPE);
    mockDailyRepo.upsert.mockResolvedValue({});

    await request(app).get('/api/v1/daily');

    expect(mockDailyRepo.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        problemTitle: 'Two Sum', // must be defined — this was undefined before the fix
        problemSlug: 'two-sum',
        problemDifficulty: 'Easy',
      })
    );
  });
});
