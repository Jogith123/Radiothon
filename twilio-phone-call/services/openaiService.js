/**
 * OpenAI Service
 * Handles all interactions with OpenAI API (GPT models)
 */

const OpenAI = require('openai');

let openai = null;
let isInitializedFlag = false;

/**
 * Initialize OpenAI client
 */
function initializeOpenAI() {
    try {
        if (process.env.OPENAI_API_KEY) {
            openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY
            });
            isInitializedFlag = true;
            const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
            console.log(`✅ OpenAI initialized (using ${model})`);
            return true;
        } else {
            console.log('⚠️  OPENAI_API_KEY not found in .env');
            return false;
        }
    } catch (error) {
        console.log('⚠️  OpenAI initialization failed:', error.message);
        return false;
    }
}

/**
 * Check if OpenAI is initialized
 * @returns {boolean}
 */
function isInitialized() {
    return isInitializedFlag;
}

/**
 * Get OpenAI client instance
 * @returns {OpenAI|null}
 */
function getClient() {
    return openai;
}

/**
 * Generate answer for educational question
 * @param {string} question - User's question
 * @returns {Promise<string>} AI-generated answer
 */
async function generateAnswer(question) {
    if (!openai) {
        throw new Error('OpenAI not initialized');
    }

    const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

    const completion = await openai.chat.completions.create({
        model: model,
        messages: [
            {
                role: 'system',
                content: 'You are an educational assistant. Answer questions clearly and concisely in 2-3 sentences suitable for voice response. Focus on accuracy and simplicity.'
            },
            {
                role: 'user',
                content: question
            }
        ],
        temperature: 0.7,
        max_tokens: 200
    });

    return completion.choices[0].message.content.trim();
}

/**
 * Classify question into subject category
 * @param {string} question - User's question
 * @returns {Promise<string>} Subject category (specific school-level subject)
 */
async function classifySubject(question) {
    if (!openai) {
        return 'General';
    }

    try {
        const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

        const completion = await openai.chat.completions.create({
            model: model,
            messages: [
                {
                    role: 'system',
                    content: `You are an educational subject classifier. Analyze questions and identify the specific school-level subject.

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
1. Identify the SPECIFIC subject name (e.g., "History" not "Other")
2. Return ONLY the subject name, nothing else
3. Use proper capitalization (e.g., "World History", "Computer Science")
4. If it's a general knowledge question, return "General Knowledge"
5. Be specific - don't use "Other" unless absolutely necessary`
                },
                {
                    role: 'user',
                    content: `Classify this question into a subject: "${question}"`
                }
            ],
            temperature: 0.3,
            max_tokens: 20
        });

        const subject = completion.choices[0].message.content.trim();
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
    if (!openai) {
        throw new Error('OpenAI not initialized');
    }

    const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

    const questionsAndAnswers = history
        .map((x, i) => `${i + 1}. Q: ${x.question}\nA: ${x.response}`)
        .join('\n\n');

    const completion = await openai.chat.completions.create({
        model: model,
        messages: [
            {
                role: 'system',
                content: 'You are an educational assistant. Create short, simple summaries suitable for voice response. Keep summaries under 100 words.'
            },
            {
                role: 'user',
                content: `Here are the user's previous ${subjectName} questions and answers:\n\n${questionsAndAnswers}\n\nGive a short and simple summary of what the user has learned so far in ${subjectName}.`
            }
        ],
        temperature: 0.7,
        max_tokens: 150
    });

    return completion.choices[0].message.content.trim();
}

module.exports = {
    initializeOpenAI,
    isInitialized,
    getClient,
    generateAnswer,
    classifySubject,
    generateSummary
};
