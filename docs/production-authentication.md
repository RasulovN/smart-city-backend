# Production-Grade Authentication System

## Overview

This document describes the implementation of a production-grade JWT authentication system with enhanced security features including token rotation, CSRF protection, and comprehensive session management.

## 🎯 **Key Features Implemented**

### Token Management
- **Access Token**: 10-minute lifetime for API authentication
- **Refresh Token**: 7-day lifetime with automatic rotation
- **Token Storage**: HTTP-only secure cookies (XSS protection)
- **Token Validation**: Database-backed refresh token validation

### Security Features
- **CSRF Protection**: Double-submit cookie pattern
- **Rate Limiting**: Protection against brute force attacks
- **Session Management**: Track and manage multiple active sessions
- **Token Rotation**: Refresh tokens are invalidated after use
- **Secure Cookies**: Production-ready cookie configuration

### Database Integration
- **Refresh Token Storage**: MongoDB storage with expiration tracking
- **Session Tracking**: Track user sessions with metadata
- **Token Invalidation**: Automatic cleanup of expired tokens
- **Multi-Session Support**: Support multiple concurrent sessions per user

## 🔧 **Architecture Components**

### 1. User Model (`models/user.js`)
Extended with refresh token management:
```javascript
refreshTokens: [{
  token: String,           // The refresh token
  createdAt: Date,         // When token was created
  expiresAt: Date,         // When token expires
  userAgent: String,       // Client user agent
  ipAddress: String        // Client IP address
}]
```

**Key Methods:**
- `addRefreshToken()` - Add new refresh token
- `removeRefreshToken()` - Remove specific token
- `removeAllRefreshTokens()` - Remove all tokens (logout all)
- `hasValidRefreshToken()` - Check if token exists and is valid
- `cleanExpiredRefreshTokens()` - Remove expired tokens
- `getRefreshTokenCount()` - Get active session count

### 2. Token Utilities (`utils/tokenUtils.js`)
Centralized token management functions:

**Token Generation:**
- `generateAccessToken(user)` - Creates 10-minute access token
- `generateRefreshToken(user, jti)` - Creates 7-day refresh token
- `generateTokenPair(user)` - Creates both tokens together
- `generateCSRFToken()` - Creates CSRF protection token

**Token Verification:**
- `verifyAccessToken(token)` - Validates access token
- `verifyRefreshToken(token)` - Validates refresh token

**Cookie Configuration:**
- `getAccessTokenCookieOptions()` - 10-minute cookie settings
- `getRefreshTokenCookieOptions()` - 7-day cookie settings
- `getCSRFCookieOptions()` - CSRF cookie settings

### 3. CSRF Protection (`middleware/csrf.middleware.js`)
Implements double-submit cookie pattern:

**Key Functions:**
- `setCSRFToken()` - Sets CSRF token on GET requests
- `validateCSRFToken()` - Validates CSRF token on state changes
- `requireCSRF()` - Middleware for CSRF protection

### 4. Authentication Middleware (`middleware/auth.middleware.js`)
Updated for cookie-based authentication:

