/**
 * src/controllers/profileController.js
 *
 * WHY: Handles user profile CRUD operations.
 * HOW: Reads/updates user data via the userRepository.
 */

import { userRepository } from '../repositories/userRepository.js';
import { tokenRepository } from '../repositories/tokenRepository.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AppError } from '../utils/AppError.js';

export const profileController = {
  /**
   * GET /profile
   * Get the authenticated user's profile.
   */
  async getProfile(req, res) {
    return sendSuccess(res, req.user, 'Profile fetched successfully');
  },

  /**
   * PUT /profile
   * Update profile fields (name, bio, avatar, leetcodeUsername).
   */
  async updateProfile(req, res, next) {
    try {
      const { name, bio, avatar, leetcodeUsername } = req.body;
      const updated = await userRepository.updateProfile(req.user.id, {
        name,
        bio,
        avatar,
        leetcodeUsername,
      });

      if (!updated) {
        return next(new AppError('Profile update failed', 500));
      }

      return sendSuccess(res, updated, 'Profile updated successfully');
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /profile
   * Soft-delete the user account and invalidate all refresh tokens.
   */
  async deleteAccount(req, res, next) {
    try {
      await tokenRepository.deleteAllForUser(req.user.id);
      await userRepository.softDelete(req.user.id);

      return sendSuccess(res, null, 'Account deleted successfully');
    } catch (err) {
      next(err);
    }
  },
};
