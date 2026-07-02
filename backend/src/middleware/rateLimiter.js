/**
 * src/middleware/rateLimiter.js
 *
 * WHY: Without rate limiting, a single user could spam requests and either
 *      crash our server or trigger LeetCode/AI API bans.
 * HOW: express-rate-limit tracks requests by IP in memory.
 *      AI routes get a tighter limit since AI calls are expensive.
 * DESIGN: We export multiple limiters for different sensitivity levels.
 */

import rateLimit from 'express-rate-limit';

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000; // 15 min
const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;

/**
 * General API limiter — 100 requests per 15 minutes per IP.
 */
export const generalLimiter = rateLimit({
  windowMs,
  max: maxRequests,
  message: {
    success: false,
    error: {
      code: 429,
      message: 'Too many requests. Please try again later.',
    },
  },
  standardHeaders: true, // Returns rate limit info in RateLimit-* headers
  legacyHeaders: false,
});

/**
 * Auth limiter — stricter to prevent brute-force attacks.
 * 10 attempts per 15 minutes per IP.
 */
export const authLimiter = rateLimit({
  windowMs,
  max: 10,
  message: {
    success: false,
    error: {
      code: 429,
      message: 'Too many authentication attempts. Please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * AI limiter — tighter because AI calls cost money and take time.
 * 20 requests per 15 minutes per IP.
 */
export const aiLimiter = rateLimit({
  windowMs,
  max: 20,
  message: {
    success: false,
    error: {
      code: 429,
      message: 'AI request limit reached. Please slow down.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
