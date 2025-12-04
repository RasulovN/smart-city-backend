// models/OptimizedAttendance.js
const mongoose = require("mongoose");

const OptimizedAttendanceSchema = new mongoose.Schema({
  // Document type identification
  type: { 
    type: String, 
    enum: ['realtime', 'finalized'], 
    required: true,
    default: 'realtime'
  },
  
  // Core identifiers
  date: { 
    type: String, 
    required: true,
    index: true
  },
  shift_no: { 
    type: Number, 
    default: null,
    index: true
  },
  tuman_id: { 
    type: Number, 
    default: null,
    index: true
  },
  
  // Geographic information
  viloyat: {
    id: { type: Number, required: true, index: true },
    nomi: { type: String, required: true }
  },

  // Main attendance summary
  summary: {
    schools: { 
      total: { type: Number, index: true },
      active: { type: Number, index: true }
    },
    students: {
      total: { type: Number, index: true },
      active: { type: Number, index: true },
      present_today: { type: Number, index: true },
      absent_today: { type: Number, index: true },
      late_today: { type: Number, index: true },
      attendance_rate: { type: Number, index: true }
    },
    teachers: { 
      total: { type: Number, index: true },
      active: { type: Number, index: true }
    }
  },

  // Hierarchical geographic data with shift-based nested structure
  districts: [{
    tuman_nomi: String,
    shifts: {
      all: {
        schools_count: { type: Number, index: true },
        students_total: { type: Number, index: true },
        students_present: { type: Number, index: true },
        attendance_rate: { type: Number, index: true }
      },
      shift1: {
        schools_count: { type: Number, index: true },
        students_total: { type: Number, index: true },
        students_present: { type: Number, index: true },
        attendance_rate: { type: Number, index: true }
      },
      shift2: {
        schools_count: { type: Number, index: true },
        students_total: { type: Number, index: true },
        students_present: { type: Number, index: true },
        attendance_rate: { type: Number, index: true }
      },
      shift3: {
        schools_count: { type: Number, index: true },
        students_total: { type: Number, index: true },
        students_present: { type: Number, index: true },
        attendance_rate: { type: Number, index: true }
      }
    }
  }],

  cities: [{
    shahar_nomi: String,
    shifts: {
      all: {
        schools_count: { type: Number, index: true },
        students_total: { type: Number, index: true },
        students_present: { type: Number, index: true },
        attendance_rate: { type: Number, index: true }
      },
      shift1: {
        schools_count: { type: Number, index: true },
        students_total: { type: Number, index: true },
        students_present: { type: Number, index: true },
        attendance_rate: { type: Number, index: true }
      },
      shift2: {
        schools_count: { type: Number, index: true },
        students_total: { type: Number, index: true },
        students_present: { type: Number, index: true },
        attendance_rate: { type: Number, index: true }
      },
      shift3: {
        schools_count: { type: Number, index: true },
        students_total: { type: Number, index: true },
        students_present: { type: Number, index: true },
        attendance_rate: { type: Number, index: true }
      }
    }
  }],

  // Daily snapshot specific data
  dailySummary: {
    shifts: {
      all: { type: Object },
      shift1: { type: Object },
      shift2: { type: Object },
      shift3: { type: Object }
    },
    totalPresent: { type: Number, index: true },
    totalStudents: { type: Number, index: true },
    overallRate: { type: Number, index: true }
  },

  // Timestamps
  timestamp: { 
    type: Date, 
    default: Date.now,
    index: true
  },
  finalizedAt: { 
    type: Date, 
    index: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true
  },
  updatedAt: { 
    type: Date, 
    default: Date.now,
    index: true
  }
});

// OPTIMIZED INDEXES for fast filtering and sorting
OptimizedAttendanceSchema.index({ date: 1, shift_no: 1, type: 1 });
OptimizedAttendanceSchema.index({ type: 1, createdAt: -1 });
OptimizedAttendanceSchema.index({ 'viloyat.id': 1, date: 1 });
OptimizedAttendanceSchema.index({ 'summary.students.attendance_rate': -1 });
OptimizedAttendanceSchema.index({ date: -1, type: 1 });
OptimizedAttendanceSchema.index({ type: 1, 'viloyat.id': 1, shift_no: 1 });

// Index for single document per date queries
OptimizedAttendanceSchema.index({ date: 1, type: 1, shift_no: 1 }, { unique: true });

// Index for tuman_id filtered queries
OptimizedAttendanceSchema.index({ date: 1, shift_no: 1, tuman_id: 1, type: 1 }, { unique: true });

