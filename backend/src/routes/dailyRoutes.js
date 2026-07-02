/**
 * src/routes/dailyRoutes.js
 */

import { Router } from 'express';
import { dailyController } from '../controllers/dailyController.js';
import { optionalAuth } from '../middleware/auth.js';
import { requireAuth } from '../middleware/auth.js';
import { aiLimiter, generalLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.get('/',         generalLimiter, optionalAuth, dailyController.getDaily);
router.get('/history',  generalLimiter, dailyController.getDailyHistory);
router.get('/explain',  aiLimiter, requireAuth, dailyController.explainDaily);

export default router;
