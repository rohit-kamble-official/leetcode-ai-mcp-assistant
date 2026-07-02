/**
 * src/controllers/historyController.js
 */

import { searchHistoryRepository } from '../repositories/searchHistoryRepository.js';
import { sendSuccess, buildPaginationMeta } from '../utils/response.js';
import { AppError } from '../utils/AppError.js';

export const historyController = {
  /**
   * GET /history
   */
  async getSearchHistory(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const offset = (pageNum - 1) * limitNum;

      const [history, total] = await Promise.all([
        searchHistoryRepository.findByUserId(req.user.id, { limit: limitNum, offset }),
        searchHistoryRepository.countByUserId(req.user.id),
      ]);

      const meta = buildPaginationMeta(total, pageNum, limitNum);
      return sendSuccess(res, history, 'Search history fetched', 200, meta);
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /history
   * Clear all search history.
   */
  async clearHistory(req, res, next) {
    try {
      const count = await searchHistoryRepository.deleteByUserId(req.user.id);
      return sendSuccess(res, { deleted: count }, 'Search history cleared');
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /history/:id
   * Delete a single history entry.
   */
  async deleteHistoryItem(req, res, next) {
    try {
      const removed = await searchHistoryRepository.deleteById(req.params.id, req.user.id);
      if (!removed) {
        return next(new AppError('History item not found', 404));
      }
      return sendSuccess(res, null, 'History item deleted');
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /history/recent
   * Get recently viewed problems.
   */
  async getRecentlyViewed(req, res, next) {
    try {
      const recent = await searchHistoryRepository.findRecentlyViewed(req.user.id, 10);
      return sendSuccess(res, recent, 'Recently viewed problems fetched');
    } catch (err) {
      next(err);
    }
  },
};
