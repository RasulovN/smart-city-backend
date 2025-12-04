# Data Update System Documentation

## Overview
The attendance system now includes intelligent data update functionality that differentiates between today's data (which gets updated) and historical data (which gets inserted), ensuring optimal data management and avoiding duplication.

## Smart Data Update Logic

### Today's Data Behavior
When data for today's date is received:
1. **Check for Existing Data**: System first checks if data for today's date already exists
2. **Update if Exists**: If data exists, it updates the existing record with fresh information
3. **Create if New**: If data doesn't exist, it creates a new record
4. **Update Timestamps**: Updates both `updatedAt` and `timestamp` fields

### Historical Data Behavior
For dates other than today:
- **Standard Upsert**: Uses traditional upsert behavior (insert or update based on existence)
- **No Timestamp Modification**: Maintains original creation timestamps

## Implementation Details

### Core Function Logic
```javascript
async function saveToMongoDB(data) {
  const today = new Date().toISOString().split("T")[0];
  const isToday = data.date === today;
  
  if (isToday) {
    // Today's data - smart update
    const existingData = await OptimizedAttendance.findOne({
      date: data.date,
      shift_no: data.shift_no ?? null,
      type: 'realtime'
    });

    if (existingData) {
      // Update existing record
      await OptimizedAttendance.findOneAndUpdate(
        { date: data.date, shift_no: data.shift_no ?? null, type: 'realtime' },
        {
          ...doc,
          updatedAt: new Date(),
          timestamp: new Date()
        },
        { new: true }
      );
      console.log(`🔄 YANGILANDI → ...`);
    } else {
      // Create new record
      await OptimizedAttendance.findOneAndUpdate(
        { date: data.date, shift_no: data.shift_no ?? null, type: 'realtime' },
        doc,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`✅ YARATILDI → ...`);
    }
  } else {
    // Historical data - standard upsert
    await OptimizedAttendance.findOneAndUpdate(
      { date: data.date, shift_no: data.shift_no ?? null, type: 'realtime' },
      doc,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`📝 SAQLANDI → ...`);
  }
}
```

## Console Output Examples

### Today's Data Update
```
🔄 YANGILANDI → 2025-12-04 | Smena: 1 | Davomat: 75.2% | Shaharlar: 2 | Tumanlar: 14
```

### Today's Data Creation
```
✅ YARATILDI → 2025-12-04 | Smena: 1 | Davomat: 75.2% | Shaharlar: 2 | Tumanlar: 14
```

### Historical Data
```
📝 SAQLANDI → 2025-12-03 | Smena: 1 | Davomat: 73.5% | Shaharlar: 2 | Tumanlar: 14
```

## Data Cleanup System

### Automatic Cleanup
The system includes automatic cleanup of old today's data:
- **Frequency**: Every 6 hours
- **Criteria**: Deletes today's data created more than 1 hour ago
- **Purpose**: Removes duplicate/obsolete today's data

### Cleanup Function
```javascript
async function cleanOldTodayData() {
  const today = new Date().toISOString().split("T")[0];
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const result = await OptimizedAttendance.deleteMany({
    date: today,
    type: 'realtime',
    createdAt: { $lt: oneHourAgo }
  });
  
  if (result.deletedCount > 0) {
    console.log(`🧹 Eski bugungi ma'lumotlar tozalandi: ${result.deletedCount} ta yozuv`);
  }
}
```

### Cleanup Console Output
```
🧹 Eski bugungi ma'lumotlar tozalandi: 5 ta yozuv
```

## Benefits

### Data Integrity
- **No Duplicates**: Today's data is updated, not duplicated
- **Fresh Information**: Always displays the most recent data for today
- **Historical Preservation**: Old data remains unchanged

### Performance Optimization
- **Reduced Storage**: Eliminates redundant today's records
- **Faster Queries**: Less data to search through
- **Efficient Updates**: Targeted updates instead of bulk inserts

### System Reliability
- **Consistent Data**: Today's information is always current
- **Automatic Cleanup**: Self-maintaining system
- **Error Prevention**: Avoids data conflicts

## Use Cases

### Real-time Monitoring
```javascript
// Today's 1st shift data comes in multiple times during the day
// First time: Creates new record
// Subsequent times: Updates existing record

