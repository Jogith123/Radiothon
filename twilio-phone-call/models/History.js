/**
 * History Model
 * Handles all database operations for question/answer history
 */

const { getDatabase } = require('../database/connection');

/**
 * History document schema
 * Each question/answer pair is stored as a separate document
 * @typedef {Object} HistoryDocument
 * @property {string} user_id - User's phone number (caller's number, not Twilio number)
 * @property {string} subject - Question subject (automatically classified: Math, Physics, Chemistry, Biology, History, Geography, Computer Science, English, Economics, Political Science, Environmental Science, General Knowledge, etc.)
 * @property {string} question - Question text
 * @property {string} response - AI-generated response
 * @property {Date} timestamp - When the question was asked
 */

class History {
  /**
   * Get the history collection
   * @returns {Collection|null}
   */
  static getCollection() {
    const db = getDatabase();
    return db ? db.collection('history') : null;
  }

  /**
   * Insert a new question/answer record
   * @param {HistoryDocument} document - History document to insert
   * @returns {Promise<Object>} Insert result
   */
  static async insertOne(document) {
    const collection = this.getCollection();
    if (!collection) {
      throw new Error('Database not connected');
    }

    return await collection.insertOne(document);
  }

  /**
   * Find history records by user ID
   * @param {string} userId - User's phone number
   * @param {number} limit - Maximum number of records to return
   * @returns {Promise<Array>} Array of history documents
   */
  static async findByUserId(userId, limit = 100) {
    const collection = this.getCollection();
    if (!collection) {
      return [];
    }

    return await collection
      .find({ user_id: userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
  }

  /**
   * Find history records by user ID and subject
   * @param {string} userId - User's phone number
   * @param {string} subject - Subject name (case-insensitive)
   * @param {number} limit - Maximum number of records to return
   * @returns {Promise<Array>} Array of history documents
   */
  static async findByUserIdAndSubject(userId, subject, limit = 5) {
    const collection = this.getCollection();
    if (!collection) {
      return [];
    }

    // Escape special regex characters in subject name
    const escapedSubject = subject.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    return await collection
      .find({
        user_id: userId,
        subject: { $regex: new RegExp(escapedSubject, 'i') }
      })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
  }

  /**
   * Get statistics by subject for a user
   * @param {string} userId - User's phone number
   * @returns {Promise<Array>} Array of subject statistics
   */
  static async getSubjectStats(userId) {
    const collection = this.getCollection();
    if (!collection) {
      return [];
    }

    return await collection.aggregate([
      { $match: { user_id: userId } },
      {
        $group: {
          _id: '$subject',
          count: { $sum: 1 },
          lastQuestion: { $last: '$question' },
          lastTimestamp: { $last: '$timestamp' }
        }
      },
      { $sort: { count: -1 } }
    ]).toArray();
  }

  /**
   * Get total question count for a user
   * @param {string} userId - User's phone number
   * @returns {Promise<number>} Total question count
   */
  static async getQuestionCount(userId) {
    const collection = this.getCollection();
    if (!collection) {
      return 0;
    }

    return await collection.countDocuments({ user_id: userId });
  }

  /**
   * Delete the oldest question for a user (to maintain limit)
   * @param {string} userId - User's phone number
   * @returns {Promise<Object>} Delete result
   */
  static async deleteOldestQuestion(userId) {
    const collection = this.getCollection();
    if (!collection) {
      throw new Error('Database not connected');
    }

    // Find oldest question
    const oldest = await collection
      .find({ user_id: userId })
      .sort({ timestamp: 1 })
      .limit(1)
      .toArray();

    if (oldest.length > 0) {
      const result = await collection.deleteOne({ _id: oldest[0]._id });
      console.log(`🗑️  Deleted oldest question for ${userId}: "${oldest[0].question.substring(0, 50)}..."`);
      return result;
    }

    return { deletedCount: 0 };
  }

  /**
   * Delete all records for a user (for testing/cleanup)
   * @param {string} userId - User's phone number
   * @returns {Promise<Object>} Delete result
   */
  static async deleteByUserId(userId) {
    const collection = this.getCollection();
    if (!collection) {
      throw new Error('Database not connected');
    }

    return await collection.deleteMany({ user_id: userId });
  }

  /**
   * Get recent questions across all subjects
   * @param {string} userId - User's phone number
   * @param {number} limit - Maximum number of records to return
   * @returns {Promise<Array>} Array of history documents
   */
  static async getRecentQuestions(userId, limit = 10) {
    const collection = this.getCollection();
    if (!collection) {
      return [];
    }

    return await collection
      .find({ user_id: userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
  }

  /**
   * Create a new history document
   * @param {string} userId - User's phone number
   * @param {string} subject - Question subject
   * @param {string} question - User's question
   * @param {string} response - AI response
   * @returns {HistoryDocument} History document
   */
  static createDocument(userId, subject, question, response) {
    return {
      user_id: userId,
      subject: subject,
      question: question,
      response: response,
      timestamp: new Date()
    };
  }

  /**
   * Insert a new question and answer record
   * Creates a separate document for each Q&A to enable querying last 5 questions
   * @param {string} userId - User's phone number
   * @param {string} subject - Question subject
   * @param {string} question - User's question
   * @param {string} response - AI response
   * @returns {Promise<Object>} Insert result
   */
  static async insertQuestion(userId, subject, question, response) {
    const collection = this.getCollection();
    if (!collection) {
      throw new Error('Database not connected');
    }

    const document = this.createDocument(userId, subject, question, response);
    return await collection.insertOne(document);
  }

  /**
   * Get all history with optional filters and pagination
   * @param {Object} filters - Query filters
   * @param {string} filters.phoneNumber - Filter by phone number (optional)
   * @param {string} filters.subject - Filter by subject (optional)
   * @param {number} filters.limit - Maximum records to return (default: 50)
   * @param {number} filters.skip - Number of records to skip (default: 0)
   * @returns {Promise<Array>} Array of history documents
   */
  static async getAllWithFilters(filters = {}) {
    const collection = this.getCollection();
    if (!collection) {
      return [];
    }

    const { phoneNumber, subject, limit = 50, skip = 0 } = filters;
    const query = {};

    if (phoneNumber) {
      query.user_id = phoneNumber;
    }

    if (subject) {
      const escapedSubject = subject.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.subject = { $regex: new RegExp(escapedSubject, 'i') };
    }

    return await collection
      .find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
  }

}

module.exports = History;
