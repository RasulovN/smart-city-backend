// routes/schools.js
const express = require('express');
const router = express.Router();
const schoolsSocket = require('../../getServer/ws/schools');
const OptimizedAttendance = require('../../models/OptimizedAttendance');

const todayStr = new Date().toISOString().split("T")[0];

router.get('/', async (req, res) => {
  const { shift, date, interval, mode = "realtime" } = req.query;

  const selectedDate = date || todayStr;
  const isToday = selectedDate === todayStr;
  const shiftNo = shift === "0" ? null : (shift ? parseInt(shift) : null);
  const intervalVal = interval ? Math.min(Math.max(parseInt(interval), 25), 120) : (isToday ? 25 : 999999);

  let latest;
  let renderData = null;

  if (mode === "archive" && date) {
    // Archive mode - get data from MongoDB
    try {
      if (shiftNo === null) {
        // Get all shifts data for the selected date
        const shiftsData = await OptimizedAttendance.getShiftsWithDetails(selectedDate);
        if (shiftsData.shifts.all || shiftsData.shifts.shift1 || shiftsData.shifts.shift2 || shiftsData.shifts.shift3) {
          // Combine all shifts into a single data structure
          const allShiftsCombined = shiftsData.shifts.all || shiftsData.shifts.shift1 || shiftsData.shifts.shift2 || shiftsData.shifts.shift3;
          renderData = allShiftsCombined || null;
        }
      } else {
        // Get specific shift data
        const shiftData = await OptimizedAttendance.getShiftData(selectedDate, shiftNo);
        renderData = shiftData || null;
      }

      // If no specific shift data found, try to get any available data for the date
      if (!renderData) {
        const anyShiftData = await OptimizedAttendance.getShiftData(selectedDate, "all");
        renderData = anyShiftData;
      }

      latest = renderData;
    } catch (error) {
      console.error('Archive data fetch error:', error);
      latest = null;
    }
  } else {
    // Real-time mode - use WebSocket data
    schoolsSocket.setSchoolsConfig({
      shift_no: shiftNo,
      date: selectedDate || null,
      interval: intervalVal
    });

    latest = schoolsSocket.schoolsData[0];
  }

  res.send(`<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Qashqadaryo | Maktablar Davomati</title>
  <style>
    :root { --bg:#0d0d1a; --card:#1a1a2e; --accent:#00d4ff; --green:#00ff9d; --red:#ff3366; }
    body { margin:0; font-family:'Segoe UI',sans-serif; background:var(--bg); color:#e0e0ff; padding:20px; }
    .container { max-width:1200px; margin:auto; }
    h1 { text-align:center; color:var(--accent); }
    .tabs { display:flex; justify-content:center; margin-bottom:20px; gap:10px; }
    .tab { padding:12px 24px; background:${mode === 'realtime' ? 'var(--accent)' : 'var(--card)'}; color:${mode === 'realtime' ? 'black' : 'white'}; border-radius:8px; cursor:pointer; font-weight:bold; }
    .tab:hover { opacity:0.9; }
    .controls { background:var(--card); padding:20px; border-radius:12px; margin-bottom:20px; display:flex; flex-wrap:wrap; gap:15px; justify-content:center; align-items:end; }
    select, input, button { padding:12px; border:none; border-radius:8px; font-size:16px; }
    select, input { background:#16213e; color:white; }
    button { background:var(--accent); color:black; font-weight:bold; cursor:pointer; }
    .status { padding:8px 16px; border-radius:20px; font-size:0.9rem; }
    .live { background:var(--green); color:black; animation:blink 2s infinite; }
    .archive { background:var(--red); color:white; }
    @keyframes blink { 50% { opacity:0.6; } }
    .stats-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:20px; }
    .card { background:var(--card); padding:20px; border-radius:12px; }
    .rate { font-size:3.5rem; font-weight:bold; color:var(--accent); text-align:center; }
    table { width:100%; border-collapse:collapse; margin-top:10px; }
    th, td { padding:10px; text-align:left; border-bottom:1px solid #333; }
    th { background:#16213e; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Qashqadaryo viloyati — Maktablar Davomati</h1>

    <div class="tabs">
      <a href="?mode=realtime" class="tab" style="text-decoration:none;">Real-time (Bugun)</a>
      <a href="?mode=archive" class="tab" style="text-decoration:none;">Arxiv (Oldin kunlar)</a>
    </div>

    <div class="controls">
      <div>
        <label>Smena</label><br>
        <select id="shift">
          <option value="0" ${shiftNo === null ? 'selected' : ''}>Barcha</option>
          <option value="1" ${shiftNo === 1 ? 'selected' : ''}>1-smena</option>
          <option value="2" ${shiftNo === 2 ? 'selected' : ''}>2-smena</option>
          <option value="3" ${shiftNo === 3 ? 'selected' : ''}>3-smena</option>
        </select>
      </div>

      <div>
        <label>Sana</label><br>
        <input type="date" id="date" value="${selectedDate}" ${mode === 'realtime' ? 'disabled' : ''} />
      </div>

      ${mode === 'realtime' ? `
      <div>
        <label>Interval (sek)</label><br>
        <input type="number" id="interval" min="25" max="120" value="${intervalVal}" />
      </div>` : ''}

      <button onclick="apply()">Qo'llash</button>
      <span class="status ${mode === 'realtime' ? 'live' : 'archive'}">
        ${mode === 'realtime' ? '● LIVE' : 'Arxiv'}
      </span>
    </div>

    <div id="stats">
      ${renderStats(latest, mode)}
    </div>
  </div>

  <script>
    function apply() {
      const params = new URLSearchParams();
      params.set('mode', '${mode}');
      const s = document.getElementById('shift').value;
      const d = document.getElementById('date').value;
      if (s !== "0") params.set('shift', s);
      if ('${mode}' === 'archive') params.set('date', d);
      if ('${mode}' === 'realtime' && document.getElementById('interval')) {
        const i = document.getElementById('interval').value;
        if (i !== "25") params.set('interval', i);
      }
      location.search = params.toString();
    }

    // Faqat realtime rejimda avto-yangilanish
    ${mode === 'realtime' ? 'setInterval(() => location.reload(), 4000);' : ''}
  </script>
</body>
</html>`);
});

