/**
 * src/middleware/auth.js
 *
 * WHY: Protected routes need to verify the caller is authenticated.
 *      This middleware sits in front of those routes and checks the JWT.
 * HOW: Reads the Bearer token from Authorization header, verifies its
 *      signature, then loads the user from DB and attaches to req.user.
 * DESIGN: Express middleware — runs before the route handler.
 *         If verification fails, sends 401 before reaching the controller.
 */

import { authService } from '../services/authService.js';
import { userRepository } from '../repositories/userRepository.js';
import { sendError } from '../utils/response.js';

/**
 * Middleware: require a valid JWT access token.
 * Attaches the full user object to req.user.
 */
export const requireAuth = async (req, res, next) => {
  try {
    // JWT is sent as: Authorization: Bearer <token>
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'No authentication token provided', 401);
    }

    const token = authHeader.split(' ')[1];

    // Verify signature and decode payload — throws if invalid/expired
    const payload = authService.verifyAccessToken(token);

    // Load user from DB to ensure they still exist and are active
    const user = await userRepository.findById(payload.sub);
    if (!user) {
      return sendError(res, 'User no longer exists', 401);
    }

    // Attach user to request — available in all subsequent handlers
    req.user = user;
    next();
  } catch (err) {
    return sendError(res, err.message || 'Authentication failed', 401);
  }
};

/**
 * Middleware: optionally attach user if token is present.
 * Does NOT fail if no token — useful for routes that work for both
 * anonymous and authenticated users (e.g., search history only saved when logged in).
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const payload = authService.verifyAccessToken(token);
      const user = await userRepository.findById(payload.sub);
      if (user) req.user = user;
    }
  } catch {
    // Silently ignore auth failures for optional routes
  }
  next();
};
