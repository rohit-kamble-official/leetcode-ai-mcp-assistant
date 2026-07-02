/**
 * src/repositories/searchHistoryRepository.js
 *
 * WHY: Persisting search history lets users see what they've looked up
 *      and allows us to build "recently viewed" features.
 * HOW: Two tables are managed here: search_history and recently_viewed.
 *      recently_viewed uses upsert (INSERT ... ON CONFLICT) to keep one
 *      entry per problem per user, updating the viewed_at timestamp.
 */

import pool from '../config/database.js';

export const searchHistoryRepository = {
  /**
   * Save a new search query.
   */
  async save(userId, query, resultCount = 0) {
    const { rows } = await pool.query(
      `INSERT INTO search_history (user_id, query, result_count)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, query, resultCount]
    );
    return rows[0];
  },

  /**
   * Get search history for a user, newest first.
   */
  async findByUserId(userId, { limit = 20, offset = 0 } = {}) {
    const { rows } = await pool.query(
      `SELECT * FROM search_history
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return rows;
  },

  async countByUserId(userId) {
    const { rows } = await pool.query(
      'SELECT COUNT(*) as count FROM search_history WHERE user_id = $1',
      [userId]
    );
    return parseInt(rows[0].count);
  },

  /**
   * Delete all search history for a user.
   */
  async deleteByUserId(userId) {
    const { rowCount } = await pool.query(
      'DELETE FROM search_history WHERE user_id = $1',
      [userId]
    );
    return rowCount;
  },

  /**
   * Delete a single search history entry.
   */
  async deleteById(id, userId) {
    const { rowCount } = await pool.query(
      'DELETE FROM search_history WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return rowCount > 0;
  },

  // ---- Recently Viewed ----

  /**
   * Upsert a recently viewed problem.
   * If the problem was already viewed, update the timestamp instead of
   * creating a duplicate — the UNIQUE(user_id, problem_slug) constraint
   * makes this safe.
   */
  async upsertRecentlyViewed(userId, { problemSlug, problemTitle, problemDifficulty }) {
    const { rows } = await pool.query(
      `INSERT INTO recently_viewed (user_id, problem_slug, problem_title, problem_difficulty, viewed_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_id, problem_slug)
       DO UPDATE SET viewed_at = NOW()
       RETURNING *`,
      [userId, problemSlug, problemTitle, problemDifficulty]
    );
    return rows[0];
  },

  async findRecentlyViewed(userId, limit = 10) {
    const { rows } = await pool.query(
      `SELECT * FROM recently_viewed
       WHERE user_id = $1
       ORDER BY viewed_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return rows;
  },
};
