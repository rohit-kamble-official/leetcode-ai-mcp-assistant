/**
 * src/websocket/wsHandler.js
 *
 * WHY: Some features need real-time updates — submission status, notifications.
 *      HTTP polling wastes bandwidth. WebSockets maintain a persistent connection
 *      so the server can push updates instantly.
 *
 * HOW: Built on the ws library (lower-level than Socket.io but lighter weight).
 *      Each client connection is authenticated via JWT in the handshake.
 *      Messages are JSON: { type: string, payload: any }
 *
 * DESIGN:
 *   - Client connects and authenticates with a JWT
 *   - Server assigns them a room based on userId
 *   - Other services can broadcast to a user's room via broadcastToUser()
 *
 * Message Types (client → server):
 *   AUTH     — { type: 'AUTH', token: '...' }
 *   PING     — { type: 'PING' } → server responds PONG
 *   SUBSCRIBE — { type: 'SUBSCRIBE', channel: 'submissions' }
 *
 * Message Types (server → client):
 *   AUTH_SUCCESS — { type: 'AUTH_SUCCESS', userId: '...' }
 *   AUTH_FAILED  — { type: 'AUTH_FAILED', message: '...' }
 *   PONG         — { type: 'PONG' }
 *   NOTIFICATION — { type: 'NOTIFICATION', payload: { title, message } }
 *   SUBMISSION   — { type: 'SUBMISSION', payload: { status, runtime, memory } }
 */

import { WebSocketServer } from 'ws';
import { authService } from '../services/authService.js';
import { userRepository } from '../repositories/userRepository.js';
import logger from '../config/logger.js';

// Map of userId → Set of WebSocket connections (user can have multiple tabs)
const userConnections = new Map();

/**
 * Initialize the WebSocket server and attach it to an HTTP server.
 * Called once in app startup with the HTTP server instance.
 *
 * @param {http.Server} httpServer - The Express HTTP server
 */
export const initWebSocket = (httpServer) => {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws, req) => {
    logger.info('WebSocket client connected', { ip: req.socket.remoteAddress });

    // Each connection starts unauthenticated
    ws.isAuthenticated = false;
    ws.userId = null;

    // Set up ping/pong heartbeat — detect dead connections
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });

    ws.on('message', async (rawMessage) => {
      try {
        const message = JSON.parse(rawMessage.toString());
        await handleMessage(ws, message);
      } catch (err) {
        sendToClient(ws, { type: 'ERROR', message: 'Invalid message format' });
      }
    });

    ws.on('close', () => {
      if (ws.userId) {
        removeConnection(ws.userId, ws);
        logger.info('WebSocket client disconnected', { userId: ws.userId });
      }
    });

    ws.on('error', (err) => {
      logger.error('WebSocket error', { error: err.message });
    });

    // Send welcome message
    sendToClient(ws, { type: 'CONNECTED', message: 'Connected. Please authenticate.' });
  });

  // Heartbeat: ping all clients every 30s, terminate dead ones
  // This prevents zombie connections from accumulating
  const heartbeat = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) {
        logger.debug('Terminating dead WebSocket connection');
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => clearInterval(heartbeat));

  logger.info('✅ WebSocket server initialized on /ws');
  return wss;
};

/**
 * Handle incoming WebSocket messages.
 * Routes each message type to the correct handler.
 */
async function handleMessage(ws, message) {
  switch (message.type) {
    case 'AUTH': {
      await handleAuth(ws, message.token);
      break;
    }

    case 'PING': {
      sendToClient(ws, { type: 'PONG', timestamp: Date.now() });
      break;
    }

    case 'SUBSCRIBE': {
      if (!ws.isAuthenticated) {
        sendToClient(ws, { type: 'ERROR', message: 'Authentication required' });
        return;
      }
      // Could track channel subscriptions here for selective broadcasting
      sendToClient(ws, { type: 'SUBSCRIBED', channel: message.channel });
      break;
    }

    default: {
      sendToClient(ws, { type: 'ERROR', message: `Unknown message type: ${message.type}` });
    }
  }
}

/**
 * Authenticate a WebSocket connection using a JWT access token.
 */
async function handleAuth(ws, token) {
  try {
    const payload = authService.verifyAccessToken(token);
    const user = await userRepository.findById(payload.sub);

    if (!user) {
      sendToClient(ws, { type: 'AUTH_FAILED', message: 'User not found' });
      return;
    }

    ws.isAuthenticated = true;
    ws.userId = user.id;
    addConnection(user.id, ws);

    sendToClient(ws, {
      type: 'AUTH_SUCCESS',
      userId: user.id,
      name: user.name,
    });

    logger.info('WebSocket authenticated', { userId: user.id });
  } catch (err) {
    sendToClient(ws, { type: 'AUTH_FAILED', message: 'Invalid token' });
  }
}

/**
 * Register a connection in the userConnections map.
 * A user can have multiple connections (multiple browser tabs).
 */
function addConnection(userId, ws) {
  if (!userConnections.has(userId)) {
    userConnections.set(userId, new Set());
  }
  userConnections.get(userId).add(ws);
}

function removeConnection(userId, ws) {
  const connections = userConnections.get(userId);
  if (connections) {
    connections.delete(ws);
    if (connections.size === 0) {
      userConnections.delete(userId);
    }
  }
}

/**
 * Send a JSON message to a specific WebSocket client.
 */
function sendToClient(ws, message) {
  if (ws.readyState === 1) { // 1 = OPEN
    ws.send(JSON.stringify(message));
  }
}

/**
 * Broadcast a message to ALL connections for a user.
 * Called from other services to push real-time updates.
 *
 * @param {string} userId
 * @param {Object} message
 */
export const broadcastToUser = (userId, message) => {
  const connections = userConnections.get(userId);
  if (!connections || connections.size === 0) return;

  const serialized = JSON.stringify(message);
  connections.forEach((ws) => {
    if (ws.readyState === 1) {
      ws.send(serialized);
    }
  });
};

/**
 * Get the count of active WebSocket connections.
 * Useful for metrics/monitoring.
 */
export const getConnectionCount = () => {
  let total = 0;
  userConnections.forEach((set) => { total += set.size; });
  return total;
};
