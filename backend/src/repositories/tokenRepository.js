/**
 * src/repositories/tokenRepository.js
 *
 * WHY: Refresh tokens must be stored server-side so we can invalidate them
 *      (e.g., on logout or if a token is compromised).
 * HOW: We store a hash of the token (not the raw token) so even if the DB
 *      is compromised, attackers can't use the stored values.
 * DESIGN: Expired tokens are cleaned up automatically to prevent table bloat.
 */

import pool from '../config/database.js';
import crypto from 'crypto';

/**
 * Hash a token using SHA-256.
 * We store the hash, not the plain token — same principle as password hashing.
 * Time Complexity: O(n) where n is token length — effectively O(1) for fixed-size JWTs.
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const tokenRepository = {
  /**
   * Store a new refresh token.
   * expiresAt should match the JWT expiry date so we don't keep stale rows.
   */
  async save(userId, refreshToken, expiresAt) {
    const tokenHash = hashToken(refreshToken);
    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, tokenHash, expiresAt]
    );
  },

  /**
   * Find a stored token by its hash.
   * Returns the token row if found and not expired.
   */
  async findByToken(refreshToken) {
    const tokenHash = hashToken(refreshToken);
    const { rows } = await pool.query(
      `SELECT rt.*, u.id as user_id
       FROM refresh_tokens rt
       JOIN users u ON rt.user_id = u.id
       WHERE rt.token_hash = $1
         AND rt.expires_at > NOW()
         AND u.is_active = TRUE`,
      [tokenHash]
    );
    return rows[0] || null;
  },

  /**
   * Delete a specific refresh token (logout).
   */
  async deleteByToken(refreshToken) {
    const tokenHash = hashToken(refreshToken);
    const { rowCount } = await pool.query(
      'DELETE FROM refresh_tokens WHERE token_hash = $1',
      [tokenHash]
    );
    return rowCount > 0;
  },

  /**
   * Delete all refresh tokens for a user (logout from all devices).
   */
  async deleteAllForUser(userId) {
    await pool.query(
      'DELETE FROM refresh_tokens WHERE user_id = $1',
      [userId]
    );
  },

  /**
   * Remove expired tokens — should be run periodically (e.g., daily cron job).
   * Time Complexity: O(n) where n is number of expired tokens.
   */
  async deleteExpired() {
    const { rowCount } = await pool.query(
      'DELETE FROM refresh_tokens WHERE expires_at <= NOW()'
    );
    return rowCount;
  },
};
