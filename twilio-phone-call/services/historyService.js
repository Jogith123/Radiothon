/**
 * History Service
 * Business logic for managing question/answer history
 */

const History = require('../models/History');
const { classifySubject } = require('./geminiService');

/**
 * Store a question and answer with automatic subject classification
 * Uses upsert to add question to qs array for existing subject or create new document
 * @param {string} userPhone - User's phone number (caller's number, not Twilio)
 * @param {string} question - User's question
 * @param {string} answer - AI-generated answer
 * @returns {Promise<void>}
 */
async function storeQuestionAndAnswer(userPhone, question, answer) {
  try {
    // Classify the subject
    const subject = await classifySubject(question);

    // Insert: Create a new document for this Q&A
    await History.insertQuestion(userPhone, subject, question, answer);
    console.log(`✅ Stored Q&A in MongoDB - Subject: ${subject} - User: ${userPhone}`);
  } catch (error) {
    console.error('❌ Error storing to MongoDB:', error.message);
  }
}

/**
 * Get user's question history by subject
 * @param {string} userPhone - User's phone number
 * @param {string} subject - Subject name
 * @param {number} limit - Maximum number of records
 * @returns {Promise<Array>} Array of history documents
 */
async function getHistoryBySubject(userPhone, subject, limit = 5) {
  try {
    return await History.findByUserIdAndSubject(userPhone, subject, limit);
  } catch (error) {
    console.error('❌ Error fetching history:', error.message);
    return [];
  }
}

/**
 * Get user's recent questions across all subjects
 * @param {string} userPhone - User's phone number
 * @param {number} limit - Maximum number of records
 * @returns {Promise<Array>} Array of history documents
 */
async function getRecentHistory(userPhone, limit = 10) {
  try {
    return await History.getRecentQuestions(userPhone, limit);
  } catch (error) {
    console.error('❌ Error fetching recent history:', error.message);
    return [];
  }
}

/**
 * Get statistics about user's learning
 * @param {string} userPhone - User's phone number
 * @returns {Promise<Object>} Statistics object
 */
async function getUserStats(userPhone) {
  try {
    const totalQuestions = await History.getQuestionCount(userPhone);
    const subjectStats = await History.getSubjectStats(userPhone);

    return {
      totalQuestions,
      subjectStats
    };
  } catch (error) {
    console.error('❌ Error fetching user stats:', error.message);
    return {
      totalQuestions: 0,
      subjectStats: []
    };
  }
}

module.exports = {
  storeQuestionAndAnswer,
  getHistoryBySubject,
  getRecentHistory,
  getUserStats
};
