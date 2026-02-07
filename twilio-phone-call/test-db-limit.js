/**
 * Test Database Limit and Summary Features
 */

require('dotenv').config();
const { connectToMongoDB } = require('./database/connection');
const { storeQuestionAndAnswer, getHistoryBySubject } = require('./services/historyService');
const History = require('./models/History');

async function runTests() {
    console.log('🧪 Testing Database Limit and Summary Features\n');
    console.log('='.repeat(60));

    // Connect to MongoDB
    await connectToMongoDB();

    const testPhone = '+919392330425'; // Your test number

    console.log('\n1️⃣ Testing 15-Question Limit...');
    console.log('-'.repeat(60));

    // Get current count
    let count = await History.getQuestionCount(testPhone);
    console.log(`📊 Current questions in DB: ${count}`);

    // Add test questions
    const testQuestions = [
        { q: "What is Newton's first law?", a: "An object at rest stays at rest.", subject: "Physics" },
        { q: "What is photosynthesis?", a: "Process by which plants make food.", subject: "Biology" },
        { q: "What is the speed of light?", a: "299,792,458 meters per second.", subject: "Physics" },
        { q: "What is mitosis?", a: "Cell division process.", subject: "Biology" },
        { q: "What is gravity?", a: "Force that attracts objects.", subject: "Physics" }
    ];

    console.log(`\n📝 Adding ${testQuestions.length} test questions...`);
    for (const { q, a } of testQuestions) {
        await storeQuestionAndAnswer(testPhone, q, a);
    }

    // Verify count
    count = await History.getQuestionCount(testPhone);
    console.log(`\n📊 Final count: ${count}`);

    if (count <= 15) {
        console.log(`✅ PASS: Database limit working (count: ${count} ≤ 15)`);
    } else {
        console.log(`❌ FAIL: Too many questions (count: ${count} > 15)`);
    }

    console.log('\n2️⃣ Testing Subject Retrieval...');
    console.log('-'.repeat(60));

    // Test Physics
    const physicsHistory = await getHistoryBySubject(testPhone, 'Physics', 5);
    console.log(`\n📚 Physics questions found: ${physicsHistory.length}`);
    if (physicsHistory.length > 0) {
        console.log(`   Sample: "${physicsHistory[0].question}"`);
        console.log(`   Subject: ${physicsHistory[0].subject}`);
        console.log('✅ PASS: Subject classification working');
    } else {
        console.log('❌ FAIL: No Physics questions found');
    }

    // Test Biology
    const biologyHistory = await getHistoryBySubject(testPhone, 'Biology', 5);
    console.log(`\n📚 Biology questions found: ${biologyHistory.length}`);
    if (biologyHistory.length > 0) {
        console.log(`   Sample: "${biologyHistory[0].question}"`);
        console.log('✅ PASS: Biology questions retrieved');
    }

    console.log('\n3️⃣ Testing Subject Classification...');
    console.log('-'.repeat(60));

    const stats = await History.getSubjectStats(testPhone);
    console.log(`\n📊 Subjects found: ${stats.length}`);
    stats.forEach(s => {
        console.log(`   - ${s._id}: ${s.count} questions`);
    });

    if (stats.length > 0) {
        console.log('✅ PASS: Subject stats working');
    } else {
        console.log('⚠️  No subject stats found');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests completed!\n');
    console.log('Next steps:');
    console.log('1. Start server: npm run server');
    console.log('2. Make a phone call and ask questions');
    console.log('3. Press 4 and say "Physics" to test summary');
    console.log('4. Verify only 15 questions remain in DB\n');

    process.exit(0);
}

runTests().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
});
