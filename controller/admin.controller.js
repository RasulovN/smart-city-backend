const User = require('../models/user');

class AdminController {
  // Admin Registration (Self-registration for admins)
  async register(req, res) {
    try {
      console.log('Request body:', req.body);
      console.log('Request headers:', req.headers);
      const { username = null, email, password, role, sector, adminCode } = req.body || {};

      // Validate required fields
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required.'
        });
      }

      // Check admin registration code for security
      const VALID_ADMIN_CODES = {
        'admin2025': 'admin',
        'sector-admin': 'sector_admin'
      };

      if (!adminCode || !VALID_ADMIN_CODES[adminCode]) {
        return res.status(403).json({
          success: false,
          message: 'Invalid admin registration code.'
        });
      }

      // Determine role from admin code
      const requestedRole = VALID_ADMIN_CODES[adminCode];
      
      // Validate role matches the code used
      if (role && role !== requestedRole) {
        return res.status(400).json({
          success: false,
          message: `Role mismatch. This code is for ${requestedRole} role only.`
        });
      }

      // Validate role
      const validRoles = ['admin', 'sector_admin'];
      if (!validRoles.includes(requestedRole)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role.'
        });
      }

      // Validate sector for sector_admin
      const validSectors = ['ecology', 'health', 'security', 'all', "appeals", "tasks", "healthcare", "education", "transport", "infrastructure", "social", "economic", "management", "utilities", "other"];
      if (requestedRole === 'sector_admin' && !validSectors.includes(sector)) {
        return res.status(400).json({
          success: false,
          message: 'Sector is required for sector_admin. Allowed sectors: ecology, health, security'
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email: email.toLowerCase() }]
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists.'
        });
      }

      // Create new user object
      const userData = {
        email: email.toLowerCase(),
        password,
        role: requestedRole,
        sector: requestedRole === 'admin' ? 'all' : sector,
        isActive: true // Auto-activate admin registrations
      };

      // Add username only if provided and not empty, otherwise generate a unique identifier
      if (username && username.trim()) {
        userData.username = username.trim();
      } else {
        // Generate a unique identifier based on email and timestamp
        const emailPrefix = email.toLowerCase().split('@')[0];
        const timestamp = Date.now().toString(36);
        userData.username = `${emailPrefix}_${timestamp}`;
      }

      const newUser = new User(userData);

      await newUser.save();

      res.status(201).json({
        success: true,
        message: 'Admin registered successfully.',
        data: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
          sector: newUser.sector,
          isActive: newUser.isActive,
          createdAt: newUser.createdAt
        }
      });
    } catch (error) {
      console.error('Admin registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during registration.',
        error: error.message
      });
    }
  }
  // Create a new admin or sector admin (Role-based access control)
  async createUser(req, res) {
    try {
      const { username, email, phone, password, role, sector } = req.body || {};
      const currentUserRole = req.user.role;
      const currentUserId = req.user.userId;

      // Check if current user has admin or super_admin role
      if (!['admin', 'super_admin'].includes(currentUserRole)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only admin and super_admin can create users.'
        });
      }

      // Validate required fields
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required.'
        });
      }

      // Validate role
      let validRoles;
      if (currentUserRole === 'super_admin') {
        validRoles = ['admin', 'sector_admin', 'super_admin'];
      } else {
        // admin role can only create sector_admin and admin users
        validRoles = ['admin', 'sector_admin'];
      }

      if (role && !validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: `Invalid role. ${currentUserRole === 'super_admin' ? 'Allowed roles: admin, sector_admin, super_admin' : 'Allowed roles: admin, sector_admin'}`
        });
      }

      // Only super_admin can assign super_admin role
      if (role === 'super_admin' && currentUserRole !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Only super_admin can assign super_admin role.'
        });
      }

      // Validate sector for sector_admin
      const validSectors = ['ecology', 'health', 'security', 'all', "appeals", "tasks", "healthcare", "education", "transport", "infrastructure", "social", "economic", "management", "utilities", "other"];
      if (role === 'sector_admin' && !validSectors.includes(sector)) {
        return res.status(400).json({
          success: false,
          message: 'Sector is required for sector_admin. Allowed sectors: ecology, health, security'
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email: email.toLowerCase() } ]
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists.'
        });
      }

      // Create new user object
      const userData = {
        email: email.toLowerCase(),
        phone,
        password,
        role: role || 'sector_admin',
        sector: role === 'admin' ? 'all' : sector,
        createdBy: req.user.userId
      };

      // Add username only if provided and not empty, otherwise generate a unique identifier
      if (username && username.trim()) {
        userData.username = username.trim();
        console.log('Added provided username to userData:', userData.username);
      } else {
        // Generate a unique identifier based on email and timestamp
        const emailPrefix = email.toLowerCase().split('@')[0];
        const timestamp = Date.now().toString(36);
        userData.username = `${emailPrefix}_${timestamp}`;
        console.log('Generated unique username:', userData.username);
      }

      const newUser = new User(userData);

      await newUser.save();

      res.status(201).json({
        success: true,
        message: 'User created successfully.',
        data: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          phone: newUser.phone,
          role: newUser.role,
          sector: newUser.sector,
          isActive: newUser.isActive,
          createdAt: newUser.createdAt
        }
      });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error.',
        error: error.message
      });
    }
  }

  // Get all users (Admin and Super Admin)
  async getAllUsers(req, res) {
    try {
      const { role, sector, isActive, page = 1, limit = 10 } = req.query;

      // Build filter
      const filter = {};
      
      // Don't show super_admin in the list
      filter.role = { $ne: 'super_admin' };

      if (role) filter.role = role;
      if (sector) filter.sector = sector;
      if (isActive !== undefined) filter.isActive = isActive === 'true';

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const users = await User.find(filter)
        .select('-password')
        .populate('createdBy', 'username email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await User.countDocuments(filter);
 
      res.status(200).json({
        success: true,
        data: {
          users,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error.',
        error: error.message
      });
    }
  }

  // Get user by ID
  async getUserById(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findById(id)
        .select('-password')
        .populate('createdBy', 'username email');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found.'
        });
      }

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Get user by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error.',
        error: error.message
      });
    }
  }

  // Update user (Role-based access control)
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { username, email, phone, role, sector, isActive } = req.body;
      const currentUserRole = req.user.role;
      const currentUserId = req.user.userId;

      // Check if current user has admin or super_admin role
      if (!['admin', 'super_admin'].includes(currentUserRole)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only admin and super_admin can update users.'
        });
      }

      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found.'
        });
      }

      // Prevent modifying super_admin
      if (user.role === 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Cannot modify super admin.'
        });
      }

      // Role-based permission checks for updating user roles
      if (role) {
        // Only super_admin can assign super_admin role
        if (role === 'super_admin' && currentUserRole !== 'super_admin') {
          return res.status(403).json({
            success: false,
            message: 'Only super_admin can assign super_admin role.'
          });
        }

        // Check if current user can assign the requested role
        let allowedRoles;
        if (currentUserRole === 'super_admin') {
          allowedRoles = ['admin', 'sector_admin', 'super_admin'];
        } else {
          // admin role can only assign sector_admin and admin users
          allowedRoles = ['admin', 'sector_admin'];
        }

        if (!allowedRoles.includes(role)) {
          return res.status(403).json({
            success: false,
            message: `You cannot assign ${role} role. Allowed roles: ${allowedRoles.join(', ')}`
          });
        }
      }

      // Check for duplicate email/username
      if (email || username) {
        const existingUser = await User.findOne({
          _id: { $ne: id },
          $or: [
            { email: email?.toLowerCase() },
            { username }
          ].filter(Boolean)
        });

        if (existingUser) {
          return res.status(409).json({
            success: false,
            message: 'User with this email or username already exists.'
          });
        }
      }

      // Update fields
      if (username) user.username = username;
      if (email) user.email = email.toLowerCase();
      if (role && ['admin', 'sector_admin', 'super_admin'].includes(role)) {
        user.role = role;
        if (role === 'admin') user.sector = 'all';
        if (role === 'super_admin') user.sector = 'all';
      }
      if (sector && ['ecology', 'health', 'security', 'all', "appeals", "tasks", "healthcare", "education", "transport", "infrastructure", "social", "economic", "management", "utilities", "other"].includes(sector)) {
        user.sector = sector;
      }
      if (isActive !== undefined) user.isActive = isActive;

      await user.save();

      res.status(200).json({
        success: true,
        message: 'User updated successfully.',
        data: {
          id: user._id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          role: user.role,
          sector: user.sector,
          isActive: user.isActive,
          updatedAt: user.updatedAt
        }
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error.',
        error: error.message
      });
    }
  }

  // Delete user (Role-based access control)
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const currentUserRole = req.user.role;

      // Check if current user has admin or super_admin role
      if (!['admin', 'super_admin'].includes(currentUserRole)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only admin and super_admin can delete users.'
        });
      }

      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found.'
        });
      }

      // Prevent deleting super_admin
      if (user.role === 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Cannot delete super admin.'
        });
      }

      // Additional role-based checks
      if (currentUserRole === 'admin') {
        // admin role cannot delete other admin users
        if (user.role === 'admin') {
          return res.status(403).json({
            success: false,
            message: 'Admin role cannot delete other admin users. Only super_admin can delete admin users.'
          });
        }
      }

      await User.findByIdAndDelete(id);

      res.status(200).json({
        success: true,
        message: 'User deleted successfully.'
      });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error.',
        error: error.message
      });
    }
  }

  // Deactivate user (soft delete) - Role-based access control
  async deactivateUser(req, res) {
    try {
      const { id } = req.params;
      const currentUserRole = req.user.role;

      // Check if current user has admin or super_admin role
      if (!['admin', 'super_admin'].includes(currentUserRole)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only admin and super_admin can deactivate users.'
        });
      }

      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found.'
        });
      }

      // Prevent deactivating super_admin
      if (user.role === 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Cannot deactivate super admin.'
        });
      }

      // Additional role-based checks
      if (currentUserRole === 'admin') {
        // admin role cannot deactivate other admin users
        if (user.role === 'admin') {
          return res.status(403).json({
            success: false,
            message: 'Admin role cannot deactivate other admin users. Only super_admin can deactivate admin users.'
          });
        }
      }

      user.isActive = false;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'User deactivated successfully.'
      });
    } catch (error) {
      console.error('Deactivate user error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error.',
        error: error.message
      });
    }
  }

  // Activate user - Role-based access control
  async activateUser(req, res) {
    try {
      const { id } = req.params;
      const currentUserRole = req.user.role;

      // Check if current user has admin or super_admin role
      if (!['admin', 'super_admin'].includes(currentUserRole)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only admin and super_admin can activate users.'
        });
      }

      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found.'
        });
      }

      // Additional role-based checks
      if (currentUserRole === 'admin') {
        // admin role cannot activate other admin users
        if (user.role === 'admin') {
          return res.status(403).json({
            success: false,
            message: 'Admin role cannot activate other admin users. Only super_admin can activate admin users.'
          });
        }
      }

      user.isActive = true;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'User activated successfully.'
      });
    } catch (error) {
      console.error('Activate user error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error.',
        error: error.message
      });
    }
  }

  // Reset user password - Role-based access control
  async resetUserPassword(req, res) {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;
      const currentUserRole = req.user.role;

      // Check if current user has admin or super_admin role
      if (!['admin', 'super_admin'].includes(currentUserRole)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only admin and super_admin can reset user passwords.'
        });
      }

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters long.'
        });
      }

      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found.'
        });
      }

      // Prevent resetting super_admin password
      if (user.role === 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Cannot reset super admin password.'
        });
      }

      // Additional role-based checks for admin users
      if (currentUserRole === 'admin') {
        // admin role cannot reset other admin users' passwords
        if (user.role === 'admin') {
          return res.status(403).json({
            success: false,
            message: 'Admin role cannot reset other admin users passwords. Only super_admin can reset admin users passwords.'
          });
        }
      }

      user.password = newPassword;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Password reset successfully.'
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error.',
        error: error.message
      });
    }
  }

  // Get users by sector
  async getUsersBySector(req, res) {
    try {
      const { sector } = req.params;

      const validSectors = ['ecology', 'health', 'security', 'all', "appeals", "tasks", "healthcare", "education", "transport", "infrastructure", "social", "economic", "management", "utilities", "other"];
      if (!validSectors.includes(sector)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid sector. Allowed sectors: ecology, health, security'
        });
      }

      const users = await User.find({ sector, role: 'sector_admin' })
        .select('-password')
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: users
      });
    } catch (error) {
      console.error('Get users by sector error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error.',
        error: error.message
      });
    }
  }

 

}

module.exports = new AdminController();
