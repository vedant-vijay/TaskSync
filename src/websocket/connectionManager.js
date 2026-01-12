
class ConnectionManager {
  constructor() {
    // Map of userId -> WebSocket connection
    this.connections = new Map();
    
    // Map of projectId -> Set of userIds
    this.projectRooms = new Map();
  }

  /**
   * Add a connection
   */
  addConnection(userId, ws) {
    this.connections.set(userId, ws);
    console.log(`Connection added for user: ${userId}`);
  }

  /**
   * Remove a connection
   */
  removeConnection(userId) {
    const ws = this.connections.get(userId);
    
    if (ws) {
      // Remove user from all project rooms
      ws.projectIds.forEach(projectId => {
        this.leaveProject(userId, projectId);
      });
    }
    
    this.connections.delete(userId);
    console.log(`Connection removed for user: ${userId}`);
  }

  /**
   * Get connection for a user
   */
  getConnection(userId) {
    return this.connections.get(userId);
  }

  /**
   * Join a project room
   */
  joinProject(userId, projectId) {
    if (!this.projectRooms.has(projectId)) {
      this.projectRooms.set(projectId, new Set());
    }
    
    this.projectRooms.get(projectId).add(userId);
    console.log(`User ${userId} joined project room ${projectId}`);
  }

  /**
   * Leave a project room
   */
  leaveProject(userId, projectId) {
    const room = this.projectRooms.get(projectId);
    
    if (room) {
      room.delete(userId);
      
      // Clean up empty rooms
      if (room.size === 0) {
        this.projectRooms.delete(projectId);
      }
      
      console.log(`User ${userId} left project room ${projectId}`);
    }
  }

  /**
   * Get all users in a project
   */
  getProjectUsers(projectId) {
    return this.projectRooms.get(projectId) || new Set();
  }

  /**
   * Broadcast message to all users in a project
   */
  broadcastToProject(projectId, message, excludeUserId = null) {
    const users = this.getProjectUsers(projectId);
    let sentCount = 0;
    
    users.forEach(userId => {
      if (userId !== excludeUserId) {
        const ws = this.getConnection(userId);
        
        if (ws && ws.readyState === 1) { // WebSocket.OPEN
          try {
            ws.send(JSON.stringify(message));
            sentCount++;
          } catch (error) {
            console.error(`Failed to send message to user ${userId}:`, error);
          }
        }
      }
    });
    
    console.log(`Broadcast ${message.type} to ${sentCount} users in project ${projectId}`);
  }

  /**
   * Send message to specific user
   */
  sendToUser(userId, message) {
    const ws = this.getConnection(userId);
    
    if (ws && ws.readyState === 1) {
      try {
        ws.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error(`Failed to send message to user ${userId}:`, error);
        return false;
      }
    }
    
    return false;
  }

  /**
   * Get active connections count
   */
  getActiveConnectionsCount() {
    return this.connections.size;
  }

  /**
   * Get project rooms count
   */
  getProjectRoomsCount() {
    return this.projectRooms.size;
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      activeConnections: this.getActiveConnectionsCount(),
      projectRooms: this.getProjectRoomsCount(),
      projects: Array.from(this.projectRooms.entries()).map(([projectId, users]) => ({
        projectId,
        userCount: users.size
      }))
    };
  }
}

// Create singleton instance
const connectionManager = new ConnectionManager();

module.exports = {
  connectionManager,
  ConnectionManager
};