/**
 * src/server.js
 *
 * WHY: This is the entry point. It starts the HTTP server and connects
 *      to all external dependencies (DB, Redis).
 * HOW: We use http.createServer() instead of app.listen() because we need
 *      to attach the WebSocket server to the same HTTP server instance.
 * DESIGN: Graceful shutdown — when SIGTERM/SIGINT is received (e.g., Docker stop),
 *         we close the server cleanly before exiting. This prevents data loss
 *         from in-flight requests being killed abruptly.
 */

import 'dotenv/config';
import http from 'http';
import app from './app.js';
import { connectDatabase } from './config/database.js';
import { connectRedis } from './config/redis.js';
import { initWebSocket } from './websocket/wsHandler.js';
import logger from './config/logger.js';

const PORT = parseInt(process.env.PORT) || 3000;

const start = async () => {
  try {
    // 1. Connect to PostgreSQL
    await connectDatabase();

    // 2. Connect to Redis
    await connectRedis();

    // 3. Create HTTP server (wraps Express app)
    const httpServer = http.createServer(app);

    // 4. Attach WebSocket server to the same port
    initWebSocket(httpServer);

    // 5. Start listening
    httpServer.listen(PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${PORT}`);
      logger.info(`📖 API Docs: http://localhost:${PORT}/api-docs`);
      logger.info(`🔌 WebSocket: ws://localhost:${PORT}/ws`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // ============================================================
    // Graceful Shutdown
    // ============================================================
    // When Kubernetes/Docker sends SIGTERM, finish in-flight requests first.
    const shutdown = (signal) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      httpServer.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });

      // Force exit after 10 seconds if graceful shutdown hangs
      setTimeout(() => {
        logger.error('Forcefully shutting down after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

    // Catch unhandled promise rejections — log but don't crash
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Promise Rejection', { reason });
    });

    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
      process.exit(1); // Uncaught exceptions leave the app in an unknown state
    });

  } catch (err) {
    logger.error('Failed to start server', { error: err.message });
    process.exit(1);
  }
};

start();
