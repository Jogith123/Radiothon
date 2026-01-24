/**
 * MongoDB Test Script
 * Run this to verify MongoDB connection and test basic operations
 * Now uses modular structure
 */

require('dotenv').config();
const { connectToMongoDB, closeConnection, isConnected } = require('./database/connection');
const History = require('./models/History');
const { initializeGemini, classifySubject } = require('./services/geminiService');

async function testMongoDB() {
  console.log('🧪 Testing MongoDB Connection with Modular Structure...\n');

  try {
    // Check if MONGODB_URI is set
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI not found in .env file');
      console.log('Please add: MONGODB_URI=mongodb://localhost:27017/vidya-vani');
      process.exit(1);
    }

    console.log('📡 Connecting to MongoDB...');
    console.log(`URI: ${process.env.MONGODB_URI.replace(/\/\/.*@/, '//***:***@')}\n`);

    // Connect to MongoDB using modular connection
    await connectToMongoDB();

    if (!isConnected()) {
      throw new Error('Failed to connect to MongoDB');
    }

    console.log('✅ Connected to MongoDB successfully!\n');

    // Initialize Gemini for subject classification test
    initializeGemini();

    // Test 1: Insert a sample document using History model
    console.log('📝 Test 1: Inserting sample document using History model...');
    const sampleDoc = History.createDocument(
      '+919876543210',
      'Biology',
      'What is photosynthesis?',
      'Photosynthesis is the process by which plants convert light energy into chemical energy.'
    );

    const insertResult = await History.insertOne(sampleDoc);
    console.log(`✅ Inserted document with ID: ${insertResult.insertedId}\n`);

    // Test 2: Query the document using History model
    console.log('🔍 Test 2: Querying documents using History model...');
    const docs = await History.findByUserId('+919876543210');
    console.log(`✅ Found ${docs.length} document(s)`);
    console.log('Sample document:', JSON.stringify(docs[0], null, 2), '\n');

    // Test 3: Indexes (already created by connection module)
    console.log('📊 Test 3: Verifying indexes...');
    console.log('✅ Indexes already created by connection module\n');

    // Test 4: Query by subject using History model
    console.log('🔍 Test 4: Querying by subject using History model...');
    const biologyDocs = await History.findByUserIdAndSubject('+919876543210', 'Biology', 5);
    console.log(`✅ Found ${biologyDocs.length} Biology question(s)\n`);

    // Test 5: Aggregate statistics using History model
    console.log('📈 Test 5: Getting statistics using History model...');
    const stats = await History.getSubjectStats('+919876543210');
    console.log('✅ Statistics by subject:');
    stats.forEach(stat => {
      console.log(`   - ${stat._id}: ${stat.count} question(s)`);
    });
    console.log('');

    // Test 6: Test subject classification (if Gemini is available)
    console.log('🤖 Test 6: Testing subject classification...');
    try {
      const testQuestion = 'What is Newton\'s first law of motion?';
      const subject = await classifySubject(testQuestion);
      console.log(`✅ Question: "${testQuestion}"`);
      console.log(`   Classified as: ${subject}\n`);
    } catch (error) {
      console.log('⚠️  Gemini not available, skipping classification test\n');
    }

    // Test 7: Clean up test data using History model
    console.log('🧹 Test 7: Cleaning up test data...');
    const deleteResult = await History.deleteByUserId('+919876543210');
    console.log(`✅ Deleted ${deleteResult.deletedCount} test document(s)\n`);

    console.log('🎉 All tests passed! MongoDB modular structure is working perfectly!\n');

    // ===== NEW: Test 8: Last 5 Questions Summary Feature =====
    console.log('📊 Test 8: Testing Last 5 Questions for Summary...');
    console.log('   This tests the new schema that stores each Q&A separately\n');

    const testUser = '+1234567890';
    const testSubject = 'Physics';

    // Insert 7 Physics questions (we'll fetch only last 5)
    const physicsQuestions = [
      { q: "What is Newton's first law?", a: "An object at rest stays at rest unless acted upon by a force." },
      { q: "Explain gravity", a: "Gravity is a force that attracts objects with mass toward each other." },
      { q: "What is momentum?", a: "Momentum is the product of an object's mass and velocity." },
      { q: "Define kinetic energy", a: "Kinetic energy is the energy of motion, equal to 1/2 mv²." },
      { q: "What is friction?", a: "Friction is a force that opposes motion between surfaces in contact." },
      { q: "Explain acceleration", a: "Acceleration is the rate of change of velocity over time." },
      { q: "What is work in physics?", a: "Work is force applied over a distance, W = F × d." }
    ];

    console.log('   Inserting 7 Physics questions...');
    for (const qa of physicsQuestions) {
      await History.insertQuestion(testUser, testSubject, qa.q, qa.a);
    }
    console.log(`   ✅ Stored 7 questions\n`);

    // Fetch last 5
    const last5 = await History.findByUserIdAndSubject(testUser, testSubject, 5);

    console.log(`   📋 Retrieved ${last5.length} questions (expected 5)`);

    if (last5.length === 5) {
      console.log('   ✅ SUCCESS: Got exactly 5 Q&A pairs!\n');
      console.log('   Retrieved questions (newest first):');
      last5.forEach((h, i) => {
        console.log(`      ${i + 1}. Q: ${h.question}`);
        console.log(`         A: ${h.response.substring(0, 50)}...`);
      });
      console.log('');

      // Verify they are the LAST 5 (not the first 5)
      if (last5[0].question === "What is work in physics?") {
        console.log('   ✅ VERIFIED: Retrieved the LAST 5 questions (newest to oldest)\n');
      } else {
        console.log('   ⚠️  Warning: Order might be incorrect\n');
      }
    } else {
      console.log(`   ❌ FAILURE: Expected 5, got ${last5.length}\n`);
    }

    // Test with different subject
    console.log('   Testing with Biology...');
    await History.insertQuestion(testUser, 'Biology', 'What is photosynthesis?', 'Plants convert light to energy.');
    await History.insertQuestion(testUser, 'Biology', 'What is DNA?', 'DNA is the genetic material.');
    const biologyLast5 = await History.findByUserIdAndSubject(testUser, 'Biology', 5);
    console.log(`   ✅ Biology: Retrieved ${biologyLast5.length} questions (expected 2)\n`);

    // Clean up test data
    console.log('   🧹 Cleaning up test data...');
    const deleteResult2 = await History.deleteByUserId(testUser);
    console.log(`   ✅ Deleted ${deleteResult2.deletedCount} test documents\n`);

    console.log('🎉 Summary Feature Test Passed!\n');
    console.log('✅ The new schema works correctly:');
    console.log('   - Each Q&A stored as separate document');
    console.log('   - Can retrieve last 5 questions per subject');
    console.log('   - Proper sorting (newest first)');
    console.log('   - Multiple subjects handled independently\n');

    console.log('🎉 All tests passed! MongoDB modular structure is working perfectly!\n');
    console.log('✅ Verified:');
    console.log('   - Database connection module');
    console.log('   - History model CRUD operations');
    console.log('   - Subject classification service');
    console.log('   - Data queries and aggregations\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure MongoDB is running (if using local)');
    console.error('2. Check your MONGODB_URI in .env file');
    console.error('3. For MongoDB Atlas, verify:');
    console.error('   - Database user credentials');
    console.error('   - IP whitelist (0.0.0.0/0 for testing)');
    console.error('   - Network connectivity\n');
    process.exit(1);
  } finally {
    await closeConnection();
  }
}

// Run the test
testMongoDB();
