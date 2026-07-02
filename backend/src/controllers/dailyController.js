/**
 * src/controllers/dailyController.js
 */

import { leetcodeService } from '../services/leetcode/leetcodeService.js';
import { aiService } from '../services/ai/aiService.js';
import { dailyChallengeRepository } from '../repositories/dailyChallengeRepository.js';
import { sendSuccess } from '../utils/response.js';

export const dailyController = {
  /**
   * GET /daily
   * Get today's challenge (with DB persistence).
   */
  async getDaily(req, res, next) {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Check DB cache first. NOTE: the DB row stores the original
      // LeetCode GraphQL payload in `problem_data` (jsonb). We must
      // return THAT shape — { date, question: {...} } — not the raw
      // row, otherwise the frontend (which always reads `data.question`)
      // gets undefined on every cache hit. This was a real bug: the API
      // returned two different response shapes depending on cache state.
      const cached = await dailyChallengeRepository.findByDate(today);
      if (cached) {
        const payload = typeof cached.problem_data === 'string'
          ? JSON.parse(cached.problem_data)
          : cached.problem_data;
        return sendSuccess(res, payload, "Today's challenge fetched from cache");
      }

      // Fetch from LeetCode
      const challenge = await leetcodeService.getDailyChallenge();

      // Persist to DB for history
      await dailyChallengeRepository.upsert({
        challengeDate: today,
        problemSlug: challenge.question.titleSlug,
        problemTitle: challenge.question.title,
        problemDifficulty: challenge.question.difficulty,
        problemData: challenge,
      });

      return sendSuccess(res, challenge, "Today's challenge fetched");
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /daily/history
   * Get challenge history for the last 30 days.
   */
  async getDailyHistory(req, res, next) {
    try {
      const { limit = 30 } = req.query;
      const history = await dailyChallengeRepository.findHistory(parseInt(limit));
      return sendSuccess(res, history, 'Daily challenge history fetched');
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /daily/explain
   * Get AI explanation for today's daily challenge.
   */
  async explainDaily(req, res, next) {
    try {
      const challenge = await leetcodeService.getDailyChallenge();
      const problem = await leetcodeService.getProblemBySlug(challenge.question.titleSlug);
      const explanation = await aiService.explainProblem(problem);

      return sendSuccess(res, {
        challenge: challenge.question,
        explanation,
      }, "Today's challenge explained");
    } catch (err) {
      next(err);
    }
  },
};
