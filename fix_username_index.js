require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/user');
const config = require('./config');

const fixUsernameIndex = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongoUrl);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('users');

    // Drop the existing unique index on username
    try {
      await collection.dropIndex('username_1');
      console.log('🗑️  Dropped existing username_1 index');
    } catch (error) {
      console.log('ℹ️  username_1 index does not exist or already dropped');
    }

    // The unique index will be recreated automatically when we restart the server
    console.log('✅ Index fix completed. Restart the server to recreate the index.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

fixUsernameIndex();