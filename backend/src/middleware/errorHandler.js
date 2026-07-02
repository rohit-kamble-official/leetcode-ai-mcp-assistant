/**
 * src/middleware/errorHandler.js
 *
 * WHY: Without a global error handler, unhandled errors return ugly stack
 *      traces to clients (a security risk in production).
 * HOW: Express recognizes a 4-parameter middleware as an error handler.
 *      We check isOperational to decide how much detail to share.
 * DESIGN: This is the LAST middleware registered in app.js so it catches
 *         errors propagated by next(err) throughout the app.
 */

import logger from '../config/logger.js';

export const errorHandler = (err, req, res, next) => {
  // Log the full error for debugging
  logger.error('Unhandled error', {
    message: err.message,
    statusCode: err.statusCode,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  const statusCode = err.statusCode || 500;
  const isOperational = err.isOperational || false;

  // Operational errors: safe to send details to client
  // Programming errors: send generic message to avoid leaking internals
  const message = isOperational ? err.message : 'An unexpected error occurred';

  const response = {
    success: false,
    error: {
      code: statusCode,
      message,
    },
  };

  // Include stack trace in development for debugging
  if (process.env.NODE_ENV === 'development' && err.stack) {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

/**
 * Catch 404s — when no route matches the request.
 * Must be registered AFTER all routes but BEFORE errorHandler.
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 404,
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
};
