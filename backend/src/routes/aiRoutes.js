/**
 * src/routes/aiRoutes.js
 */

import { Router } from 'express';
import { aiController } from '../controllers/aiController.js';
import { requireAuth } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { codeAnalysisValidation } from '../validators/profileValidators.js';

const router = Router();

// AI routes require auth (to prevent anonymous API abuse)
router.use(requireAuth, aiLimiter);

router.post('/problems/:titleSlug/explain',          aiController.explainProblem);
router.post('/problems/:titleSlug/hints',            aiController.getHints);
router.post('/problems/:titleSlug/explain-solution', codeAnalysisValidation, validate, aiController.explainSolution);
router.post('/analyze-code',                         codeAnalysisValidation, validate, aiController.analyzeCode);
router.post('/optimize-code',                        codeAnalysisValidation, validate, aiController.optimizeCode);
router.post('/time-complexity',                      codeAnalysisValidation, validate, aiController.timeComplexity);
router.post('/space-complexity',                     codeAnalysisValidation, validate, aiController.spaceComplexity);

export default router;
