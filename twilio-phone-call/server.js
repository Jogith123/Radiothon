const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const VoiceResponse = require('twilio').twiml.VoiceResponse;

// Import modular services
const { connectToMongoDB, closeConnection, isConnected } = require('./database/connection');
const { initializeOpenAI, isInitialized: isOpenAIInitialized, generateAnswer, generateSummary } = require('./services/openaiService');
const aiProviderService = require('./services/aiProviderService');
const { initializeTTS, initializeSTT, textToSpeechConvert, transcribeAudio } = require('./services/speechService');
const { storeQuestionAndAnswer, getHistoryBySubject, getUserStats, getAllHistory } = require('./services/historyService');
const { initializeTranslation, detectLanguage, translateText, isTranslationAvailable } = require('./services/translationService');
const { initializeWebSocket, broadcastCallStarted, broadcastQuestionTranscribed, broadcastAnswerGenerated, broadcastQASaved, broadcastCallEnded, broadcastPipelineStage, closeWebSocket } = require('./services/websocketService');
const { getLanguageByDigit, getPrompt, getVoiceConfig, PROMPTS } = require('./config/languageConfig');

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

  // Initialize AI Provider (auto-detects Gemini or OpenAI)
  await aiProviderService.initializeAIProvider();
  console.log(`✅ Active AI Provider: ${aiProviderService.getActiveProvider()}`);

  // Initialize Google TTS (optional - falls back to Twilio)
  initializeTTS();

  // Initialize Google STT (optional - falls back to Twilio)
  initializeSTT();

  // Initialize Google Translation (optional)
  initializeTranslation();

  // Initialize MongoDB
  await connectToMongoDB();

  // Initialize RAG embedding model for vector search
  const { initializeEmbeddings } = require('./services/ragService');
  initializeEmbeddings();

  // Initialize WebSocket on shared HTTP server (same port, path /ws)
  initializeWebSocket(server);

  console.log('\n✅ All services initialized\n');
}

/**
 * Helper function to add multilingual prompt to TwiML
 * For Telugu and Tamil: uses pre-generated audio files
 * For English and Hindi: uses Polly TTS
 */
function addMultilingualPrompt(twimlObject, promptKey, langCode, options = {}) {
  const audioFileMap = {
    'welcome': langCode === 'te-IN' ? 'welcome_telugu' : 'welcome_tamil',
    'mainMenu': langCode === 'te-IN' ? 'menu_telugu' : 'menu_tamil',
    'askQuestion': langCode === 'te-IN' ? 'ask_question_telugu' : 'ask_question_tamil',
    'recordingStopped': langCode === 'te-IN' ? 'recording_stopped_telugu' : 'recording_stopped_tamil',
    'questionRecorded': langCode === 'te-IN' ? 'question_recorded_telugu' : 'question_recorded_tamil',
    'questionRecordedOptions': langCode === 'te-IN' ? 'question_recorded_options_telugu' : 'question_recorded_options_tamil',
    'processingQuestion': langCode === 'te-IN' ? 'processing_telugu' : 'processing_tamil',
    'afterAnswer': langCode === 'te-IN' ? 'after_answer_telugu' : 'after_answer_tamil',
    'noQuestion': langCode === 'te-IN' ? 'no_question_telugu' : 'no_question_tamil',
    'stillProcessing': langCode === 'te-IN' ? 'still_processing_telugu' : 'still_processing_tamil',
    'summaryRequest': langCode === 'te-IN' ? 'summary_request_telugu' : 'summary_request_tamil',
    'followUpPrompt': langCode === 'te-IN' ? 'followup_prompt_telugu' : 'followup_prompt_tamil',
    'followUpRecorded': langCode === 'te-IN' ? 'followup_recorded_telugu' : 'followup_recorded_tamil',
    'noPreviousQuestion': langCode === 'te-IN' ? 'no_previous_telugu' : 'no_previous_tamil',
    'goodbye': langCode === 'te-IN' ? 'goodbye_telugu' : 'goodbye_tamil',
    'invalidOption': langCode === 'te-IN' ? 'invalid_option_telugu' : 'invalid_option_tamil',
    'aiServiceError': langCode === 'te-IN' ? 'ai_error_telugu' : 'ai_error_tamil',
    'databaseError': langCode === 'te-IN' ? 'db_error_telugu' : 'db_error_tamil',
    'generalError': langCode === 'te-IN' ? 'general_error_telugu' : 'general_error_tamil',
    'chapterExplainPrompt': langCode === 'te-IN' ? 'chapter_explain_telugu' : 'chapter_explain_tamil',
    'chapterProcessing': langCode === 'te-IN' ? 'chapter_processing_telugu' : 'chapter_processing_tamil',
    'chapterRecorded': langCode === 'te-IN' ? 'chapter_recorded_telugu' : 'chapter_recorded_tamil',
    'noDocumentsUploaded': langCode === 'te-IN' ? 'no_documents_telugu' : 'no_documents_tamil',
    'pausedExplanation': langCode === 'te-IN' ? 'paused_explanation_telugu' : 'paused_explanation_tamil',
    'continueExplanation': langCode === 'te-IN' ? 'continue_explanation_telugu' : 'continue_explanation_tamil',
    'afterChapterExplain': langCode === 'te-IN' ? 'after_chapter_telugu' : 'after_chapter_tamil'
  };

  if (langCode === 'te-IN' || langCode === 'ta-IN') {
    const audioFile = audioFileMap[promptKey];
    if (audioFile) {
      twimlObject.play(`${process.env.BASE_URL}/audio/${audioFile}.mp3`);
    } else {
      const prompt = getPrompt(promptKey, 'en-US');
      twimlObject.say(prompt, { voice: 'Polly.Joanna', language: 'en-US', ...options });
    }
  } else {
    const prompt = getPrompt(promptKey, langCode);
    const voiceConfig = getVoiceConfig(langCode);
    twimlObject.say(prompt, { ...voiceConfig, ...options });
  }
}

