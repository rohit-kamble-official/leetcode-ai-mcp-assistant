/**
 * src/repositories/dailyChallengeRepository.js
 *
 * WHY: Caches daily challenges in PostgreSQL so we can show historical
 *      challenges even after LeetCode rotates to a new day.
 * HOW: Each challenge is stored by its date. ON CONFLICT DO UPDATE
 *      ensures we always have the latest data for each date.
 */

import pool from '../config/database.js';

export const dailyChallengeRepository = {
  /**
   * Get today's challenge from the DB cache.
   */
  async findByDate(date) {
    const { rows } = await pool.query(
      'SELECT * FROM daily_challenges WHERE challenge_date = $1',
      [date]
    );
    return rows[0] || null;
  },

  /**
   * Upsert today's challenge.
   * ON CONFLICT DO UPDATE refreshes stale data if we re-fetch.
   */
  async upsert({ challengeDate, problemSlug, problemTitle, problemDifficulty, problemData }) {
    const { rows } = await pool.query(
      `INSERT INTO daily_challenges (challenge_date, problem_slug, problem_title, problem_difficulty, problem_data)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (challenge_date)
       DO UPDATE SET
         problem_slug = EXCLUDED.problem_slug,
         problem_title = EXCLUDED.problem_title,
         problem_difficulty = EXCLUDED.problem_difficulty,
         problem_data = EXCLUDED.problem_data
       RETURNING *`,
      [challengeDate, problemSlug, problemTitle, problemDifficulty, JSON.stringify(problemData)]
    );
    return rows[0];
  },

  /**
   * Get challenge history — last N days.
   * Useful for "challenge history" feature.
   */
  async findHistory(limit = 30) {
    const { rows } = await pool.query(
      `SELECT id, challenge_date, problem_slug, problem_title, problem_difficulty
       FROM daily_challenges
       ORDER BY challenge_date DESC
       LIMIT $1`,
      [limit]
    );
    return rows;
  },
};
