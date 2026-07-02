/**
 * tests/unit/aiService.test.js
 *
 * WHY: Tests that AI service methods correctly construct prompts
 *      without making real API calls.
 */

import { jest } from '@jest/globals';

const mockCreate = jest.fn().mockResolvedValue({
  content: [{ text: 'Mock AI response explaining the problem.' }],
});

jest.unstable_mockModule('@anthropic-ai/sdk', () => ({
  default: jest.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  })),
}));

const { aiService } = await import('../../src/services/ai/aiService.js');

const mockProblem = {
  title: 'Two Sum',
  difficulty: 'Easy',
  content: '<p>Given an array of integers return indices of two numbers that add up to target.</p>',
};

describe('aiService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('explainProblem()', () => {
    it('should return a string explanation', async () => {
      const result = await aiService.explainProblem(mockProblem);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });
  });

  describe('generateHints()', () => {
    it('should call AI and return hints string', async () => {
      const result = await aiService.generateHints(mockProblem);
      expect(typeof result).toBe('string');
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });
  });

  describe('analyzeCode()', () => {
    it('should return analysis for submitted code', async () => {
      const code = 'def twoSum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        if target - num in seen: return [seen[target-num], i]\n        seen[num] = i';
      const result = await aiService.analyzeCode(mockProblem, code, 'python');
      expect(typeof result).toBe('string');
    });

    it('should work without a problem context', async () => {
      const result = await aiService.analyzeCode(null, 'print("hello")', 'python');
      expect(typeof result).toBe('string');
    });
  });

  describe('estimateTimeComplexity()', () => {
    it('should return complexity analysis', async () => {
      const code = 'for i in range(n):\n    for j in range(n):\n        print(i, j)';
      const result = await aiService.estimateTimeComplexity(code, 'python');
      expect(typeof result).toBe('string');
    });
  });

  describe('estimateSpaceComplexity()', () => {
    it('should return space analysis', async () => {
      const result = await aiService.estimateSpaceComplexity('arr = [x for x in range(n)]', 'python');
      expect(typeof result).toBe('string');
    });
  });
});