// Store user sessions (in production, use Redis or database)
const userSessions = new Map();

// ============================================
// IVR ENDPOINTS
// ============================================

// Welcome endpoint - Entry point for incoming calls (Language Selection)
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
    state: 'language_selection',
    fromNumber: fromNumber,
    language: 'en-US',  // Default to English for speech recognition
    selectedLanguage: null,  // Will be set after language selection
    startTime: Date.now() // Track call start time for duration
  });

  const twiml = new VoiceResponse();
  const gather = twiml.gather({
    action: `${process.env.BASE_URL}/ivr/language-selected`,
    numDigits: '1',
    method: 'POST',
    timeout: 10
  });

  // Play pre-generated language selection audio files
  const languageAudioFiles = [
    'lang_select_english.mp3',
    'lang_select_hindi.mp3',
    'lang_select_telugu.mp3',
    'lang_select_tamil.mp3'
  ];

  languageAudioFiles.forEach(audioFile => {
    gather.play(`${process.env.BASE_URL}/audio/${audioFile}`);
  });

  // If no input, repeat language selection
  twiml.redirect(`${process.env.BASE_URL}/ivr/welcome`);

  res.type('text/xml');
  res.send(twiml.toString());
});

// Language selection handler
app.post('/ivr/language-selected', (req, res) => {
  const digit = req.body.Digits;
  const callSid = req.body.CallSid;
  console.log(`🌐 Language selected: ${digit} (Call: ${callSid})`);

  const twiml = new VoiceResponse();
  const selectedLang = getLanguageByDigit(digit);

  if (selectedLang) {
    // Store language preference in session
    const session = userSessions.get(callSid) || {};
    session.selectedLanguage = selectedLang.code;
    session.state = 'language_confirmed';
    userSessions.set(callSid, session);

    console.log(`✅ Language set to: ${selectedLang.name} (${selectedLang.code})`);

    // Welcome message in selected language
    addMultilingualPrompt(twiml, 'welcome', selectedLang.code);

    // Redirect to main menu
    twiml.redirect(`${process.env.BASE_URL}/ivr/menu?lang=${digit}`);
  } else {
    // Invalid selection
    console.log(`⚠️  Invalid language selection: ${digit}`);
    addMultilingualPrompt(twiml, 'invalidLanguage', 'en-US');
    twiml.redirect(`${process.env.BASE_URL}/ivr/welcome`);
  }

  res.type('text/xml');
  res.send(twiml.toString());
});

