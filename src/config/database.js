
const { MongoClient } = require('mongodb');

let db = null;
let client = null;

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

    await createIndexes();
    
    console.log('Database indexes created successfully');
    
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

async function createIndexes() {
  try {

    await db.collection('users').createIndex({ email: 1 }, { unique: true });
  
    await db.collection('projects').createIndex({ leaderId: 1 });
    await db.collection('projects').createIndex({ 'members.userId': 1 });

    await db.collection('tasks').createIndex({ projectId: 1 });
    await db.collection('tasks').createIndex({ assignedTo: 1 });
    await db.collection('tasks').createIndex({ projectId: 1, status: 1 });
    await db.collection('tasks').createIndex({ createdAt: -1 });
  } catch (error) {
    console.error('Error creating indexes:', error);
    throw error;
  }
}

function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB first.');
  }
  return db;
}

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
