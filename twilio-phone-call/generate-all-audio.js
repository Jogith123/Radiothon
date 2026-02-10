/**
 * Generate ALL audio files for Telugu and Tamil using Google Cloud TTS
 * This ensures complete multilingual support since Amazon Polly doesn't support these languages
 */

require('dotenv').config();
const { initializeTTS, textToSpeechConvert } = require('./services/speechService');
const path = require('path');
const fs = require('fs');

// All prompts that need to be pre-generated for Telugu and Tamil
const allPrompts = {
    // Language selection
    'lang_select_telugu': {
        text: 'విద్యా వాణి కి స్వాగతం. తెలుగు కోసం మూడు నొక్కండి.',
        lang: 'te-IN'
    },
    'lang_select_tamil': {
        text: 'வித்யா வாணி க்கு வரவேற்கிறோம். தமிழுக்கு நான்கு அழுத்தவும்.',
        lang: 'ta-IN'
    },

    // Welcome messages
    'welcome_telugu': {
        text: 'విద్యా వాణి కి స్వాగతం, మీ ఏఐ విద్యా సహాయకుడు.',
        lang: 'te-IN'
    },
    'welcome_tamil': {
        text: 'வித்யா வாணி க்கு வரவேற்கிறோம், உங்கள் ஏஐ கல்வி உதவியாளர்.',
        lang: 'ta-IN'
    },

    // Main menu
    'menu_telugu': {
        text: 'విద్యా ప్రశ్న అడగడానికి ఒకటి నొక్కండి. రికార్డింగ్ ఆపడానికి రెండు నొక్కండి. సమాధానం పొందడానికి మూడు నొక్కండి. సారాంశం పొందడానికి నాలుగు నొక్కండి. మెనుకు తిరిగి వెళ్ళడానికి ఐదు నొక్కండి. మరిన్ని వివరాలు జోడించడానికి ఆరు నొక్కండి. కాల్ ముగించడానికి తొమ్మిది నొక్కండి.',
        lang: 'te-IN'
    },
    'menu_tamil': {
        text: 'கல்வி கேள்வி கேட்க ஒன்று அழுத்தவும். பதிவை நிறுத்த இரண்டு அழுத்தவும். பதிலைப் பெற மூன்று அழுத்தவும். சுருக்கத்தைப் பெற நான்கு அழுத்தவும். மெனுவுக்குத் திரும்ப ஐந்து அழுத்தவும். மேலும் விவரங்களைச் சேர்க்க ஆறு அழுத்தவும். அழைப்பை முடிக்க ஒன்பது அழுத்தவும்.',
        lang: 'ta-IN'
    },

    // Ask question
    'ask_question_telugu': {
        text: 'దయచేసి బీప్ తర్వాత మీ విద్యా ప్రశ్న అడగండి. రికార్డింగ్ ఆపడానికి రెండు నొక్కండి.',
        lang: 'te-IN'
    },
    'ask_question_tamil': {
        text: 'பீப் ஒலிக்குப் பிறகு உங்கள் கல்வி கேள்வியைக் கேளுங்கள். பதிவை நிறுத்த இரண்டு அழுத்தவும்.',
        lang: 'ta-IN'
    },

    // Recording stopped
    'recording_stopped_telugu': {
        text: 'రికార్డింగ్ ఆగిపోయింది. మీ ప్రశ్న ప్రాసెస్ చేయబడుతోంది. సమాధానం వినడానికి దయచేసి మూడు నొక్కండి.',
        lang: 'te-IN'
    },
    'recording_stopped_tamil': {
        text: 'பதிவு நிறுத்தப்பட்டது. உங்கள் கேள்வி செயலாக்கப்படுகிறது. பதிலைக் கேட்க மூன்று அழுத்தவும்.',
        lang: 'ta-IN'
    },

    // Question recorded
    'question_recorded_telugu': {
        text: 'ధన్యవాదాలు. మీ ప్రశ్న ప్రాసెస్ చేయబడుతోంది. సమాధానం వినడానికి దయచేసి మూడు నొక్కండి, లేదా మరొక ప్రశ్న అడగడానికి ఒకటి నొక్కండి.',
        lang: 'te-IN'
    },
    'question_recorded_tamil': {
        text: 'நன்றி. உங்கள் கேள்வி செயலாக்கப்படுகிறது. பதிலைக் கேட்க மூன்று அழுத்தவும், அல்லது மற்றொரு கேள்வி கேட்க ஒன்று அழுத்தவும்.',
        lang: 'ta-IN'
    },

    // Processing question
    'processing_telugu': {
        text: 'AI తో మీ ప్రశ్నను ప్రాసెస్ చేస్తోంది. దయచేసి వేచి ఉండండి.',
        lang: 'te-IN'
    },
    'processing_tamil': {
        text: 'AI உடன் உங்கள் கேள்வி செயலாக்கப்படுகிறது. தயவுசெய்து காத்திருங்கள்.',
        lang: 'ta-IN'
    },

    // After answer
    'after_answer_telugu': {
        text: 'మరొక ప్రశ్న అడగడానికి ఒకటి నొక్కండి, లేదా కాల్ ముగించడానికి తొమ్మిది నొక్కండి.',
        lang: 'te-IN'
    },
    'after_answer_tamil': {
        text: 'மற்றொரு கேள்வி கேட்க ஒன்று அழுத்தவும், அல்லது அழைப்பை முடிக்க ஒன்பது அழுத்தவும்.',
        lang: 'ta-IN'
    },

    // No question found
    'no_question_telugu': {
        text: 'ప్రశ్న కనుగొనబడలేదు. దయచేసి మొదట ప్రశ్న అడగడానికి ఒకటి నొక్కండి.',
        lang: 'te-IN'
    },
    'no_question_tamil': {
        text: 'கேள்வி கிடைக்கவில்லை. முதலில் கேள்வி கேட்க ஒன்று அழுத்தவும்.',
        lang: 'ta-IN'
    },

    // Still processing
    'still_processing_telugu': {
        text: 'మీ ప్రశ్న ఇంకా ప్రాసెస్ చేయబడుతోంది. దయచేసి ఒక క్షణం వేచి ఉండండి మరియు మళ్లీ మూడు నొక్కండి.',
        lang: 'te-IN'
    },
    'still_processing_tamil': {
        text: 'உங்கள் கேள்வி இன்னும் செயலாக்கப்படுகிறது. தயவுசெய்து சிறிது நேரம் காத்திருந்து மீண்டும் மூன்று அழுத்தவும்.',
        lang: 'ta-IN'
    },

    // Summary request
    'summary_request_telugu': {
        text: 'దయచేసి మీరు సారాంశం చేయాల్సిన విషయం చెప్పండి.',
        lang: 'te-IN'
    },
    'summary_request_tamil': {
        text: 'தயவுசெய்து நீங்கள் சுருக்கமாகச் சொல்ல வேண்டிய பாடத்தைச் சொல்லுங்கள்.',
        lang: 'ta-IN'
    },

    // Follow-up prompt
    'followup_prompt_telugu': {
        text: 'మీరు చివరి ప్రశ్నకు మరిన్ని వివరాలు జోడించవచ్చు. దయచేసి ఇప్పుడు మాట్లాడండి మరియు పూర్తయినప్పుడు రెండు నొక్కండి.',
        lang: 'te-IN'
    },
    'followup_prompt_tamil': {
        text: 'கடைசி கேள்விக்கு மேலும் விவரங்களைச் சேர்க்கலாம். தயவுசெய்து இப்போது பேசுங்கள் மற்றும் முடிந்ததும் இரண்டு அழுத்தவும்.',
        lang: 'ta-IN'
    },

    // Follow-up recorded
    'followup_recorded_telugu': {
        text: 'ధన్యవాదాలు. మీ అదనపు వివరాలు ప్రాసెస్ చేయబడుతున్నాయి. నవీకరించిన సమాధానం వినడానికి దయచేసి మూడు నొక్కండి.',
        lang: 'te-IN'
    },
    'followup_recorded_tamil': {
        text: 'நன்றி. உங்கள் கூடுதல் விவரங்கள் செயலாக்கப்படுகின்றன. புதுப்பிக்கப்பட்ட பதிலைக் கேட்க மூன்று அழுத்தவும்.',
        lang: 'ta-IN'
    },

    // No previous question
    'no_previous_telugu': {
        text: 'మునుపటి ప్రశ్న కనుగొనబడలేదు. దయచేసి మొదట ప్రశ్న అడగడానికి ఒకటి నొక్కండి.',
        lang: 'te-IN'
    },
    'no_previous_tamil': {
        text: 'முந்தைய கேள்வி கிடைக்கவில்லை. முதலில் கேள்வி கேட்க ஒன்று அழுத்தவும்.',
        lang: 'ta-IN'
    },

    // Goodbye
    'goodbye_telugu': {
        text: 'విద్యా వాణిని ఉపయోగించినందుకు ధన్యవాదాలు. వీడ్కోలు!',
        lang: 'te-IN'
    },
    'goodbye_tamil': {
        text: 'வித்யா வாணியைப் பயன்படுத்தியதற்கு நன்றி. விடைபெறுகிறேன்!',
        lang: 'ta-IN'
    },

    // Invalid option
    'invalid_option_telugu': {
        text: 'చెల్లని ఎంపిక. ప్రధాన మెనుకు తిరిగి వెళ్తోంది.',
        lang: 'te-IN'
    },
    'invalid_option_tamil': {
        text: 'தவறான விருப்பம். பிரதான மெனுவுக்குத் திரும்புகிறது.',
        lang: 'ta-IN'
    },

    // Error messages
    'ai_error_telugu': {
        text: 'క్షమించండి, AI సేవ కాన్ఫిగర్ చేయబడలేదు.',
        lang: 'te-IN'
    },
    'ai_error_tamil': {
        text: 'மன்னிக்கவும், AI சேவை உள்ளமைக்கப்படவில்லை.',
        lang: 'ta-IN'
    },

    'db_error_telugu': {
        text: 'క్షమించండి, డేటాబేస్ సేవ అందుబాటులో లేదు.',
        lang: 'te-IN'
    },
    'db_error_tamil': {
        text: 'மன்னிக்கவும், தரவுத்தள சேவை கிடைக்கவில்லை.',
        lang: 'ta-IN'
    },

    'general_error_telugu': {
        text: 'క్షమించండి, నేను ఒక లోపాన్ని ఎదుర్కొన్నాను. దయచేసి మళ్లీ ప్రయత్నించండి.',
        lang: 'te-IN'
    },
    'general_error_tamil': {
        text: 'மன்னிக்கவும், நான் ஒரு பிழையை எதிர்கொண்டேன். தயவுசெய்து மீண்டும் முயற்சிக்கவும்.',
        lang: 'ta-IN'
    }
};

async function generateAllAudio() {
    console.log('🎙️ Generating ALL Telugu and Tamil audio files...\n');
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

    for (const [key, prompt] of Object.entries(allPrompts)) {
        try {
            const filename = `${key}.mp3`;
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
                const targetPath = path.join(audioDir, filename);

                if (fs.existsSync(sourcePath)) {
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
            await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
            console.error(`   ❌ Error generating ${key}:`, error.message);
            console.log();
            failCount++;
        }
    }

    console.log('═'.repeat(60));
    console.log('📊 Generation Summary');
    console.log('═'.repeat(60));
    console.log(`✅ Success: ${successCount} files`);
    console.log(`❌ Failed: ${failCount} files`);
    console.log(`📁 Total: ${successCount + failCount} files`);
    console.log();

    // List all generated files
    console.log('Generated files:');
    const files = fs.readdirSync(audioDir).filter(f => f.endsWith('.mp3'));
    files.forEach(file => {
        const stats = fs.statSync(path.join(audioDir, file));
        console.log(`   ✓ ${file} (${Math.round(stats.size / 1024)}KB)`);
    });
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
