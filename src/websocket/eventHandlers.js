const { connectionManager } = require('./connectionManager');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');

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

    const isMember = await Project.isMember(projectId, ws.userId);
    if (!isMember) {
      ws.send(JSON.stringify({
        type: 'ERROR',
        payload: { message: 'You are not a member of this project' }
      }));
      return;
    }

    ws.projectIds.add(projectId);
    connectionManager.joinProject(ws.userId, projectId);

    const project = await Project.findById(projectId);
    const members = await Project.getMembersWithDetails(projectId);
    const tasks = await Task.findByProjectId(projectId);
    
    // ✅ FIX: Get online users with full details
    const onlineUserIds = Array.from(connectionManager.getProjectUsers(projectId));
    const onlineUsers = await Promise.all(
      onlineUserIds.map(async (userId) => {
        const user = await User.findById(userId);
        return user ? {
          _id: user._id.toString(),
          id: user._id.toString(),
          name: user.name,
          email: user.email
        } : null;
      })
    );
    const validOnlineUsers = onlineUsers.filter(u => u !== null);

    // ✅ FIX: Include full assignedTo details and comments in tasks
    const tasksWithDetails = await Promise.all(tasks.map(async (t) => {
      let assignedToUser = null;
      if (t.assignedTo) {
        const user = await User.findById(t.assignedTo);
        if (user) {
          assignedToUser = {
            _id: user._id.toString(),
            id: user._id.toString(),
            name: user.name
          };
        }
      }

      return {
        _id: t._id.toString(), 
        title: t.title,
        description: t.description,
        projectId: t.projectId.toString(),
        createdBy: t.createdBy.toString(),
        assignedTo: assignedToUser,
        status: t.status,
        comments: t.comments || [],
        commentCount: t.comments?.length || 0,
        activeViewers: t.activeViewers?.map(v => v.toString()) || [],
        activeEditors: t.activeEditors?.map(e => e.toString()) || [],
        createdAt: t.createdAt,
        updatedAt: t.updatedAt
      };
    }));

    ws.send(JSON.stringify({
      type: 'PROJECT_JOINED',
      payload: {
        projectId,
        project: {
          _id: project._id.toString(), 
          name: project.name,
          description: project.description,
          leaderId: project.leaderId.toString()
        },
        members,
        tasks: tasksWithDetails,
        onlineUsers: validOnlineUsers,
        timestamp: new Date().toISOString()
      }
    }));

    connectionManager.broadcastToProject(projectId, {
      type: 'USER_CONNECTED',
      payload: {
        user: {
          _id: ws.userId, 
          id: ws.userId,  
          name: ws.userName
        },
        projectId,
        timestamp: new Date().toISOString()
      }
    }, ws.userId);

  } catch (error) {
    console.error('Error in handleJoinProject:', error);
    ws.send(JSON.stringify({
      type: 'ERROR',
      payload: { message: 'Failed to join project' }
    }));
  }
}

async function handleLeaveProject(ws, payload) {
  try {
    const { projectId } = payload;

    if (!projectId) {
      return;
    }

    ws.projectIds.delete(projectId);
    connectionManager.leaveProject(ws.userId, projectId);

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

  } catch (error) {
    console.error('Error in handleLeaveProject:', error);
  }
}

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

    const isMember = await Project.isMember(projectId, ws.userId);
    if (!isMember) {
      ws.send(JSON.stringify({
        type: 'ERROR',
        payload: { message: 'Not a member of this project' }
      }));
      return;
    }

    const taskData = {
      title,
      description,
      projectId,
      createdBy: ws.userId,
      status: status || 'TODO'
    };

    if (assignedTo && typeof assignedTo === 'string' && assignedTo.trim() !== '') {

      if (!/^[0-9a-fA-F]{24}$/.test(assignedTo)) {
        ws.send(JSON.stringify({
          type: 'ERROR',
          payload: { message: 'Invalid user ID format for assignment' }
        }));
        return;
      }
      taskData.assignedTo = assignedTo;
    }

    const task = await Task.create(taskData);

    let assignedUser = null;
    if (task.assignedTo) {
      assignedUser = await User.findById(task.assignedTo);
    }

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

  } catch (error) {
    console.error('❌ Error in handleCreateTask:', error);
    ws.send(JSON.stringify({
      type: 'ERROR',
      payload: { message: 'Failed to create task', error: error.message }
    }));
  }
}

