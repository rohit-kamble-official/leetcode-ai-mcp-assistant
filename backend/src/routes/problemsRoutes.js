/**
 * src/routes/problemsRoutes.js
 */

import { Router } from 'express';
import { problemsController } from '../controllers/problemsController.js';
import { optionalAuth } from '../middleware/auth.js';
import { generalLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { searchValidation, problemSlugValidation } from '../validators/profileValidators.js';

const router = Router();

// optionalAuth: saves search history if logged in, still works for anonymous users
router.get('/',                          generalLimiter, optionalAuth, searchValidation, validate, problemsController.searchProblems);
router.get('/daily',                     generalLimiter, optionalAuth, problemsController.getDailyChallenge);
router.get('/contests',                  generalLimiter, problemsController.getContests);
router.get('/user/:username/stats',      generalLimiter, problemsController.getUserStats);
router.get('/:titleSlug',               generalLimiter, optionalAuth, problemSlugValidation, validate, problemsController.getProblem);

export default router;
