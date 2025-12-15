// Test file to check current environment variables and secrets
require('dotenv').config();

const jwt = require('jsonwebtoken');
const User = require('../models/user');

console.log('🔍 Checking Current Environment Variables and Secrets...\n');

// Check environment variables
console.log('1. Environment Variables Check:');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? `SET (${process.env.JWT_SECRET.substring(0, 20)}...)` : 'NOT SET');
console.log('JWT_REFRESH_SECRET:', process.env.JWT_REFRESH_SECRET ? `SET (${process.env.JWT_REFRESH_SECRET.substring(0, 20)}...)` : 'NOT SET');
console.log('NODE_ENV:', process.env.NODE_ENV || 'NOT SET');

// Test token utils loading
console.log('\n2. Testing Token Utils Loading:');
try {
  const tokenUtils = require('../utils/tokenUtils');
  console.log('✅ Token utils loaded successfully');
} catch (error) {
  console.log('❌ Token utils failed to load:', error.message);
}

// Check users with refresh tokens
console.log('\n3. Checking Users with Refresh Tokens:');
async function checkUsersWithRefreshTokens() {
  try {
    const users = await User.find({ 'refreshTokens.0': { $exists: true } });
    console.log(`Found ${users.length} users with refresh tokens:`);
    
    for (const user of users.slice(0, 5)) { // Check first 5 users
      console.log(`  - ${user.email} (${user.username}): ${user.refreshTokens.length} refresh tokens`);
      if (user.refreshTokens.length > 0) {
        const firstToken = user.refreshTokens[0].token;
        console.log(`    First token: ${firstToken.substring(0, 50)}...`);
      }
    }
  } catch (error) {
    console.log('❌ Error checking users:', error.message);
  }
}

checkUsersWithRefreshTokens();

// Test token verification with current secrets
console.log('\n4. Testing Token Verification with Current Secrets:');
try {
  const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
  
  if (!JWT_REFRESH_SECRET) {
    console.log('❌ JWT_REFRESH_SECRET not found');
  } else {
    // Try to decode a token to see if we can extract the payload
    console.log('Current JWT_REFRESH_SECRET:', JWT_REFRESH_SECRET.substring(0, 20) + '...');
  }
} catch (error) {
  console.log('❌ Error testing token verification:', error.message);
}

console.log('\n✅ Check completed!');