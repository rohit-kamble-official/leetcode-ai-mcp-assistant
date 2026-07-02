/**
 * src/routes/profileRoutes.js
 */

import { Router } from 'express';
import { profileController } from '../controllers/profileController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateProfileValidation } from '../validators/profileValidators.js';
import { generalLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// All profile routes require authentication and are rate-limited
router.use(requireAuth, generalLimiter);

router.get('/',    profileController.getProfile);
router.put('/',    updateProfileValidation, validate, profileController.updateProfile);
router.delete('/', profileController.deleteAccount);

export default router;
