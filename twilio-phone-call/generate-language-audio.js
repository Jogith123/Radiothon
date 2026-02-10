/**
 * Generate language selection audio files using Google Cloud TTS
 * This script creates audio files for all 4 language selection prompts
 * because Amazon Polly doesn't support Telugu and Tamil
 */

require('dotenv').config();
const { initializeTTS, textToSpeechConvert } = require('./services/speechService');
const path = require('path');
const fs = require('fs');

// Language selection prompts
const languagePrompts = [
    {
        text: 'Welcome to Vidya Vani. Press 1 for English.',
        languageCode: 'en-US',
        filename: 'lang_select_english.mp3'
    },
    {
        text: 'विद्या वाणी में आपका स्वागत है। हिंदी के लिए दो दबाएं।',
        languageCode: 'hi-IN',
        filename: 'lang_select_hindi.mp3'
    },
    {
        text: 'విద్యా వాణి కి స్వాగతం. తెలుగు కోసం మూడు నొక్కండి.',
        languageCode: 'te-IN',
        filename: 'lang_select_telugu.mp3'
    },
    {
        text: 'வித்யா வாணி க்கு வரவேற்கிறோம். தமிழுக்கு நான்கு அழுத்தவும்.',
        languageCode: 'ta-IN',
        filename: 'lang_select_tamil.mp3'
    }
];

async function generateLanguageSelectionAudio() {
    console.log('🎙️ Generating language selection audio files...\n');

    // Initialize Google TTS
    initializeTTS();

    const audioDir = path.join(__dirname, 'audio');

    // Ensure audio directory exists
    if (!fs.existsSync(audioDir)) {
        fs.mkdirSync(audioDir, { recursive: true });
    }

    for (const prompt of languagePrompts) {
        try {
            console.log(`📝 Generating: ${prompt.filename}`);
            console.log(`   Language: ${prompt.languageCode}`);
            console.log(`   Text: ${prompt.text}`);

            // Generate audio using Google TTS
            const audioFileName = await textToSpeechConvert(
                prompt.text,
                `lang_select_${prompt.languageCode}`, // unique call ID
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

    console.log('✅ Language selection audio generation complete!');
    console.log('\nGenerated files:');
    languagePrompts.forEach(p => {
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
generateLanguageSelectionAudio()
    .then(() => {
        console.log('\n🎉 Done!');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Error:', error);
        process.exit(1);
    });