// Main menu handler
app.post('/ivr/menu', async (req, res) => {
  const digit = req.body.Digits;
  const callSid = req.body.CallSid;
  const langDigit = req.query.lang || req.body.lang;

  console.log(`🔢 User pressed: ${digit} (Call: ${callSid})`);

  // Get session and language
  const session = userSessions.get(callSid) || {};
  const selectedLangCode = session.selectedLanguage || 'en-US';

  // If this is first time showing menu (no digit pressed yet), show the menu
  if (!digit) {
    const twiml = new VoiceResponse();
    const gather = twiml.gather({
      action: `${process.env.BASE_URL}/ivr/menu`,
      numDigits: '1',
      method: 'POST',
      timeout: 10
    });

    // For Telugu and Tamil, use pre-generated audio files (Polly doesn't support them)
    // For English and Hindi, use Polly say verb
    if (selectedLangCode === 'te-IN') {
      gather.play(`${process.env.BASE_URL}/audio/menu_telugu.mp3`);
    } else if (selectedLangCode === 'ta-IN') {
      gather.play(`${process.env.BASE_URL}/audio/menu_tamil.mp3`);
    } else {
      const menuPrompt = getPrompt('mainMenu', selectedLangCode);
      const voiceConfig = getVoiceConfig(selectedLangCode);
      gather.say(menuPrompt, { ...voiceConfig, loop: 2 });
    }

    res.type('text/xml');
    res.send(twiml.toString());
    return;
  }

  const optionActions = {
    '1': askQuestion,
    '2': stopRecording,
    '3': getAnswer,
    '4': getSummary,
    '5': returnToMenu,
    '6': followUpQuestion,
    '7': chapterExplain,
    '8': pauseExplanation,
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
      res.send(redirectWelcome(callSid));
    }
  } else {
    console.log(`⚠️  Invalid option: ${digit}`);
    res.type('text/xml');
    res.send(redirectWelcome(callSid));
  }
});

// Ask question flow
async function askQuestion(callSid, req) {
  console.log(`🎤 Starting recording for call: ${callSid}`);
  const session = userSessions.get(callSid) || {};
  session.state = 'recording_question';
  userSessions.set(callSid, session);

  const twiml = new VoiceResponse();
  const selectedLangCode = session.selectedLanguage || 'en-US';

  addMultilingualPrompt(twiml, 'askQuestion', selectedLangCode);

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
  const session = userSessions.get(callSid) || {};
  const selectedLangCode = session.selectedLanguage || 'en-US';

  const twiml = new VoiceResponse();

  addMultilingualPrompt(twiml, 'recordingStopped', selectedLangCode);

  const gather = twiml.gather({
    action: `${process.env.BASE_URL}/ivr/menu`,
    numDigits: '1',
    method: 'POST',
    timeout: 10
  });

  addMultilingualPrompt(gather, 'afterAnswer', selectedLangCode, { loop: 3 });

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

  const selectedLangCode = session.selectedLanguage || 'en-US';

  const twiml = new VoiceResponse();
  addMultilingualPrompt(twiml, 'questionRecorded', selectedLangCode);

  const gather = twiml.gather({
    action: `${process.env.BASE_URL}/ivr/menu`,
    numDigits: '1',
    method: 'POST',
    timeout: 10
  });

  addMultilingualPrompt(gather, 'questionRecordedOptions', selectedLangCode, { loop: 3 });

  res.type('text/xml');
  res.send(twiml.toString());
});

