/**
 * Speech Service
 * Handles Google Cloud Speech-to-Text and Text-to-Speech
 */

const textToSpeech = require('@google-cloud/text-to-speech');
const speech = require('@google-cloud/speech');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const util = require('util');

let ttsClient = null;
let sttClient = null;

/**
 * Initialize Google Text-to-Speech client
 */
function initializeTTS() {
  try {
    if (fs.existsSync(process.env.GOOGLE_TTS_KEY_FILE || './google-credentials.json')) {
      ttsClient = new textToSpeech.TextToSpeechClient({
        keyFilename: process.env.GOOGLE_TTS_KEY_FILE || './google-credentials.json'
      });
      console.log('✅ Google TTS initialized');
      return true;
    } else {
      console.log('⚠️  Google TTS credentials not found - using Twilio TTS fallback');
      return false;
    }
  } catch (error) {
    console.log('⚠️  Google TTS initialization failed - using Twilio TTS fallback');
    ttsClient = null;
    return false;
  }
}

/**
 * Initialize Google Speech-to-Text client
 */
function initializeSTT() {
  try {
    if (fs.existsSync(process.env.GOOGLE_TTS_KEY_FILE || './google-credentials.json')) {
      sttClient = new speech.SpeechClient({
        keyFilename: process.env.GOOGLE_TTS_KEY_FILE || './google-credentials.json'
      });
      console.log('✅ Google Speech-to-Text initialized');
      return true;
    } else {
      console.log('⚠️  Google STT credentials not found - using Twilio transcription fallback');
      return false;
    }
  } catch (error) {
    console.log('⚠️  Google STT initialization failed - using Twilio transcription fallback');
    sttClient = null;
    return false;
  }
}

/**
 * Check if TTS is available
 * @returns {boolean}
 */
function isTTSAvailable() {
  return ttsClient !== null;
}

/**
 * Check if STT is available
 * @returns {boolean}
 */
function isSTTAvailable() {
  return sttClient !== null;
}

/**
 * Convert text to speech using Google TTS with language support
 * @param {string} text - Text to convert
 * @param {string} callSid - Call SID for file naming
 * @param {string} languageCode - Language code (e.g., 'te-IN', 'en-US', 'hi-IN', 'ta-IN')
 * @returns {Promise<string|null>} Audio file name or null if failed
 */
async function textToSpeechConvert(text, callSid, languageCode = 'en-US') {
  // If TTS client is not available, return null to use Twilio TTS
  if (!ttsClient) {
    console.log('Using Twilio TTS fallback');
    return null;
  }

  try {
    // Ensure audio directory exists
    const audioDir = path.join(__dirname, '..', 'audio');
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    // Voice mapping for different languages
    const voiceMap = {
      'en-US': 'en-US-Neural2-F',          // English (US) - Female
      'te-IN': 'te-IN-Standard-A',         // Telugu (India) - Female
      'hi-IN': 'hi-IN-Neural2-A',          // Hindi (India) - Female
      'ta-IN': 'ta-IN-Standard-A',         // Tamil (India) - Female
      'kn-IN': 'kn-IN-Standard-A',         // Kannada (India) - Female
      'ml-IN': 'ml-IN-Standard-A'          // Malayalam (India) - Female
    };

    const voiceName = voiceMap[languageCode] || voiceMap['en-US'];

    console.log(`🎙️ TTS Request: Language=${languageCode}, Voice=${voiceName}`);
    console.log(`📝 Text to convert: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`);

    const request = {
      input: { text: text },
      voice: {
        languageCode: languageCode,
        name: voiceName,
        ssmlGender: 'FEMALE'
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 0.95,
        pitch: 0.0
      }
    };

    const [response] = await ttsClient.synthesizeSpeech(request);
    const fileName = `answer_${callSid}_${Date.now()}.mp3`;
    const filePath = path.join(audioDir, fileName);

    await util.promisify(fs.writeFile)(filePath, response.audioContent, 'binary');
    console.log(`🔊 TTS audio generated successfully: ${fileName} (Language: ${languageCode}, Voice: ${voiceName})`);

    // Clean up old audio files (older than 1 hour)
    cleanupOldAudioFiles(audioDir);

    return fileName;
  } catch (error) {
    console.error('Error with Google TTS:', error.message);
    return null;
  }
}

/**
 * Transcribe audio using Google Speech-to-Text with language support
 * @param {string} recordingUrl - URL of the recording
 * @param {string} callSid - Call SID for logging
 * @param {string} languageCode - Language code (e.g., 'te-IN' for Telugu, 'en-US' for English)
 * @returns {Promise<Object>} { text: string, detectedLanguage: string }
 */
