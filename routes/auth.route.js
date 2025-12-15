const express = require('express');
const router = express.Router();
const authController = require('../controller/auth.controller');
const { verifyToken, rateLimitSensitiveOps } = require('../middleware/auth.middleware');
const { validateCSRFToken, clearCSRFToken } = require('../middleware/csrf.middleware');

// Public routes (no authentication required)

// POST /api/auth/login
// Login user and issue tokens
// Body: { email, password }
// Cookies: accessToken, refreshToken, csrfToken (set by server)
// Response: user data, allowed routes, token expiry info, csrfToken
router.post('/login', rateLimitSensitiveOps(5, 15 * 60 * 1000), authController.login);

// POST /api/auth/refresh-token
// Refresh access token using refresh token
// Cookies: refreshToken (required), accessToken (will be refreshed)
// No CSRF protection needed as it doesn't change state
router.post('/refresh-token', authController.refreshToken);

// Protected routes (authentication required)

// POST /api/auth/logout
// Logout user and revoke current session
// Cookies: accessToken, refreshToken, csrfToken (will be cleared)
// CSRF protection: Not required (protected by authentication)
router.post('/logout', verifyToken, clearCSRFToken, authController.logout);

// POST /api/auth/logout-all
// Logout from all devices
// Cookies: accessToken, refreshToken, csrfToken (will be cleared)
// CSRF protection: Not required (protected by authentication)
router.post('/logout-all', verifyToken, clearCSRFToken, authController.logoutAll);

// GET /api/auth/profile
// Get current user profile
// Cookies: accessToken (required)
// No CSRF protection needed as it's a read operation
router.get('/profile', verifyToken, authController.getProfile);

// POST /api/auth/change-password
// Change user password
// Body: { currentPassword, newPassword }
// Cookies: accessToken, csrfToken
// CSRF protection: Required
router.post('/change-password', verifyToken, validateCSRFToken, authController.changePassword);

// GET /api/auth/sessions
// Get active sessions count
// Cookies: accessToken (required)
// No CSRF protection needed as it's a read operation
router.get('/sessions', verifyToken, authController.getSessions);

// POST /api/auth/clear-all-tokens
// Clear all refresh tokens from database (Development only)
router.post('/clear-all-tokens', authController.clearAllTokens);

module.exports = router;
