/**
 * src/controllers/favoritesController.js
 */

import { favoritesRepository } from '../repositories/favoritesRepository.js';
import { sendSuccess, sendError, buildPaginationMeta } from '../utils/response.js';
import { AppError } from '../utils/AppError.js';

export const favoritesController = {
  /**
   * GET /favorites
   */
  async getFavorites(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const offset = (pageNum - 1) * limitNum;

      const [favorites, total] = await Promise.all([
        favoritesRepository.findByUserId(req.user.id, { limit: limitNum, offset }),
        favoritesRepository.countByUserId(req.user.id),
      ]);

      const meta = buildPaginationMeta(total, pageNum, limitNum);
      return sendSuccess(res, favorites, 'Favorites fetched successfully', 200, meta);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /favorites
   */
  async addFavorite(req, res, next) {
    try {
      const { problemSlug, problemTitle, problemDifficulty } = req.body;

      if (!problemSlug || !problemTitle) {
        return next(new AppError('problemSlug and problemTitle are required', 400));
      }

      const exists = await favoritesRepository.exists(req.user.id, problemSlug);
      if (exists) {
        return sendError(res, 'Problem is already in favorites', 409);
      }

      const favorite = await favoritesRepository.add(req.user.id, {
        problemSlug,
        problemTitle,
        problemDifficulty,
      });

      return sendSuccess(res, favorite, 'Added to favorites', 201);
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /favorites/:problemSlug
   */
  async removeFavorite(req, res, next) {
    try {
      const { problemSlug } = req.params;
      const removed = await favoritesRepository.remove(req.user.id, problemSlug);

      if (!removed) {
        return next(new AppError('Favorite not found', 404));
      }

      return sendSuccess(res, null, 'Removed from favorites');
    } catch (err) {
      next(err);
    }
  },
};
