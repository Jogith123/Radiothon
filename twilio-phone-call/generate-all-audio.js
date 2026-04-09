/**
 * Generate ALL audio files for English, Hindi, Telugu and Tamil using Google Cloud TTS
 * This ensures complete multilingual support for the IVR system
 */

require('dotenv').config();
const { initializeTTS, textToSpeechConvert } = require('./services/speechService');
const path = require('path');
const fs = require('fs');

// All prompts that need to be pre-generated for all 4 languages
const allPrompts = {
    // ==========================================
    // LANGUAGE SELECTION (played at start)
    // ==========================================
    'lang_select_english': {
        text: 'Welcome to Vidya Vani. Press 1 for English.',
        lang: 'en-US'
    },
    'lang_select_hindi': {
        text: 'विद्या वाणी में आपका स्वागत है। हिंदी के लिए दो दबाएं।',
        lang: 'hi-IN'
    },
    'lang_select_telugu': {
        text: 'విద్యా వాణి కి స్వాగతం. తెలుగు కోసం మూడు నొక్కండి.',
        lang: 'te-IN'
    },
    'lang_select_tamil': {
        text: 'வித்யா வாணி க்கு வரவேற்கிறோம். தமிழுக்கு நான்கு அழுத்தவும்.',
        lang: 'ta-IN'
    },

    // ==========================================
    // ENGLISH PROMPTS
    // ==========================================
    'welcome_english': {
        text: 'Welcome to Vidya Vani, your AI powered educational assistant.',
        lang: 'en-US'
    },
    'menu_english': {
        text: 'Press 1 to ask an educational question. Press 2 to stop recording. Press 3 to get the answer. Press 4 to get a summary of your questions on a subject. Press 5 to return to main menu. Press 6 to add more details to your last question. Press 9 to end the call.',
        lang: 'en-US'
    },
    'ask_question_english': {
        text: 'Please ask your educational question after the beep. Press 2 to stop recording.',
        lang: 'en-US'
    },
    'recording_stopped_english': {
        text: 'Recording stopped. Your question is being processed. Please press 3 to hear the answer.',
        lang: 'en-US'
    },
    'question_recorded_english': {
        text: 'Thank you. Your question is being processed. Please press 3 to hear the answer, or press 1 to ask another question.',
        lang: 'en-US'
    },
    'processing_english': {
        text: 'Processing your question with AI. Please wait.',
        lang: 'en-US'
    },
    'after_answer_english': {
        text: 'Press 1 to ask another question, or press 9 to end the call.',
        lang: 'en-US'
    },
    'no_question_english': {
        text: 'No question found. Please press 1 to ask a question first.',
        lang: 'en-US'
    },
    'still_processing_english': {
        text: 'Your question is still being processed. Please wait a moment and press 3 again.',
        lang: 'en-US'
    },
    'summary_request_english': {
        text: 'Please tell me the subject you need to summarize.',
        lang: 'en-US'
    },
    'followup_prompt_english': {
        text: 'You can add more details to the last question. Please speak now and press 2 when finished.',
        lang: 'en-US'
    },
    'followup_recorded_english': {
        text: 'Thank you. Your additional details are being processed. Please press 3 to hear the updated answer.',
        lang: 'en-US'
    },
    'no_previous_english': {
        text: 'No previous question found. Please press 1 to ask a question first.',
        lang: 'en-US'
    },
    'goodbye_english': {
        text: 'Thank you for using Vidya Vani. Goodbye!',
        lang: 'en-US'
    },
    'invalid_option_english': {
        text: 'Invalid option. Returning to the main menu.',
        lang: 'en-US'
    },
    'ai_error_english': {
        text: 'Sorry, AI service is not configured. Please add your OpenAI API key to the environment file.',
        lang: 'en-US'
    },
    'db_error_english': {
        text: 'Sorry, database service is not available. This feature requires database connection.',
        lang: 'en-US'
    },
    'general_error_english': {
        text: 'Sorry, I encountered an error. Please try again.',
        lang: 'en-US'
    },

    // ==========================================
    // HINDI PROMPTS
    // ==========================================
    'welcome_hindi': {
        text: 'विद्या वाणी में आपका स्वागत है, आपका एआई शैक्षिक सहायक।',
        lang: 'hi-IN'
    },
    'menu_hindi': {
        text: 'शैक्षिक प्रश्न पूछने के लिए 1 दबाएं। रिकॉर्डिंग बंद करने के लिए 2 दबाएं। उत्तर पाने के लिए 3 दबाएं। किसी विषय पर अपने प्रश्नों का सारांश पाने के लिए 4 दबाएं। मुख्य मेनू पर वापस जाने के लिए 5 दबाएं। अपने अंतिम प्रश्न में अधिक विवरण जोड़ने के लिए 6 दबाएं। कॉल समाप्त करने के लिए 9 दबाएं।',
        lang: 'hi-IN'
    },
    'ask_question_hindi': {
        text: 'कृपया बीप के बाद अपना शैक्षिक प्रश्न पूछें। रिकॉर्डिंग बंद करने के लिए 2 दबाएं।',
        lang: 'hi-IN'
    },
    'recording_stopped_hindi': {
        text: 'रिकॉर्डिंग बंद हो गई। आपका प्रश्न संसाधित किया जा रहा है। उत्तर सुनने के लिए कृपया 3 दबाएं।',
        lang: 'hi-IN'
    },
    'question_recorded_hindi': {
        text: 'धन्यवाद। आपका प्रश्न संसाधित किया जा रहा है। उत्तर सुनने के लिए कृपया 3 दबाएं, या दूसरा प्रश्न पूछने के लिए 1 दबाएं।',
        lang: 'hi-IN'
    },
    'processing_hindi': {
        text: 'एआई के साथ आपके प्रश्न को संसाधित किया जा रहा है। कृपया प्रतीक्षा करें।',
        lang: 'hi-IN'
    },
    'after_answer_hindi': {
        text: 'दूसरा प्रश्न पूछने के लिए 1 दबाएं, या कॉल समाप्त करने के लिए 9 दबाएं।',
        lang: 'hi-IN'
    },
    'no_question_hindi': {
        text: 'कोई प्रश्न नहीं मिला। कृपया पहले प्रश्न पूछने के लिए 1 दबाएं।',
        lang: 'hi-IN'
    },
    'still_processing_hindi': {
        text: 'आपका प्रश्न अभी भी संसाधित किया जा रहा है। कृपया एक क्षण प्रतीक्षा करें और फिर से 3 दबाएं।',
        lang: 'hi-IN'
    },
    'summary_request_hindi': {
        text: 'कृपया मुझे वह विषय बताएं जिसका आपको सारांश चाहिए।',
        lang: 'hi-IN'
    },
    'followup_prompt_hindi': {
        text: 'आप अंतिम प्रश्न में अधिक विवरण जोड़ सकते हैं। कृपया अभी बोलें और समाप्त होने पर 2 दबाएं।',
        lang: 'hi-IN'
    },
    'followup_recorded_hindi': {
        text: 'धन्यवाद। आपके अतिरिक्त विवरण संसाधित किए जा रहे हैं। अद्यतन उत्तर सुनने के लिए कृपया 3 दबाएं।',
        lang: 'hi-IN'
    },
    'no_previous_hindi': {
        text: 'कोई पिछला प्रश्न नहीं मिला। कृपया पहले प्रश्न पूछने के लिए 1 दबाएं।',
        lang: 'hi-IN'
    },
    'goodbye_hindi': {
        text: 'विद्या वाणी का उपयोग करने के लिए धन्यवाद। अलविदा!',
        lang: 'hi-IN'
    },
    'invalid_option_hindi': {
        text: 'अमान्य विकल्प। मुख्य मेनू पर वापस जा रहे हैं।',
        lang: 'hi-IN'
    },
    'ai_error_hindi': {
        text: 'क्षमा करें, एआई सेवा कॉन्फ़िगर नहीं है।',
        lang: 'hi-IN'
    },
    'db_error_hindi': {
        text: 'क्षमा करें, डेटाबेस सेवा उपलब्ध नहीं है।',
        lang: 'hi-IN'
    },
    'general_error_hindi': {
        text: 'क्षमा करें, मुझे एक त्रुटि का सामना करना पड़ा। कृपया पुनः प्रयास करें।',
        lang: 'hi-IN'
    },

    // ==========================================
    // TELUGU PROMPTS
    // ==========================================
    'welcome_telugu': {
        text: 'విద్యా వాణి కి స్వాగతం, మీ ఏఐ విద్యా సహాయకుడు.',
        lang: 'te-IN'
    },
    'menu_telugu': {
        text: 'విద్యా ప్రశ్న అడగడానికి ఒకటి నొక్కండి. రికార్డింగ్ ఆపడానికి రెండు నొక్కండి. సమాధానం పొందడానికి మూడు నొక్కండి. సారాంశం పొందడానికి నాలుగు నొక్కండి. మెనుకు తిరిగి వెళ్ళడానికి ఐదు నొక్కండి. మరిన్ని వివరాలు జోడించడానికి ఆరు నొక్కండి. కాల్ ముగించడానికి తొమ్మిది నొక్కండి.',
        lang: 'te-IN'
    },
    'ask_question_telugu': {
        text: 'దయచేసి బీప్ తర్వాత మీ విద్యా ప్రశ్న అడగండి. రికార్డింగ్ ఆపడానికి రెండు నొక్కండి.',
        lang: 'te-IN'
    },
    'recording_stopped_telugu': {
        text: 'రికార్డింగ్ ఆగిపోయింది. మీ ప్రశ్న ప్రాసెస్ చేయబడుతోంది. సమాధానం వినడానికి దయచేసి మూడు నొక్కండి.',
        lang: 'te-IN'
    },
    'question_recorded_telugu': {
        text: 'ధన్యవాదాలు. మీ ప్రశ్న ప్రాసెస్ చేయబడుతోంది. సమాధానం వినడానికి దయచేసి మూడు నొక్కండి, లేదా మరొక ప్రశ్న అడగడానికి ఒకటి నొక్కండి.',
        lang: 'te-IN'
    },
    'processing_telugu': {
        text: 'AI తో మీ ప్రశ్నను ప్రాసెస్ చేస్తోంది. దయచేసి వేచి ఉండండి.',
        lang: 'te-IN'
    },
    'after_answer_telugu': {
        text: 'మరొక ప్రశ్న అడగడానికి ఒకటి నొక్కండి, లేదా కాల్ ముగించడానికి తొమ్మిది నొక్కండి.',
        lang: 'te-IN'
    },
    'no_question_telugu': {
        text: 'ప్రశ్న కనుగొనబడలేదు. దయచేసి మొదట ప్రశ్న అడగడానికి ఒకటి నొక్కండి.',
        lang: 'te-IN'
    },
    'still_processing_telugu': {
        text: 'మీ ప్రశ్న ఇంకా ప్రాసెస్ చేయబడుతోంది. దయచేసి ఒక క్షణం వేచి ఉండండి మరియు మళ్లీ మూడు నొక్కండి.',
        lang: 'te-IN'
    },
    'summary_request_telugu': {
        text: 'దయచేసి మీరు సారాంశం చేయాల్సిన విషయం చెప్పండి.',
        lang: 'te-IN'
    },
    'followup_prompt_telugu': {
        text: 'మీరు చివరి ప్రశ్నకు మరిన్ని వివరాలు జోడించవచ్చు. దయచేసి ఇప్పుడు మాట్లాడండి మరియు పూర్తయినప్పుడు రెండు నొక్కండి.',
        lang: 'te-IN'
    },
    'followup_recorded_telugu': {
        text: 'ధన్యవాదాలు. మీ అదనపు వివరాలు ప్రాసెస్ చేయబడుతున్నాయి. నవీకరించిన సమాధానం వినడానికి దయచేసి మూడు నొక్కండి.',
        lang: 'te-IN'
    },
    'no_previous_telugu': {
        text: 'మునుపటి ప్రశ్న కనుగొనబడలేదు. దయచేసి మొదట ప్రశ్న అడగడానికి ఒకటి నొక్కండి.',
        lang: 'te-IN'
    },
    'goodbye_telugu': {
        text: 'విద్యా వాణిని ఉపయోగించినందుకు ధన్యవాదాలు. వీడ్కోలు!',
        lang: 'te-IN'
    },
    'invalid_option_telugu': {
        text: 'చెల్లని ఎంపిక. ప్రధాన మెనుకు తిరిగి వెళ్తోంది.',
        lang: 'te-IN'
    },
    'ai_error_telugu': {
        text: 'క్షమించండి, AI సేవ కాన్ఫిగర్ చేయబడలేదు.',
        lang: 'te-IN'
    },
    'db_error_telugu': {
        text: 'క్షమించండి, డేటాబేస్ సేవ అందుబాటులో లేదు.',
        lang: 'te-IN'
    },
    'general_error_telugu': {
        text: 'క్షమించండి, నేను ఒక లోపాన్ని ఎదుర్కొన్నాను. దయచేసి మళ్లీ ప్రయత్నించండి.',
        lang: 'te-IN'
    },

    // ==========================================
    // TAMIL PROMPTS
    // ==========================================
    'welcome_tamil': {
        text: 'வித்யா வாணி க்கு வரவேற்கிறோம், உங்கள் ஏஐ கல்வி உதவியாளர்.',
        lang: 'ta-IN'
    },
    'menu_tamil': {
        text: 'கல்வி கேள்வி கேட்க ஒன்று அழுத்தவும். பதிவை நிறுத்த இரண்டு அழுத்தவும். பதிலைப் பெற மூன்று அழுத்தவும். சுருக்கத்தைப் பெற நான்கு அழுத்தவும். மெனுவுக்குத் திரும்ப ஐந்து அழுத்தவும். மேலும் விவரங்களைச் சேர்க்க ஆறு அழுத்தவும். அழைப்பை முடிக்க ஒன்பது அழுத்தவும்.',
        lang: 'ta-IN'
    },
    'ask_question_tamil': {
        text: 'பீப் ஒலிக்குப் பிறகு உங்கள் கல்வி கேள்வியைக் கேளுங்கள். பதிவை நிறுத்த இரண்டு அழுத்தவும்.',
        lang: 'ta-IN'
    },
    'recording_stopped_tamil': {
        text: 'பதிவு நிறுத்தப்பட்டது. உங்கள் கேள்வி செயலாக்கப்படுகிறது. பதிலைக் கேட்க மூன்று அழுத்தவும்.',
        lang: 'ta-IN'
    },
    'question_recorded_tamil': {
        text: 'நன்றி. உங்கள் கேள்வி செயலாக்கப்படுகிறது. பதிலைக் கேட்க மூன்று அழுத்தவும், அல்லது மற்றொரு கேள்வி கேட்க ஒன்று அழுத்தவும்.',
        lang: 'ta-IN'
    },
    'processing_tamil': {
        text: 'AI உடன் உங்கள் கேள்வி செயலாக்கப்படுகிறது. தயவுசெய்து காத்திருங்கள்.',
        lang: 'ta-IN'
    },
    'after_answer_tamil': {
        text: 'மற்றொரு கேள்வி கேட்க ஒன்று அழுத்தவும், அல்லது அழைப்பை முடிக்க ஒன்பது அழுத்தவும்.',
        lang: 'ta-IN'
    },
    'no_question_tamil': {
        text: 'கேள்வி கிடைக்கவில்லை. முதலில் கேள்வி கேட்க ஒன்று அழுத்தவும்.',
        lang: 'ta-IN'
    },
    'still_processing_tamil': {
        text: 'உங்கள் கேள்வி இன்னும் செயலாக்கப்படுகிறது. தயவுசெய்து சிறிது நேரம் காத்திருந்து மீண்டும் மூன்று அழுத்தவும்.',
        lang: 'ta-IN'
    },
    'summary_request_tamil': {
        text: 'தயவுசெய்து நீங்கள் சுருக்கமாகச் சொல்ல வேண்டிய பாடத்தைச் சொல்லுங்கள்.',
        lang: 'ta-IN'
    },
    'followup_prompt_tamil': {
        text: 'கடைசி கேள்விக்கு மேலும் விவரங்களைச் சேர்க்கலாம். தயவுசெய்து இப்போது பேசுங்கள் மற்றும் முடிந்ததும் இரண்டு அழுத்தவும்.',
        lang: 'ta-IN'
    },
    'followup_recorded_tamil': {
        text: 'நன்றி. உங்கள் கூடுதல் விவரங்கள் செயலாக்கப்படுகின்றன. புதுப்பிக்கப்பட்ட பதிலைக் கேட்க மூன்று அழுத்தவும்.',
        lang: 'ta-IN'
    },
    'no_previous_tamil': {
        text: 'முந்தைய கேள்வி கிடைக்கவில்லை. முதலில் கேள்வி கேட்க ஒன்று அழுத்தவும்.',
        lang: 'ta-IN'
    },
    'goodbye_tamil': {
        text: 'வித்யா வாணியைப் பயன்படுத்தியதற்கு நன்றி. விடைபெறுகிறேன்!',
        lang: 'ta-IN'
    },
    'invalid_option_tamil': {
        text: 'தவறான விருப்பம். பிரதான மெனுவுக்குத் திரும்புகிறது.',
        lang: 'ta-IN'
    },
    'ai_error_tamil': {
        text: 'மன்னிக்கவும், AI சேவை உள்ளமைக்கப்படவில்லை.',
        lang: 'ta-IN'
    },
    'db_error_tamil': {
        text: 'மன்னிக்கவும், தரவுத்தள சேவை கிடைக்கவில்லை.',
        lang: 'ta-IN'
    },
    'general_error_tamil': {
        text: 'மன்னிக்கவும், நான் ஒரு பிழையை எதிர்கொண்டேன். தயவுசெய்து மீண்டும் முயற்சிக்கவும்.',
        lang: 'ta-IN'
    }
};

