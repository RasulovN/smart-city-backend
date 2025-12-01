require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/user');
const config = require('./config');

const debugUserCreation = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongoUrl);
    console.log('✅ Connected to MongoDB');

    // Test creating a user without username
    console.log('\n🧪 Testing user creation without username...');
    
    const userData = {
      email: 'test-debug@smartcity.uz',
      password: 'test123',
      role: 'sector_admin',
      sector: 'health',
      createdBy: null
    };
    
    console.log('User data to be saved:', JSON.stringify(userData, null, 2));
    
    const newUser = new User(userData);
    console.log('User object before save:', JSON.stringify(newUser.toObject(), null, 2));
    
    await newUser.save();
    
    console.log('User object after save:', JSON.stringify(newUser.toObject(), null, 2));
    
    // Check what's in the database
    const savedUser = await User.findById(newUser._id);
    console.log('Saved user from database:', JSON.stringify(savedUser.toObject(), null, 2));
    
    // Clean up
    await User.findByIdAndDelete(newUser._id);
    console.log('\n🗑️  Test user deleted');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

debugUserCreation();