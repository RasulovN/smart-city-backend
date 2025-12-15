const jwt = require('jsonwebtoken');

console.log('🔧 Fixing Token Issue...\n');

// Set environment variables for testing
process.env.JWT_SECRET = 'test-jwt-secret-key-for-access-tokens';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-for-refresh-tokens';
process.env.NODE_ENV = 'development';

console.log('1. Testing JWT Token Generation and Verification:');

// Mock user
const mockUser = {
  _id: '507f1f77bcf86cd799439011',
  username: 'testuser',
  email: 'test@example.com',
  role: 'admin',
  sector: 'ecology'
};

try {
  // Test with correct secrets
  const JWT_SECRET = process.env.JWT_SECRET;
  const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

  console.log('Using secrets:');
  console.log('Access Secret:', JWT_SECRET.substring(0, 20) + '...');
  console.log('Refresh Secret:', JWT_REFRESH_SECRET.substring(0, 20) + '...');

  // Generate access token
  const accessToken = jwt.sign(
    {
      userId: mockUser._id,
      username: mockUser.username,
      email: mockUser.email,
      role: mockUser.role,
      sector: mockUser.sector,
      type: 'access',
      iat: Math.floor(Date.now() / 1000)
    },
    JWT_SECRET,
    { expiresIn: '10m' }
  );

  console.log('✅ Access token generated:', accessToken.substring(0, 50) + '...');

  // Verify access token
  const decodedAccess = jwt.verify(accessToken, JWT_SECRET);
  console.log('✅ Access token verified:', decodedAccess.type);

  // Generate refresh token
  const refreshToken = jwt.sign(
    {
      userId: mockUser._id,
      type: 'refresh',
      jti: 'test-jti-' + Date.now(),
      iat: Math.floor(Date.now() / 1000)
    },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  console.log('✅ Refresh token generated:', refreshToken.substring(0, 50) + '...');

  // Verify refresh token
  const decodedRefresh = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
  console.log('✅ Refresh token verified:', decodedRefresh.type);

  console.log('\n2. Testing with Our Token Utils:');

  // Now test with our token utils
  const tokenUtils = require('../utils/tokenUtils');

  const testAccessToken = tokenUtils.generateAccessToken(mockUser);
  console.log('✅ Utility access token generated');

  const testRefreshToken = tokenUtils.generateRefreshToken(mockUser);
  console.log('✅ Utility refresh token generated');

  const verifyAccess = tokenUtils.verifyAccessToken(testAccessToken);
  console.log('✅ Utility access token verified:', verifyAccess.type);

  const verifyRefresh = tokenUtils.verifyRefreshToken(testRefreshToken);
  console.log('✅ Utility refresh token verified:', verifyRefresh.type);

  console.log('\n🎉 All token operations working correctly!');

} catch (error) {
  console.log('❌ Error:', error.message);
  console.log('Error details:', error);
}

// Test cookie configuration
console.log('\n3. Testing Cookie Configuration:');
try {
  const {
    getAccessTokenCookieOptions,
    getRefreshTokenCookieOptions,
    getCSRFCookieOptions
  } = require('../utils/tokenUtils');

  const accessOptions = getAccessTokenCookieOptions();
  const refreshOptions = getRefreshTokenCookieOptions();
  const csrfOptions = getCSRFCookieOptions();

  console.log('✅ Access token options:', JSON.stringify(accessOptions, null, 2));
  console.log('✅ Refresh token options:', JSON.stringify(refreshOptions, null, 2));
  console.log('✅ CSRF token options:', JSON.stringify(csrfOptions, null, 2));

} catch (error) {
  console.log('❌ Cookie configuration error:', error.message);
}

console.log('\n✅ Fix test completed!');