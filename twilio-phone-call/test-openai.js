/**
 * Test OpenAI Service Integration
 * Quick test to verify OpenAI is working correctly
 */

require('dotenv').config();
const {
    initializeOpenAI,
    isInitialized,
    generateAnswer,
    classifySubject,
    generateSummary
} = require('./services/openaiService');

async function runTests() {
    console.log('🧪 Testing OpenAI Integration\n');
    console.log('='.repeat(50));

    // Test 1: Initialize
    console.log('\n1️⃣ Testing Initialization...');
    const initialized = initializeOpenAI();
    if (initialized && isInitialized()) {
        console.log('   ✅ OpenAI initialized successfully');
    } else {
        console.log('   ❌ Failed to initialize OpenAI');
        console.log('   Check OPENAI_API_KEY in .env file');
        return;
    }

    // Test 2: Generate Answer
    console.log('\n2️⃣ Testing Question Answering...');
    try {
        const question = "What is photosynthesis?";
        console.log(`   Question: "${question}"`);
        const answer = await generateAnswer(question);
        console.log(`   Answer: "${answer}"`);

        if (answer && answer.length > 0 && answer.length < 500) {
            console.log('   ✅ Answer generated successfully (concise and voice-friendly)');
        } else {
            console.log('   ⚠️  Answer might be too long or empty');
        }
    } catch (error) {
        console.log('   ❌ Error:', error.message);
    }

    // Test 3: Subject Classification
    console.log('\n3️⃣ Testing Subject Classification...');
    try {
        const testQuestions = [
            "What is the speed of light?",
            "Who was the first president of India?",
            "What is the chemical formula for water?"
        ];

        for (const q of testQuestions) {
            const subject = await classifySubject(q);
            console.log(`   "${q.substring(0, 40)}..." → ${subject}`);
        }
        console.log('   ✅ Subject classification working');
    } catch (error) {
        console.log('   ❌ Error:', error.message);
    }

    // Test 4: Summary Generation
    console.log('\n4️⃣ Testing Summary Generation...');
    try {
        const mockHistory = [
            {
                question: "What is Newton's first law?",
                response: "An object at rest stays at rest unless acted upon by an external force."
            },
            {
                question: "What is gravity?",
                response: "Gravity is the force that attracts objects toward each other."
            }
        ];

        const summary = await generateSummary('Physics', mockHistory);
        console.log(`   Summary: "${summary}"`);

        if (summary && summary.length > 0 && summary.length < 300) {
            console.log('   ✅ Summary generated successfully');
        } else {
            console.log('   ⚠️  Summary might be too long');
        }
    } catch (error) {
        console.log('   ❌ Error:', error.message);
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ All tests completed!');
    console.log('\nNext steps:');
    console.log('1. Run: npm run server');
    console.log('2. Make a test phone call');
    console.log('3. Press 1 and ask a question');
    console.log('4. Verify OpenAI generates the answer');
}

// Run tests
runTests().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
});