// Process transcription asynchronously with translation support
async function processTranscription(recordingUrl, callSid) {
  try {
    const session = userSessions.get(callSid) || {};

    // Get user's preferred language (default to English)
    const userLanguage = session.selectedLanguage || 'en-US';

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
    const userLanguage = session.selectedLanguage || 'en-US';

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
  const selectedLangCode = session.selectedLanguage || 'en-US';
  const voiceConfig = getVoiceConfig(selectedLangCode);

  // Check if transcription is still processing
  if (session.state === 'processing_transcription') {
    console.log(`⏳ Transcription still processing for call: ${callSid}`);
    addMultilingualPrompt(twiml, 'stillProcessing', selectedLangCode);
    twiml.redirect(`${process.env.BASE_URL}/ivr/welcome`);
    return twiml.toString();
  }

  if (!question) {
    console.log(`⚠️  No question found for call: ${callSid}`);
    addMultilingualPrompt(twiml, 'noQuestion', selectedLangCode);
    twiml.redirect(`${process.env.BASE_URL}/ivr/welcome`);
    return twiml.toString();
  }

  try {
    // Check if any AI provider is available
    if (!aiProviderService.isAnyProviderInitialized()) {
      addMultilingualPrompt(twiml, 'aiServiceError', selectedLangCode);
      twiml.redirect(`${process.env.BASE_URL}/ivr/welcome`);
      return twiml.toString();
    }

    // Get answer from AI provider (in English)
    let answer = '';

    // Get the question from session
    // const question = session.currentQuestion; // This line is already present above, no need to duplicate.

    twiml.say(
      getPrompt('processingQuestion', selectedLangCode),
      voiceConfig
    );

    console.log(`🤖 Sending to AI (${aiProviderService.getActiveProvider()}): ${question}`);
    const answerEnglish = await aiProviderService.generateAnswer(question);

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
      getPrompt('afterAnswer', selectedLangCode),
      voiceConfig
    );

  } catch (error) {
    console.error('Error getting answer from AI:', error);
    addMultilingualPrompt(twiml, 'generalError', selectedLangCode);
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
  const selectedLangCode = session.selectedLanguage || 'en-US';
  const voiceConfig = getVoiceConfig(selectedLangCode);

  try {
    // Check if MongoDB is available
    if (!isConnected()) {
      addMultilingualPrompt(twiml, 'databaseError', selectedLangCode);
      twiml.redirect(`${process.env.BASE_URL}/ivr/welcome`);
      return twiml.toString();
    }

    // Check if any AI provider is available
    if (!aiProviderService.isAnyProviderInitialized()) {
      addMultilingualPrompt(twiml, 'aiServiceError', selectedLangCode);
      twiml.redirect(`${process.env.BASE_URL}/ivr/welcome`);
      return twiml.toString();
    }

    // Ask user for subject
    twiml.say(
      getPrompt('summaryRequest', selectedLangCode),
      voiceConfig
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
    addMultilingualPrompt(twiml, 'generalError', selectedLangCode);
    twiml.redirect(`${process.env.BASE_URL}/ivr/welcome`);
  }

  return twiml.toString();
}

// Follow-up question flow - add more details to last question
async function followUpQuestion(callSid, req) {
  console.log(`🔄 Follow-up question for call: ${callSid}`);
  const session = userSessions.get(callSid) || {};
  const selectedLangCode = session.selectedLanguage || 'en-US';
  const voiceConfig = getVoiceConfig(selectedLangCode);

  const twiml = new VoiceResponse();

  // Check if there's a previous question
  if (!session.currentQuestion) {
    console.log(`⚠️  No previous question found for call: ${callSid}`);
    addMultilingualPrompt(twiml, 'noPreviousQuestion', selectedLangCode);
    twiml.redirect(`${process.env.BASE_URL}/ivr/welcome`);
    return twiml.toString();
  }

  console.log(`📝 Previous question: "${session.currentQuestion}"`);

  // Store the original question before follow-up
  session.originalQuestionBeforeFollowup = session.currentQuestion;
  userSessions.set(callSid, session);

  twiml.say(
    getPrompt('followUpPrompt', selectedLangCode),
    voiceConfig
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
  const selectedLangCode = session.selectedLanguage || 'en-US';
  const voiceConfig = getVoiceConfig(selectedLangCode);

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
        getPrompt('noSummary', selectedLangCode, { subject: subjectName }),
        voiceConfig
      );
      twiml.redirect(`${process.env.BASE_URL}/ivr/welcome`);
      res.type('text/xml');
      res.send(twiml.toString());
      return;
    }

    // Generate summary using AI provider
    console.log(`🤖 Generating summary for ${subjectName} with ${history.length} questions...`);
    const summary = await aiProviderService.generateSummary(subjectName, history);
    console.log(`📊 Summary generated successfully`);

    // Convert summary to speech
    const audioFileName = await textToSpeechConvert(summary, callSid);

    twiml.say(
      getPrompt('summaryIntro', selectedLangCode, { subject: subjectName, count: history.length }),
      voiceConfig
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
      getPrompt('afterSummary', selectedLangCode),
      voiceConfig
    );

  } catch (error) {
    console.error('❌ Error processing summary:', error);
    addMultilingualPrompt(twiml, 'generalError', selectedLangCode);
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
  const selectedLangCode = session.selectedLanguage || 'en-US';
  const voiceConfig = getVoiceConfig(selectedLangCode);

  addMultilingualPrompt(twiml, 'followUpRecorded', selectedLangCode);

  const gather = twiml.gather({
    action: `${process.env.BASE_URL}/ivr/menu`,
    numDigits: '1',
    method: 'POST',
    timeout: 10
  });

  addMultilingualPrompt(gather, 'questionRecordedOptions', selectedLangCode, { loop: 3 });

  res.type('text/xml');
  res.send(twiml.toString());
});

