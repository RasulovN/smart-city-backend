const { saveOrUpdateShiftStats } = require('../services/statsService');

// Test data for shift 1
const shift1TestData = {
  "type": "stats",
  "timestamp": "2025-12-02T08:00:00.000Z",
  "data": {
    "date": "2025-12-02",
    "shift_no": 1,
    "viloyat_id": 1,
    "viloyat_nomi": "Qashqadaryo",
    "schools": {
      "total": 1250,
      "active": 1180,
      "inactive": 70,
      "new_enrollments": 45
    },
    "students": {
      "total": 450000,
      "present_today": 425000,
      "absent_today": 25000,
      "attendance_rate": 94.44,
      "new_enrollments": 1200
    },
    "teachers": {
      "total": 28000,
      "active": 27500,
      "inactive": 500,
      "new_hires": 25
    },
    "tumanlarda": [
      {
        "tuman_id": 1,
        "tuman_nomi": "Qarshi",
        "schools": 180,
        "students": 65000,
        "attendance_rate": 95.2
      },
      {
        "tuman_id": 2,
        "tuman_nomi": "G'uzor",
        "schools": 95,
        "students": 35000,
        "attendance_rate": 93.8
      },
      {
        "tuman_id": 3,
        "tuman_nomi": "Koson",
        "schools": 110,
        "students": 42000,
        "attendance_rate": 94.1
      }
    ],
    "shaxarlarda": [
      {
        "shahar_id": 1,
        "shahar_nomi": "Qarshi",
        "schools": 45,
        "students": 28000,
        "attendance_rate": 96.5
      },
      {
        "shahar_id": 2,
        "shahar_nomi": "Shahrisabz",
        "schools": 25,
        "students": 15000,
        "attendance_rate": 94.8
      }
    ]
  }
};

// Test data for shift 2
const shift2TestData = {
  "type": "stats",
  "timestamp": "2025-12-02T13:00:00.000Z",
  "data": {
    "date": "2025-12-02",
    "shift_no": 2,
    "viloyat_id": 1,
    "viloyat_nomi": "Qashqadaryo",
    "schools": {
      "total": 1250,
      "active": 1185,
      "inactive": 65,
      "new_enrollments": 52
    },
    "students": {
      "total": 445000,
      "present_today": 418000,
      "absent_today": 27000,
      "attendance_rate": 93.93,
      "new_enrollments": 1150
    },
    "teachers": {
      "total": 28000,
      "active": 27600,
      "inactive": 400,
      "new_hires": 30
    },
    "tumanlarda": [
      {
        "tuman_id": 1,
        "tuman_nomi": "Qarshi",
        "schools": 180,
        "students": 64000,
        "attendance_rate": 94.5
      },
      {
        "tuman_id": 2,
        "tuman_nomi": "G'uzor",
        "schools": 95,
        "students": 34500,
        "attendance_rate": 92.9
      },
      {
        "tuman_id": 3,
        "tuman_nomi": "Koson",
        "schools": 110,
        "students": 41500,
        "attendance_rate": 93.7
      }
    ],
    "shaxarlarda": [
      {
        "shahar_id": 1,
        "shahar_nomi": "Qarshi",
        "schools": 45,
        "students": 27500,
        "attendance_rate": 95.8
      },
      {
        "shahar_id": 2,
        "shahar_nomi": "Shahrisabz",
        "schools": 25,
        "students": 14800,
        "attendance_rate": 94.2
      }
    ]
  }
};

// Test data for "all" shifts (shift_no = null)
const allShiftsTestData = {
  "type": "stats",
  "timestamp": "2025-12-02T17:00:00.000Z",
  "data": {
    "date": "2025-12-02",
    "shift_no": null,
    "viloyat_id": 1,
    "viloyat_nomi": "Qashqadaryo",
    "schools": {
      "total": 1250,
      "active": 1190,
      "inactive": 60,
      "new_enrollments": 48
    },
    "students": {
      "total": 455000,
      "present_today": 432000,
      "absent_today": 23000,
      "attendance_rate": 94.95,
      "new_enrollments": 1180
    },
    "teachers": {
      "total": 28000,
      "active": 27700,
      "inactive": 300,
      "new_hires": 28
    },
    "tumanlarda": [
      {
        "tuman_id": 1,
        "tuman_nomi": "Qarshi",
        "schools": 180,
        "students": 66000,
        "attendance_rate": 95.8
      },
      {
        "tuman_id": 2,
        "tuman_nomi": "G'uzor",
        "schools": 95,
        "students": 35500,
        "attendance_rate": 94.2
      },
      {
        "tuman_id": 3,
        "tuman_nomi": "Koson",
        "schools": 110,
        "students": 43000,
        "attendance_rate": 94.5
      }
    ],
    "shaxarlarda": [
      {
        "shahar_id": 1,
        "shahar_nomi": "Qarshi",
        "schools": 45,
        "students": 28500,
        "attendance_rate": 96.8
      },
      {
        "shahar_id": 2,
        "shahar_nomi": "Shahrisabz",
        "schools": 25,
        "students": 15200,
        "attendance_rate": 95.3
      }
    ]
  }
};

/**
 * Test function to simulate incremental updates
 */
async function runIncrementalTest() {
  console.log('🧪 Starting incremental shift stats test...\n');

  try {
    console.log('1️⃣  Testing SHIFT 1 data...');
    await saveOrUpdateShiftStats(shift1TestData);
    console.log('   ✅ Shift 1 data saved successfully\n');

    console.log('2️⃣  Testing SHIFT 2 data (should merge without replacing shift 1)...');
    await saveOrUpdateShiftStats(shift2TestData);
    console.log('   ✅ Shift 2 data saved successfully\n');

    console.log('3️⃣  Testing ALL SHIFTS data (should update "all" key)...');
    await saveOrUpdateShiftStats(allShiftsTestData);
    console.log('   ✅ All shifts data saved successfully\n');

    console.log('🎉 All tests passed! Check the database to verify:');
    console.log('   - Document with date: 2025-12-02 and region_id: 1 should exist');
    console.log('   - It should contain shifts.shift1, shifts.shift2, and shifts.all');
    console.log('   - Each shift should have its own summary, districts, and cities');
    console.log('   - No duplicate documents should be created\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Export test data and function
module.exports = {
  shift1TestData,
  shift2TestData,
  allShiftsTestData,
  runIncrementalTest
};

// Run test if called directly
if (require.main === module) {
  runIncrementalTest().then(() => {
    console.log('🏁 Test completed');
    process.exit(0);
  }).catch((error) => {
    console.error('💥 Test error:', error);
    process.exit(1);
  });
}