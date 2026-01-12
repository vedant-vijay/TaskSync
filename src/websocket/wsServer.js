const WebSocket = require('ws');
const { verifyToken } = require('../utils/jwtUtils');
const { handleWebSocketMessage } = require('./wsHandlers');
const { connectionManager } = require('./connectionManager');

let wss = null;


function initializeWebSocketServer(port) {
  wss = new WebSocket.Server({ port });

  wss.on('connection', handleConnection);

  // Start heartbeat
  setupHeartbeat();

  console.log(`WebSocket server initialized on port ${port}`);
  
  return wss;
}

/**
 * Handle new WebSocket connection
 */
function handleConnection(ws, req) {
  console.log('New WebSocket connection attempt');

  // Connection is not authenticated yet
  ws.isAuthenticated = false;
  ws.userId = null;
  ws.projectIds = new Set();

  // Set ping interval to keep connection alive
  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  // Handle incoming messages
  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      await handleWebSocketMessage(ws, message);
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
      ws.send(JSON.stringify({
        type: 'ERROR',
        payload: {
          message: 'Invalid message format or processing error',
          error: error.message
        }
      }));
    }
  });

  // Handle connection close
  ws.on('close', () => {
    handleDisconnection(ws);
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  // Send connection established message
  ws.send(JSON.stringify({
    type: 'CONNECTION_ESTABLISHED',
    payload: {
      message: 'Connected to WebSocket server. Please authenticate.',
      timestamp: new Date().toISOString()
    }
  }));
}

/**
 * Handle WebSocket disconnection
 */
function handleDisconnection(ws) {
  if (ws.isAuthenticated && ws.userId) {
    console.log(`User ${ws.userId} disconnected`);

    // Notify all projects about user disconnection
    ws.projectIds.forEach(projectId => {
      connectionManager.broadcastToProject(projectId, {
        type: 'USER_DISCONNECTED',
        payload: {
          userId: ws.userId,
          userName: ws.userName,
          projectId,
          timestamp: new Date().toISOString()
        }
      }, ws.userId);
    });

    // Remove connection from manager
    connectionManager.removeConnection(ws.userId);
  }
}

/**
 * Setup periodic ping to keep connections alive
 */
function setupHeartbeat() {
  const interval = setInterval(() => {
    if (!wss) return;

    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }

      ws.isAlive = false;
      ws.ping();
    });
  }, 30000); // 30 seconds

  if (wss) {
    wss.on('close', () => {
      clearInterval(interval);
    });
  }
}

/**
 * Get WebSocket server instance
 */
function getWSS() {
  return wss;
}

module.exports = {
  initializeWebSocketServer,
  getWSS
};