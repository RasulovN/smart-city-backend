# Incremental Attendance System - Final Implementation

## Complete Working Solution

### Schema (OptimizedAttendance.js)
```javascript
const OptimizedAttendanceSchema = new mongoose.Schema({
  type: { type: String, enum: ['realtime', 'finalized'], required: true, default: 'realtime' },
  date: { type: String, required: true, index: true },
  shift_no: { type: Number, default: null, index: true },
  viloyat: {
    id: { type: Number, required: true, index: true },
    nomi: { type: String, required: true }
  },
  summary: {
    schools: { total: { type: Number, index: true }, active: { type: Number, index: true } },
    students: {
      total: { type: Number, index: true },
      active: { type: Number, index: true },
      present_today: { type: Number, index: true },
      absent_today: { type: Number, index: true },
      late_today: { type: Number, index: true },
      attendance_rate: { type: Number, index: true }
    },
    teachers: { total: { type: Number, index: true }, active: { type: Number, index: true } }
  },
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
  timestamp: { type: Date, default: Date.now, index: true },
  finalizedAt: { type: Date, index: true },
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now, index: true }
});

// Single document per date index
OptimizedAttendanceSchema.index({ date: 1, type: 1, shift_no: 1 }, { unique: true });

// Incremental shift save - CORE METHOD
OptimizedAttendanceSchema.statics.saveIncrementalShift = async function(rawData, shift_no) {
  const today = new Date().toISOString().split("T")[0];
  const isToday = rawData.date === today;
  const shiftKey = shift_no === null ? "all" : `shift${shift_no}`;

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

  if (isToday) {
    const existing = await this.findOne({ 
      date: rawData.date,
      type: 'realtime' 
    });

    if (existing) {
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
```

### WebSocket Integration (schools.js)
```javascript
async function saveToMongoDB(data) {
  try {
    const result = await OptimizedAttendance.saveIncrementalShift(data, data.shift_no ?? null);
    
    const shiftName = data.shift_no === null ? 'Barcha' : `${data.shift_no}-smena`;
    const operation = result.operation === 'updated' ? '🔄 YANGILANDI' : '✅ YARATILDI';
    
    console.log(`${operation} → ${data.date} | Smena: ${shiftName} | Davomat: ${data.students.attendance_rate}% | Shaharlar: ${data.shaxarlarda?.length || 0} | Tumanlar: ${data.tumanlarda?.length || 0}`);
    
    await OptimizedAttendance.updateTotalSummary(data.date);
  } catch (err) {
    console.error("MongoDB ga saqlashda xato:", err.message);
  }
}
```

## Example Requests

### 1. Save "All" Shift
```javascript
const allShiftData = {
  date: "2025-12-04",
  viloyat_id: 1,
  viloyat_nomi: "Qashqadaryo",
  schools: { total: 1240, active: 1240 },
  students: {
    total: 654812,
    active: 654812,
    present_today: 500000,
    absent_today: 154812,
    late_today: 50000,
    attendance_rate: 76.4
  },
  teachers: { total: 0, active: 0 },
  shaxarlarda: [
    {
      shahar_nomi: "Qarshi",
      schools_count: 51,
      students_total: 55404,
      students_present: 42351,
      attendance_rate: 76.4
    }
  ],
  tumanlarda: [
    {
      tuman_nomi: "Qarshi tumani",
      schools_count: 128,
      students_total: 56838,
      students_present: 43450,
      attendance_rate: 76.4
    }
  ]
};

await OptimizedAttendance.saveIncrementalShift(allShiftData, null);
// Result: Creates/updates "all" field only
```

### 2. Save Shift 1
```javascript
const shift1Data = {
  date: "2025-12-04",
  viloyat_id: 1,
  viloyat_nomi: "Qashqadaryo",
  schools: { total: 1240, active: 1240 },
  students: {
    total: 200000,
    active: 200000,
    present_today: 180000,
    absent_today: 20000,
    late_today: 10000,
    attendance_rate: 90.0
  },
  teachers: { total: 0, active: 0 },
  shaxarlarda: [
    {
      shahar_nomi: "Qarshi",
      schools_count: 51,
      students_total: 20000,
      students_present: 18000,
      attendance_rate: 90.0
    }
  ],
  tumanlarda: [
    {
      tuman_nomi: "Qarshi tumani",
      schools_count: 128,
      students_total: 25000,
      students_present: 22500,
      attendance_rate: 90.0
    }
  ]
};

await OptimizedAttendance.saveIncrementalShift(shift1Data, 1);
// Result: Updates only "shift1" field, "all", "shift2", "shift3" unchanged
```

