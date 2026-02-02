require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

// Import modular services
const { connectToMongoDB, closeConnection, isConnected } = require('./database/connection');
const { initializeGemini, isInitialized: isGeminiInitialized, generateAnswer, generateSummary } = require('./services/geminiService');
const { initializeTTS, initializeSTT, textToSpeechConvert, transcribeAudio } = require('./services/speechService');
const { storeQuestionAndAnswer, getHistoryBySubject, getUserStats } = require('./services/historyService');
const { initializeTranslation, detectLanguage, translateText, isTranslationAvailable } = require('./services/translationService');
const { initializeRedis, storeSession, getSession, updateSession, deleteSession, isRedisConnected } = require('./services/redisService');
const { 
    createWelcomeResponse, 
    createQuestionRecordingResponse, 
    createSubjectSelectionResponse,
    createAudioPlaybackResponse,
    createTTSResponse,
    createHangupResponse,
    validateExotelRequest,
    getCallInfo 
} = require('./services/exotelService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/audio', express.static(path.join(__dirname, 'audio')));

// Initialize all services
async function initializeServices() {
    console.log('🚀 Initializing Vidya Vani services...\n');

    // Initialize Redis first (for session storage)
    const redisConnected = await initializeRedis();
    if (!redisConnected) {
        console.warn('⚠️  Redis not available - using fallback session storage');
    }

    // Initialize Gemini AI
    initializeGemini();

    // Initialize Google TTS
    initializeTTS();

    // Initialize Google STT
    initializeSTT();

    // Initialize Google Translation
    initializeTranslation();

    // Initialize MongoDB
    await connectToMongoDB();

    console.log('\n✅ All services initialized\n');
}

// Exotel webhook endpoints

// Welcome endpoint - Entry point for incoming calls
app.post('/exotel/welcome', async (req, res) => {
    if (!validateExotelRequest(req)) {
        return res.status(400).json({ error: 'Invalid request' });
    }

    const callInfo = getCallInfo(req);
    console.log(`📞 Incoming call: ${callInfo.callSid} from ${callInfo.fromNumber}`);

    // Initialize session
    const sessionData = {
        questions: [],
        currentQuestion: null,
        state: 'welcome',
        fromNumber: callInfo.fromNumber,
        language: 'en-in',  // Default to English India
        callStartTime: new Date().toISOString()
    };

    if (isRedisConnected()) {
        await storeSession(callInfo.callSid, sessionData);
    }

    const response = createWelcomeResponse();
    res.json(response);
});

// Main menu processor
app.post('/exotel/process', async (req, res) => {
    if (!validateExotelRequest(req)) {
        return res.status(400).json({ error: 'Invalid request' });
    }

    const callInfo = getCallInfo(req);
    console.log(`🔢 User pressed: ${callInfo.digits} (Call: ${callInfo.callSid})`);

    let sessionData;
    if (isRedisConnected()) {
        sessionData = await getSession(callInfo.callSid);
    }

    if (!sessionData) {
        // Fallback session creation
        sessionData = {
            questions: [],
            currentQuestion: null,
            state: 'welcome',
            fromNumber: callInfo.fromNumber,
            language: 'en-in'
        };
    }

    try {
        let response;
        
        switch (callInfo.digits) {
            case '1':
                // Ask question
                sessionData.state = 'recording_question';
                if (isRedisConnected()) {
                    await updateSession(callInfo.callSid, sessionData);
                }
                response = createQuestionRecordingResponse();
                break;
                
            case '2':
                // Subject lessons
                response = createSubjectSelectionResponse();
                break;
                
            case '3':
                // Get answer to recorded question
                response = await handleGetAnswer(callInfo.callSid, sessionData);
                break;
                
            case '4':
                // Previous answers
                response = await handlePreviousAnswers(callInfo.callSid, sessionData);
                break;
                
            case '9':
                // End call
                response = createHangupResponse();
                if (isRedisConnected()) {
                    await deleteSession(callInfo.callSid);
                }
                break;
                
            default:
                // Invalid option - return to welcome
                response = createWelcomeResponse();
                break;
        }

        res.json(response);
    } catch (error) {
        console.error(`❌ Error in menu option ${callInfo.digits}:`, error);
        res.json(createWelcomeResponse());
    }
});

