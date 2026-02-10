/**
 * Language Configuration for Vidya Vani IVR System
 * Supports: English, Hindi, Telugu, Tamil
 */

// Language metadata and voice configuration
const LANGUAGES = {
    '1': {
        code: 'en-US',
        voice: 'Polly.Joanna',
        name: 'English',
        shortCode: 'en'
    },
    '2': {
        code: 'hi-IN',
        voice: 'Polly.Aditi',
        name: 'Hindi',
        shortCode: 'hi'
    },
    '3': {
        code: 'te-IN',
        voice: 'Polly.Aditi',
        name: 'Telugu',
        shortCode: 'te'
    },
    '4': {
        code: 'ta-IN',
        voice: 'Polly.Aditi',
        name: 'Tamil',
        shortCode: 'ta'
    }
};

// All IVR prompts in 4 languages
const PROMPTS = {
    // Language selection (played in sequence, each in its own language)
    languageSelection: [
        { text: 'Welcome to Vidya Vani. Press 1 for English.', voice: 'Polly.Joanna', language: 'en-US' },
        { text: 'विद्या वाणी में आपका स्वागत है। हिंदी के लिए दो दबाएं।', voice: 'Polly.Aditi', language: 'hi-IN' },
        { text: 'విద్యా వాణి కి స్వాగతం. తెలుగు కోసం మూడు నొక్కండి.', voice: 'Polly.Aditi', language: 'te-IN' },
        { text: 'வித்யா வாணி க்கு வரவேற்கிறோம். தமிழுக்கு நான்கு அழுத்தவும்.', voice: 'Polly.Aditi', language: 'ta-IN' }
    ],

    // Welcome message after language selection
    welcome: {
        'en-US': 'Welcome to Vidya Vani, your AI powered educational assistant.',
        'hi-IN': 'विद्या वाणी में आपका स्वागत है, आपका एआई शैक्षिक सहायक।',
        'te-IN': 'విద్యా వాణి కి స్వాగతం, మీ ఏఐ విద్యా సహాయకుడు.',
        'ta-IN': 'வித்யா வாணி க்கு வரவேற்கிறோம், உங்கள் ஏஐ கல்வி உதவியாளர்.'
    },

    // Main menu options
    mainMenu: {
        'en-US': 'Press 1 to ask an educational question. Press 2 to stop recording. Press 3 to get the answer. Press 4 to get a summary of your questions on a subject. Press 5 to return to main menu. Press 6 to add more details to your last question. Press 9 to end the call.',
        'hi-IN': 'शैक्षिक प्रश्न पूछने के लिए 1 दबाएं। रिकॉर्डिंग बंद करने के लिए 2 दबाएं। उत्तर पाने के लिए 3 दबाएं। किसी विषय पर अपने प्रश्नों का सारांश पाने के लिए 4 दबाएं। मुख्य मेनू पर वापस जाने के लिए 5 दबाएं। अपने अंतिम प्रश्न में अधिक विवरण जोड़ने के लिए 6 दबाएं। कॉल समाप्त करने के लिए 9 दबाएं।',
        'te-IN': 'విద్యా ప్రశ్న అడగడానికి ఒకటి నొక్కండి. రికార్డింగ్ ఆపడానికి రెండు నొక్కండి. సమాధానం పొందడానికి మూడు నొక్కండి. సారాంశం పొందడానికి నాలుగు నొక్కండి. మెనుకు తిరిగి వెళ్ళడానికి ఐదు నొక్కండి. మరిన్ని వివరాలు జోడించడానికి ఆరు నొక్కండి. కాల్ ముగించడానికి తొమ్మిది నొక్కండి.',
        'ta-IN': 'கல்வி கேள்வி கேட்க ஒன்று அழுத்தவும். பதிவை நிறுத்த இரண்டு அழுத்தவும். பதிலைப் பெற மூன்று அழுத்தவும். சுருக்கத்தைப் பெற நான்கு அழுத்தவும். மெனுவுக்குத் திரும்ப ஐந்து அழுத்தவும். மேலும் விவரங்களைச் சேர்க்க ஆறு அழுத்தவும். அழைப்பை முடிக்க ஒன்பது அழுத்தவும்.'
    },

    // Ask question prompt
    askQuestion: {
        'en-US': 'Please ask your educational question after the beep. Press 2 to stop recording.',
        'hi-IN': 'कृपया बीप के बाद अपना शैक्षिक प्रश्न पूछें। रिकॉर्डिंग बंद करने के लिए 2 दबाएं।',
        'te-IN': 'దయచేసి బీప్ తర్వాత మీ విద్యా ప్రశ్న అడగండి. రికార్డింగ్ ఆపడానికి 2 నొక్కండి.',
        'ta-IN': 'பீப் ஒலிக்குப் பிறகு உங்கள் கல்வி கேள்வியைக் கேளுங்கள். பதிவை நிறுத்த 2 ஐ அழுத்தவும்.'
    },

    // Recording stopped
    recordingStopped: {
        'en-US': 'Recording stopped. Your question is being processed. Please press 3 to hear the answer.',
        'hi-IN': 'रिकॉर्डिंग बंद हो गई। आपका प्रश्न संसाधित किया जा रहा है। उत्तर सुनने के लिए कृपया 3 दबाएं।',
        'te-IN': 'రికార్డింగ్ ఆగిపోయింది. మీ ప్రశ్న ప్రాసెస్ చేయబడుతోంది. సమాధానం వినడానికి దయచేసి 3 నొక్కండి.',
        'ta-IN': 'பதிவு நிறுத்தப்பட்டது. உங்கள் கேள்வி செயலாக்கப்படுகிறது. பதிலைக் கேட்க 3 ஐ அழுத்தவும்.'
    },

    // Question recorded
    questionRecorded: {
        'en-US': 'Thank you. Your question is being processed. Please press 3 to hear the answer, or press 1 to ask another question.',
        'hi-IN': 'धन्यवाद। आपका प्रश्न संसाधित किया जा रहा है। उत्तर सुनने के लिए कृपया 3 दबाएं, या दूसरा प्रश्न पूछने के लिए 1 दबाएं।',
        'te-IN': 'ధన్యవాదాలు. మీ ప్రశ్న ప్రాసెస్ చేయబడుతోంది. సమాధానం వినడానికి దయచేసి 3 నొక్కండి, లేదా మరొక ప్రశ్న అడగడానికి 1 నొక్కండి.',
        'ta-IN': 'நன்றி. உங்கள் கேள்வி செயலாக்கப்படுகிறது. பதிலைக் கேட்க 3 ஐ அழுத்தவும், அல்லது மற்றொரு கேள்வி கேட்க 1 ஐ அழுத்தவும்.'
    },

    // Question recorded - menu options
    questionRecordedOptions: {
        'en-US': 'Press 3 for answer, or press 1 for new question.',
        'hi-IN': 'उत्तर के लिए 3 दबाएं, या नए प्रश्न के लिए 1 दबाएं।',
        'te-IN': 'సమాధానం కోసం 3 నొక్కండి, లేదా కొత్త ప్రశ్న కోసం 1 నొక్కండి.',
        'ta-IN': 'பதிலுக்கு 3 ஐ அழுத்தவும், அல்லது புதிய கேள்விக்கு 1 ஐ அழுத்தவும்.'
    },

    // Processing question
    processingQuestion: {
        'en-US': 'Processing your question with AI. Please wait.',
        'hi-IN': 'एआई के साथ आपके प्रश्न को संसाधित किया जा रहा है। कृपया प्रतीक्षा करें।',
        'te-IN': 'AI తో మీ ప్రశ్నను ప్రాసెస్ చేస్తోంది. దయచేసి వేచి ఉండండి.',
        'ta-IN': 'AI உடன் உங்கள் கேள்வி செயலாக்கப்படுகிறது. தயவுசெய்து காத்திருங்கள்.'
    },

    // After answer options
    afterAnswer: {
        'en-US': 'Press 1 to ask another question, or press 9 to end the call.',
        'hi-IN': 'दूसरा प्रश्न पूछने के लिए 1 दबाएं, या कॉल समाप्त करने के लिए 9 दबाएं।',
        'te-IN': 'మరొక ప్రశ్న అడగడానికి 1 నొక్కండి, లేదా కాల్ ముగించడానికి 9 నొక్కండి.',
        'ta-IN': 'மற்றொரு கேள்வி கேட்க 1 ஐ அழுத்தவும், அல்லது அழைப்பை முடிக்க 9 ஐ அழுத்தவும்.'
    },

    // No question found
    noQuestion: {
        'en-US': 'No question found. Please press 1 to ask a question first.',
        'hi-IN': 'कोई प्रश्न नहीं मिला। कृपया पहले प्रश्न पूछने के लिए 1 दबाएं।',
        'te-IN': 'ప్రశ్న కనుగొనబడలేదు. దయచేసి మొదట ప్రశ్న అడగడానికి 1 నొక్కండి.',
        'ta-IN': 'கேள்வி கிடைக்கவில்லை. முதலில் கேள்வி கேட்க 1 ஐ அழுத்தவும்.'
    },

    // Still processing
    stillProcessing: {
        'en-US': 'Your question is still being processed. Please wait a moment and press 3 again.',
        'hi-IN': 'आपका प्रश्न अभी भी संसाधित किया जा रहा है। कृपया एक क्षण प्रतीक्षा करें और फिर से 3 दबाएं।',
        'te-IN': 'మీ ప్రశ్న ఇంకా ప్రాసెస్ చేయబడుతోంది. దయచేసి ఒక క్షణం వేచి ఉండండి మరియు మళ్లీ 3 నొక్కండి.',
        'ta-IN': 'உங்கள் கேள்வி இன்னும் செயலாக்கப்படுகிறது. தயவுசெய்து சிறிது நேரம் காத்திருந்து மீண்டும் 3 ஐ அழுத்தவும்.'
    },

    // Summary request
    summaryRequest: {
        'en-US': 'Please tell me the subject you need to summarize.',
        'hi-IN': 'कृपया मुझे वह विषय बताएं जिसका आपको सारांश चाहिए।',
        'te-IN': 'దయచేసి మీరు సారాంశం చేయాల్సిన విషయం చెప్పండి.',
        'ta-IN': 'தயவுசெய்து நீங்கள் சுருக்கமாகச் சொல்ல வேண்டிய பாடத்தைச் சொல்லுங்கள்.'
    },

    // Summary intro
    summaryIntro: {
        'en-US': 'Here is your learning summary for {subject}, based on your last {count} questions.',
        'hi-IN': 'यहाँ आपके अंतिम {count} प्रश्नों के आधार पर {subject} के लिए आपका सीखने का सारांश है।',
        'te-IN': 'మీ చివరి {count} ప్రశ్నల ఆధారంగా {subject} కోసం మీ అభ్యాస సారాంశం ఇక్కడ ఉంది.',
        'ta-IN': 'உங்கள் கடைசி {count} கேள்விகளின் அடிப்படையில் {subject} க்கான உங்கள் கற்றல் சுருக்கம் இங்கே உள்ளது.'
    },

    // No summary available
    noSummary: {
        'en-US': 'You have not asked any questions about {subject} yet. Please ask some questions first, then request a summary.',
        'hi-IN': 'आपने अभी तक {subject} के बारे में कोई प्रश्न नहीं पूछा है। कृपया पहले कुछ प्रश्न पूछें, फिर सारांश का अनुरोध करें।',
        'te-IN': 'మీరు ఇంకా {subject} గురించి ఏ ప్రశ్నలు అడగలేదు. దయచేసి మొదట కొన్ని ప్రశ్నలు అడగండి, తర్వాత సారాంశం అభ్యర్థించండి.',
        'ta-IN': 'நீங்கள் இன்னும் {subject} பற்றி எந்தக் கேள்விகளும் கேட்கவில்லை. முதலில் சில கேள்விகளைக் கேளுங்கள், பின்னர் சுருக்கத்தைக் கோருங்கள்.'
    },

    // After summary options
    afterSummary: {
        'en-US': 'Press 1 to ask another question, press 4 for another summary, or press 9 to end the call.',
        'hi-IN': 'दूसरा प्रश्न पूछने के लिए 1 दबाएं, दूसरे सारांश के लिए 4 दबाएं, या कॉल समाप्त करने के लिए 9 दबाएं।',
        'te-IN': 'మరొక ప్రశ్న అడగడానికి 1 నొక్కండి, మరొక సారాంశం కోసం 4 నొక్కండి, లేదా కాల్ ముగించడానికి 9 నొక్కండి.',
        'ta-IN': 'மற்றொரு கேள்வி கேட்க 1 ஐ அழுத்தவும், மற்றொரு சுருக்கத்திற்கு 4 ஐ அழுத்தவும், அல்லது அழைப்பை முடிக்க 9 ஐ அழுத்தவும்.'
    },

    // Follow-up question
    followUpPrompt: {
        'en-US': 'You can add more details to the last question. Please speak now and press 2 when finished.',
        'hi-IN': 'आप अंतिम प्रश्न में अधिक विवरण जोड़ सकते हैं। कृपया अभी बोलें और समाप्त होने पर 2 दबाएं।',
        'te-IN': 'మీరు చివరి ప్రశ్నకు మరిన్ని వివరాలు జోడించవచ్చు. దయచేసి ఇప్పుడు మాట్లాడండి మరియు పూర్తయినప్పుడు 2 నొక్కండి.',
        'ta-IN': 'கடைசி கேள்விக்கு மேலும் விவரங்களைச் சேர்க்கலாம். தயவுசெய்து இப்போது பேசுங்கள் மற்றும் முடிந்ததும் 2 ஐ அழுத்தவும்.'
    },

    // Follow-up recorded
    followUpRecorded: {
        'en-US': 'Thank you. Your additional details are being processed. Please press 3 to hear the updated answer.',
        'hi-IN': 'धन्यवाद। आपके अतिरिक्त विवरण संसाधित किए जा रहे हैं। अद्यतन उत्तर सुनने के लिए कृपया 3 दबाएं।',
        'te-IN': 'ధన్యవాదాలు. మీ అదనపు వివరాలు ప్రాసెస్ చేయబడుతున్నాయి. నవీకరించిన సమాధానం వినడానికి దయచేసి 3 నొక్కండి.',
        'ta-IN': 'நன்றி. உங்கள் கூடுதல் விவரங்கள் செயலாக்கப்படுகின்றன. புதுப்பிக்கப்பட்ட பதிலைக் கேட்க 3 ஐ அழுத்தவும்.'
    },

    // No previous question for follow-up
    noPreviousQuestion: {
        'en-US': 'No previous question found. Please press 1 to ask a question first.',
        'hi-IN': 'कोई पिछला प्रश्न नहीं मिला। कृपया पहले प्रश्न पूछने के लिए 1 दबाएं।',
        'te-IN': 'మునుపటి ప్రశ్న కనుగొనబడలేదు. దయచేసి మొదట ప్రశ్న అడగడానికి 1 నొక్కండి.',
        'ta-IN': 'முந்தைய கேள்வி கிடைக்கவில்லை. முதலில் கேள்வி கேட்க 1 ஐ அழுத்தவும்.'
    },

    // Goodbye message
    goodbye: {
        'en-US': 'Thank you for using Vidya Vani. Goodbye!',
        'hi-IN': 'विद्या वाणी का उपयोग करने के लिए धन्यवाद। अलविदा!',
        'te-IN': 'విద్యా వాణిని ఉపయోగించినందుకు ధన్యవాదాలు. వీడ్కోలు!',
        'ta-IN': 'வித்யா வாணியைப் பயன்படுத்தியதற்கு நன்றி. விடைபெறுகிறேன்!'
    },

    // Invalid option
    invalidOption: {
        'en-US': 'Invalid option. Returning to the main menu.',
        'hi-IN': 'अमान्य विकल्प। मुख्य मेनू पर वापस जा रहे हैं।',
        'te-IN': 'చెల్లని ఎంపిక. ప్రధాన మెనుకు తిరిగి వెళ్తోంది.',
        'ta-IN': 'தவறான விருப்பம். பிரதான மெனுவுக்குத் திரும்புகிறது.'
    },

    // Invalid language selection
    invalidLanguage: {
        'en-US': 'Invalid selection. Please try again.',
        'hi-IN': 'अमान्य चयन। कृपया पुनः प्रयास करें।',
        'te-IN': 'చెల్లని ఎంపిక. దయచేసి మళ్లీ ప్రయత్నించండి.',
        'ta-IN': 'தவறான தேர்வு. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.'
    },

    // Error messages
    aiServiceError: {
        'en-US': 'Sorry, AI service is not configured. Please add your OpenAI API key to the environment file.',
        'hi-IN': 'क्षमा करें, एआई सेवा कॉन्फ़िगर नहीं है। कृपया अपनी OpenAI API कुंजी पर्यावरण फ़ाइल में जोड़ें।',
        'te-IN': 'క్షమించండి, AI సేవ కాన్ఫిగర్ చేయబడలేదు. దయచేసి మీ OpenAI API కీని ఎన్విరాన్మెంట్ ఫైల్‌కు జోడించండి.',
        'ta-IN': 'மன்னிக்கவும், AI சேவை உள்ளமைக்கப்படவில்லை. தயவுசெய்து உங்கள் OpenAI API விசையை சூழல் கோப்பில் சேர்க்கவும்.'
    },

    databaseError: {
        'en-US': 'Sorry, database service is not available. This feature requires database connection.',
        'hi-IN': 'क्षमा करें, डेटाबेस सेवा उपलब्ध नहीं है। इस सुविधा के लिए डेटाबेस कनेक्शन की आवश्यकता है।',
        'te-IN': 'క్షమించండి, డేటాబేస్ సేవ అందుబాటులో లేదు. ఈ ఫీచర్‌కు డేటాబేస్ కనెక్షన్ అవసరం.',
        'ta-IN': 'மன்னிக்கவும், தரவுத்தள சேவை கிடைக்கவில்லை. இந்த அம்சத்திற்கு தரவுத்தள இணைப்பு தேவை.'
    },

    generalError: {
        'en-US': 'Sorry, I encountered an error. Please try again.',
        'hi-IN': 'क्षमा करें, मुझे एक त्रुटि का सामना करना पड़ा। कृपया पुनः प्रयास करें।',
        'te-IN': 'క్షమించండి, నేను ఒక లోపాన్ని ఎదుర్కొన్నాను. దయచేసి మళ్లీ ప్రయత్నించండి.',
        'ta-IN': 'மன்னிக்கவும், நான் ஒரு பிழையை எதிர்கொண்டேன். தயவுசெய்து மீண்டும் முயற்சிக்கவும்.'
    }
};

