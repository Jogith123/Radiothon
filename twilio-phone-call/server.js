const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const VoiceResponse = require('twilio').twiml.VoiceResponse;

// Import modular services
const { connectToMongoDB, closeConnection, isConnected } = require('./database/connection');
const { initializeOpenAI, isInitialized: isOpenAIInitialized, generateAnswer, generateSummary } = require('./services/openaiService');
const { initializeTTS, initializeSTT, textToSpeechConvert, transcribeAudio } = require('./services/speechService');
const { storeQuestionAndAnswer, getHistoryBySubject, getUserStats, getAllHistory } = require('./services/historyService');
const { initializeTranslation, detectLanguage, translateText, isTranslationAvailable } = require('./services/translationService');
const { initializeWebSocket, broadcastCallStarted, broadcastQuestionTranscribed, broadcastAnswerGenerated, broadcastQASaved, broadcastCallEnded, broadcastPipelineStage, closeWebSocket } = require('./services/websocketService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/audio', express.static(path.join(__dirname, 'audio')));

// CORS for frontend (allow all origins in development)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Create HTTP server (shared between Express and WebSocket)
const server = http.createServer(app);

// Initialize all services
async function initializeServices() {
  console.log('🚀 Initializing Vidya Vani services...\n');

  // Initialize OpenAI
  initializeOpenAI();

  // Initialize Google TTS
  initializeTTS();

  // Initialize Google STT
  initializeSTT();

  // Initialize Google Translation
  initializeTranslation();

  // Initialize MongoDB
  await connectToMongoDB();

  // Initialize WebSocket on shared HTTP server (same port, path /ws)
  initializeWebSocket(server);

  console.log('\n✅ All services initialized\n');
}

// Store user sessions (in production, use Redis or database)
const userSessions = new Map();

// ============================================
// IVR ENDPOINTS
// ============================================

// Welcome endpoint - Entry point for incoming calls
app.post('/ivr/welcome', (req, res) => {
  const callSid = req.body.CallSid;
  const fromNumber = req.body.From;
  console.log(`📞 Incoming call: ${callSid} from ${fromNumber}`);

  // Broadcast call started (non-blocking)
  try {
    broadcastCallStarted(callSid, fromNumber);
  } catch (error) {
    // Silent fail - don't affect phone call
  }

  // Initialize session
  userSessions.set(callSid, {
    questions: [],
    currentQuestion: null,
    state: 'welcome',
    fromNumber: fromNumber,
    language: 'en-US',  // Default to English, auto-detected from speech
    startTime: Date.now() // Track call start time for duration
  });

  const twiml = new VoiceResponse();
  const gather = twiml.gather({
    action: `${process.env.BASE_URL}/ivr/menu`,
    numDigits: '1',
    method: 'POST',
    timeout: 10
  });

  gather.say(
    'Welcome to Vidya Vani, your AI powered educational assistant. ' +
    'Press 1 to ask a question. ' +
    'Press 2 to stop recording. ' +
    'Press 3 to get the answer. ' +
    'Press 4 to get a summary of your last 5 questions on a subject. ' +
    'Press 5 to stop and return to main menu. ' +
    'Press 6 to add more details to your last question. ' +
    'Press 9 to end the call.',
    { voice: 'Polly.Joanna', language: 'en-US', loop: 2 }
  );

  res.type('text/xml');
  res.send(twiml.toString());
});

// Main menu handler
app.post('/ivr/menu', async (req, res) => {
  const digit = req.body.Digits;
  const callSid = req.body.CallSid;
  console.log(`🔢 User pressed: ${digit} (Call: ${callSid})`);

  const optionActions = {
    '1': askQuestion,
    '2': stopRecording,
    '3': getAnswer,
    '4': getSummary,
    '5': returnToMenu,
    '6': followUpQuestion,
    '9': endCall
  };

  if (optionActions[digit]) {
    try {
      const twiml = await optionActions[digit](callSid, req);
      res.type('text/xml');
      res.send(twiml);
    } catch (error) {
      console.error(`❌ Error in menu option ${digit}:`, error);
      res.type('text/xml');
      res.send(redirectWelcome());
    }
  } else {
    console.log(`⚠️  Invalid option: ${digit}`);
    res.type('text/xml');
    res.send(redirectWelcome());
  }
});

// Ask question flow
async function askQuestion(callSid, req) {
  console.log(`🎤 Starting recording for call: ${callSid}`);
  const session = userSessions.get(callSid) || {};
  session.state = 'recording_question';
  userSessions.set(callSid, session);

  const twiml = new VoiceResponse();

  twiml.say(
    'Please ask your educational question after the beep. Press 2 to stop recording.',
    { voice: 'Polly.Joanna', language: 'en-US' }
  );

  twiml.record({
    action: `${process.env.BASE_URL}/ivr/question-recorded`,
    method: 'POST',
    maxLength: 60,
    finishOnKey: '2',
    transcribe: false,  // Disable Twilio transcription, we'll use Google STT
    playBeep: true
  });

  return twiml.toString();
}

