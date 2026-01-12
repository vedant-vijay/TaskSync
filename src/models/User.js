/**
 * User Model
 * Handles user data operations
 */

const { ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const { getDB } = require('../config/database');

class User {
  /**
   * Create a new user
   */
  static async create(userData) {
    const db = getDB();
    const { email, password, name, role } = userData;

    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = {
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      name: name.trim(),
      role: role || 'MEMBER',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('users').insertOne(user);
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return { ...userWithoutPassword, _id: result.insertedId };
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const db = getDB();
    return await db.collection('users').findOne({ 
      email: email.toLowerCase() 
    });
  }

  /**
   * Find user by ID
   */
  static async findById(userId) {
    const db = getDB();
    return await db.collection('users').findOne({ 
      _id: new ObjectId(userId) 
    });
  }

  /**
   * Verify password
   */
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Get user without password
   */
  static sanitizeUser(user) {
    if (!user) return null;
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Find multiple users by IDs
   */
  static async findByIds(userIds) {
    const db = getDB();
    const objectIds = userIds.map(id => new ObjectId(id));
    return await db.collection('users').find({ 
      _id: { $in: objectIds } 
    }).toArray();
  }

  /**
   * Update user
   */
  static async update(userId, updates) {
    const db = getDB();
    
    const allowedUpdates = ['name', 'role'];
    const filteredUpdates = {};
    
    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }
    
    filteredUpdates.updatedAt = new Date();
    
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: filteredUpdates }
    );
    
    return result.modifiedCount > 0;
  }
}

module.exports = User;