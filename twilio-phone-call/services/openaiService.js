/**
 * OpenAI Service for Vidya Vani
 * Handles:
 * - Question answering
 * - Subject classification
 * - Summary generation
 */

const { OpenAI } = require('openai');

// OpenAI client instance
let openaiClient = null;
let isInitialized = false;

/**
 * Initialize OpenAI with API key from environment
 */
function initializeOpenAI() {
    try {
        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            throw new Error('OPENAI_API_KEY not found in environment variables');
        }

        openaiClient = new OpenAI({
            apiKey: apiKey
        });

        isInitialized = true;
        console.log(`✅ OpenAI initialized (using ${process.env.OPENAI_MODEL || 'gpt-3.5-turbo'})`);
    } catch (error) {
        console.error('❌ Failed to initialize OpenAI:', error.message);
        throw error;
    }
}

/**
 * Check if OpenAI is initialized
 */
function isOpenAIInitialized() {
    return isInitialized;
}

/**
 * Generate answer to a question using OpenAI
 * @param {string} question - The user's question
 * @returns {Promise<string>} - Generated answer
 */
async function generateAnswer(question) {
    try {
        if (!isInitialized) {
            throw new Error('OpenAI not initialized. Call initializeOpenAI() first.');
        }

        console.log(`🤖 Sending to OpenAI: ${question}`);

        const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

        const response = await openaiClient.chat.completions.create({
            model: model,
            messages: [
                {
                    role: 'system',
                    content: 'You are Vidya Vani, an educational voice assistant for students. Provide clear, concise, and accurate answers to educational questions. Keep responses under 100 words and suitable for voice output. Focus on key concepts and examples.'
                },
                {
                    role: 'user',
                    content: question
                }
            ],
            temperature: 0.7,
            max_tokens: 300
        });

        const answer = response.choices[0].message.content.trim();
        console.log(`📊 Answer generated successfully (${answer.length} chars)`);

        return answer;
    } catch (error) {
        console.error('❌ Error generating answer:', error.message);
        throw error;
    }
}

/**
 * Classify subject from a question
 * @param {string} question - The question to classify
 * @returns {Promise<string>} - Subject name (e.g., "Physics", "Math", "History")
 */
async function classifySubject(question) {
    try {
        if (!isInitialized) {
            throw new Error('OpenAI not initialized. Call initializeOpenAI() first.');
        }

        const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

        const response = await openaiClient.chat.completions.create({
            model: model,
            messages: [
                {
                    role: 'system',
                    content: 'You are a subject classifier. Classify the given question into one of these subjects: Physics, Chemistry, Biology, Mathematics, History, Geography, English, Computer Science, Economics, Political Science, or General Knowledge. Respond with ONLY the subject name, nothing else.'
                },
                {
                    role: 'user',
                    content: question
                }
            ],
            temperature: 0.3,
            max_tokens: 10
        });

        const subject = response.choices[0].message.content.trim();
        console.log(`📚 Classified subject: ${subject}`);

        return subject;
    } catch (error) {
        console.error('❌ Error classifying subject:', error.message);
        // Fallback to "General" if classification fails
        return 'General';
    }
}

/**
 * Generate a summary of questions and answers
 * @param {Array} history - Array of {question, answer} objects
 * @param {string} subject - Subject name
 * @returns {Promise<string>} - Generated summary
 */
async function generateSummary(history, subject) {
    try {
        if (!isInitialized) {
            throw new Error('OpenAI not initialized. Call initializeOpenAI() first.');
        }

        if (!history || history.length === 0) {
            return `You haven't asked any questions about ${subject} yet.`;
        }

        // Format history for the prompt
        const historyText = history.map((item, index) =>
            `Q${index + 1}: ${item.question}\nA${index + 1}: ${item.answer}`
        ).join('\n\n');

        const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

        const response = await openaiClient.chat.completions.create({
            model: model,
            messages: [
                {
                    role: 'system',
                    content: 'You are Vidya Vani, an educational voice assistant. Create a concise learning summary from the student\'s questions and answers. Highlight key points learned and connections between topics. Keep it under 150 words and suitable for voice output.'
                },
                {
                    role: 'user',
                    content: `Summarize this learning session about ${subject}:\n\n${historyText}`
                }
            ],
            temperature: 0.7,
            max_tokens: 400
        });

        const summary = response.choices[0].message.content.trim();
        console.log(`📊 Summary generated successfully`);

        return summary;
    } catch (error) {
        console.error('❌ Error generating summary:', error.message);
        throw error;
    }
}

module.exports = {
    initializeOpenAI,
    isOpenAIInitialized,
    generateAnswer,
    classifySubject,
    generateSummary
};
