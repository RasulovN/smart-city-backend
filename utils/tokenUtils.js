const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

// Validate environment variables
if (!JWT_SECRET) {
  console.error('❌ JWT_SECRET environment variable is not set!');
  throw new Error('JWT_SECRET environment variable is required');
}

if (!JWT_REFRESH_SECRET) {
  console.error('❌ JWT_REFRESH_SECRET environment variable is not set!');
  throw new Error('JWT_REFRESH_SECRET environment variable is required');
}

if (JWT_SECRET === JWT_REFRESH_SECRET) {
  console.error('❌ JWT_SECRET and JWT_REFRESH_SECRET must be different!');
  throw new Error('Access and refresh token secrets must be different');
}

console.log('✅ JWT secrets loaded successfully');
console.log('Access secret:', JWT_SECRET.substring(0, 20) + '...');
console.log('Refresh secret:', JWT_REFRESH_SECRET.substring(0, 20) + '...');

// Token lifetimes (in seconds)
const ACCESS_TOKEN_EXPIRY = 10 * 60; // 10 minutes
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days

/**
 * Generate a secure random token
 * @returns {string} Random token string
 */
function generateSecureToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate access token with 10-minute expiry
 * @param {Object} user - User object
 * @returns {string} JWT access token
 */
function generateAccessToken(user) {
  return jwt.sign(
    {
      userId: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      sector: user.sector,
      type: 'access',
      iat: Math.floor(Date.now() / 1000)
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

/**
 * Generate refresh token with 7-day expiry
 * @param {Object} user - User object
 * @param {string} jti - Unique token ID for rotation tracking
 * @returns {string} JWT refresh token
 */
function generateRefreshToken(user, jti = null) {
  const tokenId = jti || generateSecureToken();
  
  return jwt.sign(
    {
      userId: user._id,
      type: 'refresh',
      jti: tokenId,
      iat: Math.floor(Date.now() / 1000)
    },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
}

/**
 * Verify access token
 * @param {string} token - Access token to verify
 * @returns {Object} Decoded token payload
 */
function verifyAccessToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }
    
    return decoded;
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    throw error;
  }
}

/**
 * Verify refresh token
 * @param {string} token - Refresh token to verify
 * @returns {Object} Decoded token payload
 */
function verifyRefreshToken(token) {
  try {
    console.log('🔍 Verifying refresh token...');
    console.log('Token length:', token?.length);
    console.log('Using refresh secret:', JWT_REFRESH_SECRET.substring(0, 20) + '...');
    
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    console.log('✅ Refresh token verified successfully');
    console.log('Decoded payload:', decoded);
    
    if (decoded.type !== 'refresh') {
      console.log('❌ Invalid token type:', decoded.type);
      throw new Error('Invalid token type');
    }
    
    return decoded;
  } catch (error) {
    console.log('❌ Refresh token verification failed:', error.message);
    console.log('Error name:', error.name);
    console.log('Error details:', error);
    
    if (error.name === 'JsonWebTokenError') {
      console.log('❌ JWT signature verification failed - this usually means the token was signed with a different secret');
      console.log('This can happen if JWT secrets were changed after token generation');
      console.log('The token will need to be refreshed by the user logging in again');
      throw new Error('Invalid refresh token');
    }
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token expired');
    }
    throw error;
  }
}

/**
 * Enhanced verify refresh token with better error handling
 * @param {string} token - Refresh token to verify
 * @returns {Object} Decoded token payload
 */
function verifyRefreshTokenEnhanced(token) {
  try {
    console.log('🔍 Verifying refresh token (enhanced)...');
    console.log('Token length:', token?.length);
    console.log('Using refresh secret:', JWT_REFRESH_SECRET.substring(0, 20) + '...');
    
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    console.log('✅ Refresh token verified successfully');
    console.log('Decoded payload:', decoded);
    
    if (decoded.type !== 'refresh') {
      console.log('❌ Invalid token type:', decoded.type);
      throw new Error('Invalid token type');
    }
    
    return decoded;
  } catch (error) {
    console.log('❌ Refresh token verification failed:', error.message);
    console.log('Error name:', error.name);
    
    // Provide more specific error messages
    if (error.name === 'JsonWebTokenError' && error.message.includes('invalid signature')) {
      console.log('💡 This error typically means:');
      console.log('   - The refresh token was generated with a different secret');
      console.log('   - JWT secrets were changed after token generation');
      console.log('   - Users will need to log in again to get fresh tokens');
      throw new Error('Refresh token was signed with an incompatible secret. Please log in again.');
    }
    
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid refresh token format');
    }
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token expired');
    }
    throw error;
  }
}

/**
 * Get access token expiration time in milliseconds
 * @returns {number} Expiration timestamp
 */
function getAccessTokenExpiration() {
  return Date.now() + (ACCESS_TOKEN_EXPIRY * 1000);
}

/**
 * Get refresh token expiration time in milliseconds
 * @returns {number} Expiration timestamp
 */
function getRefreshTokenExpiration() {
  return Date.now() + (REFRESH_TOKEN_EXPIRY * 1000);
}

/**
 * Generate CSRF token
 * @returns {string} Random CSRF token
 */
function generateCSRFToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Cookie configuration for access token
 * @returns {Object} Cookie options
 */
function getAccessTokenCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: ACCESS_TOKEN_EXPIRY * 1000, // Convert to milliseconds
    path: '/api'
  };
}

/**
 * Cookie configuration for refresh token
 * @returns {Object} Cookie options
 */
function getRefreshTokenCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: REFRESH_TOKEN_EXPIRY * 1000, // Convert to milliseconds
    path: '/api/auth'
  };
}

/**
 * Cookie configuration for CSRF token
 * @returns {Object} Cookie options
 */
function getCSRFCookieOptions() {
  return {
    httpOnly: false, // CSRF token needs to be readable by JavaScript
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: ACCESS_TOKEN_EXPIRY * 1000,
    path: '/'
  };
}

/**
 * Generate a token pair (access + refresh)
 * @param {Object} user - User object
 * @returns {Object} Object containing both tokens and expiration times
 */
function generateTokenPair(user) {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  
  return {
    accessToken,
    refreshToken,
    accessTokenExpiresAt: getAccessTokenExpiration(),
    refreshTokenExpiresAt: getRefreshTokenExpiration(),
    accessTokenExpiresIn: ACCESS_TOKEN_EXPIRY,
    refreshTokenExpiresIn: REFRESH_TOKEN_EXPIRY
  };
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  verifyRefreshTokenEnhanced,
  generateSecureToken,
  generateCSRFToken,
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  getCSRFCookieOptions,
  generateTokenPair,
  getAccessTokenExpiration,
  getRefreshTokenExpiration,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY
};