async function transcribeAudio(recordingUrl, callSid, languageCode = 'te-IN') {
  try {
    console.log(`🎙️ Starting transcription for ${callSid} (Language: ${languageCode})...`);

    // Download the audio file from Twilio
    const audioResponse = await axios({
      method: 'get',
      url: recordingUrl,
      responseType: 'arraybuffer',
      auth: {
        username: process.env.TWILIO_ACCOUNT_SID,
        password: process.env.TWILIO_AUTH_TOKEN
      }
    });

    const audioBuffer = Buffer.from(audioResponse.data);
    console.log(`📥 Downloaded audio: ${audioBuffer.length} bytes`);

    let transcriptionText = '';
    let detectedLanguage = 'en-US';

    // Use Google Speech-to-Text if available
    if (sttClient) {
      console.log(`🔊 Using Google Speech-to-Text for ${callSid} with auto-detection`);

      // Supported languages for multi-language detection
      // Order matters: Test English first since it's most common
      const supportedLanguages = ['en-US', 'te-IN', 'hi-IN', 'ta-IN'];

      let bestTranscription = '';
      let bestLanguage = 'en-US';
      let bestConfidence = 0;
      const languageResults = [];

      // Try each supported language and collect results
      for (const lang of supportedLanguages) {
        try {
          const request = {
            audio: {
              content: audioBuffer.toString('base64')
            },
            config: {
              encoding: 'LINEAR16',
              sampleRateHertz: 8000,
              languageCode: lang,
              enableAutomaticPunctuation: true
            }
          };

          const [response] = await sttClient.recognize(request);

          if (response.results && response.results.length > 0) {
            const result = response.results[0];
            const confidence = result.alternatives[0].confidence || 0;
            const text = result.alternatives[0].transcript;

            languageResults.push({ lang, text, confidence });
            console.log(`  📝 ${lang}: "${text}" (confidence: ${confidence.toFixed(2)})`);
          }
        } catch (err) {
          console.log(`  ⚠️ ${lang}: Failed - ${err.message}`);
        }
      }

      if (languageResults.length > 0) {
        // Sort by confidence descending
        languageResults.sort((a, b) => b.confidence - a.confidence);

        // Use the highest confidence result if it's significantly confident
        // Require at least 0.5 confidence to avoid false positives
        const MIN_CONFIDENCE_THRESHOLD = 0.5;
        const CONFIDENCE_GAP_THRESHOLD = 0.15; // Difference needed to override English default

        const topResult = languageResults[0];
        const secondResult = languageResults[1] || { confidence: 0 };

        // If English has decent confidence (>0.6), prefer it
        const englishResult = languageResults.find(r => r.lang === 'en-US');

        if (englishResult && englishResult.confidence >= 0.6) {
          // Strong English confidence - use it
          bestTranscription = englishResult.text;
          detectedLanguage = englishResult.lang;
          bestConfidence = englishResult.confidence;
          console.log(`✅ Selected English (strong confidence: ${englishResult.confidence.toFixed(2)})`);
        } else if (topResult.confidence >= MIN_CONFIDENCE_THRESHOLD &&
          (topResult.confidence - secondResult.confidence) >= CONFIDENCE_GAP_THRESHOLD) {
          // Clear winner with good confidence
          bestTranscription = topResult.text;
          detectedLanguage = topResult.lang;
          bestConfidence = topResult.confidence;
          console.log(`✅ Selected ${topResult.lang} (confidence: ${topResult.confidence.toFixed(2)}, gap: ${(topResult.confidence - secondResult.confidence).toFixed(2)})`);
        } else if (englishResult) {
          // Fallback to English if no clear winner
          bestTranscription = englishResult.text;
          detectedLanguage = englishResult.lang;
          bestConfidence = englishResult.confidence;
          console.log(`✅ Defaulting to English (ambiguous results: top=${topResult.confidence.toFixed(2)}, gap=${(topResult.confidence - secondResult.confidence).toFixed(2)})`);
        } else {
          // No English result, use the best available
          bestTranscription = topResult.text;
          detectedLanguage = topResult.lang;
          bestConfidence = topResult.confidence;
          console.log(`✅ Using best available ${topResult.lang} (no English detected)`);
        }

        // Assign the selected transcription to the result variable
        transcriptionText = bestTranscription;
      } else {
        throw new Error('No transcription results from any language');
      }

      console.log(`📝 Final transcription: "${transcriptionText}"`);
      console.log(`🌐 Detected language: ${detectedLanguage}`);
    } else {
      console.log(`⚠️ Google STT not available`);
      throw new Error('STT not available');
    }

    return {
      text: transcriptionText,
      detectedLanguage: detectedLanguage
    };
  } catch (error) {
    console.error(`❌ Transcription error for ${callSid}:`, error.message);
    throw error;
  }
}

/**
 * Clean up old audio files
 * @param {string} audioDir - Audio directory path
 */
function cleanupOldAudioFiles(audioDir) {
  try {
    const files = fs.readdirSync(audioDir);
    const oneHourAgo = Date.now() - (60 * 60 * 1000);

    files.forEach(file => {
      const filePath = path.join(audioDir, file);
      const stats = fs.statSync(filePath);
      if (stats.mtimeMs < oneHourAgo) {
        fs.unlinkSync(filePath);
        console.log(`Deleted old audio file: ${file}`);
      }
    });
  } catch (error) {
    console.error('Error cleaning up audio files:', error.message);
  }
}

module.exports = {
  initializeTTS,
  initializeSTT,
  isTTSAvailable,
  isSTTAvailable,
  textToSpeechConvert,
  transcribeAudio
};
