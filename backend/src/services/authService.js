/**
 * src/services/authService.js
 *
 * WHY: The Service Layer contains business logic.
 *      Controllers handle HTTP, repositories handle DB — services handle the "how".
 * HOW: Uses bcryptjs for password hashing (one-way function) and jsonwebtoken
 *      for creating signed JWTs (two-way but tamper-proof).
 *
 * JWT Architecture:
 *   - Access Token: Short-lived (15 min), sent with every request.
 *   - Refresh Token: Long-lived (7 days), used only to get new access tokens.
 *   This way, if an access token is stolen, it expires quickly.
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/userRepository.js';
import { tokenRepository } from '../repositories/tokenRepository.js';
import { AppError } from '../utils/AppError.js';

// Number of bcrypt rounds — higher = slower = more secure
// 12 rounds is the recommended production value (takes ~250ms per hash)
const BCRYPT_ROUNDS = 12;

export const authService = {
  /**
   * Register a new user.
   * 1. Check email not taken
   * 2. Hash password
   * 3. Create user
   * 4. Return tokens
   */
  async register({ name, email, password }) {
    const exists = await userRepository.emailExists(email);
    if (exists) {
      throw new AppError('Email is already registered', 409);
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await userRepository.create({ name, email, passwordHash });
    const tokens = await generateTokenPair(user.id);

    return { user, ...tokens };
  },

  /**
   * Authenticate a user with email + password.
   * Uses bcrypt.compare which is timing-safe (prevents timing attacks).
   */
  async login({ email, password }) {
    // Fetch user with password_hash (not excluded here unlike findById)
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    const tokens = await generateTokenPair(user.id);

    // Return user without password_hash
    const { password_hash, ...safeUser } = user;
    return { user: safeUser, ...tokens };
  },

  /**
   * Exchange a valid refresh token for a new access token.
   * Implements token rotation: old refresh token is invalidated,
   * new one is issued — if stolen token is replayed, it will fail.
   */
  async refreshTokens(refreshToken) {
    const stored = await tokenRepository.findByToken(refreshToken);
    if (!stored) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    // Verify the JWT signature (in case it was tampered with)
    try {
      jwt.verify(refreshToken, process.env.JWT_SECRET);
    } catch {
      await tokenRepository.deleteByToken(refreshToken);
      throw new AppError('Invalid refresh token', 401);
    }

    // Token rotation: delete old, issue new
    await tokenRepository.deleteByToken(refreshToken);
    const tokens = await generateTokenPair(stored.user_id);

    return tokens;
  },

  /**
   * Logout: invalidate the refresh token.
   */
  async logout(refreshToken) {
    if (refreshToken) {
      await tokenRepository.deleteByToken(refreshToken);
    }
  },

  /**
   * Verify an access token and return the decoded payload.
   * Used by the auth middleware.
   */
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      throw new AppError('Invalid or expired access token', 401);
    }
  },
};

/**
 * Internal helper: generates an access + refresh token pair.
 * Saves the refresh token to the DB.
 *
 * @param {string} userId
 * @returns {{ accessToken, refreshToken }}
 */
const generateTokenPair = async (userId) => {
  const payload = { sub: userId };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
  });

  // Parse expiry for storage
  const decoded = jwt.decode(refreshToken);
  const expiresAt = new Date(decoded.exp * 1000);

  await tokenRepository.save(userId, refreshToken, expiresAt);

  return { accessToken, refreshToken };
};
