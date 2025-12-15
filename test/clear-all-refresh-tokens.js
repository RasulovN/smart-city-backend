// Script to clear all refresh tokens from the database
require('dotenv').config();

const User = require('../models/user');

console.log('🧹 Clearing All Refresh Tokens...\n');

async function clearAllRefreshTokens() {
  try {
    console.log('1. Connecting to database...');
    
    // Connect to MongoDB
    const mongoose = require('mongoose');
    const connectDB = require('../db/mongo');
    await connectDB();
    console.log('✅ Connected to MongoDB');

    console.log('\n2. Finding users with refresh tokens...');
    const users = await User.find({ 'refreshTokens.0': { $exists: true } });
    console.log(`Found ${users.length} users with refresh tokens`);

    console.log('\n3. Clearing all refresh tokens...');
    let clearedCount = 0;
    
    for (const user of users) {
      if (user.refreshTokens && user.refreshTokens.length > 0) {
        user.refreshTokens = [];
        await user.save();
        clearedCount++;
        console.log(`  - Cleared ${user.refreshTokens.length} tokens for ${user.email}`);
      }
    }

    console.log(`\n✅ Successfully cleared refresh tokens for ${clearedCount} users`);
    
    // Verify no refresh tokens remain
    const remainingUsers = await User.find({ 'refreshTokens.0': { $exists: true } });
    console.log(`✅ Verification: ${remainingUsers.length} users still have refresh tokens`);

    console.log('\n🎉 All refresh tokens cleared successfully!');
    console.log('\n📝 Note: All users will need to log in again to get new refresh tokens.');

  } catch (error) {
    console.error('❌ Error clearing refresh tokens:', error);
  } finally {
    // Close database connection
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the function
clearAllRefreshTokens();