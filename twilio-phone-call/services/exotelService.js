/**
 * Exotel Service
 * Handles Exotel API interactions and call management
 */

const axios = require('axios');

// Exotel API configuration
const EXOTEL_API_BASE = 'https://api.exotel.com/v1/Accounts';
const EXOTEL_ACCOUNT_SID = process.env.EXOTEL_ACCOUNT_SID;
const EXOTEL_API_KEY = process.env.EXOTEL_API_KEY;
const EXOTEL_PHONE_NUMBER = process.env.EXOTEL_PHONE_NUMBER;

/**
 * Create Exotel JSON response for IVR
 */
function createExotelResponse(action, config = {}) {
    const response = {
        action: action,
        ...config
    };
    
    return response;
}

/**
 * Create welcome IVR response
 */
function createWelcomeResponse() {
    return createExotelResponse('play', {
        text: 'Welcome to Vidya Vani, your AI powered educational assistant. ' +
              'Press 1 to ask a question. ' +
              'Press 2 to listen to subject lessons. ' +
              'Press 3 to get the answer to your recorded question. ' +
              'Press 4 to get your previous answers summary. ' +
              'Press 9 to end the call.',
        language: 'en-in',
        options: [
            { digit: '1', text: 'Ask a question' },
            { digit: '2', text: 'Subject lessons' },
            { digit: '3', text: 'Get answer' },
            { digit: '4', text: 'Previous answers' },
            { digit: '9', text: 'End call' }
        ],
        next_url: `${process.env.BASE_URL}/exotel/process`
    });
}

/**
 * Create question recording response
 */
function createQuestionRecordingResponse() {
    return createExotelResponse('record', {
        text: 'Please record your question after the beep. Press hash when finished.',
        max_length: 30,
        timeout: 5,
        finish_on_key: '#',
        next_url: `${process.env.BASE_URL}/exotel/process-question`
    });
}

/**
 * Create subject selection response
 */
function createSubjectSelectionResponse() {
    return createExotelResponse('play', {
        text: 'Select a subject. Press 1 for Mathematics, 2 for Science, 3 for History, 4 for Geography.',
        language: 'en-in',
        options: [
            { digit: '1', text: 'Mathematics' },
            { digit: '2', text: 'Science' },
            { digit: '3', text: 'History' },
            { digit: '4', text: 'Geography' }
        ],
        next_url: `${process.env.BASE_URL}/exotel/play-lesson`
    });
}

/**
 * Create audio playback response
 */
function createAudioPlaybackResponse(audioUrl, nextUrl = null) {
    return createExotelResponse('play', {
        audio_url: audioUrl,
        next_url: nextUrl || `${process.env.BASE_URL}/exotel/menu`
    });
}

/**
 * Create text-to-speech response
 */
function createTTSResponse(text, nextUrl = null) {
    return createExotelResponse('play', {
        text: text,
        language: 'en-in',
        next_url: nextUrl || `${process.env.BASE_URL}/exotel/menu`
    });
}

/**
 * Create hangup response
 */
function createHangupResponse() {
    return createExotelResponse('hangup', {
        text: 'Thank you for calling Vidya Vani. Goodbye!'
    });
}

/**
 * Validate Exotel webhook request
 */
function validateExotelRequest(req) {
    // Check for required Exotel parameters
    const requiredParams = ['CallSid', 'From', 'To'];
    
    for (const param of requiredParams) {
        if (!req.body[param]) {
            console.error(`Missing required parameter: ${param}`);
            return false;
        }
    }
    
    return true;
}

/**
 * Get call information from request
 */
function getCallInfo(req) {
    return {
        callSid: req.body.CallSid,
        fromNumber: req.body.From,
        toNumber: req.body.To,
        direction: req.body.Direction || 'inbound',
        digits: req.body.Digits,
        recordingUrl: req.body.RecordingUrl,
        callStatus: req.body.CallStatus
    };
}

/**
 * Make outbound call using Exotel API (if needed for future features)
 */
async function makeOutboundCall(toNumber, appletId) {
    try {
        const response = await axios.post(
            `${EXOTEL_API_BASE}/${EXOTEL_ACCOUNT_SID}/Calls/connect.json`,
            {
                From: EXOTEL_PHONE_NUMBER,
                To: toNumber,
                CallerId: EXOTEL_PHONE_NUMBER,
                Url: `https://api.exotel.com/v1/Accounts/${EXOTEL_ACCOUNT_SID}/Applets/${appletId}`
            },
            {
                auth: {
                    username: EXOTEL_ACCOUNT_SID,
                    password: EXOTEL_API_KEY
                }
            }
        );
        
        return response.data;
    } catch (error) {
        console.error('Error making outbound call:', error.message);
        throw error;
    }
}

/**
 * Get call details from Exotel
 */
async function getCallDetails(callSid) {
    try {
        const response = await axios.get(
            `${EXOTEL_API_BASE}/${EXOTEL_ACCOUNT_SID}/Calls/${callSid}.json`,
            {
                auth: {
                    username: EXOTEL_ACCOUNT_SID,
                    password: EXOTEL_API_KEY
                }
            }
        );
        
        return response.data;
    } catch (error) {
        console.error('Error getting call details:', error.message);
        throw error;
    }
}

module.exports = {
    createExotelResponse,
    createWelcomeResponse,
    createQuestionRecordingResponse,
    createSubjectSelectionResponse,
    createAudioPlaybackResponse,
    createTTSResponse,
    createHangupResponse,
    validateExotelRequest,
    getCallInfo,
    makeOutboundCall,
    getCallDetails
};