// Compound indexes for common query patterns
OptimizedAttendanceSchema.index(
  { date: 1, shift_no: 1, type: 1, 'viloyat.id': 1 }, 
  { name: 'comprehensive_query_index' }
);

OptimizedAttendanceSchema.index(
  { type: 1, date: -1, 'summary.students.attendance_rate': -1 },
  { name: 'filtering_sorting_index' }
);

// Text index for search functionality
OptimizedAttendanceSchema.index({
  'viloyat.nomi': 'text',
  'districts.tuman_nomi': 'text',
  'cities.shahar_nomi': 'text'
});

// Text index for nested shift data
OptimizedAttendanceSchema.index({
  'districts.tuman_nomi': 'text',
  'cities.shahar_nomi': 'text'
});

// Auto-update timestamp
OptimizedAttendanceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static methods for optimized queries
OptimizedAttendanceSchema.statics.getRealtimeData = function(filters = {}) {
  const query = { type: 'realtime', ...filters };
  return this.find(query).sort({ createdAt: -1 }).limit(100);
};

OptimizedAttendanceSchema.statics.getDailySummary = function(date) {
  return this.findOne({ 
    date: date,
    type: 'finalized',
    shift_no: null 
  });
};

OptimizedAttendanceSchema.statics.getAttendanceByRate = function(filters = {}) {
  const query = { type: 'realtime', ...filters };
  return this.find(query).sort({ 'summary.students.attendance_rate': -1 });
};

OptimizedAttendanceSchema.statics.getFilteredData = function(filters = {}) {
  const {
    date,
    shift_no,
    viloyat_id,
    min_attendance_rate,
    max_attendance_rate,
    limit = 50
  } = filters;
  
  const query = { type: 'realtime' };
  
  if (date) query.date = date;
  if (shift_no !== undefined) query.shift_no = shift_no;
  if (viloyat_id) query['viloyat.id'] = viloyat_id;
  
  if (min_attendance_rate || max_attendance_rate) {
    query['summary.students.attendance_rate'] = {};
    if (min_attendance_rate) query['summary.students.attendance_rate'].$gte = min_attendance_rate;
    if (max_attendance_rate) query['summary.students.attendance_rate'].$lte = max_attendance_rate;
  }
  
  return this.find(query)
    .sort({ 'summary.students.attendance_rate': -1, createdAt: -1 })
    .limit(limit);
};

// Get all shifts data for a specific date
OptimizedAttendanceSchema.statics.getAllShiftsData = function(date) {
  return this.find({ 
    date: date,
    type: 'realtime'
  }).sort({ shift_no: 1 });
};

// Get shifts summary with cities/districts data
OptimizedAttendanceSchema.statics.getShiftsWithDetails = async function(date) {
  const shifts = await this.find({ 
    date: date,
    type: 'realtime'
  }).sort({ shift_no: 1 });

  const shiftsData = {
    date: date,
    shifts: {
      all: null,
      shift1: null,
      shift2: null,
      shift3: null
    },
    totalSummary: {
      students_present: 0,
      students_total: 0,
      attendance_rate: 0
    }
  };

  let totalPresent = 0;
  let totalStudents = 0;

  shifts.forEach(shiftData => {
    const shiftKey = shiftData.shift_no === null ? "all" : `shift${shiftData.shift_no}`;
    shiftsData.shifts[shiftKey] = shiftData;

    if (shiftData.summary?.students) {
      totalPresent += shiftData.summary.students.present_today || 0;
      totalStudents += shiftData.summary.students.total || 0;
    }
  });

  const rate = totalStudents > 0 ? (totalPresent / totalStudents * 100) : 0;
  shiftsData.totalSummary = {
    students_present: totalPresent,
    students_total: totalStudents,
    attendance_rate: parseFloat(rate.toFixed(2))
  };

  return shiftsData;
};

// Get specific shift data with cities/districts
OptimizedAttendanceSchema.statics.getShiftData = function(date, shift_no) {
  const query = { 
    date: date,
    type: 'realtime'
  };
  
  if (shift_no === 'all' || shift_no === 0 || shift_no === null) {
    query.shift_no = null;
  } else {
    query.shift_no = parseInt(shift_no);
  }
  
  return this.findOne(query);
};

