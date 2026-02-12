/**
 * One-time script to create the admin user in Firebase Auth.
 * Run: node create-admin.js
 */
const admin = require('firebase-admin');

// Initialize with project ID (uses Application Default Credentials or service account)
admin.initializeApp({
  projectId: 'nxtwave-9a97b',
});

const ADMIN_EMAIL = 'admin@vidyavani.gov.in';
const ADMIN_PASSWORD = 'VidyaVani@2026';

async function createAdmin() {
  try {
    // Check if user already exists
    try {
      const existing = await admin.auth().getUserByEmail(ADMIN_EMAIL);
      console.log('Admin user already exists:', existing.uid);
      console.log('Email:', existing.email);
      process.exit(0);
    } catch (e) {
      if (e.code !== 'auth/user-not-found') throw e;
    }

    // Create the admin user
    const user = await admin.auth().createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      displayName: 'Administrator',
      emailVerified: true,
    });

    console.log('✅ Admin user created successfully!');
    console.log('   UID:', user.uid);
    console.log('   Email:', user.email);
    console.log('   Password:', ADMIN_PASSWORD);

    // Also set custom claims to mark as admin
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    console.log('   Custom claims set: { admin: true }');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('GOOGLE_APPLICATION_CREDENTIALS')) {
      console.log('\n💡 You need to set up Firebase Admin credentials.');
      console.log('   Option 1: Set GOOGLE_APPLICATION_CREDENTIALS env var');
      console.log('   Option 2: Use the Firebase Console to create the user manually:');
      console.log('   1. Go to https://console.firebase.google.com/project/nxtwave-9a97b/authentication/users');
      console.log('   2. Click "Add User"');
      console.log(`   3. Email: ${ADMIN_EMAIL}`);
      console.log(`   4. Password: ${ADMIN_PASSWORD}`);
    }
  }
  process.exit(0);
}

createAdmin();
