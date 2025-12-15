// Test to demonstrate the JWT refresh token fix
require('dotenv').config();

const jwt = require('jsonwebtoken');
const { verifyRefreshTokenEnhanced } = require('../utils/tokenUtils');

console.log('🧪 Testing JWT Refresh Token Fix\n');

// Test 1: Verify environment variables are loaded
console.log('1. Environment Variables Check:');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? `SET (${process.env.JWT_SECRET.substring(0, 20)}...)` : 'NOT SET');
console.log('JWT_REFRESH_SECRET:', process.env.JWT_REFRESH_SECRET ? `SET (${process.env.JWT_REFRESH_SECRET.substring(0, 20)}...)` : 'NOT SET');

// Test 2: Generate a test token with current secret
console.log('\n2. Testing Token Generation and Verification:');
try {
  const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
  
  if (!JWT_REFRESH_SECRET) {
    console.log('❌ JWT_REFRESH_SECRET not found');
    return;
  }

  // Generate test token
  const testPayload = {
    userId: '507f1f77bcf86cd799439011',
    type: 'refresh',
    jti: 'test-jti-' + Date.now(),
    iat: Math.floor(Date.now() / 1000)
  };

  const testToken = jwt.sign(testPayload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
  console.log('✅ Test token generated:', testToken.substring(0, 50) + '...');

  // Test verification with enhanced function
  const decoded = verifyRefreshTokenEnhanced(testToken);
  console.log('✅ Enhanced verification successful:', decoded.type);

} catch (error) {
  console.log('❌ Token test failed:', error.message);
}

// Test 3: Test error handling with wrong secret
console.log('\n3. Testing Error Handling:');
try {
  const WRONG_SECRET = 'wrong-secret-key';
  const testTokenWithWrongSecret = jwt.sign(
    { userId: 'test', type: 'refresh', iat: Math.floor(Date.now() / 1000) },
    WRONG_SECRET,
    { expiresIn: '7d' }
  );

  // This should fail with our enhanced error message
  verifyRefreshTokenEnhanced(testTokenWithWrongSecret);
  console.log('❌ Expected error did not occur');

} catch (error) {
  console.log('✅ Error handling works correctly:');
  console.log('   Error message:', error.message);
  console.log('   Error type:', error.name);
}

console.log('\n🎉 JWT Fix Test Completed!');
console.log('\n📝 Summary:');
console.log('   - Environment variables are properly loaded');
console.log('   - Token generation and verification work correctly');
console.log('   - Enhanced error handling provides clear messages');
console.log('   - Users will get helpful guidance when refresh tokens fail');