const { connectionManager } = require('./connectionManager');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');

/**
 * Handle JOIN_PROJECT event
 */
async function handleJoinProject(ws, payload) {
  try {
    const { projectId } = payload;

    if (!projectId) {
      ws.send(JSON.stringify({
        type: 'ERROR',
        payload: { message: 'Project ID is required' }
      }));
      return;
    }

    // Verify project exists and user is a member
    const isMember = await Project.isMember(projectId, ws.userId);
    
    if (!isMember) {
      ws.send(JSON.stringify({
        type: 'ERROR',
        payload: { message: 'You are not a member of this project' }
      }));
      return;
    }

    // Add user to project room
    ws.projectIds.add(projectId);
    connectionManager.joinProject(ws.userId, projectId);

    // Get project details
    const project = await Project.findById(projectId);
    const members = await Project.getMembersWithDetails(projectId);
    const tasks = await Task.findByProjectId(projectId);

    // Get online users in project
    const onlineUsers = Array.from(connectionManager.getProjectUsers(projectId));

    // Notify user with project data
    ws.send(JSON.stringify({
      type: 'PROJECT_JOINED',
      payload: {
        projectId,
        project: {
          _id: project._id.toString(), // ✅ Changed from 'id' to '_id'
          name: project.name,
          description: project.description,
          leaderId: project.leaderId.toString()
        },
        members,
        tasks: tasks.map(t => ({
          _id: t._id.toString(), // ✅ Changed from 'id' to '_id'
          title: t.title,
          description: t.description,
          projectId: t.projectId.toString(),
          createdBy: t.createdBy.toString(),
          assignedTo: t.assignedTo?.toString(),
          status: t.status,
          commentCount: t.comments?.length || 0,
          activeViewers: t.activeViewers?.map(v => v.toString()) || [],
          activeEditors: t.activeEditors?.map(e => e.toString()) || [],
          createdAt: t.createdAt,
          updatedAt: t.updatedAt
        })),
        onlineUsers,
        timestamp: new Date().toISOString()
      }
    }));

    // Notify other users in project
    connectionManager.broadcastToProject(projectId, {
      type: 'USER_CONNECTED',
      payload: {
        user: {
          _id: ws.userId, // ✅ Added for consistency
          id: ws.userId,  // Keep both for compatibility
          name: ws.userName
        },
        projectId,
        timestamp: new Date().toISOString()
      }
    }, ws.userId);

    console.log(`User ${ws.userId} joined project ${projectId}`);
  } catch (error) {
    console.error('Error in handleJoinProject:', error);
    ws.send(JSON.stringify({
      type: 'ERROR',
      payload: { message: 'Failed to join project' }
    }));
  }
}

/**
 * Handle LEAVE_PROJECT event
 */
async function handleLeaveProject(ws, payload) {
  try {
    const { projectId } = payload;

    if (!projectId) {
      return;
    }

    // Remove user from project room
    ws.projectIds.delete(projectId);
    connectionManager.leaveProject(ws.userId, projectId);

    // Notify other users
    connectionManager.broadcastToProject(projectId, {
      type: 'USER_DISCONNECTED',
      payload: {
        userId: ws.userId,
        userName: ws.userName,
        projectId,
        timestamp: new Date().toISOString()
      }
    }, ws.userId);

    ws.send(JSON.stringify({
      type: 'PROJECT_LEFT',
      payload: { projectId }
    }));

    console.log(`User ${ws.userId} left project ${projectId}`);
  } catch (error) {
    console.error('Error in handleLeaveProject:', error);
  }
}

/**
 * Handle CREATE_TASK event
 */