// Get nested shift data for cities and districts
OptimizedAttendanceSchema.statics.getNestedShiftData = async function(date) {
  const allShifts = await this.find({ 
    date: date,
    type: 'realtime'
  }).sort({ shift_no: 1 });

  // Group data by city and district with shift breakdown
  const cityShiftData = new Map();
  const districtShiftData = new Map();

  allShifts.forEach(shiftDoc => {
    const shiftKey = shiftDoc.shift_no === null ? "all" : `shift${shiftDoc.shift_no}`;
    
    // Process cities
    if (shiftDoc.cities && shiftDoc.cities.length > 0) {
      shiftDoc.cities.forEach(city => {
        if (!cityShiftData.has(city.shahar_nomi)) {
          cityShiftData.set(city.shahar_nomi, {
            shahar_nomi: city.shahar_nomi,
            shifts: {
              all: { schools_count: 0, students_total: 0, students_present: 0, attendance_rate: 0 },
              shift1: { schools_count: 0, students_total: 0, students_present: 0, attendance_rate: 0 },
              shift2: { schools_count: 0, students_total: 0, students_present: 0, attendance_rate: 0 },
              shift3: { schools_count: 0, students_total: 0, students_present: 0, attendance_rate: 0 }
            }
          });
        }
        
        const cityData = cityShiftData.get(city.shahar_nomi);
        if (city.shifts && city.shifts[shiftKey]) {
          cityData.shifts[shiftKey] = city.shifts[shiftKey];
        } else if (shiftDoc.summary) {
          // If no nested structure, use overall shift data
          cityData.shifts[shiftKey] = {
            schools_count: shiftDoc.summary.schools?.total || 0,
            students_total: shiftDoc.summary.students?.total || 0,
            students_present: shiftDoc.summary.students?.present_today || 0,
            attendance_rate: shiftDoc.summary.students?.attendance_rate || 0
          };
        }
      });
    }

    // Process districts
    if (shiftDoc.districts && shiftDoc.districts.length > 0) {
      shiftDoc.districts.forEach(district => {
        if (!districtShiftData.has(district.tuman_nomi)) {
          districtShiftData.set(district.tuman_nomi, {
            tuman_nomi: district.tuman_nomi,
            shifts: {
              all: { schools_count: 0, students_total: 0, students_present: 0, attendance_rate: 0 },
              shift1: { schools_count: 0, students_total: 0, students_present: 0, attendance_rate: 0 },
              shift2: { schools_count: 0, students_total: 0, students_present: 0, attendance_rate: 0 },
              shift3: { schools_count: 0, students_total: 0, students_present: 0, attendance_rate: 0 }
            }
          });
        }
        
        const districtData = districtShiftData.get(district.tuman_nomi);
        if (district.shifts && district.shifts[shiftKey]) {
          districtData.shifts[shiftKey] = district.shifts[shiftKey];
        } else if (shiftDoc.summary) {
          // If no nested structure, use overall shift data
          districtData.shifts[shiftKey] = {
            schools_count: shiftDoc.summary.schools?.total || 0,
            students_total: shiftDoc.summary.students?.total || 0,
            students_present: shiftDoc.summary.students?.present_today || 0,
            attendance_rate: shiftDoc.summary.students?.attendance_rate || 0
          };
        }
      });
    }
  });

  return {
    cities: Array.from(cityShiftData.values()),
    districts: Array.from(districtShiftData.values())
  };
};

// Incrementally save shift data to single document per date
OptimizedAttendanceSchema.statics.saveIncrementalShift = async function(rawData, shift_no) {
  const today = new Date().toISOString().split("T")[0];
  const isToday = rawData.date === today;
  const shiftKey = shift_no === null ? "all" : `shift${shift_no}`;

  // Build the shift data object
  const shiftData = {
    date: rawData.date,
    viloyat: {
      id: rawData.viloyat_id,
      nomi: rawData.viloyat_nomi
    },
    summary: {
      schools: rawData.schools,
      students: rawData.students,
      teachers: rawData.teachers
    },
    timestamp: new Date(),
    districts: rawData.tumanlarda || [],
    cities: rawData.shaxarlarda || []
  };

  // For today's data, update existing record
  if (isToday) {
    const existing = await this.findOne({ 
      date: rawData.date,
      type: 'realtime' 
    });

    if (existing) {
      // Update only the specific shift field
      const updateQuery = {};
      updateQuery[`dailySummary.shifts.${shiftKey}`] = shiftData;
      
      await this.findOneAndUpdate(
        { 
          date: rawData.date,
          type: 'realtime'
        },
        {
          $set: updateQuery,
          $setOnInsert: {
            type: 'realtime',
            shift_no: null,
            createdAt: new Date()
          },
          updatedAt: new Date()
        },
        { 
          upsert: true,
          new: true,
          setDefaultsOnInsert: true
        }
      );

      return { operation: 'updated', shift: shiftKey };
    }
  }

  // Create new document or update historical data
  await this.findOneAndUpdate(
    { 
      date: rawData.date,
      type: 'realtime'
    },
    {
      $set: {
        date: rawData.date,
        viloyat: shiftData.viloyat,
        timestamp: shiftData.timestamp,
        districts: shiftData.districts,
        cities: shiftData.cities,
        updatedAt: new Date()
      },
      $setOnInsert: {
        type: 'realtime',
        shift_no: null,
        createdAt: new Date(),
        dailySummary: {
          shifts: {
            all: shiftKey === 'all' ? shiftData : {},
            shift1: shiftKey === 'shift1' ? shiftData : {},
            shift2: shiftKey === 'shift2' ? shiftData : {},
            shift3: shiftKey === 'shift3' ? shiftData : {}
          },
          totalPresent: shiftData.summary.students.present_today || 0,
          totalStudents: shiftData.summary.students.total || 0,
          overallRate: shiftData.summary.students.attendance_rate || 0
        }
      }
    },
    { 
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    }
  );

  return { operation: 'created', shift: shiftKey };
};

