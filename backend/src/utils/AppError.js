/**
 * src/utils/AppError.js
 *
 * WHY: We need one error class that carries both a message AND an HTTP status code.
 *      Without this, every catch block would need to manually set status codes.
 * HOW: Extends the built-in Error class. The `isOperational` flag distinguishes
 *      expected errors (bad input, not found) from programmer errors (bugs).
 * DESIGN: The global error handler checks isOperational:
 *         - true  → send error details to client
 *         - false → log it and send generic "Internal Server Error"
 */

export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);

    this.statusCode = statusCode;
    this.status = statusCode >= 400 && statusCode < 500 ? 'fail' : 'error';

    // Operational errors are expected — bad input, not found, etc.
    // Non-operational errors are bugs — database crashes, null pointers, etc.
    this.isOperational = true;

    // Captures the stack trace, excluding this constructor call
    Error.captureStackTrace(this, this.constructor);
  }
}