// Process recorded question
app.post('/exotel/process-question', async (req, res) => {
    if (!validateExotelRequest(req)) {
        return res.status(400).json({ error: 'Invalid request' });
    }

    const callInfo = getCallInfo(req);
    console.log(`✅ Recording completed for call: ${callInfo.callSid}`);
    console.log(`📼 Recording URL: ${callInfo.recordingUrl}`);

    let sessionData;
    if (isRedisConnected()) {
        sessionData = await getSession(callInfo.callSid);
    }

    if (!sessionData) {
        console.error(`❌ No session found for call: ${callInfo.callSid}`);
        return res.json(createWelcomeResponse());
    }

    // Process transcription immediately using Google STT
    processTranscription(callInfo.recordingUrl, callInfo.callSid, sessionData).catch(err => {
        console.error(`❌ Transcription error for ${callInfo.callSid}:`, err);
    });

    const response = createTTSResponse(
        'Thank you. Your question is being processed. Press 3 to hear the answer, or press 1 to ask another question.',
        `${process.env.BASE_URL}/exotel/process`
    );
    
    res.json(response);
});

// Play lesson based on subject selection
app.post('/exotel/play-lesson', async (req, res) => {
    if (!validateExotelRequest(req)) {
        return res.status(400).json({ error: 'Invalid request' });
    }

    const callInfo = getCallInfo(req);
    console.log(`📚 Subject selected: ${callInfo.digits} (Call: ${callInfo.callSid})`);

    const subjectMap = {
        '1': 'Mathematics',
        '2': 'Science', 
        '3': 'History',
        '4': 'Geography'
    };

    const selectedSubject = subjectMap[callInfo.digits] || 'Mathematics';
    
    // For now, play a pre-recorded lesson or generate TTS
    const lessonText = `Welcome to the ${selectedSubject} lesson. This feature is coming soon. Please press 1 to ask a question about ${selectedSubject}.`;
    
    const response = createTTSResponse(
        lessonText,
        `${process.env.BASE_URL}/exotel/process`
    );
    
    res.json(response);
});

// Handle get answer request
async function handleGetAnswer(callSid, sessionData) {
    console.log(`🤖 Getting answer for call: ${callSid}`);

    const question = sessionData.currentQuestion;
    console.log(`📝 Current question in session: ${question}`);

    // Check if transcription is still processing
    if (sessionData.state === 'processing_transcription') {
        console.log(`⏳ Transcription still processing for call: ${callSid}`);
        return createTTSResponse(
            'Your question is still being processed. Please wait a moment and press 3 again.',
            `${process.env.BASE_URL}/exotel/process`
        );
    }

    if (!question) {
        console.log(`⚠️  No question found for call: ${callSid}`);
        return createTTSResponse(
            'No question found. Please press 1 to ask a question first.',
            `${process.env.BASE_URL}/exotel/process`
        );
    }

    try {
        // Check if Gemini AI is available
        if (!isGeminiInitialized()) {
            return createTTSResponse(
                'Sorry, AI service is not configured. Please add your Gemini API key to the environment file.',
                `${process.env.BASE_URL}/exotel/process`
            );
        }

        console.log(`🤖 Sending to Gemini: ${question}`);
        const answerEnglish = await generateAnswer(question);

        console.log(`🤖 Answer (English): ${answerEnglish}`);

        // Get user's language from session
        const questionLanguage = sessionData.questionLanguage || 'en';
        const detectedLanguageCode = sessionData.detectedLanguageCode || 'en-in';

        // Translate answer back to user's language if needed
        let answerInUserLanguage = answerEnglish;
        if (questionLanguage !== 'en') {
            console.log(`🌐 Translating answer: English → ${questionLanguage}...`);
            answerInUserLanguage = await translateText(answerEnglish, questionLanguage, 'en');
            console.log(`📝 Answer (${questionLanguage}): ${answerInUserLanguage}`);
        }

        // Store answer in session
        sessionData.lastAnswer = answerEnglish;              // English version
        sessionData.lastAnswerTranslated = answerInUserLanguage;  // User's language
        
        if (isRedisConnected()) {
            await updateSession(callSid, sessionData);
        }

        // Classify and store (using English question and answer)
        if (isConnected()) {
            await storeQuestionAndAnswer(sessionData.fromNumber, question, answerEnglish);
        }

        // Convert translated answer to speech in user's language
        const audioFileName = await textToSpeechConvert(
            answerInUserLanguage,
            callSid,
            detectedLanguageCode  // Use full language code (e.g., 'te-IN')
        );

        let response;
        if (audioFileName) {
            // Play the generated audio in user's language
            const audioUrl = `${process.env.BASE_URL}/audio/${audioFileName}`;
            response = createAudioPlaybackResponse(
                audioUrl,
                `${process.env.BASE_URL}/exotel/process`
            );
        } else {
            // Fallback to TTS
            response = createTTSResponse(
                answerInUserLanguage,
                `${process.env.BASE_URL}/exotel/process`
            );
        }

        return response;

    } catch (error) {
        console.error('Error getting answer from Gemini:', error);
        return createTTSResponse(
            'Sorry, I encountered an error processing your question. Please try again.',
            `${process.env.BASE_URL}/exotel/process`
        );
    }
}