async function handleCreateTask(ws, payload) {
  try {
    const { projectId, title, description, assignedTo, status } = payload;

    if (!title || !projectId) {
      ws.send(JSON.stringify({
        type: 'ERROR',
        payload: { message: 'Title and project ID are required' }
      }));
      return;
    }

    // Verify user is member
    const isMember = await Project.isMember(projectId, ws.userId);
    if (!isMember) {
      ws.send(JSON.stringify({
        type: 'ERROR',
        payload: { message: 'Not a member of this project' }
      }));
      return;
    }

    // Build task data
    const taskData = {
      title,
      description,
      projectId,
      createdBy: ws.userId,
      status: status || 'TODO'
    };

    // ✅ Only add assignedTo if it's a valid value
    if (assignedTo && typeof assignedTo === 'string' && assignedTo.trim() !== '') {
      // ✅ Validate it's a valid ObjectId format
      if (!/^[0-9a-fA-F]{24}$/.test(assignedTo)) {
        ws.send(JSON.stringify({
          type: 'ERROR',
          payload: { message: 'Invalid user ID format for assignment' }
        }));
        return;
      }
      taskData.assignedTo = assignedTo;
    }

    console.log('Creating task with data:', taskData);

    // ✅ Create the task - this was missing!
    const task = await Task.create(taskData);

    // ✅ Get assigned user details if task is assigned
    let assignedUser = null;
    if (task.assignedTo) {
      assignedUser = await User.findById(task.assignedTo);
    }

    // Broadcast to all project members
    connectionManager.broadcastToProject(projectId, {
      type: 'TASK_CREATED',
      payload: {
        task: {
          _id: task._id.toString(),
          title: task.title,
          description: task.description,
          projectId: task.projectId.toString(),
          createdBy: task.createdBy.toString(),
          assignedTo: assignedUser ? {
            _id: assignedUser._id.toString(),
            name: assignedUser.name
          } : null,
          status: task.status,
          commentCount: 0,
          comments: [],
          activeViewers: [],
          activeEditors: [],
          createdAt: task.createdAt,
          updatedAt: task.updatedAt
        },
        createdBy: {
          userId: ws.userId,
          userName: ws.userName
        },
        timestamp: new Date().toISOString()
      }
    });

    console.log(`✅ Task created in project ${projectId} by user ${ws.userId}`);
  } catch (error) {
    console.error('❌ Error in handleCreateTask:', error);
    ws.send(JSON.stringify({
      type: 'ERROR',
      payload: { message: 'Failed to create task', error: error.message }
    }));
  }
}

/**
 * Handle ASSIGN_TASK event
 */
async function handleAssignTask(ws, payload) {
  try {
    const { taskId, assignedTo, projectId } = payload;

    console.log('📋 Assign task request:', { taskId, assignedTo, projectId });

    if (!taskId || !projectId) {
      ws.send(JSON.stringify({
        type: 'ERROR',
        payload: { message: 'Task ID and project ID are required' }
      }));
      return;
    }

    // Get task
    const task = await Task.findById(taskId);
    if (!task) {
      ws.send(JSON.stringify({
        type: 'ERROR',
        payload: { message: 'Task not found' }
      }));
      return;
    }

    // Verify project membership
    const isMember = await Project.isMember(projectId, ws.userId);
    if (!isMember) {
      ws.send(JSON.stringify({
        type: 'ERROR',
        payload: { message: 'Not authorized' }
      }));
      return;
    }

    // ✅ Handle unassign case FIRST - check for null, undefined, empty string, or "null" string
    if (!assignedTo || assignedTo === '' || assignedTo === 'null' || assignedTo === 'undefined') {
      console.log('🔄 Unassigning task:', taskId);
      
      // Unassign the task
      await Task.assign(taskId, null, ws.userId);
      
      connectionManager.broadcastToProject(projectId, {
        type: 'TASK_ASSIGNED',
        payload: {
          taskId,
          assignedTo: null,
          assignedBy: {
            userId: ws.userId,
            userName: ws.userName
          },
          timestamp: new Date().toISOString()
        }
      });
      
      console.log(`✅ Task ${taskId} unassigned by ${ws.userId}`);
      return; // ✅ RETURN HERE - don't continue to validation
    }

    // ✅ Validate assignedTo is a valid MongoDB ObjectId format (24 hex characters)
    if (!/^[0-9a-fA-F]{24}$/.test(assignedTo)) {
      console.error('❌ Invalid user ID format:', assignedTo);
      ws.send(JSON.stringify({
        type: 'ERROR',
        payload: { message: 'Invalid user ID format' }
      }));
      return;
    }

    // ✅ Verify assignee is a member (only if assigning to someone)
    const assigneeIsMember = await Project.isMember(projectId, assignedTo);
    if (!assigneeIsMember) {
      ws.send(JSON.stringify({
        type: 'ERROR',
        payload: { message: 'Assigned user is not a member of this project' }
      }));
      return;
    }

    // Assign task
    await Task.assign(taskId, assignedTo, ws.userId);

    // Get assigned user details
    const assignedUser = await User.findById(assignedTo);

    if (!assignedUser) {
      ws.send(JSON.stringify({
        type: 'ERROR',
        payload: { message: 'Assigned user not found' }
      }));
      return;
    }

    // Broadcast to all project members
    connectionManager.broadcastToProject(projectId, {
      type: 'TASK_ASSIGNED',
      payload: {
        taskId,
        assignedTo: {
          _id: assignedUser._id.toString(),
          name: assignedUser.name
        },
        assignedBy: {
          userId: ws.userId,
          userName: ws.userName
        },
        timestamp: new Date().toISOString()
      }
    });

    console.log(`✅ Task ${taskId} assigned to ${assignedTo} by ${ws.userId}`);
  } catch (error) {
    console.error('❌ Error in handleAssignTask:', error);
    ws.send(JSON.stringify({
      type: 'ERROR',
      payload: { message: 'Failed to assign task', error: error.message }
    }));
  }
}