// Stop recording handler (when user presses 2)
function stopRecording(callSid, req) {
  const twiml = new VoiceResponse();

  twiml.say(
    'Recording stopped. Your question is being processed. Please press 3 to hear the answer.',
    { voice: 'Polly.Joanna', language: 'en-US' }
  );

  const gather = twiml.gather({
    action: `${process.env.BASE_URL}/ivr/menu`,
    numDigits: '1',
    method: 'POST',
    timeout: 10
  });

  gather.say(
    'Press 3 for answer, or press 1 for new question.',
    { voice: 'Polly.Joanna', language: 'en-US', loop: 3 }
  );

  return twiml.toString();
}

// Handle recorded question
app.post('/ivr/question-recorded', async (req, res) => {
  const callSid = req.body.CallSid;
  const recordingUrl = req.body.RecordingUrl;
  console.log(`✅ Recording completed for call: ${callSid}`);
  console.log(`📼 Recording URL: ${recordingUrl}`);

  const session = userSessions.get(callSid) || {};
  session.lastRecordingUrl = recordingUrl;
  session.state = 'processing_transcription';
  userSessions.set(callSid, session);

  // Process transcription immediately using Google STT
  processTranscription(recordingUrl, callSid).catch(err => {
    console.error(`❌ Transcription error for ${callSid}:`, err);
  });

  const twiml = new VoiceResponse();
  twiml.say(
    'Thank you. Your question is being processed. ' +
    'Please press 3 to hear the answer, or press 1 to ask another question.',
    { voice: 'Polly.Joanna', language: 'en-US' }
  );

  const gather = twiml.gather({
    action: `${process.env.BASE_URL}/ivr/menu`,
    numDigits: '1',
    method: 'POST',
    timeout: 10
  });

  gather.say(
    'Press 3 for answer, or press 1 for new question.',
    { voice: 'Polly.Joanna', language: 'en-US', loop: 3 }
  );

  res.type('text/xml');
  res.send(twiml.toString());
});

// Process transcription asynchronously with translation support
async function processTranscription(recordingUrl, callSid) {
  try {
    const session = userSessions.get(callSid) || {};

    // Get user's preferred language (default to English)
    const userLanguage = session.language || 'en-US';

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

    // Save both original and translated to session
    session.currentQuestion = questionForAI;           // English for AI
    session.originalQuestion = transcriptionText;      // Original language
    session.questionLanguage = langCode;               // Language code ('te', 'hi', etc.)
    session.detectedLanguageCode = detectedLanguage;   // Full code ('te-IN', etc.)
    session.questions.push(questionForAI);
    session.state = 'transcription_complete';
    userSessions.set(callSid, session);

    console.log(`✅ Question saved: "${questionForAI}" (from ${langCode})`);

    // Broadcast question transcribed (non-blocking)
    try {
      broadcastQuestionTranscribed(callSid, questionForAI, detectedLanguage);
    } catch (error) {
      // Silent fail
    }
  } catch (error) {
    console.error(`❌ Transcription error for ${callSid}:`, error.message);
    // Set a fallback message
    const session = userSessions.get(callSid) || {};
    session.transcriptionError = true;
    userSessions.set(callSid, session);
  }
}

// Process follow-up transcription and combine with original question
async function processFollowupTranscription(recordingUrl, callSid) {
  try {
    const session = userSessions.get(callSid) || {};
    const userLanguage = session.language || 'en-US';

    // Transcribe the additional details
    const transcriptionResult = await transcribeAudio(recordingUrl, callSid, userLanguage);
    const additionalDetails = transcriptionResult.text || transcriptionResult;
    const detectedLanguage = transcriptionResult.detectedLanguage || userLanguage;

    console.log(`📝 Additional details transcribed: "${additionalDetails}"`);

    // Get language code
    const langCode = detectedLanguage.split('-')[0];

    // Translate to English if needed
    let additionalDetailsEnglish = additionalDetails;
    if (langCode !== 'en') {
      console.log(`🌐 Translating ${langCode} → English...`);
      additionalDetailsEnglish = await translateText(additionalDetails, 'en', langCode);
      console.log(`📝 Translated details: "${additionalDetailsEnglish}"`);
    }

    // Combine with original question
    const originalQuestion = session.originalQuestionBeforeFollowup || session.currentQuestion;
    const combinedQuestion = `${originalQuestion}. Additional details: ${additionalDetailsEnglish}`;

    console.log(`🔗 Combined question: "${combinedQuestion}"`);

    // Update session with combined question
    session.currentQuestion = combinedQuestion;
    session.originalQuestion = combinedQuestion;
    session.followUpDetails = additionalDetailsEnglish;
    session.questionLanguage = langCode;
    session.detectedLanguageCode = detectedLanguage;
    session.state = 'followup_complete';
    userSessions.set(callSid, session);

    console.log(`✅ Follow-up processed and combined`);

    // Broadcast follow-up transcribed (non-blocking)
    try {
      broadcastQuestionTranscribed(callSid, combinedQuestion, detectedLanguage);
    } catch (error) {
      // Silent fail
    }

  } catch (error) {
    console.error(`❌ Follow-up transcription error for ${callSid}:`, error.message);
    const session = userSessions.get(callSid) || {};
    session.transcriptionError = true;
    userSessions.set(callSid, session);
  }
}

