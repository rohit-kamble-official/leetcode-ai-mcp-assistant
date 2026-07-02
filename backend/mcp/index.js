/**
 * mcp/index.js
 *
 * WHY: The MCP server runs as a completely separate process from the REST API.
 *      AI tools (Claude Desktop, Cursor) launch it via stdio — they call it
 *      like a CLI tool, not an HTTP server.
 *
 * HOW: Connects to DB and Redis (needed for caching), then starts the MCP
 *      server on stdio transport.
 *
 * USAGE:
 *   node mcp/index.js
 *
 * CONFIG (Claude Desktop ~/.config/claude/claude_desktop_config.json):
 *   {
 *     "mcpServers": {
 *       "leetcode": {
 *         "command": "node",
 *         "args": ["/path/to/project/mcp/index.js"],
 *         "env": { "ANTHROPIC_API_KEY": "...", "DB_HOST": "..." }
 *       }
 *     }
 *   }
 */

import 'dotenv/config';
import { connectDatabase } from '../src/config/database.js';
import { connectRedis } from '../src/config/redis.js';
import { startMcpServer } from '../src/services/mcp/mcpServer.js';
import logger from '../src/config/logger.js';

const start = async () => {
  try {
    await connectDatabase();
    await connectRedis();
    await startMcpServer();
  } catch (err) {
    logger.error('MCP Server failed to start', { error: err.message });
    process.exit(1);
  }
};

start();
