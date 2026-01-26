const WebSocket = require('ws');
const { verifyToken } = require('../utils/jwtUtils');
const { handleWebSocketMessage } = require('./wsHandlers');
const { connectionManager } = require('./connectionManager');

let wss = null;


function initializeWebSocketServer(port) {
  wss = new WebSocket.Server({ port });

  wss.on('connection', handleConnection);

  setupHeartbeat();

  console.log(`WebSocket server initialized on port ${port}`);
  
  return wss;
}

function handleConnection(ws, req) {
  console.log('New WebSocket connection attempt');

  ws.isAuthenticated = false;
  ws.userId = null;
  ws.projectIds = new Set();

  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
  });

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

  ws.on('close', () => {
    handleDisconnection(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  ws.send(JSON.stringify({
    type: 'CONNECTION_ESTABLISHED',
    payload: {
      message: 'Connected to WebSocket server. Please authenticate.',
      timestamp: new Date().toISOString()
    }
  }));
}

function handleDisconnection(ws) {
  if (ws.isAuthenticated && ws.userId) {
    console.log(`User ${ws.userId} disconnected`);

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

    connectionManager.removeConnection(ws.userId);
  }
}

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
  }, 30000); 

  if (wss) {
    wss.on('close', () => {
      clearInterval(interval);
    });
  }
}

function getWSS() {
  return wss;
}

module.exports = {
  initializeWebSocketServer,
  getWSS
};