// Handle transcription callback (kept for backward compatibility with Twilio transcription)
app.post('/ivr/transcription', async (req, res) => {
  const callSid = req.body.CallSid;
  const transcriptionText = req.body.TranscriptionText;

  console.log(`📝 Twilio transcription received for ${callSid}: "${transcriptionText}"`);

  const session = userSessions.get(callSid) || {};
  // Only use Twilio transcription if Google STT hasn't already processed it
  if (!session.currentQuestion) {
    session.currentQuestion = transcriptionText;
    session.questions.push(transcriptionText);
    userSessions.set(callSid, session);
    console.log(`✅ Question saved to session for ${callSid}`);
  }

  res.sendStatus(200);
});

// Get answer from Gemini AI
async function getAnswer(callSid, req) {
  console.log(`🤖 Getting answer for call: ${callSid}`);
  const session = userSessions.get(callSid) || {};
  const question = session.currentQuestion;
  console.log(`📝 Current question in session: ${question}`);

  const twiml = new VoiceResponse();

  // Check if transcription is still processing
  if (session.state === 'processing_transcription') {
    console.log(`⏳ Transcription still processing for call: ${callSid}`);
    twiml.say(
      'Your question is still being processed. Please wait a moment and press 3 again.',
      { voice: 'Polly.Joanna', language: 'en-US' }
    );
    twiml.redirect(`${process.env.BASE_URL}/ivr/welcome`);
    return twiml.toString();
  }

  if (!question) {
    console.log(`⚠️  No question found for call: ${callSid}`);
    twiml.say(
      'No question found. Please press 1 to ask a question first.',
      { voice: 'Polly.Joanna', language: 'en-US' }
    );
    twiml.redirect(`${process.env.BASE_URL}/ivr/welcome`);
    return twiml.toString();
  }

  try {
    // Check if OpenAI is available
    if (!isOpenAIInitialized()) {
      twiml.say(
        'Sorry, AI service is not configured. Please add your OpenAI API key to the environment file.',
        { voice: 'Polly.Joanna', language: 'en-US' }
      );
      twiml.redirect(`${process.env.BASE_URL}/ivr/welcome`);
      return twiml.toString();
    }

    // Get answer from OpenAI (in English)
    let answer = '';

    // Get the question from session
    // const question = session.currentQuestion; // This line is already present above, no need to duplicate.

    twiml.say(
      'Processing your question with AI. Please wait.',
      { voice: 'Polly.Joanna', language: 'en-US' }
    );

    console.log(`🤖 Sending to OpenAI: ${question}`);
    const answerEnglish = await generateAnswer(question);

    console.log(`🤖 Answer (English): ${answerEnglish}`);

    // Broadcast answer generated (non-blocking)
    try {
      broadcastAnswerGenerated(callSid, answerEnglish, 'General'); // Subject will be classified later
    } catch (error) {
      // Silent fail
    }

    // Get user's language from session
    const questionLanguage = session.questionLanguage || 'en';
    const detectedLanguageCode = session.detectedLanguageCode || 'en-US';

    console.log(`🌐 Language Info: Detected="${detectedLanguageCode}", Code="${questionLanguage}"`);

    // Translate answer back to user's language if needed
    let answerInUserLanguage = answerEnglish;
    if (questionLanguage !== 'en') {
      console.log(`🌐 Translating answer: English → ${questionLanguage}...`);
      answerInUserLanguage = await translateText(answerEnglish, questionLanguage, 'en');
      console.log(`📝 Answer (${questionLanguage}): ${answerInUserLanguage}`);
    } else {
      console.log(`✅ Answer is already in English, no translation needed`);
    }

    // Store answer in session
    session.lastAnswer = answerEnglish;              // English version
    session.lastAnswerTranslated = answerInUserLanguage;  // User's language
    userSessions.set(callSid, session);

    // Classify and store (using English question and answer)
    if (isConnected()) {
      await storeQuestionAndAnswer(session.fromNumber, question, answerEnglish);

      // Broadcast Q&A saved (non-blocking)
      try {
        broadcastQASaved({
          callSid,
          fromNumber: session.fromNumber,
          question,
          answer: answerEnglish.substring(0, 200),
          language: detectedLanguageCode,
          subject: 'Unknown' // Will be classified in storeQuestionAndAnswer
        });
      } catch (error) {
        // Silent fail
      }
    }

    // Convert translated answer to speech in user's language
    console.log(`🎤 Converting to speech: Language="${detectedLanguageCode}"`);
    const audioFileName = await textToSpeechConvert(
      answerInUserLanguage,
      callSid,
      detectedLanguageCode  // Use full language code (e.g., 'te-IN')
    );

    if (audioFileName) {
      // Play the generated audio in user's language
      const audioUrl = `${process.env.BASE_URL}/audio/${audioFileName}`;
      console.log(`▶️ Playing audio in ${detectedLanguageCode}: ${audioUrl}`);
      twiml.play(audioUrl);
    } else {
      // Fallback to Twilio's TTS
      console.log(`⚠️ Using Twilio TTS fallback in English`);
      twiml.say(answerEnglish, { voice: 'Polly.Joanna', language: 'en-US' });
    }

    // Offer next options
    const gather = twiml.gather({
      action: `${process.env.BASE_URL}/ivr/menu`,
      numDigits: '1',
      method: 'POST',
      timeout: 10
    });

    gather.say(
      'Press 1 to ask another question, or press 9 to end the call.',
      { voice: 'Polly.Joanna', language: 'en-US' }
    );

  } catch (error) {
    console.error('Error getting answer from OpenAI:', error);
    twiml.say(
      'Sorry, I encountered an error processing your question. Please try again.',
      { voice: 'Polly.Joanna', language: 'en-US' }
    );
    twiml.redirect(`${process.env.BASE_URL}/ivr/welcome`);
  }

  return twiml.toString();
}

