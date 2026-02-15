const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { connectToMongoDB } = require('./database/connection');
const History = require('./models/History');

(async () => {
  try {
    await connectToMongoDB();
    
    const collection = History.getCollection();
    if (!collection) {
      console.log('❌ Database not connected!');
      process.exit(1);
    }
    
    const count = await collection.countDocuments();
    console.log('\n📊 Total documents in History collection:', count);
    
    if (count === 0) {
      console.log('\n⚠️  NO DATA IN DATABASE - This is why metrics show 0!');
      console.log('   Make a test phone call to populate data.');
      process.exit(0);
    }
    
    const recent = await collection.find().sort({ timestamp: -1 }).limit(10).toArray();
    console.log('\n📝 Recent 10 calls:');
    recent.forEach((r, i) => {
      console.log(`  ${i+1}. [${r.subject}] ${r.user_id} - ${r.question.substring(0, 60)}...`);
      console.log(`     Time: ${r.timestamp}`);
    });
    
    // Get unique users
    const users = await collection.distinct('user_id');
    console.log(`\n👥 Unique users: ${users.length}`);
    users.forEach(u => console.log(`  - ${u}`));
    
    // Get subject breakdown
    const subjects = await collection.aggregate([
      { $group: { _id: '$subject', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    console.log('\n📚 Subject breakdown:');
    subjects.forEach(s => console.log(`  - ${s._id}: ${s.count} calls`));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
