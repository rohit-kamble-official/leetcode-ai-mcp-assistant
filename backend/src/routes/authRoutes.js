/**
 * src/routes/authRoutes.js
 *
 * WHY: Defines all authentication-related endpoints.
 * HOW: Express Router groups related routes together.
 *      Middleware runs in order: limiter → validator → validate → controller.
 */

import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import {
  registerValidation,
  loginValidation,
  refreshValidation,
} from '../validators/authValidators.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

router.post('/register', authLimiter, registerValidation, validate, authController.register);
router.post('/login',    authLimiter, loginValidation,    validate, authController.login);
router.post('/refresh',  authLimiter, refreshValidation,  validate, authController.refresh);
router.post('/logout',   authController.logout);
router.get('/me',        requireAuth, authController.me);

export default router;
