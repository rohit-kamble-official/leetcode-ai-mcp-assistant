/**
 * src/config/database.js
 *
 * WHY: Centralizes all PostgreSQL connection configuration.
 * HOW: Uses the pg library's Pool for connection pooling, which
 *      reuses database connections instead of creating a new one
 *      per request — critical for performance under load.
 * DESIGN: Exported as a singleton so the entire app shares one pool.
 */

import pg from 'pg';
import logger from './logger.js';

const { Pool } = pg;

// Connection pool: reuses DB connections (default max: 10)
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,

  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,

  min: parseInt(process.env.DB_POOL_MIN) || 2,
  max: parseInt(process.env.DB_POOL_MAX) || 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Log pool errors so they don't crash the process silently
pool.on('error', (err) => {
  logger.error('Unexpected error on idle database client', { error: err.message });
});

/**
 * Test the database connection on startup.
 * Throws if the connection fails so the app doesn't start broken.
 */
export const connectDatabase = async () => {
  const client = await pool.connect();
  try {
    await client.query('SELECT NOW()');
    logger.info('✅ PostgreSQL connected successfully');
  } finally {
    client.release();
  }
};

export default pool;
