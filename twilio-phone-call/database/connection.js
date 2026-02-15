/**
 * MongoDB Database Connection Module
 * Handles connection initialization and management
 */

const { MongoClient } = require('mongodb');

let db = null;
let mongoClient = null;

/**
 * Connect to MongoDB database
 * @returns {Promise<void>}
 */
async function connectToMongoDB() {
  try {
    if (!process.env.MONGODB_URI) {
      console.log('⚠️  MONGODB_URI not found in .env - Database features disabled');
      return;
    }

    mongoClient = new MongoClient(process.env.MONGODB_URI);
    await mongoClient.connect();
    db = mongoClient.db();
    console.log('✅ MongoDB connected successfully');
    
    // Create indexes for better query performance
    await createIndexes();
    console.log('✅ MongoDB indexes created');
  } catch (error) {
    console.log('⚠️  MongoDB connection failed:', error.message);
    db = null;
  }
}

/**
 * Create database indexes
 * @returns {Promise<void>}
 */
async function createIndexes() {
  if (!db) return;
  
  try {
    // Index for fetching user history sorted by time
    await db.collection('history').createIndex({ user_id: 1, timestamp: -1 });
    
    // Index for subject-specific queries
    await db.collection('history').createIndex({ user_id: 1, subject: 1, timestamp: -1 });

    // Indexes for RAG chunks collection (vector search)
    await db.collection('rag_chunks').createIndex({ docId: 1 });
    await db.collection('rag_chunks').createIndex({ fileName: 1, chunkIndex: 1 });
  } catch (error) {
    console.error('❌ Error creating indexes:', error.message);
  }
}

/**
 * Get database instance
 * @returns {Db|null} MongoDB database instance
 */
function getDatabase() {
  return db;
}

/**
 * Get MongoDB client instance
 * @returns {MongoClient|null} MongoDB client instance
 */
function getClient() {
  return mongoClient;
}

/**
 * Close MongoDB connection
 * @returns {Promise<void>}
 */
async function closeConnection() {
  if (mongoClient) {
    await mongoClient.close();
    console.log('✅ MongoDB connection closed');
    db = null;
    mongoClient = null;
  }
}

/**
 * Check if database is connected
 * @returns {boolean}
 */
function isConnected() {
  return db !== null;
}

module.exports = {
  connectToMongoDB,
  getDatabase,
  getClient,
  closeConnection,
  isConnected
};
