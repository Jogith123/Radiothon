require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const VoiceResponse = require('twilio').twiml.VoiceResponse;
const path = require('path');

// Import modular services
const { connectToMongoDB, closeConnection, isConnected } = require('./database/connection');
const { initializeOpenAI, isOpenAIInitialized, generateAnswer, generateSummary } = require('./services/openaiService');
const { initializeTTS, initializeSTT, textToSpeechConvert, transcribeAudio } = require('./services/speechService');
const { storeQuestionAndAnswer, getHistoryBySubject, getUserStats, getAllHistory } = require('./services/historyService');
const { initializeTranslation, detectLanguage, translateText, isTranslationAvailable } = require('./services/translationService');
const { initializeWebSocket, broadcastCallStarted, broadcastQuestionTranscribed, broadcastAnswerGenerated, broadcastQASaved, broadcastCallEnded, broadcastPipelineStage, closeWebSocket } = require('./services/websocketService');
const { getLanguageByDigit, getPrompt, getVoiceConfig, PROMPTS } = require('./config/languageConfig');

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * Helper function to add multilingual prompt to TwiML
 * For Telugu and Tamil: uses pre-generated Google TTS audio files (Polly doesn't support them well)
 * For English and Hindi: uses Polly TTS
 * @param {object} twimlObject - Twilio gather or VoiceResponse object
 * @param {string} promptKey - Key from languageConfig (e.g., 'askQuestion', 'welcome')
 * @param {string} langCode - Language code (e.g., 'te-IN', 'ta-IN', 'en-US', 'hi-IN')
 * @param {object} options - Additional options (loop, etc.)
 */
function addMultilingualPrompt(twimlObject, promptKey, langCode, options = {}) {
  // Map language codes to language name suffixes used in audio file names
  const langSuffix = {
    'en-US': 'english',
    'hi-IN': 'hindi',
    'te-IN': 'telugu',
    'ta-IN': 'tamil'
  };

  // Map prompt keys to audio file base names
  const promptToFileBase = {
    'welcome': 'welcome',
    'mainMenu': 'menu',
    'askQuestion': 'ask_question',
    'recordingStopped': 'recording_stopped',
    'questionRecorded': 'question_recorded',
    'questionRecordedOptions': 'question_recorded',
    'processingQuestion': 'processing',
    'afterAnswer': 'after_answer',
    'noQuestion': 'no_question',
    'stillProcessing': 'still_processing',
    'summaryRequest': 'summary_request',
    'followUpPrompt': 'followup_prompt',
    'followUpRecorded': 'followup_recorded',
    'noPreviousQuestion': 'no_previous',
    'goodbye': 'goodbye',
    'invalidOption': 'invalid_option',
    'aiServiceError': 'ai_error',
    'databaseError': 'db_error',
    'generalError': 'general_error'
  };

  const suffix = langSuffix[langCode] || 'english';
  const fileBase = promptToFileBase[promptKey];

  if (fileBase) {
    const audioFile = `${fileBase}_${suffix}`;
    const audioUrl = `${process.env.BASE_URL}/audio/${audioFile}.mp3`;
    // Apply loop option if specified
    if (options.loop && options.loop > 1) {
      for (let i = 0; i < options.loop; i++) {
        twimlObject.play(audioUrl);
      }
    } else {
      twimlObject.play(audioUrl);
    }
  } else {
    // Fallback to Polly TTS if prompt key not mapped
    const prompt = getPrompt(promptKey, langCode);
    const voiceConfig = getVoiceConfig(langCode);
    twimlObject.say(prompt, { ...voiceConfig, ...options });
  }
}

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

  // Initialize WebSocket server (port 5050)
  initializeWebSocket(5050);

  console.log('\n✅ All services initialized\n');
}

// Store user sessions (in production, use Redis or database)
const userSessions = new Map();

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

  // Play pre-generated language selection audio files (using Google TTS)
  // Amazon Polly doesn't support Telugu and Tamil, so we use pre-generated files
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

    // Redirect to main menu with language parameter
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
    // Use TTS for all languages (including Telugu and Tamil)
    addMultilingualPrompt(gather, 'mainMenu', selectedLangCode, { loop: 2 });

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

    // CRITICAL FIX: Use the user's SELECTED language, not the default language
    // selectedLanguage is set when user presses 1/2/3/4 for language selection
    // language is just a default fallback ('en-US')
    const userLanguage = session.selectedLanguage || session.language || 'en-US';

    console.log(`🎯 User selected language: ${session.selectedLanguage}`);
    console.log(`🎙️ Transcribing with language hint: ${userLanguage}`);

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
    // Check if OpenAI is available
    if (!isOpenAIInitialized()) {
      addMultilingualPrompt(twiml, 'aiServiceError', selectedLangCode);
      twiml.redirect(`${process.env.BASE_URL}/ivr/welcome`);
      return twiml.toString();
    }

    // Get answer from OpenAI (in English)
    let answer = '';

    // Get the question from session
    // const question = session.currentQuestion; // This line is already present above, no need to duplicate.

    addMultilingualPrompt(twiml, 'processingQuestion', selectedLangCode);

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

    addMultilingualPrompt(gather, 'afterAnswer', selectedLangCode);

  } catch (error) {
    console.error('❌❌❌ CRITICAL ERROR in getAnswer ❌❌❌');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Call SID:', callSid);
    console.error('Selected Language:', selectedLangCode);
    console.error('Question:', question);

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

    // Check if OpenAI is available
    if (!isOpenAIInitialized()) {
      addMultilingualPrompt(twiml, 'aiServiceError', selectedLangCode);
      twiml.redirect(`${process.env.BASE_URL}/ivr/welcome`);
      return twiml.toString();
    }

    // Ask user for subject
    addMultilingualPrompt(twiml, 'summaryRequest', selectedLangCode);

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

  addMultilingualPrompt(twiml, 'followUpPrompt', selectedLangCode);

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

      addMultilingualPrompt(twiml, 'noQuestion', selectedLangCode);
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

    addMultilingualPrompt(gather, 'afterAnswer', selectedLangCode);

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

  const selectedLangCode = session.selectedLanguage || 'en-US';
  const voiceConfig = getVoiceConfig(selectedLangCode);

  const twiml = new VoiceResponse();
  twiml.say(
    getPrompt('followUpRecorded', selectedLangCode),
    voiceConfig
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
  const session = userSessions.get(callSid) || {};
  const selectedLangCode = session.selectedLanguage || 'en-US';
  const voiceConfig = getVoiceConfig(selectedLangCode);

  const twiml = new VoiceResponse();
  twiml.say(
    getPrompt('goodbye', selectedLangCode),
    voiceConfig
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
function redirectWelcome(callSid) {
  const session = userSessions.get(callSid) || {};
  const selectedLangCode = session.selectedLanguage || 'en-US';
  const voiceConfig = getVoiceConfig(selectedLangCode);

  const twiml = new VoiceResponse();
  twiml.say(
    getPrompt('invalidOption', selectedLangCode),
    voiceConfig
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

  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📞 Twilio webhook URL: ${process.env.BASE_URL || `http://localhost:${PORT}`}/ivr/welcome`);
  });
}

startServer();
