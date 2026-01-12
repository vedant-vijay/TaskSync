/**
 * Task Model
 * Handles task data operations
 */

const { ObjectId } = require('mongodb');
const { getDB } = require('../config/database');

class Task {
  /**
   * Create a new task
   */
  static async create(taskData) {
    const db = getDB();
    const { title, description, projectId, createdBy, assignedTo, status } = taskData;

    const task = {
      title: title.trim(),
      description: description?.trim() || '',
      projectId: new ObjectId(projectId),
      createdBy: new ObjectId(createdBy),
      assignedTo: assignedTo ? new ObjectId(assignedTo) : null,
      status: status || 'TODO',
      comments: [],
      activeViewers: [],
      activeEditors: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('tasks').insertOne(task);
    return { ...task, _id: result.insertedId };
  }

  /**
   * Find task by ID
   */
  static async findById(taskId) {
    const db = getDB();
    return await db.collection('tasks').findOne({ 
      _id: new ObjectId(taskId) 
    });
  }

  /**
   * Find tasks by project
   */
  static async findByProjectId(projectId) {
    const db = getDB();
    return await db.collection('tasks').find({ 
      projectId: new ObjectId(projectId) 
    }).sort({ createdAt: -1 }).toArray();
  }

  /**
   * Update task status
   */
  static async updateStatus(taskId, status, updatedBy) {
    const db = getDB();
    
    const validStatuses = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status');
    }
    
    const result = await db.collection('tasks').updateOne(
      { _id: new ObjectId(taskId) },
      {
        $set: { 
          status, 
          updatedAt: new Date(),
          updatedBy: new ObjectId(updatedBy)
        }
      }
    );

    return result.modifiedCount > 0;
  }

  /**
 * Assign task to user
 */
static async assign(taskId, userId, assignedBy) {
    const db = getDB();
    
    // ✅ Handle null assignment (unassign)
    const updateData = {
      updatedAt: new Date(),
      assignedBy: new ObjectId(assignedBy)
    };

    if (userId === null || userId === undefined) {
      updateData.assignedTo = null;
    } else {
      updateData.assignedTo = new ObjectId(userId);
    }
    
    const result = await db.collection('tasks').updateOne(
      { _id: new ObjectId(taskId) },
      { $set: updateData }
    );

    return result.modifiedCount > 0;
  }

  /**
   * Add comment to task
   */
  static async addComment(taskId, commentData) {
    const db = getDB();
    const { userId, text } = commentData;

    const comment = {
      _id: new ObjectId(),
      userId: new ObjectId(userId),
      text: text.trim(),
      createdAt: new Date()
    };

    const result = await db.collection('tasks').updateOne(
      { _id: new ObjectId(taskId) },
      {
        $push: { comments: comment },
        $set: { updatedAt: new Date() }
      }
    );

    return result.modifiedCount > 0 ? comment : null;
  }

  /**
   * Add active viewer to task
   */
  static async addViewer(taskId, userId) {
    const db = getDB();
    
    await db.collection('tasks').updateOne(
      { _id: new ObjectId(taskId) },
      {
        $addToSet: { activeViewers: new ObjectId(userId) }
      }
    );
  }

  /**
   * Remove active viewer from task
   */
  static async removeViewer(taskId, userId) {
    const db = getDB();
    
    await db.collection('tasks').updateOne(
      { _id: new ObjectId(taskId) },
      {
        $pull: { activeViewers: new ObjectId(userId) }
      }
    );
  }

  /**
   * Add active editor to task
   */
  static async addEditor(taskId, userId) {
    const db = getDB();
    
    await db.collection('tasks').updateOne(
      { _id: new ObjectId(taskId) },
      {
        $addToSet: { activeEditors: new ObjectId(userId) }
      }
    );
  }

  /**
   * Remove active editor from task
   */
  static async removeEditor(taskId, userId) {
    const db = getDB();
    
    await db.collection('tasks').updateOne(
      { _id: new ObjectId(taskId) },
      {
        $pull: { activeEditors: new ObjectId(userId) }
      }
    );
  }

  /**
   * Find tasks assigned to user
   */
  static async findByAssignedUser(userId) {
    const db = getDB();
    return await db.collection('tasks').find({ 
      assignedTo: new ObjectId(userId) 
    }).sort({ createdAt: -1 }).toArray();
  }

  /**
   * Update task
   */
  static async update(taskId, updates) {
    const db = getDB();
    
    const allowedUpdates = ['title', 'description'];
    const filteredUpdates = {};
    
    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }
    
    filteredUpdates.updatedAt = new Date();
    
    const result = await db.collection('tasks').updateOne(
      { _id: new ObjectId(taskId) },
      { $set: filteredUpdates }
    );
    
    return result.modifiedCount > 0;
  }

  /**
   * Delete task
   */
  static async delete(taskId) {
    const db = getDB();
    const result = await db.collection('tasks').deleteOne({ 
      _id: new ObjectId(taskId) 
    });
    return result.deletedCount > 0;
  }
}

module.exports = Task;