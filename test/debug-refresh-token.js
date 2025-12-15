const jwt = require('jsonwebtoken');
const User = require('../models/user');

console.log('🔍 Debugging Refresh Token Issue...\n');

// Test environment variables
console.log('1. Environment Variables:');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
console.log('JWT_REFRESH_SECRET:', process.env.JWT_REFRESH_SECRET ? 'SET' : 'NOT SET');
console.log('NODE_ENV:', process.env.NODE_ENV || 'NOT SET');

// Test JWT secrets
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key';

console.log('\n2. JWT Secrets:');
console.log('Access Token Secret:', JWT_SECRET.substring(0, 20) + '...');
console.log('Refresh Token Secret:', JWT_REFRESH_SECRET.substring(0, 20) + '...');

if (JWT_SECRET === JWT_REFRESH_SECRET) {
  console.log('⚠️ WARNING: Access and Refresh secrets are the same!');
} else {
  console.log('✅ Secrets are different');
}

// Test token generation and verification
console.log('\n3. Testing Token Generation:');

// Mock user
const mockUser = {
  _id: '507f1f77bcf86cd799439011',
  username: 'testuser',
  email: 'test@example.com',
  role: 'admin',
  sector: 'ecology'
};

try {
  // Test access token generation
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

  // Test access token verification
  const decodedAccess = jwt.verify(accessToken, JWT_SECRET);
  console.log('✅ Access token verified:', decodedAccess.type);

  // Test refresh token generation
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

  // Test refresh token verification
  const decodedRefresh = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
  console.log('✅ Refresh token verified:', decodedRefresh.type);
  console.log('✅ Refresh token userId:', decodedRefresh.userId);

} catch (error) {
  console.log('❌ Token generation/verification error:', error.message);
  console.log('Error details:', error);
}

// Test token utilities functions
console.log('\n4. Testing Token Utility Functions:');
try {
  const {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken
  } = require('../utils/tokenUtils');

  // Test access token
  const testAccessToken = generateAccessToken(mockUser);
  console.log('✅ Utility access token generated');
  
  const testDecodedAccess = verifyAccessToken(testAccessToken);
  console.log('✅ Utility access token verified');

  // Test refresh token
  const testRefreshToken = generateRefreshToken(mockUser);
  console.log('✅ Utility refresh token generated');
  
  const testDecodedRefresh = verifyRefreshToken(testRefreshToken);
  console.log('✅ Utility refresh token verified');

} catch (error) {
  console.log('❌ Utility functions error:', error.message);
  console.log('Error details:', error);
}

// Test User model
console.log('\n5. Testing User Model:');
try {
  const user = new User({
    username: 'testuser',
    email: 'test@example.com',
    password: 'testpassword',
    role: 'admin',
    sector: 'ecology'
  });
  
  console.log('✅ User model created');
  console.log('✅ RefreshTokens field exists:', user.schema.path('refreshTokens') !== undefined);
  
  // Test refresh token methods
  const methods = ['addRefreshToken', 'removeRefreshToken', 'hasValidRefreshToken'];
  methods.forEach(method => {
    console.log(`✅ ${method} method exists:`, typeof user[method] === 'function');
  });

} catch (error) {
  console.log('❌ User model error:', error.message);
}

// Test cookie configuration
console.log('\n6. Testing Cookie Configuration:');
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

console.log('\n🎯 Debug Complete!');