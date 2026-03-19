

const { verifyToken } = require('../utils/jwtUtils');
const { connectionManager } = require('./connectionManager');
const { eventHandlers } = require('./eventHandlers');
const User = require('../models/User');

async function handleWebSocketMessage(ws, message) {
  const { type, payload } = message;

  if (type === 'AUTHENTICATE') {
    await handleAuthentication(ws, payload);
    return;
  }

  if (!ws.isAuthenticated) {
    ws.send(JSON.stringify({
      type: 'ERROR',
      payload: {
        message: 'Please authenticate first',
        requiresAuth: true
      }
    }));
    return;
  }

  const handler = eventHandlers[type];
  
  if (handler) {
    await handler(ws, payload);
  } else {
    ws.send(JSON.stringify({
      type: 'ERROR',
      payload: {
        message: `Unknown message type: ${type}`
      }
    }));
  }
}

async function handleAuthentication(ws, payload) {
  try {
    const { token } = payload;

    if (!token) {
      ws.send(JSON.stringify({
        type: 'AUTH_ERROR',
        payload: { message: 'Token is required' }
      }));
      return;
    }

    const decoded = verifyToken(token);
    
    if (!decoded) {
      ws.send(JSON.stringify({
        type: 'AUTH_ERROR',
        payload: { message: 'Invalid or expired token' }
      }));
      return;
    }

    const user = await User.findById(decoded.userId);
    
    if (!user) {
      ws.send(JSON.stringify({
        type: 'AUTH_ERROR',
        payload: { message: 'User not found' }
      }));
      return;
    }

    ws.isAuthenticated = true;
    ws.userId = user._id.toString();
    ws.userRole = user.role;
    ws.userName = user.name;

    connectionManager.addConnection(ws.userId, ws);

    ws.send(JSON.stringify({
      type: 'AUTHENTICATED',
      payload: {
        userId: ws.userId,
        name: user.name,
        role: user.role,
        timestamp: new Date().toISOString()
      }
    }));

    console.log(`User ${user.name} (${ws.userId}) authenticated via WebSocket`);
  } catch (error) {
    console.error('Authentication error:', error);
    ws.send(JSON.stringify({
      type: 'AUTH_ERROR',
      payload: { message: 'Authentication failed' }
    }));
  }
}

module.exports = {
  handleWebSocketMessage,
  handleAuthentication
};