// ============================================
// CHAPTER EXPLAIN FLOW (Option 7)
// ============================================

// Chapter explain - user says which chapter to explain
async function chapterExplain(callSid, req) {
  console.log(`📖 Chapter explain requested for call: ${callSid}`);
  const session = userSessions.get(callSid) || {};
  const selectedLangCode = session.selectedLanguage || 'en-US';
  const voiceConfig = getVoiceConfig(selectedLangCode);

  const twiml = new VoiceResponse();

  // Check if there's a paused explanation to continue
  if (session.pausedExplanationAudio) {
    console.log(`▶️ Resuming paused explanation for call: ${callSid}`);
    addMultilingualPrompt(twiml, 'continueExplanation', selectedLangCode);

    // Play the stored explanation audio with gather for pause (press 8)
    const gather = twiml.gather({
      action: `${process.env.BASE_URL}/ivr/menu`,
      numDigits: '1',
      method: 'POST',
      input: 'dtmf'
    });

    const audioUrl = session.pausedExplanationAudio;
    gather.play(audioUrl);

    // After audio finishes, offer options
    const gather2 = twiml.gather({
      action: `${process.env.BASE_URL}/ivr/menu`,
      numDigits: '1',
      method: 'POST',
      timeout: 10
    });
    addMultilingualPrompt(gather2, 'afterChapterExplain', selectedLangCode, { loop: 2 });

    // Clear the paused state
    session.pausedExplanationAudio = null;
    userSessions.set(callSid, session);

    return twiml.toString();
  }

  // Check if RAG documents exist
  try {
    const { getLibrary } = require('./services/ragService');
    const library = await getLibrary();

    if (!library.documents || library.documents.length === 0) {
      addMultilingualPrompt(twiml, 'noDocumentsUploaded', selectedLangCode);
      twiml.redirect(`${process.env.BASE_URL}/ivr/welcome`);
      return twiml.toString();
    }
  } catch (error) {
    console.error('Error checking documents:', error);
    addMultilingualPrompt(twiml, 'databaseError', selectedLangCode);
    twiml.redirect(`${process.env.BASE_URL}/ivr/welcome`);
    return twiml.toString();
  }

  // Prompt user to say which chapter they want explained
  addMultilingualPrompt(twiml, 'chapterExplainPrompt', selectedLangCode);

  twiml.record({
    action: `${process.env.BASE_URL}/ivr/chapter-recorded`,
    method: 'POST',
    maxLength: 30,
    finishOnKey: '3',
    transcribe: false,
    playBeep: true
  });

  return twiml.toString();
}

