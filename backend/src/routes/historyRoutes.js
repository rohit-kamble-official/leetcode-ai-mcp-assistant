/**
 * src/routes/historyRoutes.js
 */

import { Router } from 'express';
import { historyController } from '../controllers/historyController.js';
import { requireAuth } from '../middleware/auth.js';
import { generalLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(requireAuth, generalLimiter);

router.get('/',         historyController.getSearchHistory);
router.delete('/',      historyController.clearHistory);
router.get('/recent',   historyController.getRecentlyViewed);
router.delete('/:id',   historyController.deleteHistoryItem);

export default router;
