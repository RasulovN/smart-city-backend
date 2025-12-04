# Nested Shift Data Structure Documentation

## Overview
The attendance system now uses a nested shift-based data structure for cities and districts, organizing data by geographic location and then by shift, providing detailed attendance analytics for each location across all shifts.

## New Data Structure

### Previous Structure (Flat)
```javascript
"cities": [
  {
    "shahar_nomi": "Qarshi",
    "schools_count": 50,
    "students_total": 55339,
    "students_present": 24735,
    "attendance_rate": 44.7
  }
]
```

### New Structure (Nested by Shifts)
```javascript
"cities": [
  {
    "shahar_nomi": "Qarshi",
    "shifts": {
      "all": {
        "schools_count": 50,
        "students_total": 55339,
        "students_present": 24735,
        "attendance_rate": 44.7
      },
      "shift1": {
        "schools_count": 50,
        "students_total": 55339,
        "students_present": 24735,
        "attendance_rate": 44.7
      },
      "shift2": {
        "schools_count": 50,
        "students_total": 55339,
        "students_present": 24735,
        "attendance_rate": 44.7
      },
      "shift3": {
        "schools_count": 50,
        "students_total": 55339,
        "students_present": 24735,
        "attendance_rate": 44.7
      }
    }
  }
]
```

## Database Schema Changes

### OptimizedAttendance Model Updates
```javascript
cities: [{
  shahar_nomi: String,
  shifts: {
    all: { 
      schools_count: Number, 
      students_total: Number, 
      students_present: Number, 
      attendance_rate: Number 
    },
    shift1: { 
      schools_count: Number, 
      students_total: Number, 
      students_present: Number, 
      attendance_rate: Number 
    },
    shift2: { 
      schools_count: Number, 
      students_total: Number, 
      students_present: Number, 
      attendance_rate: Number 
    },
    shift3: { 
      schools_count: Number, 
      students_total: Number, 
      students_present: Number, 
      attendance_rate: Number 
    }
  }
}],

districts: [{
  tuman_nomi: String,
  shifts: {
    all: { 
      schools_count: Number, 
      students_total: Number, 
      students_present: Number, 
      attendance_rate: Number 
    },
    shift1: { 
      schools_count: Number, 
      students_total: Number, 
      students_present: Number, 
      attendance_rate: Number 
    },
    shift2: { 
      schools_count: Number, 
      students_total: Number, 
      students_present: Number, 
      attendance_rate: Number 
    },
    shift3: { 
      schools_count: Number, 
      students_total: Number, 
      students_present: Number, 
      attendance_rate: Number 
    }
  }
}]
```

## Data Processing

### WebSocket Data Processing
The system automatically processes incoming WebSocket data into the nested structure:

```javascript
// Input from WebSocket
{
  "shaxarlarda": [
    {
      "shahar_nomi": "Qarshi",
      "schools_count": 50,
      "students_total": 55339,
      "students_present": 24735,
      "attendance_rate": 44.7
    }
  ]
}

// Processed into nested structure
{
  "shahar_nomi": "Qarshi",
  "shifts": {
    "shift1": { /* shift1 specific data */ },
    "shift2": { /* shift2 specific data */ },
    "shift3": { /* shift3 specific data */ },
    "all": { /* combined data */ }
  }
}
```

## API Endpoints

### Get Nested Geographic Data
```javascript
// Get cities and districts with shift breakdown
GET /api/schools/reports/geographic-shifts?date=2025-12-04

// Response
{
  "date": "2025-12-04",
  "cities": [
    {
      "shahar_nomi": "Qarshi",
      "shifts": {
        "all": { "schools_count": 50, "students_total": 55339, "students_present": 24735, "attendance_rate": 44.7 },
        "shift1": { "schools_count": 50, "students_total": 55339, "students_present": 24735, "attendance_rate": 44.7 },
        "shift2": { "schools_count": 50, "students_total": 55339, "students_present": 24735, "attendance_rate": 44.7 },
        "shift3": { "schools_count": 50, "students_total": 55339, "students_present": 24735, "attendance_rate": 44.7 }
      }
    }
  ],
  "districts": [...]
}
```

### Get All Shifts with Nested Data
```javascript
// Get all shifts with geographic breakdown
GET /api/schools/reports/all-shifts?date=2025-12-04

// Response includes both raw shift data and nested geographic data
{
  "date": "2025-12-04",
  "shifts": [/* individual shift documents */],
  "nestedGeographic": {
    "cities": [/* nested city data */],
    "districts": [/* nested district data */]
  },
  "count": 4
}
```