**Key Functions:**
- `verifyToken()` - Validates access token from cookies
- `rateLimitSensitiveOps()` - Rate limiting for sensitive operations
- `optionalAuth()` - Optional authentication (doesn't fail if no token)

### 5. Authentication Controller (`controller/auth.controller.js`)
Complete authentication flow implementation:

**Endpoints:**
- `login()` - User authentication and token issuance
- `refreshToken()` - Token rotation and refresh
- `logout()` - Single session logout
- `logoutAll()` - Logout from all devices
- `getProfile()` - Get user profile
- `changePassword()` - Password change
- `getSessions()` - Active session management

## 🔄 **Authentication Flow**

### 1. Login Flow
```
Client → POST /api/auth/login
         { email, password }

Server:
1. Validate credentials
2. Generate access token (10 min) + refresh token (7 days)
3. Store refresh token in database
4. Set HTTP-only cookies
5. Return user data + CSRF token

Response:
{
  success: true,
  data: {
    user: { ... },
    allowedRoutes: [ ... ],
    accessTokenExpiresIn: 600,
    refreshTokenExpiresIn: 604800,
    csrfToken: "..."
  }
}
```

### 2. Token Refresh Flow
```
Client → POST /api/auth/refresh-token
         Cookies: refreshToken (required)

Server:
1. Verify refresh token
2. Check token exists in database
3. Remove old refresh token (rotation)
4. Generate new token pair
5. Store new refresh token in database
6. Set new cookies

Response:
{
  success: true,
  data: {
    accessTokenExpiresIn: 600,
    refreshTokenExpiresIn: 604800
  }
}
```

### 3. Protected Request Flow
```
Client → GET/POST/PUT/DELETE /api/protected
         Cookies: accessToken (auto-sent)
         Headers: x-csrf-token (for state changes)

Server:
1. Verify access token from cookie
2. Validate CSRF token (for state changes)
3. Process request
4. Return response
```

### 4. Logout Flow
```
Client → POST /api/auth/logout
         Cookies: accessToken, refreshToken
         Headers: x-csrf-token

Server:
1. Verify authentication
2. Remove refresh token from database
3. Clear all cookies
4. Return success
```

## 🔒 **Security Implementation**

### Cookie Security
```javascript
// Access Token Cookie (10 minutes)
{
  httpOnly: true,      // Prevent XSS attacks
  secure: true,        // HTTPS only in production
  sameSite: 'strict',  // CSRF protection
  maxAge: 600000,      // 10 minutes
  path: '/api'
}

// Refresh Token Cookie (7 days)
{
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 604800000,   // 7 days
  path: '/api/auth'
}

// CSRF Token Cookie (24 hours)
{
  httpOnly: false,     // Must be readable by JavaScript
  secure: true,
  sameSite: 'strict',
  maxAge: 86400000,    // 24 hours
  path: '/'
}
```

### CSRF Protection (Double-Submit Cookie)
1. **Token Generation**: Server generates random CSRF token
2. **Cookie Storage**: Token stored in both cookie and response
3. **Header Validation**: Client sends token in `x-csrf-token` header
4. **Server Validation**: Server compares cookie token with header token

### Rate Limiting
- **Login Endpoint**: 5 attempts per 15 minutes
- **Password Change**: Built-in rate limiting
- **Configurable**: Can be applied to any sensitive endpoint

### Token Rotation
- **Automatic**: Refresh tokens are rotated on each use
- **Database Storage**: Old tokens are immediately invalidated
- **Single Use**: Each refresh token can only be used once
- **Security**: Prevents token replay attacks

## 📡 **API Endpoints**

### Authentication Endpoints

| Method | Endpoint | Auth Required | CSRF Required | Description |
|--------|----------|---------------|---------------|-------------|
| POST | `/api/auth/login` | No | No | User login |
| POST | `/api/auth/refresh-token` | No | No | Refresh tokens |
| POST | `/api/auth/logout` | Yes | Yes | Logout current session |
| POST | `/api/auth/logout-all` | Yes | Yes | Logout all devices |
| GET | `/api/auth/profile` | Yes | No | Get user profile |
| POST | `/api/auth/change-password` | Yes | Yes | Change password |
| GET | `/api/auth/sessions` | Yes | No | Get active sessions |

### Request/Response Examples

#### Login Request
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

#### Login Response
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "username": "johndoe",
      "email": "user@example.com",
      "role": "admin",
      "sector": "ecology",
      "lastLogin": "2025-12-15T05:23:31.463Z"
    },
    "allowedRoutes": {
      "routes": ["*"],
      "description": "Full access to all APIs"
    },
    "accessTokenExpiresIn": 600,
    "refreshTokenExpiresIn": 604800,
    "csrfToken": "a1b2c3d4e5f6..."
  }
}
```

#### Refresh Token Request
```bash
POST /api/auth/refresh-token
Cookie: refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Protected Request with CSRF
```bash
POST /api/auth/change-password
Cookie: accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Header: x-csrf-token: a1b2c3d4e5f6...

{
  "currentPassword": "oldPassword",
  "newPassword": "newSecurePassword123"
}
```

## 🛠️ **Frontend Integration**

