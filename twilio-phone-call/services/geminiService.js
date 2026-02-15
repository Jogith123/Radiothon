/**
 * Gemini AI Service
 * Handles all interactions with Google Gemini AI
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;
let model = null;

/**
 * Initialize Gemini AI
 */
function initializeGemini() {
  try {
    if (process.env.GEMINI_API_KEY) {
      genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      // Using Gemini 2.5 Flash - the free tier model
      model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      console.log('✅ Gemini AI initialized (using gemini-2.5-flash - Free Tier)');
      return true;
    } else {
      console.log('⚠️  GEMINI_API_KEY not found in .env');
      return false;
    }
  } catch (error) {
    console.log('⚠️  Gemini AI initialization failed:', error.message);
    return false;
  }
}

/**
 * Check if Gemini is initialized
 * @returns {boolean}
 */
function isInitialized() {
  return model !== null;
}

/**
 * Get model instance
 * @returns {GenerativeModel|null}
 */
function getModel() {
  return model;
}

/**
 * Generate answer for educational question
 * @param {string} question - User's question
 * @returns {Promise<string>} AI-generated answer
 */
async function generateAnswer(question) {
  if (!model) {
    throw new Error('Gemini AI not initialized');
  }

  const prompt = `You are an educational assistant. Answer this question clearly and concisely in 2-3 sentences suitable for voice response. Do NOT use any markdown formatting like **, *, #, or bullet points - respond in plain text only: ${question}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

/**
 * Classify question into subject category
 * @param {string} question - User's question
 * @returns {Promise<string>} Subject category (specific school-level subject)
 */
async function classifySubject(question) {
  if (!model) {
    return 'General';
  }

  try {
    const classifyPrompt = `
You are an educational subject classifier. Analyze this question and identify the specific school-level subject it belongs to.

Question: "${question}"

Common school subjects include:
- Mathematics (Algebra, Geometry, Trigonometry, Calculus, Statistics)
- Physics
- Chemistry (Organic Chemistry, Inorganic Chemistry)
- Biology (Botany, Zoology, Human Biology)
- English (Grammar, Literature, Composition)
- History (World History, Indian History, Ancient History)
- Geography
- Computer Science (Programming, IT)
- Economics
- Political Science
- Social Studies
- Environmental Science
- General Science

Instructions:
1. Identify the SPECIFIC subject name (e.g., "History" not "Other", "Geography" not "Social Studies")
2. Return ONLY the subject name, nothing else
3. Use proper capitalization (e.g., "World History", "Computer Science")
4. If it's a general knowledge question, return "General Knowledge"
5. Be specific - don't use "Other" unless absolutely necessary

Subject:`;

    const result = await model.generateContent(classifyPrompt);
    const response = await result.response;
    const subject = response.text().trim();

    console.log(`📚 Classified subject: ${subject}`);
    return subject;
  } catch (error) {
    console.error('❌ Error classifying subject:', error.message);
    return 'General';
  }
}

/**
 * Generate learning summary from question history
 * @param {string} subjectName - Subject name
 * @param {Array} history - Array of history documents
 * @returns {Promise<string>} AI-generated summary
 */
async function generateSummary(subjectName, history) {
  if (!model) {
    throw new Error('Gemini AI not initialized');
  }

  const summaryPrompt = `
Here are the user's previous ${subjectName} questions and answers:
${history.map((x, i) => `${i + 1}. Q: ${x.question}\nA: ${x.response}`).join('\n\n')}

Give a short and simple summary of what the user has learned so far in ${subjectName}. Keep it under 100 words and suitable for voice response.
`;

  const result = await model.generateContent(summaryPrompt);
  const response = await result.response;
  return response.text();
}

/**
 * Explain a specific chapter from a book/document
 * Uses relevant chunks retrieved via vector search (not the full document)
 * @param {string} chapterRequest - What the user asked (e.g., "explain chapter 3 of physics")
 * @param {string} relevantContent - Relevant chunks from vector search
 * @param {string} fileName - The document filename for context
 * @returns {Promise<string>} AI-generated chapter explanation
 */
async function explainChapter(chapterRequest, relevantContent, fileName) {
  if (!model) {
    throw new Error('Gemini AI not initialized');
  }

  const prompt = `You are an educational assistant. The user wants you to explain a specific chapter or topic from their study material.

User's request: "${chapterRequest}"

Here are the most relevant sections from the document "${fileName}" (retrieved via semantic search):
---
${relevantContent}
---

Instructions:
1. Based on the relevant sections above, explain what the user is asking about.
2. Focus on the content that directly relates to the user's request.
3. Provide a clear, detailed explanation that's easy to understand for a student.
4. Keep the explanation suitable for voice response (clear, conversational, well-structured).
5. Do NOT use any markdown formatting like **, *, #, bullet points, or numbered lists - respond in plain text only.
6. If the relevant sections don't fully cover the topic, explain what's available and mention that.
7. Keep the explanation under 500 words so it's not too long for voice playback.

Explain:`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

module.exports = {
  initializeGemini,
  isInitialized,
  getModel,
  generateAnswer,
  classifySubject,
  generateSummary,
  explainChapter
};