/**
 * Get language configuration by digit (1-4)
 * @param {string} digit - The digit pressed by user
 * @returns {object|null} Language configuration or null if invalid
 */
function getLanguageByDigit(digit) {
    return LANGUAGES[digit] || null;
}

/**
 * Get language configuration by language code (e.g., 'en-US', 'hi-IN')
 * @param {string} langCode - The language code
 * @returns {object|null} Language configuration or null if not found
 */
function getLanguageByCode(langCode) {
    return Object.values(LANGUAGES).find(lang => lang.code === langCode) || null;
}

/**
 * Get a prompt in the specified language
 * @param {string} promptKey - The key of the prompt (e.g., 'welcome', 'mainMenu')
 * @param {string} langCode - The language code (e.g., 'en-US', 'hi-IN')
 * @param {object} params - Optional parameters for string interpolation (e.g., {subject: 'Physics', count: 5})
 * @returns {string} The prompt text in the specified language
 */
function getPrompt(promptKey, langCode = 'en-US', params = {}) {
    let prompt = PROMPTS[promptKey]?.[langCode] || PROMPTS[promptKey]?.['en-US'] || '';

    // Replace placeholders like {subject}, {count} with actual values
    Object.keys(params).forEach(key => {
        prompt = prompt.replace(new RegExp(`\\{${key}\\}`, 'g'), params[key]);
    });

    return prompt;
}

/**
 * Get voice configuration for a language
 * @param {string} langCode - The language code
 * @returns {object} Object with voice and language properties
 */
function getVoiceConfig(langCode) {
    const lang = getLanguageByCode(langCode);
    return {
        voice: lang?.voice || 'Polly.Joanna',
        language: langCode
    };
}

/**
 * Check if a language code is supported
 * @param {string} langCode - The language code to check
 * @returns {boolean} True if supported, false otherwise
 */
function isLanguageSupported(langCode) {
    return Object.values(LANGUAGES).some(lang => lang.code === langCode);
}

module.exports = {
    LANGUAGES,
    PROMPTS,
    getLanguageByDigit,
    getLanguageByCode,
    getPrompt,
    getVoiceConfig,
    isLanguageSupported
};
