require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/user');
const config = require('./config');

const cleanupNullUsernames = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongoUrl);
    console.log('✅ Connected to MongoDB');

    // Find users with null usernames
    const usersWithNullUsernames = await User.find({ username: null });
    console.log(`Found ${usersWithNullUsernames.length} users with null usernames:`);
    usersWithNullUsernames.forEach(user => {
      console.log(`  - ID: ${user._id}, Email: ${user.email}, Role: ${user.role}`);
    });

    // Delete users with null usernames (but keep super_admin)
    const result = await User.deleteMany({ 
      username: null, 
      role: { $ne: 'super_admin' } 
    });
    
    console.log(`\n🗑️  Deleted ${result.deletedCount} users with null usernames`);
    
    // Verify remaining users
    const remainingUsers = await User.find({ username: null });
    console.log(`Remaining users with null usernames: ${remainingUsers.length}`);
    remainingUsers.forEach(user => {
      console.log(`  - ID: ${user._id}, Email: ${user.email}, Role: ${user.role}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

cleanupNullUsernames();