// Handle previous answers request
async function handlePreviousAnswers(callSid, sessionData) {
    console.log(`📚 Getting previous answers for call: ${callSid}`);
    
    try {
        if (!isConnected()) {
            return createTTSResponse(
                'Sorry, database service is not available. This feature requires database connection.',
                `${process.env.BASE_URL}/exotel/process`
            );
        }

        const fromNumber = sessionData.fromNumber;
        const stats = await getUserStats(fromNumber);
        
        if (stats.totalQuestions === 0) {
            return createTTSResponse(
                'You have not asked any questions yet. Please press 1 to ask a question.',
                `${process.env.BASE_URL}/exotel/process`
            );
        }

        const summaryText = `You have asked ${stats.totalQuestions} questions in total. Your most active subjects are ${stats.subjectStats.slice(0, 3).map(s => s._id).join(', ')}. Press 1 to ask a new question.`;
        
        return createTTSResponse(
            summaryText,
            `${process.env.BASE_URL}/exotel/process`
        );
        
    } catch (error) {
        console.error('Error getting previous answers:', error);
        return createTTSResponse(
            'Sorry, I encountered an error retrieving your previous answers. Please try again.',
            `${process.env.BASE_URL}/exotel/process`
        );
    }
}

// Process transcription asynchronously with translation support
async function processTranscription(recordingUrl, callSid, sessionData) {
    try {
        // Get user's preferred language (default to English India)
        const userLanguage = sessionData.language || 'en-in';

        // Transcribe with language specification
        const transcriptionResult = await transcribeAudio(recordingUrl, callSid, userLanguage);
        const transcriptionText = transcriptionResult.text;
        const detectedLanguage = transcriptionResult.detectedLanguage;

        console.log(`📝 Transcribed: "${transcriptionText}" (Language: ${detectedLanguage})`);

        // Extract language code (remove country code: 'te-IN' → 'te')
        const langCode = detectedLanguage.split('-')[0];

        // If not English, translate to English for AI processing
        let questionForAI = transcriptionText;
        if (langCode !== 'en') {
            console.log(`🌐 Translating ${langCode} → English for AI processing...`);
            questionForAI = await translateText(transcriptionText, 'en', langCode);
            console.log(`📝 Translated question: "${questionForAI}"`);
        }

        // Update session with question data
        sessionData.currentQuestion = questionForAI;           // English for AI
        sessionData.originalQuestion = transcriptionText;      // Original language
        sessionData.questionLanguage = langCode;               // Language code ('te', 'hi', etc.)
        sessionData.detectedLanguageCode = detectedLanguage;   // Full code ('te-IN', etc.)
        sessionData.questions.push(questionForAI);
        sessionData.state = 'transcription_complete';
        
        if (isRedisConnected()) {
            await updateSession(callSid, sessionData);
        }

        console.log(`✅ Question saved: "${questionForAI}" (from ${langCode})`);
    } catch (error) {
        console.error(`❌ Transcription error for ${callSid}:`, error.message);
        // Set a fallback message
        sessionData.transcriptionError = true;
        if (isRedisConnected()) {
            await updateSession(callSid, sessionData);
        }
    }
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
            gemini: isGeminiInitialized(),
            mongodb: isConnected(),
            redis: isRedisConnected()
        }
    });
});

// Error handler for all routes
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err);
    res.json(createTTSResponse(
        'Sorry, there was a server error. Please try again.',
        `${process.env.BASE_URL}/exotel/welcome`
    ));
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await closeConnection();
    if (isRedisConnected()) {
        const { closeRedisConnection } = require('./services/redisService');
        await closeRedisConnection();
    }
    process.exit(0);
});

// Start server
async function startServer() {
    await initializeServices();

    app.listen(PORT, () => {
        console.log(`🚀 Server is running on port ${PORT}`);
        console.log(`📞 Exotel webhook URL: ${process.env.BASE_URL || `http://localhost:${PORT}`}/exotel/welcome`);
    });
}

startServer();