// Get summary of last 5 questions for a subject
async function getSummary(callSid, req) {
  console.log(`📊 Getting summary for call: ${callSid}`);
  const session = userSessions.get(callSid) || {};
  const fromNumber = session.fromNumber || req.body.From;

  const twiml = new VoiceResponse();

  try {
    // Check if MongoDB is available
    if (!isConnected()) {
      twiml.say(
        'Sorry, database service is not available. This feature requires database connection.',
        { voice: 'Polly.Joanna', language: 'en-US' }
      );
      twiml.redirect(`${process.env.BASE_URL}/ivr/welcome`);
      return twiml.toString();
    }

    // Check if OpenAI is available
    if (!isOpenAIInitialized()) {
      twiml.say(
        'Sorry, AI service is not configured. Please add your OpenAI API key to the environment file.',
        { voice: 'Polly.Joanna', language: 'en-US' }
      );
      twiml.redirect(`${process.env.BASE_URL}/ivr/welcome`);
      return twiml.toString();
    }

    // Ask user for subject
    twiml.say(
      'Please tell me the subject you need to summarize.',
      { voice: 'Polly.Joanna', language: 'en-US' }
    );

    // Record the subject name
    twiml.record({
      action: `${process.env.BASE_URL}/ivr/process-summary`,
      method: 'POST',
      maxLength: 10,
      finishOnKey: '#',
      transcribe: false,
      playBeep: true
    });

  } catch (error) {
    console.error('Error in getSummary:', error);
    twiml.say(
      'Sorry, I encountered an error. Please try again.',
      { voice: 'Polly.Joanna', language: 'en-US' }
    );
    twiml.redirect(`${process.env.BASE_URL}/ivr/welcome`);
  }

  return twiml.toString();
}

// Follow-up question flow - add more details to last question
async function followUpQuestion(callSid, req) {
  console.log(`🔄 Follow-up question for call: ${callSid}`);
  const session = userSessions.get(callSid) || {};

  const twiml = new VoiceResponse();

  // Check if there's a previous question
  if (!session.currentQuestion) {
    console.log(`⚠️  No previous question found for call: ${callSid}`);
    twiml.say(
      'No previous question found. Please press 1 to ask a question first.',
      { voice: 'Polly.Joanna', language: 'en-US' }
    );
    twiml.redirect(`${process.env.BASE_URL}/ivr/welcome`);
    return twiml.toString();
  }

  console.log(`📝 Previous question: "${session.currentQuestion}"`);

  // Store the original question before follow-up
  session.originalQuestionBeforeFollowup = session.currentQuestion;
  userSessions.set(callSid, session);

  twiml.say(
    'You can add more details to the last question. Please speak now and press 2 when finished.',
    { voice: 'Polly.Joanna', language: 'en-US' }
  );

  twiml.record({
    action: `${process.env.BASE_URL}/ivr/followup-recorded`,
    method: 'POST',
    maxLength: 60,
    finishOnKey: '2',
    transcribe: false,
    playBeep: true
  });

  return twiml.toString();
}