async function handleAssignTask(ws, payload) {
  try {
    const { taskId, assignedTo, projectId } = payload;

    if (!taskId || !projectId) {
      ws.send(JSON.stringify({
        type: 'ERROR',
        payload: { message: 'Task ID and project ID are required' }
      }));
      return;
    }

    const task = await Task.findById(taskId);
    if (!task) {
      ws.send(JSON.stringify({
        type: 'ERROR',
        payload: { message: 'Task not found' }
      }));
      return;
    }

    const isMember = await Project.isMember(projectId, ws.userId);
    if (!isMember) {
      ws.send(JSON.stringify({
        type: 'ERROR',
        payload: { message: 'Not authorized' }
      }));
      return;
    }

    if (!assignedTo || assignedTo === '' || assignedTo === 'null' || assignedTo === 'undefined') {

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
      console.log('✅ Task unassigned, broadcasted to project');  // ✅ Add this log
     
      return;
    }

    if (!/^[0-9a-fA-F]{24}$/.test(assignedTo)) {
      console.error('❌ Invalid user ID format:', assignedTo);
      ws.send(JSON.stringify({
        type: 'ERROR',
        payload: { message: 'Invalid user ID format' }
      }));
      return;
    }

    const assigneeIsMember = await Project.isMember(projectId, assignedTo);
    if (!assigneeIsMember) {
      ws.send(JSON.stringify({
        type: 'ERROR',
        payload: { message: 'Assigned user is not a member of this project' }
      }));
      return;
    }

    await Task.assign(taskId, assignedTo, ws.userId);

    const assignedUser = await User.findById(assignedTo);

    if (!assignedUser) {
      ws.send(JSON.stringify({
        type: 'ERROR',
        payload: { message: 'Assigned user not found' }
      }));
      return;
    }

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

  } catch (error) {
    console.error('❌ Error in handleAssignTask:', error);
    ws.send(JSON.stringify({
      type: 'ERROR',
      payload: { message: 'Failed to assign task', error: error.message }
    }));
  }
}

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

    const task = await Task.findById(taskId);
    if (!task) {
      ws.send(JSON.stringify({
        type: 'ERROR',
        payload: { message: 'Task not found' }
      }));
      return;
    }

    const isMember = await Project.isMember(projectId, ws.userId);
    if (!isMember) {
      ws.send(JSON.stringify({
        type: 'ERROR',
        payload: { message: 'Not authorized' }
      }));
      return;
    }

    await Task.updateStatus(taskId, status, ws.userId);

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

  } catch (error) {
    console.error('Error in handleUpdateTaskStatus:', error);
    ws.send(JSON.stringify({
      type: 'ERROR',
      payload: { message: 'Failed to update task status' }
    }));
  }
}

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

    const task = await Task.findById(taskId);
    if (!task) {
      ws.send(JSON.stringify({
        type: 'ERROR',
        payload: { message: 'Task not found' }
      }));
      return;
    }

    const isMember = await Project.isMember(projectId, ws.userId);
    if (!isMember) {
      ws.send(JSON.stringify({
        type: 'ERROR',
        payload: { message: 'Not authorized' }
      }));
      return;
    }

    const comment = await Task.addComment(taskId, {
      userId: ws.userId,
      text
    });

    connectionManager.broadcastToProject(projectId, {
      type: 'TASK_COMMENT_ADDED',
      payload: {
        taskId,
        comment: {
          _id: comment._id.toString(), 
          user: {
            _id: ws.userId,
            name: ws.userName
          }, 
          text: comment.text,
          createdAt: comment.createdAt
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in handleAddComment:', error);
    ws.send(JSON.stringify({
      type: 'ERROR',
      payload: { message: 'Failed to add comment' }
    }));
  }
}

async function handleStartViewingTask(ws, payload) {
  try {
    const { taskId, projectId } = payload;

    if (!taskId || !projectId) {
      return;
    }

    await Task.addViewer(taskId, ws.userId);

    connectionManager.broadcastToProject(projectId, {
      type: 'TASK_VIEWER_JOINED',
      payload: {
        taskId,
        user: {
          _id: ws.userId,
          id: ws.userId, 
          name: ws.userName
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in handleStartViewingTask:', error);
  }
}

async function handleStopViewingTask(ws, payload) {
  try {
    const { taskId, projectId } = payload;

    if (!taskId || !projectId) {
      return;
    }

    await Task.removeViewer(taskId, ws.userId);

    connectionManager.broadcastToProject(projectId, {
      type: 'TASK_VIEWER_LEFT',
      payload: {
        taskId,
        userId: ws.userId,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in handleStopViewingTask:', error);
  }
}

async function handleStartEditingTask(ws, payload) {
  try {
    const { taskId, projectId } = payload;

    if (!taskId || !projectId) {
      return;
    }

    await Task.addEditor(taskId, ws.userId);

    connectionManager.broadcastToProject(projectId, {
      type: 'TASK_EDITOR_JOINED',
      payload: {
        taskId,
        user: {
          _id: ws.userId,
          id: ws.userId, 
          name: ws.userName
        }, 
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in handleStartEditingTask:', error);
  }
}

async function handleStopEditingTask(ws, payload) {
  try {
    const { taskId, projectId } = payload;

    if (!taskId || !projectId) {
      return;
    }

    await Task.removeEditor(taskId, ws.userId);

    connectionManager.broadcastToProject(projectId, {
      type: 'TASK_EDITOR_LEFT',
      payload: {
        taskId,
        userId: ws.userId,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in handleStopEditingTask:', error);
  }
}

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