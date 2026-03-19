const Project = require('../models/Project');
const User = require('../models/User');

async function createProject(req, res) {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    if (req.user.role !== 'LEADER') {
      return res.status(403).json({ 
        error: 'Only users with LEADER role can create projects' 
      });
    }

    const project = await Project.create({
      name,
      description,
      leaderId: req.userId
    });

    res.status(201).json({
      message: 'Project created successfully',
      project: {
        id: project._id.toString(),
        name: project.name,
        description: project.description,
        leaderId: project.leaderId.toString(),
        createdAt: project.createdAt
      }
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
}

async function getUserProjects(req, res) {
  try {
    const projects = await Project.findByUserId(req.userId);

    const projectsWithDetails = projects.map(p => ({
      id: p._id.toString(),
      name: p.name,
      description: p.description,
      leaderId: p.leaderId.toString(),
      memberCount: p.members.length,
      isLeader: p.leaderId.toString() === req.userId,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }));

    res.json({ projects: projectsWithDetails });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to get projects' });
  }
}

async function getProjectById(req, res) {
  try {
    const { id } = req.params;

    const isMember = await Project.isMember(id, req.userId);
    
    if (!isMember) {
      return res.status(403).json({ 
        error: 'You are not a member of this project' 
      });
    }

    const project = await Project.findById(id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const members = await Project.getMembersWithDetails(id);

    res.json({
      project: {
        id: project._id.toString(),
        name: project.name,
        description: project.description,
        leaderId: project.leaderId.toString(),
        members,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      }
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to get project' });
  }
}

async function addMember(req, res) {
  try {
    const { id } = req.params;
    const { userId, role } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const isLeader = await Project.isLeader(id, req.userId);
    
    if (!isLeader) {
      return res.status(403).json({ 
        error: 'Only project leader can add members' 
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await Project.addMember(id, userId, role || 'MEMBER');

    res.json({ 
      message: 'Member added successfully',
      member: {
        userId: user._id.toString(),
        name: user.name,
        email: user.email,
        role: role || 'MEMBER'
      }
    });
  } catch (error) {
    console.error('Add member error:', error);
    
    if (error.message === 'User is already a member of this project') {
      return res.status(409).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to add member' });
  }
}

module.exports = {
  createProject,
  getUserProjects,
  getProjectById,
  addMember
};
