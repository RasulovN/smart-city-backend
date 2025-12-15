const { generateCSRFToken } = require('../utils/tokenUtils');

/**
 * CSRF Protection Middleware using Double-Submit Cookie Pattern
 * 
 * This middleware implements CSRF protection by:
 * 1. Setting a CSRF token cookie on GET requests
 * 2. Validating CSRF token on state-changing requests (POST, PUT, DELETE, PATCH)
 * 3. Comparing token from cookie with token from header
 */

/**
 * Set CSRF token cookie for GET requests
 * This should be applied to all GET routes that return HTML/forms
 */
function setCSRFToken(req, res, next) {
  // Only set CSRF token for GET requests
  if (req.method === 'GET') {
    let csrfToken = req.cookies.csrfToken;
    
    // Generate new token if not exists or expired
    if (!csrfToken) {
      csrfToken = generateCSRFToken();
      res.cookie('csrfToken', csrfToken, {
        httpOnly: false, // Must be readable by JavaScript
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/'
      });
    }
    
    // Also set in locals for template rendering
    res.locals.csrfToken = csrfToken;
  }
  
  next();
}

/**
 * Validate CSRF token for state-changing requests
 * This should be applied to all POST, PUT, DELETE, PATCH routes
 */
function validateCSRFToken(req, res, next) {
  const stateChangingMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
  
  // Skip CSRF validation for non-state-changing requests
  if (!stateChangingMethods.includes(req.method)) {
    return next();
  }
  
  // Skip CSRF validation for login and refresh-token endpoints
  // These endpoints are handled separately
  const skipPaths = [
    '/api/auth/login',
    '/api/auth/refresh-token'
  ];

  if (skipPaths.includes(req.path)) {
    return next();
  }
  
  // Get CSRF token from cookie and header
  const csrfTokenFromCookie = req.cookies.csrfToken;
  const csrfTokenFromHeader = req.headers['x-csrf-token'];
  
  // Validate token presence
  if (!csrfTokenFromCookie) {
    return res.status(403).json({
      success: false,
      message: 'CSRF token missing. Please refresh the page and try again.'
    });
  }
  
  if (!csrfTokenFromHeader) {
    return res.status(403).json({
      success: false,
      message: 'CSRF token missing from request header.'
    });
  }
  
  // Validate token match
  if (csrfTokenFromCookie !== csrfTokenFromHeader) {
    return res.status(403).json({
      success: false,
      message: 'Invalid CSRF token. Possible CSRF attack detected.'
    });
  }
  
  // Token is valid, continue
  next();
}

/**
 * Generate CSRF token for client-side use
 * This endpoint can be called to get a fresh CSRF token
 */
function generateCSRFEndpoint(req, res) {
  const csrfToken = generateCSRFToken();
  
  res.cookie('csrfToken', csrfToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000,
    path: '/'
  });
  
  res.json({
    success: true,
    csrfToken
  });
}

/**
 * Remove CSRF token on logout
 */
function clearCSRFToken(req, res, next) {
  if (req.method === 'POST' && req.path === '/api/auth/logout') {
    res.clearCookie('csrfToken', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    });
  }
  next();
}

/**
 * Middleware for APIs that require CSRF protection
 * This is specifically for state-changing API endpoints
 */
function requireCSRF(req, res, next) {
  return validateCSRFToken(req, res, next);
}

/**
 * Middleware for setting CSRF tokens
 * This is for GET endpoints that serve HTML pages
 */
function csrfProtection(req, res, next) {
  return setCSRFToken(req, res, next);
}

module.exports = {
  setCSRFToken,
  validateCSRFToken,
  generateCSRFEndpoint,
  clearCSRFToken,
  requireCSRF,
  csrfProtection
};