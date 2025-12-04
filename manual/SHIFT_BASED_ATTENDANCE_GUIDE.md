# Shift-Based Attendance System Guide

## Overview
The attendance system now fully supports shift-based data storage and retrieval, with detailed cities/districts data for each shift (1, 2, 3).

## New Features

### 1. Shift-Based Data Storage
- Each shift (1, 2, 3) is stored as separate documents
- Cities and districts data is preserved for each shift
- All shifts can be queried individually or together

### 2. Enhanced API Endpoints

#### Get Daily Report (All Shifts)
```
GET /api/schools/reports/daily?date=2025-12-03
```

**Response Example:**
```json
{
  "date": "2025-12-03",
  "shifts": {
    "all": {
      // Combined data for all shifts
      "cities": [...],
      "districts": [...]
    },
    "shift1": {
      // 1st shift specific data
      "cities": [
        {
          "shahar_nomi": "Qarshi",
          "schools_count": 50,
          "students_total": 55339,
          "students_present": 24735,
          "attendance_rate": 44.7
        }
      ],
      "districts": [...]
    },
    "shift2": {
      // 2nd shift specific data
      "cities": [...],
      "districts": [...]
    },
    "shift3": {
      // 3rd shift specific data
      "cities": [...],
      "districts": [...]
    }
  },
  "totalSummary": {
    "students_present": 150000,
    "students_total": 200000,
    "attendance_rate": 75.0
  }
}
```

#### Get Specific Shift Data
```
GET /api/schools/reports/shift?date=2025-12-03&shift=1
```

#### Get All Shifts (Raw Data)
```
GET /api/schools/reports/all-shifts?date=2025-12-03
```

### 3. WebSocket Configuration
The WebSocket now supports shift-specific requests:

```javascript
// Request 1st shift data
schoolsSocket.setSchoolsConfig({
  shift_no: 1,
  date: '2025-12-03',
  interval: 25
});

// Request all shifts
schoolsSocket.setSchoolsConfig({
  shift_no: null,
  date: '2025-12-03',
  interval: 25
});

// Request 2nd shift
schoolsSocket.setSchoolsConfig({
  shift_no: 2,
  date: '2025-12-03',
  interval: 25
});
```

### 4. Model Methods

#### Get All Shifts Data
```javascript
const allShifts = await OptimizedAttendance.getAllShiftsData('2025-12-03');
```

#### Get Shifts with Details (Cities/Districts)
```javascript
const shiftsDetails = await OptimizedAttendance.getShiftsWithDetails('2025-12-03');
```

#### Get Specific Shift
```javascript
const shift1 = await OptimizedAttendance.getShiftData('2025-12-03', 1);
const allShifts = await OptimizedAttendance.getShiftData('2025-12-03', 'all');
```

### 5. Frontend Integration

#### Display All Shifts
```javascript
// React/Vue example
const response = await fetch('/api/schools/reports/daily?date=2025-12-03');
const data = await response.json();

console.log('1st shift cities:', data.shifts.shift1.cities);
console.log('2nd shift cities:', data.shifts.shift2.cities);
console.log('3rd shift cities:', data.shifts.shift3.cities);
```

#### Individual Shift Request
```javascript
// Get specific shift data
const response = await fetch('/api/schools/reports/shift?date=2025-12-03&shift=2');
const shift2Data = await response.json();
console.log('2nd shift districts:', shift2Data.districts);
```

## Data Structure

### Shift Document Structure
```javascript
{
  type: 'realtime',
  date: '2025-12-03',
  shift_no: 1, // 1, 2, 3, or null for all
  viloyat: {
    id: 1,
    nomi: 'Qashqadaryo'
  },
  summary: {
    students: {
      total: 50000,
      present_today: 35000,
      attendance_rate: 70.0
    }
  },
  cities: [
    {
      shahar_nomi: "Qarshi",
      schools_count: 50,
      students_total: 55339,
      students_present: 24735,
      attendance_rate: 44.7
    }
  ],
  districts: [
    {
      tuman_nomi: "Qarshi tumani",
      schools_count: 25,
      students_total: 27670,
      students_present: 12368,
      attendance_rate: 44.7
    }
  ]
}
```

## Performance Benefits

### 1. Efficient Querying
- Each shift can be queried independently
- Reduced data transfer for single-shift requests
- Optimized indexes for fast shift-based filtering

### 2. Flexible Reporting
- Get individual shift data quickly
- Compare performance across shifts
- Generate shift-specific analytics

### 3. WebSocket Efficiency
- Request only needed shift data
- Reduce bandwidth usage
- Faster real-time updates

## Migration from Old System

### Old Code
```javascript
const snapshot = await Attendance.findOne({ date: '2025-12-03' });
```

### New Code
```javascript
// Get all shifts
const allShifts = await OptimizedAttendance.getShiftsWithDetails('2025-12-03');

// Or get specific shift
const shift1 = await OptimizedAttendance.getShiftData('2025-12-03', 1);
```

## Usage Examples

### 1. Dashboard with Shift Tabs
```javascript
const [selectedShift, setSelectedShift] = useState(1);

const loadShiftData = async (shift) => {
  const response = await fetch(`/api/schools/reports/shift?date=${date}&shift=${shift}`);
  const data = await response.json();
  setShiftData(data);
};
```

### 2. Compare Shifts
```javascript
const compareShifts = async () => {
  const [shift1, shift2, shift3] = await Promise.all([
    OptimizedAttendance.getShiftData(date, 1),
    OptimizedAttendance.getShiftData(date, 2),
    OptimizedAttendance.getShiftData(date, 3)
  ]);
  
  console.log('Shift Comparison:', { shift1, shift2, shift3 });
};
```

### 3. Real-time Shift Monitoring
```javascript
// Monitor specific shift
schoolsSocket.setSchoolsConfig({ shift_no: 2, date: today });
setInterval(() => {
  const latest = schoolsSocket.schoolsData[0];
  updateShift2Display(latest);
}, 5000);
```

## Error Handling
All endpoints include proper error handling:
```javascript
try {
  const data = await OptimizedAttendance.getShiftsWithDetails(date);
  if (!data) {
    return res.json({ message: "Ma'lumot topilmadi" });
  }
  res.json(data);
} catch (error) {
  res.status(500).json({ message: "Server xatosi", error: error.message });
}
```

This enhanced system provides complete shift-based attendance tracking with detailed geographic breakdowns for each shift.