// Process summary request
app.post('/ivr/process-summary', async (req, res) => {
  const callSid = req.body.CallSid;
  const recordingUrl = req.body.RecordingUrl;
  console.log(`📊 Processing summary request for call: ${callSid}`);

  const session = userSessions.get(callSid) || {};
  const fromNumber = session.fromNumber || req.body.From;

  const twiml = new VoiceResponse();

  try {
    // Transcribe the subject name
    let subjectName = 'Physics'; // Default fallback

    if (recordingUrl) {
      try {
        // Transcribe with explicit language
        const transcriptionResult = await transcribeAudio(recordingUrl, callSid, 'en-US');

        // Handle both string and object responses
        const transcribedText = typeof transcriptionResult === 'string'
          ? transcriptionResult
          : (transcriptionResult.text || transcriptionResult.transcript || '');

        console.log(`📝 Subject name transcribed: "${transcribedText}"`);

        // Extract just the subject name (remove phrases like "give me summary", "I want summary", etc.)
        subjectName = extractSubjectName(transcribedText);
        console.log(`📚 Extracted subject: "${subjectName}"`);
      } catch (error) {
        console.error('❌ Error transcribing subject:', error.message);
      }
    }

    // Fetch last 5 questions for this subject (exclude summary requests)
    console.log(`🔍 Fetching history for subject: "${subjectName}" from user: ${fromNumber}`);
    const history = await getHistoryBySubject(fromNumber, subjectName, 5);

    console.log(`📊 Found ${history.length} questions for "${subjectName}"`);
    if (history.length > 0) {
      console.log(`📋 First question: "${history[0].question.substring(0, 50)}..."`);
    }

    if (history.length === 0) {
      // Get all available subjects for this user
      const stats = await getUserStats(fromNumber);
      console.log(`📚 User's available subjects: ${stats.subjectStats.map(s => s._id).join(', ')}`);

      twiml.say(
        `You have not asked any questions about ${subjectName} yet. Please ask some questions first, then request a summary.`,
        { voice: 'Polly.Joanna', language: 'en-US' }
      );
      twiml.redirect(`${process.env.BASE_URL}/ivr/welcome`);
      res.type('text/xml');
      res.send(twiml.toString());
      return;
    }

    // Generate summary using OpenAI
    console.log(`🤖 Generating summary for ${subjectName} with ${history.length} questions...`);
    const summary = await generateSummary(subjectName, history);
    console.log(`📊 Summary generated successfully`);

    // Convert summary to speech
    const audioFileName = await textToSpeechConvert(summary, callSid);

    twiml.say(
      `Here is your learning summary for ${subjectName}, based on your last ${history.length} questions.`,
      { voice: 'Polly.Joanna', language: 'en-US' }
    );

    twiml.pause({ length: 1 });

    if (audioFileName) {
      const audioUrl = `${process.env.BASE_URL}/audio/${audioFileName}`;
      twiml.play(audioUrl);
    } else {
      twiml.say(summary, { voice: 'Polly.Joanna', language: 'en-US' });
    }

    // Offer next options
    const gather = twiml.gather({
      action: `${process.env.BASE_URL}/ivr/menu`,
      numDigits: '1',
      method: 'POST',
      timeout: 10
    });

    gather.say(
      'Press 1 to ask another question, press 4 for another summary, or press 9 to end the call.',
      { voice: 'Polly.Joanna', language: 'en-US' }
    );

  } catch (error) {
    console.error('❌ Error processing summary:', error);
    twiml.say(
      'Sorry, I encountered an error generating your summary. Please try again.',
      { voice: 'Polly.Joanna', language: 'en-US' }
    );
    twiml.redirect(`${process.env.BASE_URL}/ivr/welcome`);
  }

  res.type('text/xml');
  res.send(twiml.toString());
});

// Helper function to extract subject name from transcribed text
function extractSubjectName(text) {
  // Remove common phrases that might be in the transcription
  let cleanText = text
    .toLowerCase()
    .replace(/give me (?:the )?summary/gi, '')
    .replace(/i want (?:a )?summary/gi, '')
    .replace(/summary (?:of|on|for|about)/gi, '')
    .replace(/(?:uh|um|ah|er)/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.,!?;:]+$/g, '');  // Remove trailing punctuation

  if (!cleanText) return 'Physics';

  // Subject name mapping for common variations
  const subjectMapping = {
    'math': 'Mathematics',
    'maths': 'Mathematics',
    'mathematics': 'Mathematics',
    'physics': 'Physics',
    'chemistry': 'Chemistry',
    'organic chemistry': 'Organic Chemistry',
    'inorganic chemistry': 'Inorganic Chemistry',
    'biology': 'Biology',
    'botany': 'Botany',
    'zoology': 'Zoology',
    'human biology': 'Human Biology',
    'history': 'History',
    'world history': 'World History',
    'indian history': 'Indian History',
    'ancient history': 'Ancient History',
    'geography': 'Geography',
    'english': 'English',
    'grammar': 'Grammar',
    'literature': 'Literature',
    'composition': 'Composition',
    'computer science': 'Computer Science',
    'programming': 'Computer Science',
    'it': 'Computer Science',
    'economics': 'Economics',
    'political science': 'Political Science',
    'social studies': 'Social Studies',
    'environmental science': 'Environmental Science',
    'general science': 'General Science',
    'general knowledge': 'General Knowledge',
    'science': 'General Science'
  };

  // Normalize by checking mapping first
  const normalized = subjectMapping[cleanText];
  if (normalized) {
    console.log(`🔄 Normalized "${text}" to "${normalized}"`);
    return normalized;
  }

  // Capitalize first letter of each word if no mapping found
  const capitalized = cleanText
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  console.log(`📚 Using capitalized: "${capitalized}"`);
  return capitalized;
}