// Enhanced WebSocket data handler with dynamic updates and tuman_id support
OptimizedAttendanceSchema.statics.saveWebSocketData = async function(websocketData, config) {
  const { date, shift_no, tuman_id } = config;
  const shiftKey = shift_no === null || shift_no === undefined ? "all" : `shift${shift_no}`;
  
  // Build dynamic update object from received fields
  const updateFields = {
    date: date,
    shift_no: shift_no ?? null,
    tuman_id: tuman_id ?? null,
    timestamp: new Date(),
    updatedAt: new Date()
  };

  // Add viloyat info if present
  if (websocketData.viloyat_id || websocketData.viloyat_nomi) {
    updateFields.viloyat = {
      id: websocketData.viloyat_id,
      nomi: websocketData.viloyat_nomi
    };
  }

  // Add summary data if present
  if (websocketData.schools || websocketData.students || websocketData.teachers) {
    updateFields.summary = {
      schools: websocketData.schools || {},
      students: websocketData.students || {},
      teachers: websocketData.teachers || {}
    };
  }

  // Add geographic data if present
  if (websocketData.tumanlarda) {
    updateFields.districts = websocketData.tumanlarda;
  }
  if (websocketData.shaxarlarda) {
    updateFields.cities = websocketData.shaxarlarda;
  }

  // Build query for finding existing record
  const query = {
    date: date,
    type: 'realtime',
    shift_no: shift_no ?? null,
    tuman_id: tuman_id ?? null
  };

  // Check if record exists
  const existing = await this.findOne(query);

  if (existing) {
    // UPDATE existing record - only update received fields
    await this.findOneAndUpdate(
      query,
      { $set: updateFields },
      { new: true }
    );
    return { operation: 'updated', query };
  } else {
    // CREATE new record with complete structure
    const newDoc = {
      ...query,
      type: 'realtime',
      createdAt: new Date(),
      ...updateFields,
      dailySummary: {
        shifts: {
          all: shiftKey === 'all' ? updateFields : {},
          shift1: shiftKey === 'shift1' ? updateFields : {},
          shift2: shiftKey === 'shift2' ? updateFields : {},
          shift3: shiftKey === 'shift3' ? updateFields : {}
        }
      }
    };

    await this.create(newDoc);
    return { operation: 'created', query };
  }
};

// Dynamic config message builder
OptimizedAttendanceSchema.statics.buildConfigMessage = function(options = {}) {
  const config = {
    type: "config",
    interval: options.interval || 25
  };

  if (options.shift_no !== undefined && options.shift_no !== null) {
    config.shift_no = options.shift_no;
  }

  if (options.date) {
    config.date = options.date;
  }

  if (options.tuman_id !== undefined && options.tuman_id !== null) {
    config.tuman_id = options.tuman_id;
  }

  return config;
};

// Get data by filters
OptimizedAttendanceSchema.statics.getDataByFilters = function(filters = {}) {
  const query = { type: 'realtime' };
  
  if (filters.date) query.date = filters.date;
  if (filters.shift_no !== undefined) query.shift_no = filters.shift_no;
  if (filters.tuman_id !== undefined) query.tuman_id = filters.tuman_id;
  if (filters.viloyat_id) query['viloyat.id'] = filters.viloyat_id;

  return this.find(query).sort({ updatedAt: -1 });
};

// Get single document with all shifts for a date
OptimizedAttendanceSchema.statics.getSingleDaySnapshot = function(date) {
  return this.findOne({
    date: date,
    type: 'realtime',
    shift_no: null
  });
};

