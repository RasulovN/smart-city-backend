const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// Role types: super_admin, admin, sector_admin
// Sectors: ecology, health, security
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: false,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: false,
    trim: true,
    minlength: 9,
    maxlength: 15
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'sector_admin'],
    default: 'sector_admin'
  },
  sector: { 
    type: String,
    enum: ['ecology', 'health', 'security', 'all', "appeals", "tasks", "healthcare", "education", "transport", "infrastructure", "social", "economic", "management", "utilities", "other"],
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  refreshTokens: [{
    token: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      required: true
    },
    userAgent: {
      type: String,
      default: null
    },
    ipAddress: {
      type: String,
      default: null
    }
  }],
  lastPasswordChange: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Create partial unique index for username (only when username is not null)
UserSchema.index({ username: 1 }, { 
  unique: true, 
  partialFilterExpression: { username: { $exists: true, $ne: null, $ne: '' } } 
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get allowed sectors based on role
UserSchema.methods.getAllowedSectors = function() {
  if (this.role === 'super_admin' || this.role === 'admin') {
    return ['ecology', 'health', 'security', 'all'];
  }
  return [this.sector];
};

// Check if user can access a specific sector
UserSchema.methods.canAccessSector = function(sector) {
  if (this.role === 'super_admin' || this.role === 'admin') {
    return true;
  }
  return this.sector === sector || this.sector === 'all';
};

// Static method to get sector-specific permissions
UserSchema.statics.getSectorPermissions = function(sector) {
  const permissions = {
    ecology: ['environment', 'pollution', 'waste', 'green_spaces'],
    health: ['hospitals', 'clinics', 'emergency', 'public_health'],
    security: ['traffic', 'surveillance', 'emergency_response', 'public_safety'],
    all: ['environment', 'pollution', 'waste', 'green_spaces', 'hospitals', 'clinics', 'emergency', 'public_health', 'traffic', 'surveillance', 'emergency_response', 'public_safety']
  };
  return permissions[sector] || [];
};

// Add refresh token
UserSchema.methods.addRefreshToken = function(token, expiresAt, userAgent = null, ipAddress = null) {
  this.refreshTokens.push({
    token,
    expiresAt,
    userAgent,
    ipAddress
  });
  return this.save();
};

// Remove specific refresh token
UserSchema.methods.removeRefreshToken = function(token) {
  this.refreshTokens = this.refreshTokens.filter(rt => rt.token !== token);
  return this.save();
};

// Remove all refresh tokens (logout all devices)
UserSchema.methods.removeAllRefreshTokens = function() {
  this.refreshTokens = [];
  return this.save();
};

// Clean expired refresh tokens
UserSchema.methods.cleanExpiredRefreshTokens = function() {
  const now = new Date();
  this.refreshTokens = this.refreshTokens.filter(rt => rt.expiresAt > now);
  return this.save();
};

// Check if refresh token exists and is valid
UserSchema.methods.hasValidRefreshToken = function(token) {
  const now = new Date();
  return this.refreshTokens.some(rt => rt.token === token && rt.expiresAt > now);
};

// Get refresh token count
UserSchema.methods.getRefreshTokenCount = function() {
  const now = new Date();
  return this.refreshTokens.filter(rt => rt.expiresAt > now).length;
};

module.exports = mongoose.model("User", UserSchema);
