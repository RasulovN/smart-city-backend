const mongoose = require('mongoose');

const ShiftDataSchema = new mongoose.Schema({
  summary: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  districts: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  cities: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  }
}, { _id: false });

const StatsSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true,
    index: true
  },
  region_id: {
    type: Number,
    required: true,
    index: true
  },
  shifts: {
    shift1: {
      type: ShiftDataSchema,
      default: () => ({})
    },
    shift2: {
      type: ShiftDataSchema,
      default: () => ({})
    },
    shift3: {
      type: ShiftDataSchema,
      default: () => ({})
    },
    all: {
      type: ShiftDataSchema,
      default: () => ({})
    }
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'stats'
});

// Compound index for optimal queries
StatsSchema.index({ date: 1, region_id: 1 }, { unique: true });

// Pre-save middleware to update updated_at
StatsSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

module.exports = mongoose.model('Stats', StatsSchema);