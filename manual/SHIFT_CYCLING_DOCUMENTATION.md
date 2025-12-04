# Shift Cycling System Documentation

## Overview
The attendance system now includes an automatic shift cycling mechanism that collects data for all shifts (1, 2, 3) by automatically cycling through WebSocket requests with different shift parameters.

## How It Works

### Automatic Shift Cycling
The system automatically cycles through all shifts every 30 seconds:
1. **Null (All shifts)** - Gets combined data for all shifts
2. **Shift 1** - Gets 1st shift specific data
3. **Shift 2** - Gets 2nd shift specific data  
4. **Shift 3** - Gets 3rd shift specific data

### WebSocket Requests Sent
The system sends these WebSocket config requests automatically:

```javascript
// Request 1: All shifts
{"type": "config", "interval": 25, "shift_no": null}

// Request 2: 1st shift only
{"type": "config", "interval": 25, "shift_no": 1}

// Request 3: 2nd shift only
{"type": "config", "interval": 25, "shift_no": 2}

// Request 4: 3rd shift only
{"type": "config", "interval": 25, "shift_no": 3}
```

Each request runs for 30 seconds before moving to the next shift, creating a 2-minute complete cycle.

## Data Storage Results

### Database Documents Created
Each shift creates separate documents in MongoDB:

```javascript
// Document 1 - All shifts combined
{
  type: 'realtime',
  date: '2025-12-04',
  shift_no: null,
  summary: { ... },
  cities: [...], // Combined cities data
  districts: [...] // Combined districts data
}

// Document 2 - Shift 1 only
{
  type: 'realtime',
  date: '2025-12-04',
  shift_no: 1,
  summary: { ... },
  cities: [...], // 1st shift specific cities
  districts: [...] // 1st shift specific districts
}

// Document 3 - Shift 2 only
{
  type: 'realtime',
  date: '2025-12-04',
  shift_no: 2,
  summary: { ... },
  cities: [...], // 2nd shift specific cities
  districts: [...] // 2nd shift specific districts
}

// Document 4 - Shift 3 only
{
  type: 'realtime',
  date: '2025-12-04',
  shift_no: 3,
  summary: { ... },
  cities: [...], // 3rd shift specific cities
  districts: [...] // 3rd shift specific districts
}
```

## API Usage

### Get Shift-Specific Data
```javascript
// Get 1st shift data for today
GET /api/schools/reports/shift?date=2025-12-04&shift=1

// Get 2nd shift data
GET /api/schools/reports/shift?date=2025-12-04&shift=2

// Get 3rd shift data
GET /api/schools/reports/shift?date=2025-12-04&shift=3

// Get all shifts combined
GET /api/schools/reports/shift?date=2025-12-04&shift=all
```

### Get All Shifts Data
```javascript
// Get all shifts data organized
GET /api/schools/reports/daily?date=2025-12-04

// Response includes:
// - shifts.all (combined data)
// - shifts.shift1 (1st shift specific)
// - shifts.shift2 (2nd shift specific)  
// - shifts.shift3 (3rd shift specific)
// - totalSummary (overall statistics)
```

## System Controls

### Module Exports
```javascript
const schoolsSocket = require('../../getServer/ws/schools');

// Control functions
schoolsSocket.startShiftCycling()     // Start automatic cycling
schoolsSocket.stopShiftCycling()      // Stop cycling
schoolsSocket.cycleToNextShift()      // Manual next shift
schoolsSocket.getCurrentShift()       // Get current shift (1,2,3,null)
schoolsSocket.isShiftCyclingActive()  // Check if cycling is active
```

### Manual Shift Control
```javascript
// Request specific shift (stops cycling)
schoolsSocket.setSchoolsConfig({
  shift_no: 1,     // Request only 1st shift
  date: '2025-12-04',
  interval: 25
});

// Resume cycling (after manual request)
schoolsSocket.setSchoolsConfig({
  shift_no: null,  // Resume automatic cycling
  interval: 25
});
```

## Monitoring and Logging

### Console Logs
The system provides detailed logging:

```
Smena sikli boshlandi - barcha smenalar uchun ma'lumot to'planmoqda
Smena sikli: Barcha ma'lumotlari so'ralmoqda...
Config yuborildi: {type: "config", interval: 25, shift_no: null}
Smena sikli: 1-smena ma'lumotlari so'ralmoqda...
Config yuborildi: {type: "config", interval: 25, shift_no: 1}
✅ SAQLANDI → 2025-12-04 | Smena: 1 | Davomat: 75.2% | Shaharlar: 2 | Tumanlar: 14
```

### Real-time Status
Monitor the current shift being processed:

```javascript
// Check what's currently being collected
console.log('Current shift:', schoolsSocket.getCurrentShift());
console.log('Is cycling:', schoolsSocket.isShiftCyclingActive());

// Current shift values:
// null = collecting all shifts data
// 1 = collecting 1st shift only
// 2 = collecting 2nd shift only  
// 3 = collecting 3rd shift only
```

## Performance Benefits

### Complete Data Collection
- **No Missing Data**: All shifts are automatically collected
- **Geographic Breakdown**: Cities and districts data for each shift
- **Comprehensive Reporting**: Full data for comparative analysis

### Efficient Resource Usage
- **Single WebSocket**: One connection handles all shifts
- **Automatic Cycling**: No manual intervention needed
- **Smart Intervals**: 30-second cycles ensure fresh data

### Query Optimization
- **Separate Documents**: Each shift has its own document for fast queries
- **Optimized Indexes**: Fast filtering by shift and date
- **Flexible Retrieval**: Get individual shifts or combined data

## Data Quality Assurance

### Automatic Fallback
- If connection drops, cycling automatically resumes on reconnect
- Each shift gets equal time for data collection
- No data loss during cycling transitions

### Error Handling
- WebSocket errors are logged and connection is restarted
- Cycling stops on connection errors and resumes on reconnect
- MongoDB errors are caught and logged without stopping the cycle

## Configuration Options

### Adjusting Cycle Timing
```javascript
// In schools.js, modify the cycle interval
shiftCycleInterval = setInterval(() => {
  cycleToNextShift();
}, 30000); // Change 30000 (30 seconds) to desired milliseconds
```

### Adding More Shifts
```javascript
// Modify the allShifts array
const allShifts = [null, 1, 2, 3, 4]; // Add shift 4
// or
const allShifts = [null, 1, 2, 3, 'morning', 'evening']; // Named shifts
```

## Troubleshooting

### No Shift Data
If you see `shift_no: null` for all records:
1. Check WebSocket connection status
2. Verify the cycling is active: `schoolsSocket.isShiftCyclingActive()`
3. Check console logs for config messages
4. Ensure the external API supports shift parameters

### Cycling Not Working
1. Check if WebSocket is connected: `ws.readyState === WebSocket.OPEN`
2. Restart cycling manually: `schoolsSocket.startShiftCycling()`
3. Check for any error messages in console
4. Verify the external API endpoint is responding

### Partial Data Collection
If only some shifts have data:
1. Check the cycle timing - each shift needs 30 seconds
2. Verify the external API supports all requested shifts
3. Check network connectivity during cycling
4. Monitor console logs for successful saves

This system ensures complete shift-based attendance data collection with automatic cycling through all available shifts.