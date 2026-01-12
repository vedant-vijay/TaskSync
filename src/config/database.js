/**
 * MongoDB Database Configuration
 * Handles connection and provides database instance
 */

const { MongoClient } = require('mongodb');

let db = null;
let client = null;

/**
 * Connect to MongoDB
 */
async function connectDB() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27101/collaborative_pm';
    
    client = new MongoClient(uri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
    });
    
    await client.connect();
    
    db = client.db();
    
    // Create indexes for better performance
    await createIndexes();
    
    console.log('Database indexes created successfully');
    
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

/**
 * Create database indexes
 */
async function createIndexes() {
  try {
    // Users collection indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    
    // Projects collection indexes
    await db.collection('projects').createIndex({ leaderId: 1 });
    await db.collection('projects').createIndex({ 'members.userId': 1 });
    
    // Tasks collection indexes
    await db.collection('tasks').createIndex({ projectId: 1 });
    await db.collection('tasks').createIndex({ assignedTo: 1 });
    await db.collection('tasks').createIndex({ projectId: 1, status: 1 });
    await db.collection('tasks').createIndex({ createdAt: -1 });
  } catch (error) {
    console.error('Error creating indexes:', error);
    throw error;
  }
}

/**
 * Get database instance
 */
function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB first.');
  }
  return db;
}

/**
 * Close database connection
 */
async function closeDB() {
  if (client) {
    await client.close();
    db = null;
    client = null;
    console.log('Database connection closed');
  }
}

module.exports = {
  connectDB,
  getDB,
  closeDB
};