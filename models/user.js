const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// Role types: super_admin, admin, sector_admin
// Sectors: ecology, health, security
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: false,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50,
    sparse: true  // Allow multiple documents with null/undefined values
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
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
    enum: ['ecology', 'health', 'security', 'all', "appeals", "other", "tasks", "komunal"],
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
  }
}, {
  timestamps: true
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

module.exports = mongoose.model("User", UserSchema);