// Handle chapter recording - transcribe and process
app.post('/ivr/chapter-recorded', async (req, res) => {
  const callSid = req.body.CallSid;
  const recordingUrl = req.body.RecordingUrl;
  console.log(`📖 Chapter request recorded for call: ${callSid}`);

  const session = userSessions.get(callSid) || {};
  const selectedLangCode = session.selectedLanguage || 'en-US';
  const voiceConfig = getVoiceConfig(selectedLangCode);

  const twiml = new VoiceResponse();

  try {
    // Transcribe what chapter the user wants
    let chapterRequest = '';
    if (recordingUrl) {
      const transcriptionResult = await transcribeAudio(recordingUrl, callSid, selectedLangCode);
      chapterRequest = typeof transcriptionResult === 'string'
        ? transcriptionResult
        : (transcriptionResult.text || transcriptionResult.transcript || '');
      console.log(`📝 Chapter request transcribed: "${chapterRequest}"`);
    }

    if (!chapterRequest) {
      addMultilingualPrompt(twiml, 'noQuestion', selectedLangCode);
      twiml.redirect(`${process.env.BASE_URL}/ivr/welcome`);
      res.type('text/xml');
      res.send(twiml.toString());
      return;
    }

    // Translate to English if needed
    const langCode = selectedLangCode.split('-')[0];
    let chapterRequestEnglish = chapterRequest;
    if (langCode !== 'en') {
      console.log(`🌐 Translating chapter request ${langCode} → English...`);
      chapterRequestEnglish = await translateText(chapterRequest, 'en', langCode);
      console.log(`📝 Translated: "${chapterRequestEnglish}"`);
    }

    // Check if RAG documents exist
    const { getLibrary, vectorSearch } = require('./services/ragService');
    const library = await getLibrary();

    if (!library.documents || library.documents.length === 0) {
      addMultilingualPrompt(twiml, 'noDocumentsUploaded', selectedLangCode);
      twiml.redirect(`${process.env.BASE_URL}/ivr/welcome`);
      res.type('text/xml');
      res.send(twiml.toString());
      return;
    }

    // Say processing
    twiml.say(
      getPrompt('chapterProcessing', selectedLangCode),
      voiceConfig
    );

    // Use vector search to find relevant chunks (instead of sending full document)
    const searchResults = await vectorSearch(chapterRequestEnglish, 15, 0.2);

    let relevantContent = '';
    let mainFileName = '';

    if (searchResults.results.length > 0) {
      // Build context from relevant chunks only
      for (const chunk of searchResults.results) {
        relevantContent += `\n\n[${chunk.fileName} - ${chunk.chapterTitle}]:\n${chunk.content}`;
        if (!mainFileName) mainFileName = chunk.fileName;
      }
      console.log(`📚 Vector search found ${searchResults.results.length} relevant chunks (${relevantContent.length} chars) from ${searchResults.totalChunksSearched} total chunks`);
    } else {
      // Fallback: if vector search finds nothing, try text search
      console.log('⚠️ Vector search returned no results, trying text search fallback...');
      const { searchDocuments } = require('./services/ragService');
      const textResults = await searchDocuments(chapterRequestEnglish, 10, 0.1);
      for (const chunk of textResults.results) {
        relevantContent += `\n\n[${chunk.fileName} - ${chunk.chapterTitle}]:\n${chunk.content}`;
        if (!mainFileName) mainFileName = chunk.fileName;
      }
      console.log(`📚 Text search fallback found ${textResults.results.length} chunks (${relevantContent.length} chars)`);
    }

    if (!relevantContent) {
      addMultilingualPrompt(twiml, 'noDocumentsUploaded', selectedLangCode);
      twiml.redirect(`${process.env.BASE_URL}/ivr/welcome`);
      res.type('text/xml');
      res.send(twiml.toString());
      return;
    }

    // Send only relevant chunks to LLM for chapter explanation
    const explanation = await aiProviderService.explainChapter(chapterRequestEnglish, relevantContent, mainFileName);
    console.log(`📖 Chapter explanation generated (${explanation.length} chars)`);

    // Translate explanation back if needed
    let explanationInUserLang = explanation;
    if (langCode !== 'en') {
      console.log(`🌐 Translating explanation → ${langCode}...`);
      explanationInUserLang = await translateText(explanation, langCode, 'en');
    }

    // Convert to speech
    const audioFileName = await textToSpeechConvert(
      explanationInUserLang,
      callSid,
      selectedLangCode
    );

    if (audioFileName) {
      const audioUrl = `${process.env.BASE_URL}/audio/${audioFileName}`;
      console.log(`▶️ Playing chapter explanation: ${audioUrl}`);

      // Store audio URL in session for pause/resume
      session.pausedExplanationAudio = audioUrl;
      session.lastChapterExplanation = explanation;
      userSessions.set(callSid, session);

      // Play with gather so user can press 8 to pause
      const gather = twiml.gather({
        action: `${process.env.BASE_URL}/ivr/menu`,
        numDigits: '1',
        method: 'POST',
        input: 'dtmf'
      });
      gather.play(audioUrl);
    } else {
      // Fallback to Twilio TTS
      const gather = twiml.gather({
        action: `${process.env.BASE_URL}/ivr/menu`,
        numDigits: '1',
        method: 'POST',
        input: 'dtmf'
      });
      gather.say(explanation, { voice: 'Polly.Joanna', language: 'en-US' });
    }

    // After explanation, offer options
    const gather2 = twiml.gather({
      action: `${process.env.BASE_URL}/ivr/menu`,
      numDigits: '1',
      method: 'POST',
      timeout: 10
    });
    addMultilingualPrompt(gather2, 'afterChapterExplain', selectedLangCode, { loop: 2 });

  } catch (error) {
    console.error('❌ Error processing chapter request:', error);
    addMultilingualPrompt(twiml, 'generalError', selectedLangCode);
    twiml.redirect(`${process.env.BASE_URL}/ivr/welcome`);
  }

  res.type('text/xml');
  res.send(twiml.toString());
});