// Handle recorded follow-up details
app.post('/ivr/followup-recorded', async (req, res) => {
  const callSid = req.body.CallSid;
  const recordingUrl = req.body.RecordingUrl;
  console.log(`✅ Follow-up recording completed for call: ${callSid}`);
  console.log(`📼 Recording URL: ${recordingUrl}`);

  const session = userSessions.get(callSid) || {};
  session.lastFollowupRecordingUrl = recordingUrl;
  session.state = 'processing_followup';
  userSessions.set(callSid, session);

  // Process follow-up transcription
  processFollowupTranscription(recordingUrl, callSid).catch(err => {
    console.error(`❌ Follow-up transcription error for ${callSid}:`, err);
  });

  const twiml = new VoiceResponse();
  twiml.say(
    'Thank you. Your additional details are being processed. ' +
    'Please press 3 to hear the updated answer.',
    { voice: 'Polly.Joanna', language: 'en-US' }
  );

  const gather = twiml.gather({
    action: `${process.env.BASE_URL}/ivr/menu`,
    numDigits: '1',
    method: 'POST',
    timeout: 10
  });

  gather.say(
    'Press 3 for answer, or press 1 for new question.',
    { voice: 'Polly.Joanna', language: 'en-US', loop: 3 }
  );

  res.type('text/xml');
  res.send(twiml.toString());
});

// Return to main menu
function returnToMenu(callSid, req) {
  console.log(`🔄 Returning to main menu for call: ${callSid}`);
  const twiml = new VoiceResponse();
  twiml.redirect(`${process.env.BASE_URL}/ivr/welcome`);
  return twiml.toString();
}

// End call
function endCall(callSid, req) {
  const twiml = new VoiceResponse();
  twiml.say(
    'Thank you for using Vidya Vani. Goodbye!',
    { voice: 'Polly.Joanna', language: 'en-US' }
  );
  twiml.hangup();

  // Broadcast call ended (non-blocking)
  try {
    const session = userSessions.get(callSid) || {};
    const duration = session.startTime ? Math.floor((Date.now() - session.startTime) / 1000) : 0;
    broadcastCallEnded(callSid, duration);
  } catch (error) {
    // Silent fail
  }

  // Clean up session
  userSessions.delete(callSid);

  return twiml.toString();
}

// Redirect to welcome
function redirectWelcome() {
  const twiml = new VoiceResponse();
  twiml.say(
    'Invalid option. Returning to the main menu.',
    { voice: 'Polly.Joanna', language: 'en-US' }
  );
  twiml.redirect(`${process.env.BASE_URL}/ivr/welcome`);
  return twiml.toString();
}

// ========================================
// REST API Endpoints for Frontend
// ========================================

/**
 * GET /api/history - Get all call history with optional filters
 * Query params: phoneNumber, subject, limit, skip
 */
app.get('/api/history', async (req, res) => {
  try {
    const { phoneNumber, subject, limit, skip } = req.query;
    const options = {
      phoneNumber,
      subject,
      limit: limit ? parseInt(limit) : 50,
      skip: skip ? parseInt(skip) : 0
    };

    const history = await getAllHistory(options);

    res.json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch history'
    });
  }
});

/**
 * GET /api/history/:phoneNumber - Get history for specific user
 */
app.get('/api/history/:phoneNumber', async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const { limit } = req.query;

    const history = await getAllHistory({
      phoneNumber,
      limit: limit ? parseInt(limit) : 50
    });

    res.json({
      success: true,
      phoneNumber,
      count: history.length,
      data: history
    });
  } catch (error) {
    console.error('Error fetching user history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user history'
    });
  }
});

/**
 * GET /api/stats - Get aggregate statistics
 * Query params: phoneNumber (optional)
 */
app.get('/api/stats', async (req, res) => {
  try {
    const { phoneNumber } = req.query;

    if (phoneNumber) {
      // Get stats for specific user
      const stats = await getUserStats(phoneNumber);
      res.json({
        success: true,
        phoneNumber,
        ...stats
      });
    } else {
      // Get overall stats (all users)
      const allHistory = await getAllHistory({ limit: 1000 });
      const totalCalls = allHistory.length;
      const uniqueUsers = [...new Set(allHistory.map(h => h.user_id))].length;
      const subjectCounts = {};

      allHistory.forEach(h => {
        subjectCounts[h.subject] = (subjectCounts[h.subject] || 0) + 1;
      });

      res.json({
        success: true,
        totalCalls,
        uniqueUsers,
        subjectCounts
      });
    }
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats'
    });
  }
});

/**
 * GET /api/calls/active - Get active call sessions
 */
app.get('/api/calls/active', (req, res) => {
  try {
    const activeCalls = [];

    userSessions.forEach((session, callSid) => {
      activeCalls.push({
        callSid,
        fromNumber: session.fromNumber,
        state: session.state,
        language: session.detectedLanguageCode || session.language,
        currentQuestion: session.currentQuestion,
        questionCount: session.questions?.length || 0
      });
    });

    res.json({
      success: true,
      count: activeCalls.length,
      data: activeCalls
    });
  } catch (error) {
    console.error('Error fetching active calls:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active calls'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      openai: isOpenAIInitialized(),
      mongodb: isConnected()
    }
  });
});

