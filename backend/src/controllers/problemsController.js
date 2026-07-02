/**
 * src/controllers/problemsController.js
 *
 * WHY: Handles all LeetCode problem-related API requests.
 * HOW: Delegates to leetcodeService for data fetching and
 *      optionally saves to search/view history for authenticated users.
 */

import { leetcodeService } from '../services/leetcode/leetcodeService.js';
import { searchHistoryRepository } from '../repositories/searchHistoryRepository.js';
import { sendSuccess, buildPaginationMeta } from '../utils/response.js';

export const problemsController = {
  /**
   * GET /problems?q=two+sum&difficulty=easy&page=1&limit=20
   * Search and list problems with optional filters.
   */
  async searchProblems(req, res, next) {
    try {
      const {
        q = '',
        difficulty,
        tags,
        page = 1,
        limit = 20,
      } = req.query;

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;
      const tagList = tags ? (Array.isArray(tags) ? tags : tags.split(',')) : [];

      const result = await leetcodeService.searchProblems({
        query: q,
        difficulty,
        tags: tagList,
        skip,
        limit: limitNum,
      });

      // Save to search history if user is authenticated
      if (req.user && q) {
        searchHistoryRepository
          .save(req.user.id, q, result.total)
          .catch(() => {}); // Fire-and-forget — don't let history failure break search
      }

      const meta = buildPaginationMeta(result.total, pageNum, limitNum);
      return sendSuccess(res, result.questions, 'Problems fetched successfully', 200, meta);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /problems/:titleSlug
   * Get full details of a specific problem.
   */
  async getProblem(req, res, next) {
    try {
      const { titleSlug } = req.params;
      const problem = await leetcodeService.getProblemBySlug(titleSlug);

      // Track as recently viewed for authenticated users
      if (req.user) {
        searchHistoryRepository
          .upsertRecentlyViewed(req.user.id, {
            problemSlug: titleSlug,
            problemTitle: problem.title,
            problemDifficulty: problem.difficulty,
          })
          .catch(() => {});
      }

      return sendSuccess(res, problem, 'Problem fetched successfully');
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /problems/daily
   * Get today's daily challenge.
   */
  async getDailyChallenge(req, res, next) {
    try {
      const challenge = await leetcodeService.getDailyChallenge();
      return sendSuccess(res, challenge, "Today's challenge fetched successfully");
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /problems/contests
   * Get upcoming contests.
   */
  async getContests(req, res, next) {
    try {
      const contests = await leetcodeService.getContests();
      return sendSuccess(res, contests, 'Contests fetched successfully');
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /problems/user/:username/stats
   * Get a LeetCode user's public stats.
   */
  async getUserStats(req, res, next) {
    try {
      const { username } = req.params;
      const stats = await leetcodeService.getUserStats(username);
      return sendSuccess(res, stats, 'User stats fetched successfully');
    } catch (err) {
      next(err);
    }
  },
};