// Pause explanation (Option 8) - stops audio playback, lets user take notes
function pauseExplanation(callSid, req) {
  console.log(`⏸️ Pausing explanation for call: ${callSid}`);
  const session = userSessions.get(callSid) || {};
  const selectedLangCode = session.selectedLanguage || 'en-US';

  const twiml = new VoiceResponse();

  // Tell user it's paused and they can take notes
  addMultilingualPrompt(twiml, 'pausedExplanation', selectedLangCode);

  // Wait for user input - press 7 to continue, or other options
  const gather = twiml.gather({
    action: `${process.env.BASE_URL}/ivr/menu`,
    numDigits: '1',
    method: 'POST',
    timeout: 120  // Wait up to 2 minutes for user to take notes
  });

  addMultilingualPrompt(gather, 'pausedExplanation', selectedLangCode, { loop: 1 });

  // If no input after timeout, redirect to menu
  twiml.redirect(`${process.env.BASE_URL}/ivr/welcome`);

  return twiml.toString();
}

// Return to main menu
function returnToMenu(callSid, req) {
  console.log(`🔄 Returning to main menu for call: ${callSid}`);
  const twiml = new VoiceResponse();
  twiml.redirect(`${process.env.BASE_URL}/ivr/welcome`);
  return twiml.toString();
}

// End call
function endCall(callSid, req) {
  const session = userSessions.get(callSid) || {};
  const selectedLangCode = session.selectedLanguage || 'en-US';

  const twiml = new VoiceResponse();
  addMultilingualPrompt(twiml, 'goodbye', selectedLangCode);
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
function redirectWelcome(callSid) {
  const session = userSessions.get(callSid) || {};
  const selectedLangCode = session.selectedLanguage || 'en-US';

  const twiml = new VoiceResponse();
  addMultilingualPrompt(twiml, 'invalidOption', selectedLangCode);
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
        language: session.detectedLanguageCode || session.selectedLanguage,
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
      ai: aiProviderService.getActiveProvider(),
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
      ai: aiProviderService.getActiveProvider(),
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
      ai: aiProviderService.getActiveProvider(),
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
// RAG Content Library API
// ========================================
const multer = require('multer');
const ragService = require('./services/ragService');

// Configure multer for file uploads (memory storage for processing)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.txt', '.pdf', '.docx', '.md', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error(`Unsupported file type: ${ext}`));
  }
});

/**
 * GET /api/rag/library - List all documents
 */
app.get('/api/rag/library', async (req, res) => {
  try {
    const data = await ragService.getLibrary();
    res.json(data);
  } catch (error) {
    console.error('RAG library error:', error.message);
    res.json({ success: true, count: 0, documents: [] });
  }
});

/**
 * POST /api/rag/upload - Upload a document
 */