// ========================================
// Analytics & Status API
// ========================================

/**
 * GET /api/status - System status for dashboard
 */
app.get('/api/status', async (req, res) => {
  try {
    const activeCalls = [];
    userSessions.forEach((session, callSid) => activeCalls.push(session));

    // Get today's call count from MongoDB
    const allHistory = await getAllHistory({ limit: 10000 });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const callsToday = allHistory.filter(h => new Date(h.timestamp) >= today).length;

    res.json({
      success: true,
      backend: isConnected() ? 'Online' : 'Degraded',
      websocket: 'Connected',
      activeSessions: activeCalls.length,
      callsToday,
      mongodb: isConnected(),
      openai: isOpenAIInitialized()
    });
  } catch (error) {
    res.json({
      success: true,
      backend: 'Online',
      websocket: 'Connected',
      activeSessions: userSessions.size,
      callsToday: 0,
      mongodb: isConnected(),
      openai: isOpenAIInitialized()
    });
  }
});

/**
 * GET /api/analytics/summary - Aggregate stats for Analytics page stat cards
 */
app.get('/api/analytics/summary', async (req, res) => {
  try {
    const allHistory = await getAllHistory({ limit: 50000 });
    const now = new Date();

    // This week (Mon-Sun)
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const thisWeek = allHistory.filter(h => new Date(h.timestamp) >= weekStart);
    const lastWeek = allHistory.filter(h => {
      const t = new Date(h.timestamp);
      return t >= lastWeekStart && t < weekStart;
    });

    const totalCallsThisWeek = thisWeek.length;
    const totalCallsLastWeek = lastWeek.length;
    const callsTrend = totalCallsLastWeek > 0
      ? (((totalCallsThisWeek - totalCallsLastWeek) / totalCallsLastWeek) * 100).toFixed(1)
      : '0';

    const uniqueStudentsThisWeek = [...new Set(thisWeek.map(h => h.user_id))].length;
    const uniqueStudentsLastWeek = [...new Set(lastWeek.map(h => h.user_id))].length;
    const studentsTrend = uniqueStudentsLastWeek > 0
      ? (((uniqueStudentsThisWeek - uniqueStudentsLastWeek) / uniqueStudentsLastWeek) * 100).toFixed(1)
      : '0';

    // Avg questions per session (approximate by grouping by user per day)
    const avgQuestionsPerUser = uniqueStudentsThisWeek > 0
      ? (totalCallsThisWeek / uniqueStudentsThisWeek).toFixed(1)
      : '0';

    res.json({
      success: true,
      totalCalls: totalCallsThisWeek,
      callsTrend: `${totalCallsThisWeek >= totalCallsLastWeek ? '+' : ''}${callsTrend}%`,
      uniqueStudents: uniqueStudentsThisWeek,
      studentsTrend: `${uniqueStudentsThisWeek >= uniqueStudentsLastWeek ? '+' : ''}${studentsTrend}%`,
      avgQuestionsPerUser,
      totalAllTime: allHistory.length
    });
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch analytics summary' });
  }
});

/**
 * GET /api/analytics/call-volume - Daily call volume for the week
 */
app.get('/api/analytics/call-volume', async (req, res) => {
  try {
    const allHistory = await getAllHistory({ limit: 50000 });
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();

    // Last 7 days
    const volumeByDay = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dayName = days[d.getDay()];
      const dateKey = d.toISOString().split('T')[0];
      volumeByDay[dateKey] = { day: dayName, calls: 0, missed: 0 };
    }

    allHistory.forEach(h => {
      const dateKey = new Date(h.timestamp).toISOString().split('T')[0];
      if (volumeByDay[dateKey]) {
        volumeByDay[dateKey].calls++;
      }
    });

    res.json({
      success: true,
      data: Object.values(volumeByDay)
    });
  } catch (error) {
    console.error('Error fetching call volume:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch call volume' });
  }
});

/**
 * GET /api/analytics/subjects - Subject distribution
 */
