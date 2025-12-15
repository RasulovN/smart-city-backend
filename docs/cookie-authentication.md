# Cookie-Based Authentication System

## Overview

The authentication system has been updated to use secure HTTP-only cookies for storing access and refresh tokens instead of sending them in the response body. This provides enhanced security and protection against XSS attacks.

## Changes Made

### 1. Authentication Controller Updates (`controller/auth.controller.js`)

- **Separate Token Types**: Now generates both access tokens (24h) and refresh tokens (7 days)
- **Cookie Storage**: Tokens are stored in HTTP-only cookies with secure settings
- **Token Rotation**: Refresh endpoint generates new token pairs for security
- **Logout Enhancement**: Clears both access and refresh token cookies

### 2. Middleware Updates (`middleware/auth.middleware.js`)

- **Cookie Reading**: Modified to read tokens from `req.cookies` instead of Authorization header
- **Token Type Validation**: Added validation to ensure only access tokens are used for authentication
- **Enhanced Security**: Maintains all existing user validation and role checking

### 3. CORS Configuration (`index.js`)

- **Credential Support**: Updated CORS to allow credentials with `credentials: true`
- **Origin Configuration**: Uses `FRONTEND_URL` environment variable for specific origin
- **Security**: Removed Authorization header from allowed headers since tokens are in cookies

## Environment Variables

Add these environment variables to your `.env` file:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRES_IN=7d

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000

# Environment
NODE_ENV=development
```

## Frontend Integration

### 1. Axios Configuration

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://your-api-domain.com/api',
  withCredentials: true, // Important: Enable credentials
  headers: {
    'Content-Type': 'application/json'
  }
});
```

### 2. Login Request

```javascript
const login = async (email, password) => {
  try {
    const response = await api.post('/auth/login', {
      email,
      password
    });
    
    // Tokens are automatically stored in cookies
    // No need to store tokens in localStorage
    console.log('Login successful:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('Login failed:', error.response.data);
    throw error;
  }
};
```

### 3. Logout Request

```javascript
const logout = async () => {
  try {
    await api.post('/auth/logout');
    // Cookies are automatically cleared by the server
    console.log('Logout successful');
  } catch (error) {
    console.error('Logout failed:', error.response.data);
    throw error;
  }
};
```

### 4. Protected Requests

```javascript
const getProtectedData = async () => {
  try {
    const response = await api.get('/protected-endpoint');
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      // Token expired, try to refresh
      try {
        await api.post('/auth/refresh-token');
        // Retry the original request
        const retryResponse = await api.get('/protected-endpoint');
        return retryResponse.data;
      } catch (refreshError) {
        // Refresh failed, redirect to login
        console.log('Token refresh failed, redirecting to login');
        window.location.href = '/login';
        return null;
      }
    }
    throw error;
  }
};
```

### 5. Token Refresh Logic

```javascript
// Auto-refresh token before expiration
const setupTokenRefresh = () => {
  setInterval(async () => {
    try {
      await api.post('/auth/refresh-token');
      console.log('Token refreshed successfully');
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Redirect to login if refresh fails
      window.location.href = '/login';
    }
  }, 23 * 60 * 60 * 1000); // Refresh every 23 hours
};
```

## Security Features

### 1. HTTP-Only Cookies
- Tokens are not accessible via JavaScript (XSS protection)
- Automatically sent with requests to the same domain

### 2. Secure Cookie Settings
- `httpOnly: true`: Prevents JavaScript access
- `secure: true`: Only sent over HTTPS in production
- `sameSite: 'strict'`: CSRF protection
- Proper expiration times for both tokens

### 3. Token Rotation
- New refresh token generated on each refresh
- Prevents reuse of old refresh tokens
- Access token has shorter expiration for security

### 4. CORS Configuration
- Specific origin whitelisting
- Credentials required for cross-origin requests
- No sensitive headers exposed

## API Endpoints

### POST `/api/auth/login`
- **Body**: `{ email, password }`
- **Response**: User data (no tokens in response)
- **Cookies Set**: `accessToken`, `refreshToken`

### POST `/api/auth/logout`
- **Headers**: No special headers needed
- **Response**: Success message
- **Cookies Cleared**: `accessToken`, `refreshToken`

### POST `/api/auth/refresh-token`
- **Headers**: No special headers needed
- **Response**: Success message
- **Cookies Set**: New `accessToken`, `refreshToken`

### GET `/api/auth/profile`
- **Headers**: No special headers needed (cookies are automatic)
- **Response**: User profile data

## Migration Notes

### For Existing Frontend Applications:
1. Remove token storage from localStorage/sessionStorage
2. Update API client to use `withCredentials: true`
3. Remove Authorization header from requests
4. Implement automatic token refresh logic
5. Update logout functionality

### For Mobile Applications:
1. Ensure cookie support in your HTTP client
2. Configure credentials for cross-origin requests
3. Handle cookie storage automatically (usually handled by the platform)

## Testing

### 1. Test Login Flow
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -c cookies.txt
```

### 2. Test Protected Endpoint
```bash
curl http://localhost:4000/api/auth/profile \
  -b cookies.txt
```

### 3. Test Logout
```bash
curl -X POST http://localhost:4000/api/auth/logout \
  -b cookies.txt \
  -c cookies.txt
```

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Ensure `FRONTEND_URL` is set correctly and `withCredentials: true`
2. **Cookie Not Set**: Check if cookies are being blocked by browser
3. **Token Not Sent**: Verify `withCredentials: true` in API client
4. **Refresh Not Working**: Check if refresh token cookie is being sent

### Debug Steps:
1. Check browser developer tools → Application → Cookies
2. Verify network requests include cookies
3. Check server logs for cookie-related errors
4. Ensure environment variables are set correctly