app.post('/api/rag/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file provided' });

    const fileName = req.file.originalname;
    const ext = path.extname(fileName).toLowerCase().replace('.', '');
    const subject = req.body.subject || 'General';
    let content = '';

    // Parse based on file type
    if (ext === 'pdf') {
      // Use pdf2json for PDF text extraction (Node.js native, no DOM dependencies)
      const PDFParser = require('pdf2json');
      const pdfParser = new PDFParser();

      // Parse PDF buffer
      content = await new Promise((resolve, reject) => {
        let textContent = '';

        pdfParser.on('pdfParser_dataError', errData => {
          reject(new Error(errData.parserError));
        });

        pdfParser.on('pdfParser_dataReady', pdfData => {
          try {
            // Extract text from all pages
            const pages = pdfData.Pages || [];
            for (const page of pages) {
              const texts = page.Texts || [];
              for (const text of texts) {
                const textRuns = text.R || [];
                for (const run of textRuns) {
                  if (run.T) {
                    // Decode URI-encoded text
                    textContent += decodeURIComponent(run.T) + ' ';
                  }
                }
              }
              textContent += '\n\n'; // Add paragraph break between pages
            }
            resolve(textContent.trim());
          } catch (err) {
            reject(err);
          }
        });

        pdfParser.parseBuffer(req.file.buffer);
      });

      console.log(`📄 PDF parsed: ${fileName} - ${content.length} chars`);
    } else {
      // Plain text files (txt, md, csv, docx)
      content = req.file.buffer.toString('utf-8');
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'No readable text content found in file' });
    }

    const result = await ragService.uploadDocument(fileName, content, subject, ext);
    res.json(result);
  } catch (error) {
    console.error('RAG upload error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/rag/search - Search documents
 */
app.post('/api/rag/search', async (req, res) => {
  try {
    const { query, topK = 5, minSimilarity = 0.2 } = req.body;
    if (!query) return res.status(400).json({ success: false, error: 'Query required' });

    const results = await ragService.searchDocuments(query, topK, minSimilarity);
    res.json(results);
  } catch (error) {
    console.error('RAG search error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/rag/content/:docId - Delete a document
 */
app.delete('/api/rag/content/:docId', async (req, res) => {
  try {
    const result = await ragService.deleteDocument(req.params.docId);
    res.json(result);
  } catch (error) {
    console.error('RAG delete error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/rag/clear - Clear entire library
 */
app.post('/api/rag/clear', async (req, res) => {
  try {
    const result = await ragService.clearLibrary();
    res.json(result);
  } catch (error) {
    console.error('RAG clear error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/rag/validate-response - Validate response quality
 */
app.post('/api/rag/validate-response', async (req, res) => {
  try {
    const { response, threshold = 0.6 } = req.body;
    if (!response) return res.status(400).json({ success: false, error: 'Response text required' });

    const result = ragService.validateResponse(response, threshold);
    res.json(result);
  } catch (error) {
    console.error('RAG validate error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/rag/generate-answer - Generate RAG-enhanced answer using Gemini
 */
app.post('/api/rag/generate-answer', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ success: false, error: 'Query required' });

    // Search for relevant context
    const searchResult = await ragService.searchDocuments(query, 3, 0.1);
    const context = searchResult.results.map(r => r.content).join('\n\n');

    // Use AI provider (Gemini or OpenAI) to generate answer
    let answer;
    try {
      if (context.length > 0) {
        answer = await aiProviderService.generateAnswer(
          `Using the following reference material:\n\n${context}\n\nAnswer this question: ${query}`
        );
      } else {
        answer = await aiProviderService.generateAnswer(query);
      }
    } catch (aiError) {
      console.warn('AI generation failed, returning context only:', aiError.message);
      answer = context.length > 0 
        ? `Based on the knowledge base: ${context.substring(0, 500)}` 
        : 'No AI provider available and no relevant documents found.';
    }

    res.json({
      success: true,
      query,
      answer: answer || 'Unable to generate answer',
      augmentedContext: context.length > 0 ? context : null,
      sources: searchResult.results.map(r => ({
        fileName: r.fileName,
        subject: r.subject,
        chapterTitle: r.chapterTitle || 'General',
        relevanceScore: r.score || r.similarity,
        similarity: r.score || r.similarity
      })),
      sourcesCount: searchResult.results.length,
      hasContext: context.length > 0
    });
  } catch (error) {
    console.error('RAG generate error:', error.message);
    res.status(500).json({ success: false, error: error.message });
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

  // Respond to Exotel IMMEDIATELY — don't make it wait for Twilio API
  res.status(200).send('OK');
  console.log('✅ Acknowledged Exotel webhook (200 OK sent)');

  // Now initiate Twilio call asynchronously (after response is sent)
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || '+12082959422';

  console.log('\n🔧 Twilio Configuration:');
  console.log(`   From Number: ${twilioPhoneNumber}`);
  console.log(`   To Number: ${normalizedNumber}`);
  console.log(`   Webhook URL: ${process.env.BASE_URL}/ivr/welcome`);
  console.log(`   Account SID: ${accountSid ? accountSid.substring(0, 10) + '...' : 'MISSING'}`);

  const twilio = require('twilio');
  const client = twilio(accountSid, authToken);

  try {
    console.log('\n⏳ Initiating Twilio outbound call...');

    const call = await client.calls.create({
      from: twilioPhoneNumber,
      to: normalizedNumber,
      url: `${process.env.BASE_URL}/ivr/welcome`
    });

    console.log('\n✅ SUCCESS: Twilio call initiated!');
    console.log(`   Call SID: ${call.sid}`);
    console.log(`   Status: ${call.status}`);
    console.log(`   From: ${call.from}`);
    console.log(`   To: ${call.to}`);
    console.log(`   Direction: ${call.direction}`);
    console.log('========================================\n');
  } catch (error) {
    console.error('\n❌ FAILED: Error creating Twilio call');
    console.error(`   Error Message: ${error.message}`);
    console.error(`   Error Code: ${error.code || 'N/A'}`);
    console.error(`   Error Details: ${JSON.stringify(error, null, 2)}`);
    console.log('========================================\n');
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