/**
 * Handle UPDATE_TASK_STATUS event
 */
async function handleUpdateTaskStatus(ws, payload) {
  try {
    const { taskId, status, projectId } = payload;

    if (!taskId || !status || !projectId) {
      ws.send(JSON.stringify({
        type: 'ERROR',
        payload: { message: 'Task ID, status, and project ID are required' }
      }));
      return;
    }

    // Get task
    const task = await Task.findById(taskId);
    if (!task) {
      ws.send(JSON.stringify({
        type: 'ERROR',
        payload: { message: 'Task not found' }
      }));
      return;
    }

    // Verify project membership
    const isMember = await Project.isMember(projectId, ws.userId);
    if (!isMember) {
      ws.send(JSON.stringify({
        type: 'ERROR',
        payload: { message: 'Not authorized' }
      }));
      return;
    }

    // Update status
    await Task.updateStatus(taskId, status, ws.userId);

    // Broadcast to all project members
    connectionManager.broadcastToProject(projectId, {
      type: 'TASK_STATUS_UPDATED',
      payload: {
        taskId,
        status,
        updatedBy: {
          userId: ws.userId,
          userName: ws.userName
        },
        timestamp: new Date().toISOString()
      }
    });

    console.log(`Task ${taskId} status updated to ${status} by ${ws.userId}`);
  } catch (error) {
    console.error('Error in handleUpdateTaskStatus:', error);
    ws.send(JSON.stringify({
      type: 'ERROR',
      payload: { message: 'Failed to update task status' }
    }));
  }
}

/**
 * Handle ADD_COMMENT event
 */
async function handleAddComment(ws, payload) {
  try {
    const { taskId, text, projectId } = payload;

    if (!taskId || !text || !projectId) {
      ws.send(JSON.stringify({
        type: 'ERROR',
        payload: { message: 'Task ID, comment text, and project ID are required' }
      }));
      return;
    }

    // Get task
    const task = await Task.findById(taskId);
    if (!task) {
      ws.send(JSON.stringify({
        type: 'ERROR',
        payload: { message: 'Task not found' }
      }));
      return;
    }

    // Verify project membership
    const isMember = await Project.isMember(projectId, ws.userId);
    if (!isMember) {
      ws.send(JSON.stringify({
        type: 'ERROR',
        payload: { message: 'Not authorized' }
      }));
      return;
    }

    // Add comment
    const comment = await Task.addComment(taskId, {
      userId: ws.userId,
      text
    });

    // Broadcast to all project members
    connectionManager.broadcastToProject(projectId, {
      type: 'TASK_COMMENT_ADDED',
      payload: {
        taskId,
        comment: {
          _id: comment._id.toString(), // ✅ Changed from 'id' to '_id'
          user: {
            _id: ws.userId,
            name: ws.userName
          }, // ✅ Send full user object
          text: comment.text,
          createdAt: comment.createdAt
        },
        timestamp: new Date().toISOString()
      }
    });

    console.log(`Comment added to task ${taskId} by ${ws.userId}`);
  } catch (error) {
    console.error('Error in handleAddComment:', error);
    ws.send(JSON.stringify({
      type: 'ERROR',
      payload: { message: 'Failed to add comment' }
    }));
  }
}