## Static Model Methods

### Process Shift Data
```javascript
const processedData = OptimizedAttendance.processShiftData(rawWebSocketData, shift_no);
```
Automatically converts flat WebSocket data into nested shift structure.

### Get Nested Shift Data
```javascript
const nestedData = await OptimizedAttendance.getNestedShiftData('2025-12-04');
```
Returns cities and districts organized by shift breakdown.

### Usage Example
```javascript
// Frontend usage
const response = await fetch('/api/schools/reports/geographic-shifts?date=2025-12-04');
const data = await response.json();

// Get Qarshi city data for all shifts
const qarshiData = data.cities.find(city => city.shahar_nomi === 'Qarshi');
console.log('Qarshi 1st shift attendance:', qarshiData.shifts.shift1.attendance_rate);
console.log('Qarshi 2nd shift attendance:', qarshiData.shifts.shift2.attendance_rate);
console.log('Qarshi 3rd shift attendance:', qarshiData.shifts.shift3.attendance_rate);

// Compare shift performance
const shiftComparison = {
  shift1: qarshiData.shifts.shift1.attendance_rate,
  shift2: qarshiData.shifts.shift2.attendance_rate,
  shift3: qarshiData.shifts.shift3.attendance_rate
};
```

## Benefits

### Detailed Analytics
- **Per-Shift Analysis**: Analyze attendance rates for each shift separately
- **Comparative Studies**: Compare performance across different shifts
- **Location-Based Insights**: See how different cities/districts perform in each shift

### Flexible Querying
- **Individual Shift Data**: Get specific shift data for any location
- **Combined Views**: Access overall data for all shifts combined
- **Cross-Shift Comparison**: Easy comparison between shifts

### Data Integrity
- **No Data Loss**: Each shift maintains its own data structure
- **Consistent Schema**: Uniform structure across all geographic entities
- **Backward Compatibility**: Existing APIs still work with adapted responses

## Frontend Integration

### React/Vue Component Example
```javascript
const ShiftAnalysis = ({ date }) => {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetch(`/api/schools/reports/geographic-shifts?date=${date}`)
      .then(res => res.json())
      .then(setData);
  }, [date]);

  if (!data) return <div>Loading...</div>;

  return (
    <div>
      <h2>Shift Analysis - {date}</h2>
      {data.cities.map(city => (
        <div key={city.shahar_nomi}>
          <h3>{city.shahar_nomi}</h3>
          <div className="shifts">
            {Object.entries(city.shifts).map(([shiftName, shiftData]) => (
              <div key={shiftName} className="shift-card">
                <h4>{shiftName}</h4>
                <p>Attendance: {shiftData.attendance_rate}%</p>
                <p>Present: {shiftData.students_present.toLocaleString()}</p>
                <p>Total: {shiftData.students_total.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
```

### Chart Data Preparation
```javascript
// Prepare data for shift comparison charts
const prepareChartData = (citiesData) => {
  return citiesData.map(city => ({
    city: city.shahar_nomi,
    shifts: {
      'Shift 1': city.shifts.shift1.attendance_rate,
      'Shift 2': city.shifts.shift2.attendance_rate,
      'Shift 3': city.shifts.shift3.attendance_rate,
      'Overall': city.shifts.all.attendance_rate
    }
  }));
};
```

## Performance Considerations

### Indexing
All nested fields are indexed for fast querying:
- Individual shift performance queries
- Geographic location filtering
- Attendance rate range filtering

### Memory Usage
- **Efficient Storage**: Only stores relevant shift data
- **No Duplication**: Shared data properly referenced
- **Optimized Queries**: Targeted data retrieval

### Query Optimization
```javascript
// Efficient query for specific city and shift
const cityShiftData = await OptimizedAttendance.findOne({
  date: '2025-12-04',
  'cities.shahar_nomi': 'Qarshi',
  'cities.shifts.shift1.attendance_rate': { $gte: 70 }
});
```

## Migration Notes

### Existing Data
- Existing flat structure data will be automatically adapted
- New shift cycling will populate nested structure
- Historical data can be migrated with the processShiftData method

### API Compatibility
- All existing endpoints continue to work
- New endpoints provide enhanced nested data
- Gradual migration path available

This nested structure provides much more detailed and flexible analysis capabilities while maintaining the efficient performance of the optimized database schema.