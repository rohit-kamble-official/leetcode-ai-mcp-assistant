/**
 * src/controllers/authController.js
 *
 * WHY: Controllers are the bridge between HTTP and the service layer.
 *      They parse requests, call services, and format responses.
 * HOW: Each method corresponds to one API endpoint.
 *      try-catch wraps each handler — errors are passed to next(err)
 *      and caught by the global error handler.
 * DESIGN: Controllers are thin — no business logic lives here.
 *         All logic is in services.
 */

import { authService } from '../services/authService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const authController = {
  /**
   * POST /auth/register
   * @swagger
   * /auth/register:
   *   post:
   *     tags: [Auth]
   *     summary: Register a new user
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [name, email, password]
   *             properties:
   *               name:
   *                 type: string
   *               email:
   *                 type: string
   *               password:
   *                 type: string
   *     responses:
   *       201:
   *         description: User registered successfully
   *       409:
   *         description: Email already registered
   */
  async register(req, res, next) {
    try {
      const { name, email, password } = req.body;
      const result = await authService.register({ name, email, password });

      return sendSuccess(
        res,
        { user: result.user, accessToken: result.accessToken, refreshToken: result.refreshToken },
        'Registration successful',
        201
      );
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /auth/login
   * @swagger
   * /auth/login:
   *   post:
   *     tags: [Auth]
   *     summary: Login with email and password
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email, password]
   *             properties:
   *               email:
   *                 type: string
   *               password:
   *                 type: string
   *     responses:
   *       200:
   *         description: Login successful
   *       401:
   *         description: Invalid credentials
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login({ email, password });

      return sendSuccess(
        res,
        { user: result.user, accessToken: result.accessToken, refreshToken: result.refreshToken },
        'Login successful'
      );
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /auth/refresh
   * Exchange a valid refresh token for a new access token.
   */
  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const tokens = await authService.refreshTokens(refreshToken);

      return sendSuccess(res, tokens, 'Tokens refreshed successfully');
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /auth/logout
   * Invalidate the refresh token.
   */
  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      await authService.logout(refreshToken);

      return sendSuccess(res, null, 'Logged out successfully');
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /auth/me
   * Return the currently authenticated user.
   */
  async me(req, res) {
    return sendSuccess(res, req.user, 'User fetched successfully');
  },
};