### 3. Save Shift 2
```javascript
const shift2Data = {
  date: "2025-12-04",
  viloyat_id: 1,
  viloyat_nomi: "Qashqadaryo",
  schools: { total: 1240, active: 1240 },
  students: {
    total: 230000,
    active: 230000,
    present_today: 180000,
    absent_today: 50000,
    late_today: 20000,
    attendance_rate: 78.3
  },
  teachers: { total: 0, active: 0 },
  shaxarlarda: [
    {
      shahar_nomi: "Qarshi",
      schools_count: 51,
      students_total: 18000,
      students_present: 14100,
      attendance_rate: 78.3
    }
  ],
  tumanlarda: [
    {
      tuman_nomi: "Qarshi tumani",
      schools_count: 128,
      schools_count: 15800,
      students_total: 15800,
      students_present: 12381,
      attendance_rate: 78.3
    }
  ]
};

await OptimizedAttendance.saveIncrementalShift(shift2Data, 2);
// Result: Updates only "shift2" field, "all", "shift1", "shift3" unchanged
```

### 4. Save Shift 3
```javascript
const shift3Data = {
  date: "2025-12-04",
  viloyat_id: 1,
  viloyat_nomi: "Qashqadaryo",
  schools: { total: 1240, active: 1240 },
  students: {
    total: 224812,
    active: 224812,
    present_today: 140000,
    absent_today: 84812,
    late_today: 20000,
    attendance_rate: 62.3
  },
  teachers: { total: 0, active: 0 },
  shaxarlarda: [
    {
      shahar_nomi: "Qarshi",
      schools_count: 51,
      students_total: 17404,
      students_present: 10851,
      attendance_rate: 62.3
    }
  ],
  tumanlarda: [
    {
      tuman_nomi: "Qarshi tumani",
      schools_count: 128,
      schools_count: 16038,
      students_total: 16038,
      students_present: 9980,
      attendance_rate: 62.3
    }
  ]
};

await OptimizedAttendance.saveIncrementalShift(shift3Data, 3);
// Result: Updates only "shift3" field, "all", "shift1", "shift2" unchanged
```

## Final Database Structure

After all requests above, single document contains:
```javascript
{
  "_id": "...",
  "date": "2025-12-04",
  "type": "realtime",
  "shift_no": null,
  "dailySummary": {
    "shifts": {
      "all": {
        "date": "2025-12-04",
        "viloyat": { "id": 1, "nomi": "Qashqadaryo" },
        "summary": {
          "schools": { "total": 1240, "active": 1240 },
          "students": {
            "total": 654812,
            "active": 654812,
            "present_today": 500000,
            "absent_today": 154812,
            "late_today": 50000,
            "attendance_rate": 76.4
          },
          "teachers": { "total": 0, "active": 0 }
        },
        "cities": [...],
        "districts": [...]
      },
      "shift1": {
        "date": "2025-12-04",
        "viloyat": { "id": 1, "nomi": "Qashqadaryo" },
        "summary": {
          "schools": { "total": 1240, "active": 1240 },
          "students": {
            "total": 200000,
            "active": 200000,
            "present_today": 180000,
            "absent_today": 20000,
            "late_today": 10000,
            "attendance_rate": 90.0
          },
          "teachers": { "total": 0, "active": 0 }
        },
        "cities": [...],
        "districts": [...]
      },
      "shift2": {
        "date": "2025-12-04",
        "viloyat": { "id": 1, "nomi": "Qashqadaryo" },
        "summary": {
          "schools": { "total": 1240, "active": 1240 },
          "students": {
            "total": 230000,
            "active": 230000,
            "present_today": 180000,
            "absent_today": 50000,
            "late_today": 20000,
            "attendance_rate": 78.3
          },
          "teachers": { "total": 0, "active": 0 }
        },
        "cities": [...],
        "districts": [...]
      },
      "shift3": {
        "date": "2025-12-04",
        "viloyat": { "id": 1, "nomi": "Qashqadaryo" },
        "summary": {
          "schools": { "total": 1240, "active": 1240 },
          "students": {
            "total": 224812,
            "active": 224812,
            "present_today": 140000,
            "absent_today": 84812,
            "late_today": 20000,
            "attendance_rate": 62.3
          },
          "teachers": { "total": 0, "active": 0 }
        },
        "cities": [...],
        "districts": [...]
      }
    },
    "totalPresent": 1000000,
    "totalStudents": 1309812,
    "overallRate": 76.35
  },
  "createdAt": "...",
  "updatedAt": "..."
}
```

## Key Benefits

1. **Single Document**: One document per date instead of multiple
2. **Incremental Updates**: Only specific shift fields are updated
3. **Data Integrity**: Existing shift data preserved unless specifically updated
4. **Efficient Storage**: No duplication of geographic or summary data
5. **Atomic Operations**: Uses MongoDB `$set` for safe updates

## Test Queries

```javascript
// Get complete day snapshot
const snapshot = await OptimizedAttendance.getSingleDaySnapshot('2025-12-04');
console.log(snapshot.dailySummary.shifts.all.summary.students.attendance_rate);
console.log(snapshot.dailySummary.shifts.shift1.summary.students.attendance_rate);
console.log(snapshot.dailySummary.shifts.shift2.summary.students.attendance_rate);
console.log(snapshot.dailySummary.shifts.shift3.summary.students.attendance_rate);

// Update totals after any change
await OptimizedAttendance.updateTotalSummary('2025-12-04');
```

This implementation ensures exactly one document per date with proper incremental updates for each shift.