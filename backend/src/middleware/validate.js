/**
 * src/middleware/validate.js
 *
 * WHY: Input validation prevents bad data from reaching services or the DB.
 *      Without it, users could send SQL injection attempts, empty strings, etc.
 * HOW: express-validator defines validation rules as arrays of middlewares.
 *      Our validate() wrapper runs them and collects errors.
 * DESIGN: Validation rules are defined in validators/ and imported in routes.
 *         This keeps route files clean — they just reference rule arrays.
 */

import { validationResult } from 'express-validator';
import { sendError } from '../utils/response.js';

/**
 * Run all validators and return 400 if any failed.
 * Usage in routes:
 *
 *   router.post('/login', loginValidation, validate, authController.login);
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => `${e.path}: ${e.msg}`).join('; ');
    return sendError(res, messages, 400);
  }
  next();
};