async function generateAllAudio() {
    console.log('🎙️ Generating ALL audio files for English, Hindi, Telugu and Tamil...\n');
    console.log(`Total prompts to generate: ${Object.keys(allPrompts).length}\n`);

    // Initialize Google TTS
    initializeTTS();

    const audioDir = path.join(__dirname, 'audio');

    // Ensure audio directory exists
    if (!fs.existsSync(audioDir)) {
        fs.mkdirSync(audioDir, { recursive: true });
    }

    let successCount = 0;
    let failCount = 0;
    let skippedCount = 0;

    for (const [key, prompt] of Object.entries(allPrompts)) {
        try {
            const filename = `${key}.mp3`;
            const targetPath = path.join(audioDir, filename);

            // Skip if file already exists and is valid (> 1KB)
            if (fs.existsSync(targetPath)) {
                const stats = fs.statSync(targetPath);
                if (stats.size > 1024) {
                    console.log(`⏭️  Skipping: ${filename} (already exists, ${Math.round(stats.size / 1024)}KB)`);
                    skippedCount++;
                    continue;
                }
            }

            console.log(`📝 Generating: ${filename}`);
            console.log(`   Language: ${prompt.lang}`);
            console.log(`   Text: ${prompt.text.substring(0, 60)}...`);

            // Generate audio using Google TTS
            const audioFileName = await textToSpeechConvert(
                prompt.text,
                `prompt_${key}`, // unique call ID
                prompt.lang
            );

            if (audioFileName) {
                // Rename to our desired filename
                const sourcePath = path.join(audioDir, audioFileName);

                if (fs.existsSync(sourcePath)) {
                    // Remove existing target if any
                    if (fs.existsSync(targetPath)) {
                        fs.unlinkSync(targetPath);
                    }
                    fs.renameSync(sourcePath, targetPath);
                    console.log(`   ✅ Created: ${filename}\n`);
                    successCount++;
                } else {
                    console.log(`   ⚠️  Source file not found: ${audioFileName}\n`);
                    failCount++;
                }
            } else {
                console.log(`   ❌ Failed to generate audio\n`);
                failCount++;
            }

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 300));

        } catch (error) {
            console.error(`   ❌ Error generating ${key}:`, error.message);
            console.log();
            failCount++;
        }
    }

    console.log('═'.repeat(60));
    console.log('📊 Generation Summary');
    console.log('═'.repeat(60));
    console.log(`✅ Generated: ${successCount} files`);
    console.log(`⏭️  Skipped: ${skippedCount} files (already existed)`);
    console.log(`❌ Failed: ${failCount} files`);
    console.log(`📁 Total: ${successCount + skippedCount + failCount} files`);
    console.log();

    // List all generated files grouped by language
    console.log('All audio files:');
    const files = fs.readdirSync(audioDir).filter(f => f.endsWith('.mp3') && !f.startsWith('answer_'));

    const groups = { 'Language Selection': [], 'English': [], 'Hindi': [], 'Telugu': [], 'Tamil': [] };
    files.forEach(file => {
        if (file.startsWith('lang_select_')) groups['Language Selection'].push(file);
        else if (file.includes('_english')) groups['English'].push(file);
        else if (file.includes('_hindi')) groups['Hindi'].push(file);
        else if (file.includes('_telugu')) groups['Telugu'].push(file);
        else if (file.includes('_tamil')) groups['Tamil'].push(file);
    });

    for (const [group, groupFiles] of Object.entries(groups)) {
        console.log(`\n  📂 ${group} (${groupFiles.length} files):`);
        groupFiles.forEach(file => {
            const stats = fs.statSync(path.join(audioDir, file));
            console.log(`     ✓ ${file} (${Math.round(stats.size / 1024)}KB)`);
        });
    }
}

// Run the generation
generateAllAudio()
    .then(() => {
        console.log('\n🎉 Done!');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Error:', error);
        process.exit(1);
    });