// Example flow:
1. 08:00 - 1st shift data arrives → ✅ YARATILDI
2. 08:30 - 1st shift data arrives → 🔄 YANGILANDI (same data)
3. 09:00 - 1st shift data arrives → 🔄 YANGILANDI (updated data)
```

### Shift Comparison
```javascript
// Same day, different shifts
08:00 - 1st shift data → ✅ YARATILDI
10:00 - 2nd shift data → ✅ YARATILDI  
12:00 - 3rd shift data → ✅ YARATILDI
14:00 - 1st shift update → 🔄 YANGILANDI
```

### Historical Data
```javascript
// Previous days' data always uses standard upsert
2025-12-03 data → 📝 SAQLANDI (insert or update)
2025-12-02 data → 📝 SAQLANDI (insert or update)
```

## API Integration

### Module Exports
```javascript
module.exports = {
  schoolsData,
  setSchoolsConfig,
  isRealtimeMode: () => isRealtimeMode,
  startShiftCycling,
  stopShiftCycling,
  cycleToNextShift,
  getCurrentShift: () => allShifts[currentShiftIndex],
  isShiftCyclingActive: () => shiftCycleInterval !== null,
  cleanOldTodayData,    // Manual cleanup function
  saveToMongoDB         // Direct access to save function
};
```

### Manual Cleanup
```javascript
const schoolsSocket = require('../../getServer/ws/schools');

// Manual cleanup if needed
await schoolsSocket.cleanOldTodayData();
```

## Monitoring and Debugging

### Log Analysis
Monitor console logs to understand data flow:
- `🔄 YANGILANDI` - Existing today's data was updated
- `✅ YARATILDI` - New today's data was created
- `📝 SAQLANDI` - Historical data was saved
- `🧹 Eski bugungi ma'lumotlar tozalandi` - Old data cleanup

### Database Query Examples
```javascript
// Check today's records
const todayRecords = await OptimizedAttendance.find({
  date: '2025-12-04',
  type: 'realtime'
}).sort({ updatedAt: -1 });

// Check if specific shift was updated recently
const recentUpdate = await OptimizedAttendance.findOne({
  date: '2025-12-04',
  shift_no: 1,
  type: 'realtime'
});

// Count today's records by shift
const shiftCounts = await OptimizedAttendance.aggregate([
  { $match: { date: '2025-12-04', type: 'realtime' } },
  { $group: { _id: '$shift_no', count: { $sum: 1 } } }
]);
```

## Configuration Options

### Cleanup Frequency
Modify cleanup interval in `scheduleDataCleanup()`:
```javascript
// Current: Every 6 hours
setInterval(async () => {
  await cleanOldTodayData();
}, 6 * 60 * 60 * 1000);

// Change to every 4 hours
setInterval(async () => {
  await cleanOldTodayData();
}, 4 * 60 * 60 * 1000);
```

### Cleanup Age Threshold
Modify age threshold in `cleanOldTodayData()`:
```javascript
// Current: 1 hour
const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

// Change to 2 hours
const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
```

## Troubleshooting

### No Updates Happening
1. Check if data.date matches today's date
2. Verify shift_no parameter
3. Check WebSocket connection status
4. Monitor console for error messages

### Too Many Records
1. Check cleanup schedule is running
2. Verify cleanup age threshold
3. Manually trigger cleanup: `schoolsSocket.cleanOldTodayData()`

### Data Not Fresh
1. Check update timestamps in database
2. Verify WebSocket is receiving new data
3. Check if shift cycling is working properly

This smart update system ensures that today's attendance data is always current and fresh while maintaining efficient storage and query performance.