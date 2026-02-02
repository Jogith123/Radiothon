/**
 * Test script to verify Exotel migration
 */

const { createWelcomeResponse, createQuestionRecordingResponse, createTTSResponse, createHangupResponse } = require('./services/exotelService');

console.log('🧪 Testing Exotel migration...\n');

// Test 1: Welcome response
console.log('1. Testing welcome response...');
try {
    const welcomeResponse = createWelcomeResponse();
    console.log('✅ Welcome response created successfully');
    console.log('   Response structure:', JSON.stringify(welcomeResponse, null, 2).substring(0, 200) + '...');
} catch (error) {
    console.log('❌ Welcome response failed:', error.message);
}

// Test 2: Question recording response
console.log('\n2. Testing question recording response...');
try {
    const recordResponse = createQuestionRecordingResponse();
    console.log('✅ Recording response created successfully');
    console.log('   Response structure:', JSON.stringify(recordResponse, null, 2).substring(0, 200) + '...');
} catch (error) {
    console.log('❌ Recording response failed:', error.message);
}

// Test 3: TTS response
console.log('\n3. Testing TTS response...');
try {
    const ttsResponse = createTTSResponse('Hello, this is a test.');
    console.log('✅ TTS response created successfully');
    console.log('   Response structure:', JSON.stringify(ttsResponse, null, 2).substring(0, 200) + '...');
} catch (error) {
    console.log('❌ TTS response failed:', error.message);
}

// Test 4: Hangup response
console.log('\n4. Testing hangup response...');
try {
    const hangupResponse = createHangupResponse();
    console.log('✅ Hangup response created successfully');
    console.log('   Response structure:', JSON.stringify(hangupResponse, null, 2));
} catch (error) {
    console.log('❌ Hangup response failed:', error.message);
}

// Test 5: Check if all required files exist
console.log('\n5. Checking file structure...');
const fs = require('fs');
const requiredFiles = [
    'services/exotelService.js',
    'services/redisService.js',
    'server.js',
    'package.json',
    '.env.example'
];

requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file} exists`);
    } else {
        console.log(`❌ ${file} missing`);
    }
});

// Test 6: Check if Twilio files are removed
console.log('\n6. Checking removed files...');
const removedFiles = [
    'makeCall.js',
    'fix-ngrok.ps1',
    'start-ngrok.bat',
    'update-url.js'
];

removedFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`❌ ${file} still exists (should be removed)`);
    } else {
        console.log(`✅ ${file} removed successfully`);
    }
});

console.log('\n🎉 Migration test completed!');
console.log('\n📋 Next steps:');
console.log('1. Set up Exotel account and get credentials');
console.log('2. Configure Redis server');
console.log('3. Update .env file with Exotel credentials');
console.log('4. Deploy to cloud hosting');
console.log('5. Configure Exotel Applet with webhook URL');