// Update total summary after any shift update
OptimizedAttendanceSchema.statics.updateTotalSummary = async function(date) {
  const doc = await this.findOne({ 
    date: date,
    type: 'realtime',
    shift_no: null 
  });

  if (!doc || !doc.dailySummary || !doc.dailySummary.shifts) return;

  const shifts = doc.dailySummary.shifts;
  let totalPresent = 0;
  let totalStudents = 0;

  // Calculate totals from all shift data
  Object.values(shifts).forEach(shiftData => {
    if (shiftData.summary && shiftData.summary.students) {
      totalPresent += shiftData.summary.students.present_today || 0;
      totalStudents += shiftData.summary.students.total || 0;
    }
  });

  const overallRate = totalStudents > 0 ? (totalPresent / totalStudents * 100) : 0;

  await this.findOneAndUpdate(
    { 
      date: date,
      type: 'realtime',
      shift_no: null
    },
    {
      $set: {
        'dailySummary.totalPresent': totalPresent,
        'dailySummary.totalStudents': totalStudents,
        'dailySummary.overallRate': parseFloat(overallRate.toFixed(2)),
        updatedAt: new Date()
      }
    }
  );
};

// Process WebSocket data into nested shift structure
OptimizedAttendanceSchema.statics.processShiftData = function(rawData, shift_no) {
  const shiftKey = shift_no === null ? "all" : `shift${shift_no}`;
  
  const processedData = {
    type: 'realtime',
    date: rawData.date,
    shift_no: shift_no,
    timestamp: new Date(),
    viloyat: {
      id: rawData.viloyat_id,
      nomi: rawData.viloyat_nomi
    },
    summary: {
      schools: rawData.schools,
      students: rawData.students,
      teachers: rawData.teachers
    },
    districts: [],
    cities: []
  };

  // Process districts with shift-based structure
  if (rawData.tumanlarda && rawData.tumanlarda.length > 0) {
    processedData.districts = rawData.tumanlarda.map(district => ({
      tuman_nomi: district.tuman_nomi,
      shifts: {
        all: shift_no === null ? {
          schools_count: district.schools_count,
          students_total: district.students_total,
          students_present: district.students_present,
          attendance_rate: district.attendance_rate
        } : { schools_count: 0, students_total: 0, students_present: 0, attendance_rate: 0 },
        shift1: shift_no === 1 ? {
          schools_count: district.schools_count,
          students_total: district.students_total,
          students_present: district.students_present,
          attendance_rate: district.attendance_rate
        } : { schools_count: 0, students_total: 0, students_present: 0, attendance_rate: 0 },
        shift2: shift_no === 2 ? {
          schools_count: district.schools_count,
          students_total: district.students_total,
          students_present: district.students_present,
          attendance_rate: district.attendance_rate
        } : { schools_count: 0, students_total: 0, students_present: 0, attendance_rate: 0 },
        shift3: shift_no === 3 ? {
          schools_count: district.schools_count,
          students_total: district.students_total,
          students_present: district.students_present,
          attendance_rate: district.attendance_rate
        } : { schools_count: 0, students_total: 0, students_present: 0, attendance_rate: 0 }
      }
    }));
  }

  // Process cities with shift-based structure
  if (rawData.shaxarlarda && rawData.shaxarlarda.length > 0) {
    processedData.cities = rawData.shaxarlarda.map(city => ({
      shahar_nomi: city.shahar_nomi,
      shifts: {
        all: shift_no === null ? {
          schools_count: city.schools_count,
          students_total: city.students_total,
          students_present: city.students_present,
          attendance_rate: city.attendance_rate
        } : { schools_count: 0, students_total: 0, students_present: 0, attendance_rate: 0 },
        shift1: shift_no === 1 ? {
          schools_count: city.schools_count,
          students_total: city.students_total,
          students_present: city.students_present,
          attendance_rate: city.attendance_rate
        } : { schools_count: 0, students_total: 0, students_present: 0, attendance_rate: 0 },
        shift2: shift_no === 2 ? {
          schools_count: city.schools_count,
          students_total: city.students_total,
          students_present: city.students_present,
          attendance_rate: city.attendance_rate
        } : { schools_count: 0, students_total: 0, students_present: 0, attendance_rate: 0 },
        shift3: shift_no === 3 ? {
          schools_count: city.schools_count,
          students_total: city.students_total,
          students_present: city.students_present,
          attendance_rate: city.attendance_rate
        } : { schools_count: 0, students_total: 0, students_present: 0, attendance_rate: 0 }
      }
    }));
  }

  return processedData;
};

module.exports = mongoose.model("OptimizedAttendance", OptimizedAttendanceSchema);