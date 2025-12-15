# JWT Refresh Token Fix Documentation

## Problem Analysis

The application was experiencing JWT refresh token verification failures with the error:
```
JsonWebTokenError: invalid signature
```

## Root Cause

The issue occurred because refresh tokens were generated with a different JWT secret than what was being used for verification. This commonly happens when:

1. JWT secrets in environment variables are changed after tokens have been generated
2. Different environments (development/production) use different secrets
3. Configuration changes were made without clearing existing tokens

## Current Environment Configuration

From the `.env` file:
```env
JWT_SECRET=smart-city-jwt-access-secret-2025-production-grade-security-key
JWT_REFRESH_SECRET=smart-city-jwt-refresh-secret-2025-production-grade-security-key
```

## Solution Implemented

### 1. Enhanced Error Handling

Added improved error handling in `utils/tokenUtils.js`:

```javascript
function verifyRefreshTokenEnhanced(token) {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    return decoded;
  } catch (error) {
    if (error.name === 'JsonWebTokenError' && error.message.includes('invalid signature')) {
      throw new Error('Refresh token was signed with an incompatible secret. Please log in again.');
    }
    // ... other error handling
  }
}
```

### 2. Better User Experience

Updated `controller/auth.controller.js` to provide clear guidance when secret mismatch occurs:

```javascript
if (verifyError.message.includes('incompatible secret')) {
  return res.status(401).json({
    success: false,
    message: 'Your session has expired due to security updates. Please log in again.',
    code: 'SECRET_MISMATCH',
    action: 'RELOGIN_REQUIRED'
  });
}
```

### 3. Development Endpoint

Added a development-only endpoint to clear all refresh tokens:
- Endpoint: `POST /api/auth/clear-all-tokens`
- Only available in development mode
- Clears all refresh tokens from the database

## Resolution Steps

### Option 1: User Re-authentication (Recommended)
1. Users will receive a clear error message when refresh fails
2. They need to log in again to get fresh tokens with the current secret
3. This is the safest approach for production

### Option 2: Clear All Tokens (Development Only)
1. Restart the server with the updated code
2. Call the endpoint: `POST /api/auth/clear-all-tokens`
3. All users will need to log in again

### Option 3: Database Cleanup (If MongoDB is accessible)
```javascript
// Direct MongoDB operation
db.users.updateMany(
  { "refreshTokens.0": { $exists: true } },
  { $set: { refreshTokens: [] } }
);
```

## Prevention

To prevent this issue in the future:

1. **Never change JWT secrets in production** without a migration plan
2. **Use environment-specific secrets** for different deployments
3. **Implement secret rotation** with overlap periods
4. **Monitor JWT verification errors** in production logs
5. **Have a token invalidation strategy** ready for security incidents

## Testing

After implementing the fix:

1. Test token refresh with valid tokens
2. Test token refresh with expired tokens  
3. Test token refresh with tampered tokens
4. Verify error messages are user-friendly
5. Check that users can successfully re-authenticate

## Environment Variables Required

Ensure these are properly set in your environment:
```env
JWT_SECRET=your-access-token-secret
JWT_REFRESH_SECRET=your-refresh-token-secret
MONGO_URL=your-mongodb-connection-string
NODE_ENV=production
```

## Notes

- The fix provides better error messages to help users understand they need to re-login
- The enhanced error handling will help developers debug similar issues in the future
- The development endpoint should be removed or protected in production environments
- Consider implementing token blacklisting for enhanced security