/**
 * Generate main menu audio files for Telugu and Tamil using Google Cloud TTS
 * These languages need pre-generated audio because Amazon Polly doesn't support them
 */

require('dotenv').config();
const { initializeTTS, textToSpeechConvert } = require('./services/speechService');
const path = require('path');
const fs = require('fs');

// Main menu prompts for Telugu and Tamil
const menuPrompts = [
    {
        text: 'విద్యా ప్రశ్న అడగడానికి ఒకటి నొక్కండి. రికార్డింగ్ ఆపడానికి రెండు నొక్కండి. సమాధానం పొందడానికి మూడు నొక్కండి. సారాంశం పొందడానికి నాలుగు నొక్కండి. మెనుకు తిరిగి వెళ్ళడానికి ఐదు నొక్కండి. మరిన్ని వివరాలు జోడించడానికి ఆరు నొక్కండి. కాల్ ముగించడానికి తొమ్మిది నొక్కండి.',
        languageCode: 'te-IN',
        filename: 'menu_telugu.mp3'
    },
    {
        text: 'கல்வி கேள்வி கேட்க ஒன்று அழுத்தவும். பதிவை நிறுத்த இரண்டு அழுத்தவும். பதிலைப் பெற மூன்று அழுத்தவும். சுருக்கத்தைப் பெற நான்கு அழுத்தவும். மெனுவுக்குத் திரும்ப ஐந்து அழுத்தவும். மேலும் விவரங்களைச் சேர்க்க ஆறு அழுத்தவும். அழைப்பை முடிக்க ஒன்பது அழுத்தவும்.',
        languageCode: 'ta-IN',
        filename: 'menu_tamil.mp3'
    },
    {
        text: 'సమాధానం కోసం 3 నొక్కండి, లేదా కొత్త ప్రశ్న కోసం 1 నొక్కండి.',
        languageCode: 'te-IN',
        filename: 'question_recorded_options_telugu.mp3'
    },
    {
        text: 'பதிலுக்கு 3 ஐ அழுத்தவும், அல்லது புதிய கேள்விக்கு 1 ஐ அழுத்தவும்.',
        languageCode: 'ta-IN',
        filename: 'question_recorded_options_tamil.mp3'
    }
];

async function generateMenuAudio() {
    console.log('🎙️ Generating main menu audio files for Telugu and Tamil...\n');

    // Initialize Google TTS
    initializeTTS();

    const audioDir = path.join(__dirname, 'audio');

    // Ensure audio directory exists
    if (!fs.existsSync(audioDir)) {
        fs.mkdirSync(audioDir, { recursive: true });
    }

    for (const prompt of menuPrompts) {
        try {
            console.log(`📝 Generating: ${prompt.filename}`);
            console.log(`   Language: ${prompt.languageCode}`);
            console.log(`   Text: ${prompt.text.substring(0, 80)}...`);

            // Generate audio using Google TTS
            const audioFileName = await textToSpeechConvert(
                prompt.text,
                `menu_${prompt.languageCode}`, // unique call ID
                prompt.languageCode
            );

            if (audioFileName) {
                // Rename to our desired filename
                const sourcePath = path.join(audioDir, audioFileName);
                const targetPath = path.join(audioDir, prompt.filename);

                if (fs.existsSync(sourcePath)) {
                    fs.renameSync(sourcePath, targetPath);
                    console.log(`   ✅ Created: ${prompt.filename}\n`);
                } else {
                    console.log(`   ⚠️  Source file not found: ${audioFileName}\n`);
                }
            } else {
                console.log(`   ❌ Failed to generate audio\n`);
            }

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
            console.error(`   ❌ Error generating ${prompt.filename}:`, error.message);
            console.log();
        }
    }

    console.log('✅ Main menu audio generation complete!');
    console.log('\nGenerated files:');
    menuPrompts.forEach(p => {
        const filePath = path.join(audioDir, p.filename);
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            console.log(`   ✓ ${p.filename} (${Math.round(stats.size / 1024)}KB)`);
        } else {
            console.log(`   ✗ ${p.filename} (missing)`);
        }
    });
}

// Run the generation
generateMenuAudio()
    .then(() => {
        console.log('\n🎉 Done!');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Error:', error);
        process.exit(1);
    });
