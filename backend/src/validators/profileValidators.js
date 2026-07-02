/**
 * src/validators/profileValidators.js
 */

import { body, param, query } from 'express-validator';

export const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),

  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),

  body('leetcodeUsername')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('LeetCode username is too long')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('LeetCode username can only contain letters, numbers, hyphens, and underscores'),
];

export const problemSlugValidation = [
  param('titleSlug')
    .trim()
    .notEmpty()
    .withMessage('Problem slug is required')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Invalid problem slug format'),
];

export const searchValidation = [
  query('q')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Search query too long'),

  query('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard', 'EASY', 'MEDIUM', 'HARD'])
    .withMessage('Difficulty must be easy, medium, or hard'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
];

export const codeAnalysisValidation = [
  body('code')
    .notEmpty()
    .withMessage('Code is required')
    .isLength({ max: 10000 })
    .withMessage('Code exceeds maximum length'),

  body('language')
    .optional()
    .isIn(['python', 'javascript', 'java', 'cpp', 'c', 'go', 'rust', 'typescript', 'kotlin', 'swift'])
    .withMessage('Unsupported programming language'),
];
