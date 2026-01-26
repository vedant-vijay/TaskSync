const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');

async function createTask(req, res) {
  try {
    const { title, description, projectId, assignedTo, status } = req.body;

    if (!title || !projectId) {
      return res.status(400).json({ 
        error: 'Title and project ID are required' 
      });
    }

    const isMember = await Project.isMember(projectId, req.userId);
    
    if (!isMember) {
      return res.status(403).json({ 
        error: 'You are not a member of this project' 
      });
    }

    if (assignedTo) {
      const assigneeIsMember = await Project.isMember(projectId, assignedTo);
      
      if (!assigneeIsMember) {
        return res.status(400).json({ 
          error: 'Assigned user is not a member of this project' 
        });
      }
    }

    const task = await Task.create({
      title,
      description,
      projectId,
      createdBy: req.userId,
      assignedTo,
      status
    });

    res.status(201).json({
      message: 'Task created successfully',
      task: {
        id: task._id.toString(),
        title: task.title,
        description: task.description,
        projectId: task.projectId.toString(),
        createdBy: task.createdBy.toString(),
        assignedTo: task.assignedTo?.toString(),
        status: task.status,
        createdAt: task.createdAt
      }
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
}

async function getProjectTasks(req, res) {
  try {
    const { projectId } = req.params;

    const isMember = await Project.isMember(projectId, req.userId);
    
    if (!isMember) {
      return res.status(403).json({ 
        error: 'You are not a member of this project' 
      });
    }

    const tasks = await Task.findByProjectId(projectId);

    const tasksWithDetails = tasks.map(t => ({
      id: t._id.toString(),
      title: t.title,
      description: t.description,
      projectId: t.projectId.toString(),
      createdBy: t.createdBy.toString(),
      assignedTo: t.assignedTo?.toString(),
      status: t.status,
      commentCount: t.comments.length,
      activeViewers: t.activeViewers.map(v => v.toString()),
      activeEditors: t.activeEditors.map(e => e.toString()),
      createdAt: t.createdAt,
      updatedAt: t.updatedAt
    }));

    res.json({ tasks: tasksWithDetails });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Failed to get tasks' });
  }
}

async function getTaskById(req, res) {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const isMember = await Project.isMember(task.projectId.toString(), req.userId);
    
    if (!isMember) {
      return res.status(403).json({ 
        error: 'You are not a member of this project' 
      });
    }

    res.json({
      task: {
        id: task._id.toString(),
        title: task.title,
        description: task.description,
        projectId: task.projectId.toString(),
        createdBy: task.createdBy.toString(),
        assignedTo: task.assignedTo?.toString(),
        status: task.status,
        comments: task.comments.map(c => ({
          id: c._id.toString(),
          userId: c.userId.toString(),
          text: c.text,
          createdAt: c.createdAt
        })),
        activeViewers: task.activeViewers.map(v => v.toString()),
        activeEditors: task.activeEditors.map(e => e.toString()),
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      }
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Failed to get task' });
  }
}

async function updateTaskStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const task = await Task.findById(id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const isMember = await Project.isMember(task.projectId.toString(), req.userId);
    
    if (!isMember) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await Task.updateStatus(id, status, req.userId);

    res.json({ 
      message: 'Task status updated successfully',
      status
    });
  } catch (error) {
    console.error('Update task status error:', error);
    
    if (error.message === 'Invalid status') {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to update task status' });
  }
}

async function assignTask(req, res) {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;

    if (!assignedTo) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const task = await Task.findById(id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const isMember = await Project.isMember(task.projectId.toString(), req.userId);
    
    if (!isMember) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    console.log('🔍 Assigning to:', assignedTo, typeof assignedTo);
  
    const assigneeIsMember = await Project.isMember(task.projectId.toString(), assignedTo);
    
    if (!assigneeIsMember) {
      return res.status(400).json({ 
        error: 'Assigned user is not a member of this project' 
      });
    }

    await Task.assign(id, assignedTo, req.userId);

    res.json({ 
      message: 'Task assigned successfully',
      assignedTo
    });
  } catch (error) {
    console.error('Assign task error:', error);
    res.status(500).json({ error: 'Failed to assign task' });
  }
}

module.exports = {
  createTask,
  getProjectTasks,
  getTaskById,
  updateTaskStatus,
  assignTask
};
