/**
 * Translation Service
 * Handles Google Cloud Translation API for multi-language support
 */

const { Translate } = require('@google-cloud/translate').v2;
const fs = require('fs');

let translateClient = null;

/**
 * Get Google credentials config - supports both file and env var
 */
function getGoogleCredentials() {
    // Option 1: GOOGLE_CREDENTIALS env var (JSON string) - for Railway/cloud
    if (process.env.GOOGLE_CREDENTIALS) {
        try {
            const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
            return { credentials };
        } catch (e) {
            console.log('⚠️  GOOGLE_CREDENTIALS env var is not valid JSON');
        }
    }
    // Option 2: Key file path - for local development
    const keyFile = process.env.GOOGLE_TTS_KEY_FILE || './google-credentials.json';
    if (fs.existsSync(keyFile)) {
        return { keyFilename: keyFile };
    }
    return null;
}

/**
 * Initialize Google Cloud Translation
 */
function initializeTranslation() {
    try {
        const creds = getGoogleCredentials();
        if (creds) {
            translateClient = new Translate(creds);
            console.log('✅ Google Cloud Translation initialized');
            return true;
        } else {
            console.log('ℹ️  Translation not configured - English-only mode (OK)');
            return false;
        }
    } catch (error) {
        console.log('⚠️  Translation initialization failed:', error.message);
        translateClient = null;
        return false;
    }
}

/**
 * Detect language of text
 * @param {string} text - Text to detect language for
 * @returns {Promise<string>} Language code (e.g., 'te' for Telugu, 'en' for English)
 */
async function detectLanguage(text) {
    if (!translateClient) {
        return 'en'; // Default to English
    }

    try {
        const [detection] = await translateClient.detect(text);
        const language = detection.language;
        console.log(`🌐 Detected language: ${language} for text: "${text.substring(0, 30)}..."`);
        return language;
    } catch (error) {
        console.error('❌ Language detection error:', error.message);
        return 'en';
    }
}

/**
 * Translate text from source language to target language
 * @param {string} text - Text to translate
 * @param {string} targetLanguage - Target language code (e.g., 'en', 'te', 'hi')
 * @param {string} sourceLanguage - Source language code (optional)
 * @returns {Promise<string>} Translated text
 */
async function translateText(text, targetLanguage, sourceLanguage = null) {
    if (!translateClient) {
        console.log('⚠️  Translation not available, returning original text');
        return text;
    }

    try {
        const options = {
            to: targetLanguage
        };

        if (sourceLanguage) {
            options.from = sourceLanguage;
        }

        const [translation] = await translateClient.translate(text, options);
        console.log(`🌐 Translated (${sourceLanguage || 'auto'} → ${targetLanguage}): "${text.substring(0, 30)}..." → "${translation.substring(0, 30)}..."`);
        return translation;
    } catch (error) {
        console.error('❌ Translation error:', error.message);
        return text; // Return original if translation fails
    }
}

/**
 * Check if translation is available
 * @returns {boolean}
 */
function isTranslationAvailable() {
    return translateClient !== null;
}

module.exports = {
    initializeTranslation,
    detectLanguage,
    translateText,
    isTranslationAvailable
};