/**
 * Handle START_VIEWING_TASK event
 */
async function handleStartViewingTask(ws, payload) {
  try {
    const { taskId, projectId } = payload;

    if (!taskId || !projectId) {
      return;
    }

    // Add viewer
    await Task.addViewer(taskId, ws.userId);

    // Broadcast to all project members
    connectionManager.broadcastToProject(projectId, {
      type: 'TASK_VIEWER_JOINED',
      payload: {
        taskId,
        user: {
          _id: ws.userId,
          id: ws.userId, // Keep both for compatibility
          name: ws.userName
        }, // ✅ Send full user object
        timestamp: new Date().toISOString()
      }
    });

    console.log(`User ${ws.userId} started viewing task ${taskId}`);
  } catch (error) {
    console.error('Error in handleStartViewingTask:', error);
  }
}

/**
 * Handle STOP_VIEWING_TASK event
 */
async function handleStopViewingTask(ws, payload) {
  try {
    const { taskId, projectId } = payload;

    if (!taskId || !projectId) {
      return;
    }

    // Remove viewer
    await Task.removeViewer(taskId, ws.userId);

    // Broadcast to all project members
    connectionManager.broadcastToProject(projectId, {
      type: 'TASK_VIEWER_LEFT',
      payload: {
        taskId,
        userId: ws.userId,
        timestamp: new Date().toISOString()
      }
    });

    console.log(`User ${ws.userId} stopped viewing task ${taskId}`);
  } catch (error) {
    console.error('Error in handleStopViewingTask:', error);
  }
}

/**
 * Handle START_EDITING_TASK event
 */
async function handleStartEditingTask(ws, payload) {
  try {
    const { taskId, projectId } = payload;

    if (!taskId || !projectId) {
      return;
    }

    // Add editor
    await Task.addEditor(taskId, ws.userId);

    // Broadcast to all project members
    connectionManager.broadcastToProject(projectId, {
      type: 'TASK_EDITOR_JOINED',
      payload: {
        taskId,
        user: {
          _id: ws.userId,
          id: ws.userId, // Keep both for compatibility
          name: ws.userName
        }, // ✅ Send full user object
        timestamp: new Date().toISOString()
      }
    });

    console.log(`User ${ws.userId} started editing task ${taskId}`);
  } catch (error) {
    console.error('Error in handleStartEditingTask:', error);
  }
}

/**
 * Handle STOP_EDITING_TASK event
 */
async function handleStopEditingTask(ws, payload) {
  try {
    const { taskId, projectId } = payload;

    if (!taskId || !projectId) {
      return;
    }

    // Remove editor
    await Task.removeEditor(taskId, ws.userId);

    // Broadcast to all project members
    connectionManager.broadcastToProject(projectId, {
      type: 'TASK_EDITOR_LEFT',
      payload: {
        taskId,
        userId: ws.userId,
        timestamp: new Date().toISOString()
      }
    });

    console.log(`User ${ws.userId} stopped editing task ${taskId}`);
  } catch (error) {
    console.error('Error in handleStopEditingTask:', error);
  }
}

// Export event handlers map
const eventHandlers = {
  JOIN_PROJECT: handleJoinProject,
  LEAVE_PROJECT: handleLeaveProject,
  CREATE_TASK: handleCreateTask,
  ASSIGN_TASK: handleAssignTask,
  UPDATE_TASK_STATUS: handleUpdateTaskStatus,
  ADD_COMMENT: handleAddComment,
  START_VIEWING_TASK: handleStartViewingTask,
  STOP_VIEWING_TASK: handleStopViewingTask,
  START_EDITING_TASK: handleStartEditingTask,
  STOP_EDITING_TASK: handleStopEditingTask
};

module.exports = {
  eventHandlers
};