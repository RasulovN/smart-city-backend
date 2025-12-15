const User = require('../models/user');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  verifyRefreshTokenEnhanced,
  generateTokenPair,
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  getCSRFCookieOptions,
  generateCSRFToken,
  getAccessTokenExpiration,
  getRefreshTokenExpiration
} = require('../utils/tokenUtils');

/**
 * Get allowed API routes based on role and sector
 */
const getAllowedRoutes = (role, sector) => {
  const baseRoutes = {
    super_admin: {
      routes: ['*'], // All routes
      description: 'Full access to all APIs'
    },
    admin: {
      routes: [
        '/api/users/*',
        '/api/ecology/*',
        '/api/health/*',
        '/api/security/*',
        '/api/environment/*',
        '/api/traffic/*',
        '/api/transport/*'
      ],
      description: 'Access to all sector APIs and user management'
    },
    sector_admin: {
      ecology: {
        routes: ['/api/environment/*', '/api/ecology/*'],
        description: 'Access to ecology and environment APIs'
      },
      health: {
        routes: ['/api/health/*', '/api/hospitals/*', '/api/clinics/*'],
        description: 'Access to health sector APIs'
      },
      security: {
        routes: ['/api/traffic/*', '/api/transport/*', '/api/security/*'],
        description: 'Access to security and traffic APIs'
      }
    }
  };

  if (role === 'super_admin') {
    return baseRoutes.super_admin;
  }
  
  if (role === 'admin') {
    return baseRoutes.admin;
  }
  
  if (role === 'sector_admin' && sector) {
    return baseRoutes.sector_admin[sector] || { routes: [], description: 'No access' };
  }

  return { routes: [], description: 'No access' };
};

