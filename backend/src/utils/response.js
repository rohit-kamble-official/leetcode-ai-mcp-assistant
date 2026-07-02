/**
 * src/utils/response.js
 *
 * WHY: Consistent response format across all endpoints makes the API
 *      predictable for frontend developers.
 * HOW: Two helper functions — success and error — that always return
 *      the same JSON shape.
 *
 * Success shape:  { success: true, data: {...}, message: "...", meta: {...} }
 * Error shape:    { success: false, error: { code: 400, message: "..." } }
 */

/**
 * Send a successful response.
 *
 * @param {Object} res - Express response object
 * @param {*} data - Response payload
 * @param {string} message - Human-readable description
 * @param {number} statusCode - HTTP status code (default 200)
 * @param {Object} meta - Optional pagination or extra metadata
 */
export const sendSuccess = (res, data, message = 'Success', statusCode = 200, meta = null) => {
  const response = {
    success: true,
    message,
    data,
  };

  if (meta) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send an error response.
 *
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default 500)
 * @param {*} details - Optional additional error details
 */
export const sendError = (res, message = 'Internal Server Error', statusCode = 500, details = null) => {
  const response = {
    success: false,
    error: {
      code: statusCode,
      message,
    },
  };

  if (details && process.env.NODE_ENV !== 'production') {
    response.error.details = details;
  }

  return res.status(statusCode).json(response);
};

/**
 * Build pagination metadata object.
 * Included in list responses so the client knows total pages.
 *
 * @param {number} total - Total items count
 * @param {number} page - Current page (1-indexed)
 * @param {number} limit - Items per page
 */
export const buildPaginationMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
  hasNextPage: page * limit < total,
  hasPrevPage: page > 1,
});
