


const schoolsSocket = require('../getServer/ws/schools');

const todayStr = new Date().toISOString().split("T")[0];

class RealTimeController {

    async getRealTime(req, res) {
      const { shift, date, interval, mode = "realtime" } = req.query;
    
      const selectedDate = date || todayStr;
      const isToday = selectedDate === todayStr;
      const shiftNo = shift === "0" ? null : (shift ? parseInt(shift) : null);
      const intervalVal = interval ? Math.min(Math.max(parseInt(interval), 25), 120) : (isToday ? 25 : 999999);
    
      // Smart config: bugun bo'lsa → real-time, oldin bo'lsa → bir marta
      schoolsSocket.setSchoolsConfig({
        shift_no: shiftNo,
        date: selectedDate || null,
        interval: intervalVal
      });
    
      const latest = schoolsSocket.schoolsData[0];
    
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
    }

    
    
}
    function renderStats(data, mode) {
        if (!data) return `<div class="card"><h2>Ma'lumot yuklanmoqda...</h2></div>`;

        const rate = (data.students?.attendance_rate || 0).toFixed(2);

        return `
            <div class="stats-grid">
            <div class="card"><div class="label">Davomat</div><div class="rate">${rate}%</div></div>
            <div class="card"><div class="label">Sana • Smena</div><div class="rate">${data.date} • ${data.shift_no ? data.shift_no + '-smena' : 'Barcha'}</div></div>
            <div class="card"><div class="label">Kelgan</div><div class="rate">${(data.students?.present_today || 0).toLocaleString()}</div></div>
            <div class="card"><div class="label">Kelmagan</div><div class="rate">${(data.students?.absent_today || 0).toLocaleString()}</div></div>
            </div>

            <div style="margin-top:30px; display:grid; grid-template-columns:1fr 1fr; gap:20px;">
            <div class="card">
                <h3>Tumanlar</h3>
                <table>
                <tr><th>Tuman</th><th>Kelgan</th><th>%</th></tr>
                ${data.tumanlarda?.map(d => `<tr><td>${d.tuman_nomi}</td><td>${d.students_present.toLocaleString()}</td><td><strong>${d.attendance_rate.toFixed(1)}%</strong></td></tr>`).join('') || ''}
                </table>
            </div>
            <div class="card">
                <h3>Shaharlar</h3>
                <table>
                <tr><th>Shahar</th><th>Kelgan</th><th>%</th></tr>
                ${data.shaxarlarda?.map(d => `<tr><td>${d.shahar_nomi}</td><td>${d.students_present.toLocaleString()}</td><td><strong>${d.attendance_rate.toFixed(1)}%</strong></td></tr>`).join('') || ''}
                </table>
            </div>
            </div>
        `;
        }

module.exports = new RealTimeController();