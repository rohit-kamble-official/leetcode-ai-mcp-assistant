/**
 * src/repositories/favoritesRepository.js
 *
 * WHY: Stores user-bookmarked LeetCode problems in PostgreSQL.
 * HOW: Simple CRUD with a unique constraint (user_id, problem_slug)
 *      preventing duplicate favorites.
 */

import pool from '../config/database.js';

export const favoritesRepository = {
  /**
   * Get all favorites for a user, newest first.
   * Time Complexity: O(k) where k is the number of favorites for that user.
   */
  async findByUserId(userId, { limit = 20, offset = 0 } = {}) {
    const { rows } = await pool.query(
      `SELECT * FROM favorites
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return rows;
  },

  /**
   * Count total favorites for pagination metadata.
   */
  async countByUserId(userId) {
    const { rows } = await pool.query(
      'SELECT COUNT(*) as count FROM favorites WHERE user_id = $1',
      [userId]
    );
    return parseInt(rows[0].count);
  },

  /**
   * Check if a specific problem is already favorited.
   */
  async exists(userId, problemSlug) {
    const { rows } = await pool.query(
      'SELECT id FROM favorites WHERE user_id = $1 AND problem_slug = $2',
      [userId, problemSlug]
    );
    return rows.length > 0;
  },

  /**
   * Add a problem to favorites.
   * ON CONFLICT DO NOTHING prevents errors if added twice.
   */
  async add(userId, { problemSlug, problemTitle, problemDifficulty }) {
    const { rows } = await pool.query(
      `INSERT INTO favorites (user_id, problem_slug, problem_title, problem_difficulty)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, problem_slug) DO NOTHING
       RETURNING *`,
      [userId, problemSlug, problemTitle, problemDifficulty]
    );
    return rows[0] || null;
  },

  /**
   * Remove a specific problem from favorites.
   */
  async remove(userId, problemSlug) {
    const { rowCount } = await pool.query(
      'DELETE FROM favorites WHERE user_id = $1 AND problem_slug = $2',
      [userId, problemSlug]
    );
    return rowCount > 0;
  },
};