app.get('/api/analytics/subjects', async (req, res) => {
  try {
    const allHistory = await getAllHistory({ limit: 50000 });
    const subjectCounts = {};

    allHistory.forEach(h => {
      const subject = h.subject || 'Unknown';
      subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;
    });

    // Convert to array sorted by count
    const data = Object.entries(subjectCounts)
      .map(([name, value]) => ({ name, value, subject: name, calls: value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 subjects

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch subjects' });
  }
});

/**
 * GET /api/analytics/performance - Hourly performance data for today
 */
app.get('/api/analytics/performance', async (req, res) => {
  try {
    const allHistory = await getAllHistory({ limit: 50000 });
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayHistory = allHistory.filter(h => new Date(h.timestamp) >= today);

    // Group by hour
    const hourlyData = {};
    for (let hour = 0; hour <= 23; hour++) {
      const timeLabel = `${hour.toString().padStart(2, '0')}:00`;
      hourlyData[hour] = { time: timeLabel, calls: 0, latency: 0 };
    }

    todayHistory.forEach(h => {
      const hour = new Date(h.timestamp).getHours();
      if (hourlyData[hour]) {
        hourlyData[hour].calls++;
      }
    });

    // Filter to hours that have passed + current hour
    const currentHour = new Date().getHours();
    const data = Object.values(hourlyData).filter((_, i) => i <= currentHour);

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching performance:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch performance' });
  }
});

// ========================================
// Exotel Integration
// ========================================

/**
 * GET /exotel/test - Test endpoint to verify server is reachable
 */
app.get('/exotel/test', (req, res) => {
  console.log('✅ Test endpoint hit - Server is reachable!');
  res.send('Exotel webhook endpoint is working! Server time: ' + new Date().toISOString());
});

/**
 * GET/POST /exotel/incoming - Exotel missed call webhook
 * Triggers Twilio outbound call to the caller's number
 * Accepts both GET and POST methods (Exotel may use either)
 */
const handleExotelWebhook = async (req, res) => {
  console.log('\n========================================');
  console.log('🔔 EXOTEL WEBHOOK RECEIVED');
  console.log(`📡 Method: ${req.method}`);
  console.log('========================================');

  // Exotel may send data via query params (GET) or body (POST)
  const params = req.method === 'GET' ? req.query : req.body;
  console.log('📦 Full params:', JSON.stringify(params, null, 2));

  const fromNumber = params.From || params.from || params.CallFrom;
  console.log(`📞 Caller Number (From): ${fromNumber}`);

  if (!fromNumber) {
    console.error('❌ ERROR: Missing From parameter in Exotel webhook');
    console.error('📦 Available parameters:', Object.keys(params));
    return res.status(400).send('Missing From parameter');
  }

  // Normalize phone number to E.164 format for Twilio
  // Remove leading 0 and add +91 country code for Indian numbers
  let normalizedNumber = fromNumber;
  if (fromNumber.startsWith('0')) {
    normalizedNumber = '+91' + fromNumber.substring(1);
    console.log(`📱 Normalized number: ${fromNumber} → ${normalizedNumber}`);
  } else if (!fromNumber.startsWith('+')) {
    normalizedNumber = '+91' + fromNumber;
    console.log(`📱 Added country code: ${fromNumber} → ${normalizedNumber}`);
  }

  // Initialize Twilio client
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || '+18588082832';

  console.log('\n🔧 Twilio Configuration:');
  console.log(`   From Number: ${twilioPhoneNumber}`);
  console.log(`   To Number: ${normalizedNumber}`);
  console.log(`   Webhook URL: ${process.env.BASE_URL}/ivr/welcome`);
  console.log(`   Account SID: ${accountSid ? accountSid.substring(0, 10) + '...' : 'MISSING'}`);

  const twilio = require('twilio');
  const client = twilio(accountSid, authToken);

  try {
    console.log('\n⏳ Initiating Twilio outbound call...');

    // Trigger Twilio outbound call
    const call = await client.calls.create({
      from: twilioPhoneNumber,
      to: normalizedNumber,  // Normalized E.164 format number
      url: `${process.env.BASE_URL}/ivr/welcome`
    });

    console.log('\n✅ SUCCESS: Twilio call initiated!');
    console.log(`   Call SID: ${call.sid}`);
    console.log(`   Status: ${call.status}`);
    console.log(`   From: ${call.from}`);
    console.log(`   To: ${call.to}`);
    console.log(`   Direction: ${call.direction}`);
    console.log('========================================\n');

    res.status(200).send('OK');
  } catch (error) {
    console.error('\n❌ FAILED: Error creating Twilio call');
    console.error(`   Error Message: ${error.message}`);
    console.error(`   Error Code: ${error.code || 'N/A'}`);
    console.error(`   Error Details: ${JSON.stringify(error, null, 2)}`);
    console.log('========================================\n');

    res.status(500).send('Error initiating call');
  }
};

// Register both GET and POST routes
app.get('/exotel/incoming', handleExotelWebhook);
app.post('/exotel/incoming', handleExotelWebhook);

// ========================================
// Error Handler
// ========================================
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  const twiml = new VoiceResponse();
  twiml.say('Sorry, there was a server error. Please try again.', { voice: 'Polly.Joanna', language: 'en-US' });
  res.type('text/xml');
  res.send(twiml.toString());
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  closeWebSocket();
  await closeConnection();
  process.exit(0);
});

// Start server
async function startServer() {
  await initializeServices();

  server.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`🔌 WebSocket available at ws://localhost:${PORT}/ws`);
    console.log(`📞 Twilio webhook URL: ${process.env.BASE_URL || `http://localhost:${PORT}`}/ivr/welcome`);
  });
}

startServer();