function renderStats(data, mode) {
  if (!data) return `<div class="card"><h2>Ma'lumot ${mode === 'archive' ? 'topilmadi' : 'yuklanmoqda'}...</h2></div>`;

  // Handle both WebSocket data and MongoDB data structures
  const students = data.students || data.summary?.students || {};
  const attendanceRate = students.attendance_rate || 0;
  const presentToday = students.present_today || 0;
  const absentToday = students.absent_today || 0;
  
  // Handle district data (MongoDB uses 'districts', WebSocket uses 'tumanlarda')
  const districts = data.districts || data.tumanlarda || [];
  // Handle city data (MongoDB uses 'cities', WebSocket uses 'shaxarlarda')
  const cities = data.cities || data.shaxarlarda || [];

  const rate = attendanceRate.toFixed(2);

  return `
    <div class="stats-grid">
      <div class="card"><div class="label">Davomat</div><div class="rate">${rate}%</div></div>
      <div class="card"><div class="label">Sana • Smena</div><div class="rate">${data.date} • ${data.shift_no ? data.shift_no + '-smena' : 'Barcha'}</div></div>
      <div class="card"><div class="label">Kelgan</div><div class="rate">${presentToday.toLocaleString()}</div></div>
      <div class="card"><div class="label">Kelmagan</div><div class="rate">${absentToday.toLocaleString()}</div></div>
    </div>

    <div style="margin-top:30px; display:grid; grid-template-columns:1fr 1fr; gap:20px;">
      <div class="card">
        <h3>Tumanlar</h3>
        <table>
          <tr><th>Tuman</th><th>Kelgan</th><th>%</th></tr>
          ${districts.map(d => {
            const present = d.students_present || d.shifts?.all?.students_present || 0;
            const rate = d.attendance_rate || d.shifts?.all?.attendance_rate || 0;
            return `<tr><td>${d.tuman_nomi}</td><td>${present.toLocaleString()}</td><td><strong>${rate.toFixed(1)}%</strong></td></tr>`;
          }).join('')}
        </table>
      </div>
      <div class="card">
        <h3>Shaharlar</h3>
        <table>
          <tr><th>Shahar</th><th>Kelgan</th><th>%</th></tr>
          ${cities.map(d => {
            const present = d.students_present || d.shifts?.all?.students_present || 0;
            const rate = d.attendance_rate || d.shifts?.all?.attendance_rate || 0;
            return `<tr><td>${d.shahar_nomi}</td><td>${present.toLocaleString()}</td><td><strong>${rate.toFixed(1)}%</strong></td></tr>`;
          }).join('')}
        </table>
      </div>
    </div>
  `;
}



