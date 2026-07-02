/**
 * src/config/logger.js
 *
 * WHY: Structured logging is essential in production. console.log() doesn't
 *      give you timestamps, levels, or machine-parseable output.
 * HOW: Winston writes colored logs to the console in development and
 *      JSON-formatted logs (for log aggregators like Datadog) in production.
 * DESIGN: Exported as a singleton so all modules share one logger.
 */

import { createLogger, format, transports } from 'winston';

const { combine, timestamp, printf, colorize, errors } = format;

// Human-readable format for development
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// JSON format for production (log aggregators parse this easily)
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  format.json()
);

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
  transports: [new transports.Console()],
  // Don't crash the app if logger fails
  exitOnError: false,
});

export default logger;
