/**
 * src/routes/favoritesRoutes.js
 */

import { Router } from 'express';
import { favoritesController } from '../controllers/favoritesController.js';
import { requireAuth } from '../middleware/auth.js';
import { generalLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(requireAuth, generalLimiter);

router.get('/',                   favoritesController.getFavorites);
router.post('/',                  favoritesController.addFavorite);
router.delete('/:problemSlug',   favoritesController.removeFavorite);

export default router;
