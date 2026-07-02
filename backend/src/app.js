/**
 * src/app.js
 *
 * WHY: Separates the Express app from the server startup (src/server.js).
 *      This makes it easy to import `app` in tests without starting the server.
 * HOW: Configures all middleware in the correct order, registers all routes,
 *      and sets up error handling.
 *
 * Middleware Order Matters:
 *   1. Security (helmet, cors, compression)
 *   2. Body parsing (json, urlencoded)
 *   3. Logging (morgan)
 *   4. Routes
 *   5. 404 handler
 *   6. Global error handler (must be last)
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';

dotenv.config();

import { swaggerSpec } from './config/swagger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Route imports
import authRoutes     from './routes/authRoutes.js';
import profileRoutes  from './routes/profileRoutes.js';
import problemsRoutes from './routes/problemsRoutes.js';
import aiRoutes       from './routes/aiRoutes.js';
import favoritesRoutes from './routes/favoritesRoutes.js';
import historyRoutes  from './routes/historyRoutes.js';
import dailyRoutes    from './routes/dailyRoutes.js';

const app = express();

// ============================================================
// 1. Security Middleware
// ============================================================

// helmet sets security-related HTTP headers (XSS, clickjacking, etc.)
app.use(helmet());

// CORS: only allow requests from the configured frontend origin
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Compress all responses — reduces bandwidth significantly for large payloads
app.use(compression());

// ============================================================
// 2. Body Parsing
// ============================================================

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ============================================================
// 3. Logging
// ============================================================

// morgan logs HTTP requests. 'dev' format: "GET /api/v1/problems 200 45ms"
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ============================================================
// 4. Health Check (no rate limiting, no auth)
// ============================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// ============================================================
// 5. API Documentation
// ============================================================

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'LeetCode AI MCP API Docs',
}));

// ============================================================
// 6. API Routes — all prefixed with /api/v1
// ============================================================

const API_PREFIX = '/api/v1';

app.use(`${API_PREFIX}/auth`,      authRoutes);
app.use(`${API_PREFIX}/profile`,   profileRoutes);
app.use(`${API_PREFIX}/problems`,  problemsRoutes);
app.use(`${API_PREFIX}/ai`,        aiRoutes);
app.use(`${API_PREFIX}/favorites`, favoritesRoutes);
app.use(`${API_PREFIX}/history`,   historyRoutes);
app.use(`${API_PREFIX}/daily`,     dailyRoutes);

// ============================================================
// 7. Error Handling (MUST be last)
// ============================================================

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
