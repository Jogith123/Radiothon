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
            const model = process.env.OPENAI_MODEL || 'gpt-5.1';
            console.log(`✅ OpenAI initialized (using ${model})`);
            return true;
        } else {
            console.log('ℹ️  OPENAI_API_KEY not set');
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
 * @param {string} context - Optional RAG context from document chunks
 * @returns {Promise<string>} AI-generated answer
 */
async function generateAnswer(question, context = '') {
    if (!openai) {
        throw new Error('OpenAI not initialized');
    }

    const model = process.env.OPENAI_MODEL || 'gpt-5.1';

    let systemPrompt;
    let userPrompt;

    if (context) {
        systemPrompt = `You are an educational assistant. The student has uploaded study materials. Use the relevant sections provided to answer their question accurately.

Instructions:
1. Answer clearly and concisely in 2-4 sentences suitable for voice response.
2. Use the document content to give an accurate answer.
3. If the documents don't fully cover the topic, seamlessly answer from your general knowledge WITHOUT mentioning that the documents lack information. Never say phrases like "the provided study materials do not contain" or "the documents don't cover" - just answer the question directly.
4. Do NOT use any markdown formatting like **, *, #, or bullet points - respond in plain text only.`;

        userPrompt = `Relevant content from their documents:
---
${context}
---

Student's question: ${question}`;
    } else {
        systemPrompt = 'You are an educational assistant. Answer questions clearly and concisely in 2-3 sentences suitable for voice response. Focus on accuracy and simplicity. Do NOT use any markdown formatting like **, *, #, or bullet points - respond in plain text only.';
        userPrompt = question;
    }

    const completion = await openai.chat.completions.create({
        model: model,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 300
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
        const model = process.env.OPENAI_MODEL || 'gpt-5.1';

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

    const model = process.env.OPENAI_MODEL || 'gpt-5.1';

    const questionsAndAnswers = history
        .map((x, i) => `${i + 1}. Q: ${x.question}\nA: ${x.response}`)
        .join('\n\n');

    const completion = await openai.chat.completions.create({
        model: model,
        messages: [
            {
                role: 'system',
                content: 'You are an educational assistant. Create short, simple summaries suitable for voice response. Keep summaries under 100 words. Do NOT use any markdown formatting.'
            },
            {
                role: 'user',
                content: `Here are the user's previous ${subjectName} questions and answers:\n\n${questionsAndAnswers}\n\nGive a short and simple summary of what the user has learned so far in ${subjectName}.`
            }
        ],
        temperature: 0.7,
        max_tokens: 200
    });

    return completion.choices[0].message.content.trim();
}

/**
 * Generate a subject-wise summary from grouped question history
 * @param {Object} subjectGroups - Object with subject names as keys and arrays of history docs as values
 * @returns {Promise<string>} AI-generated subject-wise summary
 */
async function generateSubjectWiseSummary(subjectGroups) {
    if (!openai) {
        throw new Error('OpenAI not initialized');
    }

    const model = process.env.OPENAI_MODEL || 'gpt-5.1';

    // Build a structured prompt with questions grouped by subject
    let questionsText = '';
    for (const [subject, questions] of Object.entries(subjectGroups)) {
        questionsText += `\n${subject}:\n`;
        for (const q of questions) {
            questionsText += `  - Q: ${q.question}\n    A: ${q.response}\n`;
        }
    }

    const completion = await openai.chat.completions.create({
        model: model,
        messages: [
            {
                role: 'system',
                content: 'You are an educational assistant. Provide concise subject-wise learning summaries. For each subject, summarize what the student has been learning in 1-2 sentences. Keep the total summary under 150 words and suitable for voice response. Do NOT use any markdown formatting like **, *, #, or bullet points - respond in plain text only. Start each subject section with the subject name followed by a colon.'
            },
            {
                role: 'user',
                content: `Here are a student's recent questions and answers grouped by subject:\n${questionsText}\n\nProvide a concise subject-wise learning summary.`
            }
        ],
        temperature: 0.7,
        max_tokens: 250
    });

    return completion.choices[0].message.content.trim();
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
    if (!openai) {
        throw new Error('OpenAI not initialized');
    }

    const model = process.env.OPENAI_MODEL || 'gpt-5.1';

    const completion = await openai.chat.completions.create({
        model: model,
        messages: [
            {
                role: 'system',
                content: `You are an educational assistant. The user wants you to explain a specific chapter or topic from their study material.

Instructions:
1. Based on the relevant sections provided, explain what the user is asking about.
2. Focus on the content that directly relates to the user's request.
3. Provide a clear, detailed explanation that's easy to understand for a student.
4. Keep the explanation suitable for voice response (clear, conversational, well-structured).
5. Do NOT use any markdown formatting like **, *, #, bullet points, or numbered lists - respond in plain text only.
6. If the relevant sections don't fully cover the topic, explain what's available and mention that.
7. Keep the explanation under 500 words so it's not too long for voice playback.`
            },
            {
                role: 'user',
                content: `User's request: "${chapterRequest}"

Here are the most relevant sections from the document "${fileName}" (retrieved via semantic search):
---
${relevantContent}
---

Please explain this topic.`
            }
        ],
        temperature: 0.7,
        max_tokens: 700
    });

    return completion.choices[0].message.content.trim();
}

module.exports = {
    initializeOpenAI,
    isInitialized,
    getClient,
    generateAnswer,
    classifySubject,
    generateSummary,
    generateSubjectWiseSummary,
    explainChapter
};
