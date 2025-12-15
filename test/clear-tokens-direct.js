// Script to manually clear refresh tokens using direct MongoDB operations
require('dotenv').config();

const mongoose = require('mongoose');

// Connect directly to MongoDB
async function clearRefreshTokens() {
  try {
    // Get MongoDB connection string from environment
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!mongoUri) {
      console.log('❌ MongoDB URI not found in environment variables');
      console.log('Available env vars:', Object.keys(process.env).filter(key => key.includes('MONGO') || key.includes('DB')));
      return;
    }

    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Define User schema directly
    const userSchema = new mongoose.Schema({
      username: String,
      email: String,
      password: String,
      role: String,
      sector: String,
      isActive: Boolean,
      refreshTokens: [{
        token: String,
        userAgent: String,
        ipAddress: String,
        createdAt: Date,
        expiresAt: Date
      }]
    });

    const User = mongoose.model('User', userSchema);

    console.log('\n🧹 Clearing all refresh tokens...');
    
    // Find all users with refresh tokens
    const usersWithTokens = await User.find({ 'refreshTokens.0': { $exists: true } });
    console.log(`Found ${usersWithTokens.length} users with refresh tokens`);

    // Clear all refresh tokens
    const result = await User.updateMany(
      { 'refreshTokens.0': { $exists: true } },
      { $set: { refreshTokens: [] } }
    );

    console.log(`✅ Cleared refresh tokens for ${result.modifiedCount} users`);

    // Verify no refresh tokens remain
    const remainingUsers = await User.find({ 'refreshTokens.0': { $exists: true } });
    console.log(`✅ Verification: ${remainingUsers.length} users still have refresh tokens`);

    console.log('\n🎉 All refresh tokens cleared successfully!');
    console.log('\n📝 Note: All users will need to log in again to get new refresh tokens.');

  } catch (error) {
    console.error('❌ Error clearing refresh tokens:', error);
  } finally {
    // Close database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the function
clearRefreshTokens();