### Axios Configuration
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://your-api-domain.com/api',
  withCredentials: true, // Important: Enable credentials
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add CSRF token to all state-changing requests
api.interceptors.request.use((config) => {
  const csrfToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrfToken='))
    ?.split('=')[1];

  if (config.method !== 'get' && csrfToken) {
    config.headers['x-csrf-token'] = csrfToken;
  }

  return config;
});
```

### Login Function
```javascript
const login = async (email, password) => {
  try {
    const response = await api.post('/auth/login', {
      email,
      password
    });
    
    // Tokens are automatically stored in cookies
    // CSRF token is included in response
    console.log('Login successful:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('Login failed:', error.response.data);
    throw error;
  }
};
```

### Auto Token Refresh
```javascript
// Set up automatic token refresh
setInterval(async () => {
  try {
    await api.post('/auth/refresh-token');
    console.log('Token refreshed successfully');
  } catch (error) {
    console.error('Token refresh failed:', error);
    // Redirect to login if refresh fails
    window.location.href = '/login';
  }
}, 23 * 60 * 1000); // Refresh every 23 minutes
```

### Logout Function
```javascript
const logout = async () => {
  try {
    await api.post('/auth/logout');
    console.log('Logout successful');
  } catch (error) {
    console.error('Logout failed:', error.response.data);
    throw error;
  }
};
```

## ⚙️ **Environment Configuration**

### Required Environment Variables
```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-for-access-tokens
JWT_REFRESH_SECRET=your-super-secret-refresh-key-for-refresh-tokens

# Environment
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
```

### Security Recommendations
1. **Use Strong Secrets**: Generate cryptographically secure random strings
2. **HTTPS Only**: Always use HTTPS in production
3. **Secure Headers**: Implement additional security headers
4. **Database Indexing**: Index refresh token fields for performance
5. **Monitoring**: Monitor for suspicious authentication patterns

## 📊 **Database Schema Updates**

### User Collection Changes
```javascript
{
  _id: ObjectId,
  username: String,
  email: String,
  password: String, // Hashed
  role: String,
  sector: String,
  isActive: Boolean,
  lastLogin: Date,
  lastPasswordChange: Date,
  refreshTokens: [
    {
      _id: ObjectId,
      token: String,        // JWT refresh token
      createdAt: Date,
      expiresAt: Date,
      userAgent: String,
      ipAddress: String
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes
```javascript
// Recommended indexes for performance
db.users.createIndex({ "refreshTokens.token": 1 })
db.users.createIndex({ "refreshTokens.expiresAt": 1 })
db.users.createIndex({ email: 1 })
```

## 🧪 **Testing**

### Run Comprehensive Tests
```bash
node test/production-auth-test.js
```

### Manual Testing
1. **Login Test**: Verify tokens are set in cookies
2. **Token Refresh**: Test automatic token rotation
3. **CSRF Protection**: Verify state-changing endpoints require CSRF token
4. **Session Management**: Test multiple concurrent sessions
5. **Logout**: Verify token invalidation and cookie clearing

## 🚀 **Deployment Checklist**

- [ ] Set strong JWT secrets in environment variables
- [ ] Configure HTTPS certificate
- [ ] Set NODE_ENV=production
- [ ] Configure proper CORS origins
- [ ] Set up database indexes
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging
- [ ] Test all authentication flows
- [ ] Verify CSRF protection
- [ ] Test session management

## 🔍 **Troubleshooting**

### Common Issues

1. **Tokens Not Being Set**
   - Check CORS configuration with credentials
   - Verify cookie domain and path settings
   - Ensure HTTPS in production

2. **CSRF Token Errors**
   - Verify CSRF token is included in request headers
   - Check cookie is being set properly
   - Ensure token hasn't expired

3. **Token Refresh Failures**
   - Check refresh token exists in database
   - Verify token hasn't been used/rotated
   - Check token expiration

4. **Database Connection Issues**
   - Verify MongoDB connection
   - Check user model schema
   - Ensure indexes are created

### Debugging Steps
1. Check browser developer tools → Application → Cookies
2. Verify network requests include credentials
3. Check server logs for authentication errors
4. Verify database contains refresh tokens
5. Test with Postman or curl for API debugging

## 📈 **Performance Considerations**

- **Token Storage**: Refresh tokens are stored in MongoDB with proper indexing
- **Cleanup**: Expired tokens are automatically cleaned up
- **Rate Limiting**: Prevents brute force attacks
- **Database Queries**: Optimized with selective field queries
- **Cookie Size**: JWT tokens are compact and efficiently encoded

## 🛡️ **Security Best Practices**

1. **Token Security**: HTTP-only cookies prevent XSS attacks
2. **CSRF Protection**: Double-submit pattern prevents CSRF attacks
3. **Token Rotation**: Prevents token replay attacks
4. **Rate Limiting**: Protects against brute force attacks
5. **Secure Cookies**: Production-ready cookie configuration
6. **Session Management**: Track and control active sessions
7. **Database Security**: Refresh tokens hashed and indexed
8. **Environment Security**: Separate secrets for different token types

This implementation provides a robust, secure, and scalable authentication system suitable for production environments.