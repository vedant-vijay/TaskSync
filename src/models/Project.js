const { ObjectId } = require('mongodb');
const { getDB } = require('../config/database');

class Project {

  static async create(projectData) {
    const db = getDB();
    const { name, description, leaderId } = projectData;

    const project = {
      name: name.trim(),
      description: description?.trim() || '',
      leaderId: new ObjectId(leaderId),
      members: [
        {
          userId: new ObjectId(leaderId),
          role: 'LEADER',
          joinedAt: new Date()
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('projects').insertOne(project);
    return { ...project, _id: result.insertedId };
  }

  static async findById(projectId) {
    const db = getDB();
    return await db.collection('projects').findOne({ 
      _id: new ObjectId(projectId) 
    });
  }

  static async addMember(projectId, userId, role = 'MEMBER') {
    const db = getDB();

    const project = await this.findById(projectId);
    const isAlreadyMember = project.members.some(
      m => m.userId.toString() === userId.toString()
    );
    
    if (isAlreadyMember) {
      throw new Error('User is already a member of this project');
    }
    
    const result = await db.collection('projects').updateOne(
      { _id: new ObjectId(projectId) },
      {
        $push: {
          members: {
            userId: new ObjectId(userId),
            role,
            joinedAt: new Date()
          }
        },
        $set: { updatedAt: new Date() }
      }
    );

    return result.modifiedCount > 0;
  }

static async isMember(projectId, userId) {
    const db = getDB();

    if (!projectId || !userId) {
      console.warn('isMember called with missing parameters:', { projectId, userId });
      return false;
    }

    if (!/^[0-9a-fA-F]{24}$/.test(projectId) || !/^[0-9a-fA-F]{24}$/.test(userId)) {
      console.error('Invalid ObjectId format in isMember:', { projectId, userId });
      return false;
    }

    try {
      const project = await db.collection('projects').findOne({
        _id: new ObjectId(projectId),
        'members.userId': new ObjectId(userId)
      });
      
      return !!project;
    } catch (error) {
      console.error('Error checking project membership:', error);
      return false;
    }
  }

  static async isLeader(projectId, userId) {
    const db = getDB();
    const project = await db.collection('projects').findOne({
      _id: new ObjectId(projectId),
      leaderId: new ObjectId(userId)
    });
    return !!project;
  }

  static async findByUserId(userId) {
    const db = getDB();
    return await db.collection('projects').find({
      'members.userId': new ObjectId(userId)
    }).sort({ updatedAt: -1 }).toArray();
  }

  static async getMembersWithDetails(projectId) {
    const db = getDB();
    const project = await this.findById(projectId);
    
    if (!project) return [];

    const userIds = project.members.map(m => m.userId);
    const users = await db.collection('users').find({
      _id: { $in: userIds }
    }).toArray();

    return project.members.map(member => {
      const user = users.find(u => u._id.toString() === member.userId.toString());
      return {
        userId: member.userId.toString(),
        role: member.role,
        joinedAt: member.joinedAt,
        name: user?.name,
        email: user?.email
      };
    });
  }

  static async update(projectId, updates) {
    const db = getDB();
    
    const allowedUpdates = ['name', 'description'];
    const filteredUpdates = {};
    
    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }
    
    filteredUpdates.updatedAt = new Date();
    
    const result = await db.collection('projects').updateOne(
      { _id: new ObjectId(projectId) },
      { $set: filteredUpdates }
    );
    
    return result.modifiedCount > 0;
  }

  static async delete(projectId) {
    const db = getDB();

    await db.collection('tasks').deleteMany({ 
      projectId: new ObjectId(projectId) 
    });

    const result = await db.collection('projects').deleteOne({ 
      _id: new ObjectId(projectId) 
    });
    
    return result.deletedCount > 0;
  }
}

module.exports = Project;
