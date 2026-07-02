/**
 * src/repositories/userRepository.js
 *
 * WHY: The Repository Pattern separates database queries from business logic.
 *      Controllers and services never write SQL — they call repository methods.
 * HOW: Each method wraps a parameterized SQL query.
 *      Parameterized queries prevent SQL injection attacks.
 * DESIGN: If we ever switch from PostgreSQL to another DB, we only update
 *         this file — nothing else changes.
 */

import pool from '../config/database.js';

export const userRepository = {
  /**
   * Find a user by their email address.
   * Used during login to look up the user before comparing passwords.
   * Time Complexity: O(1) — email column is indexed.
   */
  async findByEmail(email) {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = TRUE',
      [email.toLowerCase()]
    );
    return rows[0] || null;
  },

  /**
   * Find a user by their UUID.
   * Used for protected routes to attach user to request context.
   */
  async findById(id) {
    const { rows } = await pool.query(
      'SELECT id, name, email, avatar, bio, leetcode_username, created_at FROM users WHERE id = $1 AND is_active = TRUE',
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Create a new user. Returns the created user without the password_hash.
   */
  async create({ name, email, passwordHash }) {
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, avatar, bio, leetcode_username, created_at`,
      [name, email.toLowerCase(), passwordHash]
    );
    return rows[0];
  },

  /**
   * Update profile fields. Only updates fields that are provided.
   * Uses COALESCE so unset fields keep their current value.
   */
  async updateProfile(id, { name, avatar, bio, leetcodeUsername }) {
    const { rows } = await pool.query(
      `UPDATE users SET
        name = COALESCE($1, name),
        avatar = COALESCE($2, avatar),
        bio = COALESCE($3, bio),
        leetcode_username = COALESCE($4, leetcode_username)
       WHERE id = $5 AND is_active = TRUE
       RETURNING id, name, email, avatar, bio, leetcode_username, created_at`,
      [name, avatar, bio, leetcodeUsername, id]
    );
    return rows[0] || null;
  },

  /**
   * Soft-delete: mark user as inactive rather than permanently deleting.
   * Preserves data integrity and allows account recovery if needed.
   */
  async softDelete(id) {
    const { rowCount } = await pool.query(
      'UPDATE users SET is_active = FALSE WHERE id = $1',
      [id]
    );
    return rowCount > 0;
  },

  /**
   * Check if an email is already registered. Used during registration.
   */
  async emailExists(email) {
    const { rows } = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    return rows.length > 0;
  },
};