class AuthController {
  /**
   * Login user and issue tokens
   * POST /api/auth/login
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const userAgent = req.headers['user-agent'] || null;
      const ipAddress = req.ip || req.connection.remoteAddress || null;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required.'
        });
      }

      // Find user by email
      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Account is deactivated. Contact administrator.'
        });
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.'
        });
      }

      // Generate tokens
      const tokenPair = generateTokenPair(user);
      // console.log('✅ Tokens generated for user:', user.email);
      // console.log('Access token:', tokenPair.accessToken.substring(0, 50) + '...');
      // console.log('Refresh token:', tokenPair.refreshToken.substring(0, 50) + '...');
      
      // Store refresh token in database
      await user.addRefreshToken(
        tokenPair.refreshToken,
        new Date(tokenPair.refreshTokenExpiresAt),
        userAgent,
        ipAddress
      );
      // console.log('✅ Refresh token stored in database');

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Get allowed routes based on role and sector
      const allowedRoutes = getAllowedRoutes(user.role, user.sector);

      // Generate CSRF token
      const csrfToken = generateCSRFToken();

      // Set cookies
      res.cookie('accessToken', tokenPair.accessToken, getAccessTokenCookieOptions());
      res.cookie('refreshToken', tokenPair.refreshToken, getRefreshTokenCookieOptions());
      res.cookie('csrfToken', csrfToken, getCSRFCookieOptions());

      res.status(200).json({
        success: true,
        message: 'Login successful.',
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            sector: user.sector,
            lastLogin: user.lastLogin
          },
          allowedRoutes,
          accessTokenExpiresIn: tokenPair.accessTokenExpiresIn,
          refreshTokenExpiresIn: tokenPair.refreshTokenExpiresIn,
          csrfToken // Include CSRF token for client-side use
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during login.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Refresh access token using refresh token
   * POST /api/auth/refresh-token
   */
  async refreshToken(req, res) {
    try {
      console.log('🔄 Refresh token request received');
      console.log('Cookies available:', Object.keys(req.cookies));
      
      const { refreshToken } = req.cookies;

      if (!refreshToken) {
        console.log('❌ No refresh token found in cookies');
        return res.status(401).json({
          success: false,
          message: 'Refresh token not found.'
        });
      }

      console.log('✅ Refresh token found:', refreshToken.substring(0, 50) + '...');

      // Verify refresh token with enhanced error handling
      let decoded;
      try {
        decoded = verifyRefreshTokenEnhanced(refreshToken);
        console.log('✅ Refresh token verified successfully');
        console.log('Decoded payload:', decoded);
      } catch (verifyError) {
        console.log('❌ Refresh token verification failed:', verifyError.message);
        
        // If it's a secret mismatch error, provide helpful guidance
        if (verifyError.message.includes('incompatible secret')) {
          console.log('💡 JWT secret mismatch detected - users need to re-login');
          return res.status(401).json({
            success: false,
            message: 'Your session has expired due to security updates. Please log in again.',
            code: 'SECRET_MISMATCH',
            action: 'RELOGIN_REQUIRED'
          });
        }
        
        throw verifyError;
      }
      
      // Find user and check if active
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        console.log('❌ User not found:', decoded.userId);
        return res.status(401).json({
          success: false,
          message: 'User not found.'
        });
      }

      if (!user.isActive) {
        console.log('❌ User account is deactivated');
        return res.status(403).json({
          success: false,
          message: 'Account is deactivated.'
        });
      }

      console.log('✅ User found and active:', user.email);

      // Check if refresh token exists in database and is valid
      const hasValidToken = user.hasValidRefreshToken(refreshToken);
      console.log('✅ User has valid refresh token:', hasValidToken);
      
      if (!hasValidToken) {
        console.log('❌ Refresh token not found in database or expired');
        return res.status(401).json({
          success: false,
          message: 'Refresh token is invalid or has been revoked.'
        });
      }

      // Remove old refresh token (rotation)
      console.log('🔄 Removing old refresh token');
      await user.removeRefreshToken(refreshToken);
      console.log('✅ Old refresh token removed');

      // Generate new token pair
      console.log('🔄 Generating new token pair');
      const tokenPair = generateTokenPair(user);
      console.log('✅ New tokens generated');
      
      // Store new refresh token in database
      const userAgent = req.headers['user-agent'] || null;
      const ipAddress = req.ip || req.connection.remoteAddress || null;
      
      await user.addRefreshToken(
        tokenPair.refreshToken,
        new Date(tokenPair.refreshTokenExpiresAt),
        userAgent,
        ipAddress
      );
      console.log('✅ New refresh token stored in database');

      // Set new cookies
      res.cookie('accessToken', tokenPair.accessToken, getAccessTokenCookieOptions());
      res.cookie('refreshToken', tokenPair.refreshToken, getRefreshTokenCookieOptions());
      console.log('✅ New cookies set');

      res.status(200).json({
        success: true,
        message: 'Tokens refreshed successfully.',
        data: {
          accessTokenExpiresIn: tokenPair.accessTokenExpiresIn,
          refreshTokenExpiresIn: tokenPair.refreshTokenExpiresIn
        }
      });
      
      console.log('🎉 Token refresh completed successfully');
    } catch (error) {
      console.error('❌ Refresh token error:', error);
      
      if (error.message.includes('expired') || error.message.includes('invalid')) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired refresh token.'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Server error.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Logout user and revoke tokens
   * POST /api/auth/logout
   */
  async logout(req, res) {
    try {
      const { refreshToken } = req.cookies;
      const userId = req.user?.userId;

      // If user is authenticated, remove their refresh token
      if (userId && refreshToken) {
        const user = await User.findById(userId);
        if (user) {
          await user.removeRefreshToken(refreshToken);
        }
      }

      // Clear all authentication cookies
      res.clearCookie('accessToken', getAccessTokenCookieOptions());
      res.clearCookie('refreshToken', getRefreshTokenCookieOptions());
      res.clearCookie('csrfToken', getCSRFCookieOptions());

      res.status(200).json({
        success: true,
        message: 'Logout successful.'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during logout.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Logout from all devices
   * POST /api/auth/logout-all
   */
  async logoutAll(req, res) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.'
        });
      }

      // Remove all refresh tokens for the user
      const user = await User.findById(userId);
      if (user) {
        await user.removeAllRefreshTokens();
      }

      // Clear all cookies
      res.clearCookie('accessToken', getAccessTokenCookieOptions());
      res.clearCookie('refreshToken', getRefreshTokenCookieOptions());
      res.clearCookie('csrfToken', getCSRFCookieOptions());

      res.status(200).json({
        success: true,
        message: 'Logged out from all devices successfully.'
      });
    } catch (error) {
      console.error('Logout all error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during logout.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get current user profile
   * GET /api/auth/profile
   */
  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.userId).select('-password');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found.'
        });
      }

      const allowedRoutes = getAllowedRoutes(user.role, user.sector);

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            sector: user.sector,
            isActive: user.isActive,
            lastLogin: user.lastLogin,
            createdAt: user.createdAt
          },
          allowedRoutes
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Change password
   * POST /api/auth/change-password
   */
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password and new password are required.'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters long.'
        });
      }

      const user = await User.findById(req.user.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found.'
        });
      }

      // Verify current password
      const isPasswordValid = await user.comparePassword(currentPassword);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect.'
        });
      }

      // Update password
      user.password = newPassword;
      user.lastPasswordChange = new Date();
      await user.save();

      // Optionally revoke all refresh tokens to force re-login
      // await user.removeAllRefreshTokens();

      res.status(200).json({
        success: true,
        message: 'Password changed successfully.'
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get active sessions count
   * GET /api/auth/sessions
   */
  async getSessions(req, res) {
    try {
      const user = await User.findById(req.user.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found.'
        });
      }

      const activeSessions = user.getRefreshTokenCount();

      res.status(200).json({
        success: true,
        data: {
          activeSessions,
          sessions: user.refreshTokens
            .filter(rt => rt.expiresAt > new Date())
            .map(rt => ({
              id: rt._id,
              userAgent: rt.userAgent,
              ipAddress: rt.ipAddress,
              createdAt: rt.createdAt,
              expiresAt: rt.expiresAt
            }))
        }
      });
    } catch (error) {
      console.error('Get sessions error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Clear all refresh tokens from database (Development only)
   * POST /api/auth/clear-all-tokens
   */
  async clearAllTokens(req, res) {
    try {
      // Only allow in development mode
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({
          success: false,
          message: 'This endpoint is only available in development mode.'
        });
      }

      console.log('🧹 Clearing all refresh tokens...');
      
      const result = await User.updateMany(
        { 'refreshTokens.0': { $exists: true } },
        { $set: { refreshTokens: [] } }
      );

      console.log(`✅ Cleared refresh tokens for ${result.modifiedCount} users`);

      res.status(200).json({
        success: true,
        message: `Cleared refresh tokens for ${result.modifiedCount} users`,
        modifiedCount: result.modifiedCount
      });

    } catch (error) {
      console.error('❌ Error clearing tokens:', error);
      res.status(500).json({
        success: false,
        message: 'Error clearing tokens',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new AuthController();
