const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Find user and check if active
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token. User not found.' 
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ 
        success: false, 
        message: 'Account is deactivated.' 
      });
    }

    // Attach user to request
    req.user = {
      userId: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      sector: user.sector
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token.' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired.' 
      });
    }
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during authentication.' 
    });
  }
};

// Check if user has required role
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required.' 
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Insufficient permissions.' 
      });
    }

    next();
  };
};

// Check if user can access specific sector
const checkSectorAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required.' 
    });
  }

  // Super admin and admin can access all sectors
  if (req.user.role === 'super_admin' || req.user.role === 'admin') {
    return next();
  }

  // Get sector from request (query, params, or body)
  const requestedSector = req.query.sector || req.params.sector || req.body.sector;

  // If no sector specified in request, allow (will use user's sector)
  if (!requestedSector) {
    return next();
  }

  // Check if sector_admin can access the requested sector
  if (req.user.role === 'sector_admin' && req.user.sector !== requestedSector) {
    return res.status(403).json({ 
      success: false, 
      message: `Access denied. You can only access ${req.user.sector} sector data.` 
    });
  }

  next();
};

// Middleware to restrict sector_admin to their own sector
const restrictToOwnSector = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required.' 
    });
  }

  // Super admin and admin can access all
  if (req.user.role === 'super_admin' || req.user.role === 'admin') {
    return next();
  }

  // Force sector_admin to use their own sector
  if (req.user.role === 'sector_admin') {
    req.query.sector = req.user.sector;
    req.params.sector = req.user.sector;
    req.body.sector = req.user.sector;
  }

  next();
};

// Check if user is super admin
const isSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required.' 
    });
  }

  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Super admin only.' 
    });
  }

  next();
};

// Check if user is admin or super admin
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required.' 
    });
  }

  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Admin privileges required.' 
    });
  }

  next();
};

module.exports = {
  verifyToken,
  checkRole,
  checkSectorAccess,
  restrictToOwnSector,
  isSuperAdmin,
  isAdmin
};
