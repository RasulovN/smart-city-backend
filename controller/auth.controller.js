const User = require('../models/user');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

// Generate JWT access token
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      sector: user.sector,
      type: 'access'
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Generate JWT refresh token
const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      type: 'refresh'
    },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );
};

// Cookie options
const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
});

const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
});

// Get allowed API routes based on role and sector
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
  // Login
  async login(req, res) {
    try {
      const { email, password } = req.body;

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

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      // Get allowed routes based on role and sector
      const allowedRoutes = getAllowedRoutes(user.role, user.sector);

      // Set cookies
      res.cookie('accessToken', accessToken, getCookieOptions());
      res.cookie('refreshToken', refreshToken, getRefreshCookieOptions());

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
          expiresIn: JWT_EXPIRES_IN
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during login.',
        error: error.message
      });
    }
  }

  // Logout
  async logout(req, res) {
    try {
      // Clear cookies
      res.clearCookie('accessToken', getCookieOptions());
      res.clearCookie('refreshToken', getRefreshCookieOptions());

      res.status(200).json({
        success: true,
        message: 'Logout successful.'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during logout.',
        error: error.message
      });
    }
  }

  // Get current user profile
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
        error: error.message
      });
    }
  }

  // Change password
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
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Password changed successfully.'
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error.',
        error: error.message
      });
    }
  }

  // Refresh token
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.cookies;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token not found.'
        });
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
      
      // Find user and check if active
      const user = await User.findById(decoded.userId);
      
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Invalid user or account deactivated.'
        });
      }

      // Generate new tokens
      const newAccessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);

      // Set new cookies
      res.cookie('accessToken', newAccessToken, getCookieOptions());
      res.cookie('refreshToken', newRefreshToken, getRefreshCookieOptions());

      res.status(200).json({
        success: true,
        message: 'Tokens refreshed successfully.',
        data: {
          expiresIn: JWT_EXPIRES_IN
        }
      });
    } catch (error) {
      console.error('Refresh token error:', error);
      
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired refresh token.'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Server error.',
        error: error.message
      });
    }
  }
}

module.exports = new AuthController();