// GET /api/reports/daily?date=2025-12-03
router.get("/reports/daily", async (req, res) => {
  const { date } = req.query;
  
  if (!date) {
    return res.status(400).json({ message: "Sana kiritilishi kerak" });
  }

  try {
    // Get all shifts data for the specified date
    const shiftsData = await OptimizedAttendance.getShiftsWithDetails(date);
    
    if (!shiftsData.shifts.all && !shiftsData.shifts.shift1 && !shiftsData.shifts.shift2 && !shiftsData.shifts.shift3) {
      return res.json({ message: "Ma'lumot topilmadi", date: date });
    }

    res.json(shiftsData);
  } catch (error) {
    console.error('Daily reports error:', error);
    res.status(500).json({ message: "Server xatosi", error: error.message });
  }
});

// GET /api/reports/shift?date=2025-12-03&shift=1
router.get("/reports/shift", async (req, res) => {
  const { date, shift } = req.query;
  
  if (!date) {
    return res.status(400).json({ message: "Sana kiritilishi kerak" });
  }

  try {
    const shiftData = await OptimizedAttendance.getShiftData(date, shift);
    
    if (!shiftData) {
      return res.json({ message: "Smena ma'lumotlari topilmadi", date: date, shift: shift });
    }

    res.json(shiftData);
  } catch (error) {
    console.error('Shift reports error:', error);
    res.status(500).json({ message: "Server xatosi", error: error.message });
  }
});

// GET /api/reports/all-shifts?date=2025-12-03
router.get("/reports/all-shifts", async (req, res) => {
  const { date } = req.query;
  
  if (!date) {
    return res.status(400).json({ message: "Sana kiritilishi kerak" });
  }

  try {
    const allShifts = await OptimizedAttendance.getAllShiftsData(date);
    const nestedData = await OptimizedAttendance.getNestedShiftData(date);
    
    res.json({
      date: date,
      shifts: allShifts,
      nestedGeographic: nestedData,
      count: allShifts.length
    });
  } catch (error) {
    console.error('All shifts error:', error);
    res.status(500).json({ message: "Server xatosi", error: error.message });
  }
});

// GET /api/reports/geographic-shifts?date=2025-12-03
router.get("/reports/geographic-shifts", async (req, res) => {
  const { date } = req.query;
  
  if (!date) {
    return res.status(400).json({ message: "Sana kiritilishi kerak" });
  }

  try {
    const nestedData = await OptimizedAttendance.getNestedShiftData(date);
    res.json({
      date: date,
      cities: nestedData.cities,
      districts: nestedData.districts
    });
  } catch (error) {
    console.error('Geographic shifts error:', error);
    res.status(500).json({ message: "Server xatosi", error: error.message });
  }
});

module.exports = router