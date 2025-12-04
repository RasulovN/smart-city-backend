// ws/schools.js (Optimized - Unified model)
const WebSocket = require("ws");
const OptimizedAttendance = require("../../models/OptimizedAttendance");

let schoolsData = [];
let ws = null;
let currentConfig = { interval: 25, shift_no: null, date: null };
let isRealtimeMode = true;

// Shift cycling configuration
let shiftCycleInterval = null;
let currentShiftIndex = 0;
const allShifts = [null, 1, 2, 3]; // null = all shifts, then individual shifts

const URL = "wss://partner.tty0x-api-app.cloud/api/v1/partner/dashboard/ws";

// Shift cycling functions
function startShiftCycling() {
  if (shiftCycleInterval) {
    clearInterval(shiftCycleInterval);
  }
  
  // Cycle through shifts every 30 seconds to collect all data
  shiftCycleInterval = setInterval(() => {
    cycleToNextShift();
  }, 30000); // 30 seconds per shift
  
  // Start with first shift immediately
  cycleToNextShift();
  
  // console.log("Smena sikli boshlandi - barcha smenalar uchun ma'lumot to'planmoqda");
}

function stopShiftCycling() {
  if (shiftCycleInterval) {
    clearInterval(shiftCycleInterval);
    shiftCycleInterval = null;
  }
  // console.log("Smena sikli to'xtatildi");
}

function cycleToNextShift() {
  const currentShift = allShifts[currentShiftIndex];
  const shiftName = currentShift === null ? 'Barcha' : `${currentShift}-smena`;
  
  // console.log(`Smena sikli: ${shiftName} ma'lumotlari so'ralmoqda...`);
  
  const shiftConfig = {
    interval: currentConfig.interval || 25,
    shift_no: currentShift,
    date: currentConfig.date || null
  };
  
  sendShiftConfig(shiftConfig);
  
  // Move to next shift
  currentShiftIndex = (currentShiftIndex + 1) % allShifts.length;
}

function sendShiftConfig(config) {
  const payload = {
    type: "config",
    interval: config.interval || 25,
    shift_no: config.shift_no ?? null,
    date: config.date || null
  };

  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
    // console.log("Config yuborildi:", payload);
  }
}

// Bugungi sana ma'lumotlarini tozalash (kerak bo'lsa)
async function cleanOldTodayData() {
  try {
    const today = new Date().toISOString().split("T")[0];
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    // 1 soat oldin yaratilgan bugungi ma'lumotlarni o'chirish (takrorlanayotgan ma'lumotlar uchun)
    const result = await OptimizedAttendance.deleteMany({
      date: today,
      type: 'realtime',
      createdAt: { $lt: oneHourAgo }
    });
    
    if (result.deletedCount > 0) {
      // console.log(`🧹 Eski bugungi ma'lumotlar tozalandi: ${result.deletedCount} ta yozuv`);
    }
  } catch (error) {
    console.error('Ma\'lumotlarni tozalashda xato:', error.message);
  }
}

function connect() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;

  ws = new WebSocket(URL);

  ws.on("open", () => {
    // console.log("Maktablar WebSocket ulandi");
    // Start cycling through all shifts
    startShiftCycling();
  });

  ws.on("message", async (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.type !== "stats") return;

      const data = msg.data;

      // HAR BIR KELGAN MA'LUMOTNI TO'LIQ SAQLAYMIZ
      await saveToMongoDB(data);

      // RAM ga saqlash (frontend uchun)
      schoolsData.unshift(data);
      if (schoolsData.length > 100) schoolsData.pop();

    } catch (e) {
      console.error("Xato (message):", e.message);
    }
  });

  ws.on("close", () => {
    // console.log("WebSocket uzildi, qayta ulanmoqda...");
    ws = null;
    stopShiftCycling(); // Stop cycling when connection closes
    setTimeout(connect, 3000);
  });

  ws.on("error", (err) => console.error("WS xato:", err.message));
}

// HAR BIR SMENA + SANA UCHUN ALOHIDA SAQLAYDI → HECH QACHON YO‘QOTMAYDI!
async function saveToMongoDB(data) {
  try {
    // Use the new incremental shift save method
    const result = await OptimizedAttendance.saveIncrementalShift(data, data.shift_no ?? null);
    
    const shiftName = data.shift_no === null ? 'Barcha' : `${data.shift_no}-smena`;
    const operation = result.operation === 'updated' ? '🔄 YANGILANDI' : '✅ YARATILDI';
    
    // console.log(`${operation} → ${data.date} | Smena: ${shiftName} | Davomat: ${data.students.attendance_rate}% | Shaharlar: ${data.shaxarlarda?.length || 0} | Tumanlar: ${data.tumanlarda?.length || 0}`);
    
    // Update total summary after each save
    await OptimizedAttendance.updateTotalSummary(data.date);

  } catch (err) {
    console.error("MongoDB ga saqlashda xato:", err.message);
  }
}

function sendConfig(config) {
  const payload = {
    type: "config",
    interval: config.interval || 25,
    shift_no: config.shift_no ?? null,
    date: config.date || null
  };

  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
    // console.log("Config yuborildi:", payload);
  }
}

function setSchoolsConfig(config) {
  const today = new Date().toISOString().split("T")[0];
  const isToday = !config.date || config.date === today;
  isRealtimeMode = isToday;

  currentConfig = {
    interval: isToday ? (config.interval || 25) : 999999,
    shift_no: config.shift_no ?? null,
    date: config.date || null,
  };

  // If specific shift requested, stop cycling and set that shift
  if (config.shift_no !== undefined && config.shift_no !== null) {
    stopShiftCycling();
    sendConfig(currentConfig);
  } else {
    // If no specific shift, resume cycling through all shifts
    if (ws?.readyState === WebSocket.OPEN) {
      startShiftCycling();
    }
  }
}

// === KUNLIK SNAPSHOT (18:18) ===
function scheduleDailySnapshot() {
  const now = new Date();
  let nextRun = new Date(now);
  nextRun.setHours(18, 18, 0, 0);

  if (nextRun <= now) {
    nextRun.setDate(nextRun.getDate() + 1);
  }

  const delay = nextRun - now;

  setTimeout(async () => {
    await createDailySnapshot();
    scheduleDailySnapshot(); // keyingi kun
  }, delay);

  // console.log(`Keyingi snapshot: ${nextRun.toLocaleString('uz-UZ')}`);
}

// === KUNLIK MA'LUMOTLARNI TOZALASH (HAR 6 SOATDA) ===
function scheduleDataCleanup() {
  // Har 6 soatda ma'lumotlarni tozalash
  setInterval(async () => {
    await cleanOldTodayData();
  }, 6 * 60 * 60 * 1000); // 6 soat

  // Birinchi tozalash 1 soatdan keyin
  setTimeout(async () => {
    await cleanOldTodayData();
  }, 60 * 60 * 1000);
}

async function createDailySnapshot() {
  const today = new Date().toISOString().split("T")[0];
  // console.log(`17:00 SNAPSHOT: ${today}`);

  try {
    const records = await OptimizedAttendance.find({ 
      date: today,
      type: 'realtime'
    }).lean();

    if (records.length === 0) {
      console.log("Bugun ma'lumot yo'q");
      return;
    }

    const snapshot = { all: null, shift1: null, shift2: null, shift3: null };
    let totalPresent = 0;
    let totalStudents = 0;

    records.forEach(r => {
      const key = r.shift_no === null ? "all" : `shift${r.shift_no}`;
      snapshot[key] = r;

      if (r.summary?.students) {
        totalPresent += r.summary.students.present_today || 0;
        totalStudents += r.summary.students.total || 0;
      }
    });

    const rate = totalStudents > 0 ? (totalPresent / totalStudents * 100).toFixed(2) : 0;

    // Create unified finalized document
    await OptimizedAttendance.findOneAndUpdate(
      { 
        date: today,
        type: 'finalized'
      },
      {
        type: 'finalized',
        date: today,
        shift_no: null, // Overall daily summary
        dailySummary: {
          shifts: snapshot,
          totalPresent: totalPresent,
          totalStudents: totalStudents,
          overallRate: parseFloat(rate)
        },
        finalizedAt: new Date()
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`OPTIMAL KUNLIK SNAPSHOT SAQLANDI: ${today} | Umumiy davomat: ${rate}%`);

  } catch (err) {
    console.error("Snapshot xatosi:", err.message);
  }
}

connect();
scheduleDailySnapshot();
scheduleDataCleanup();

module.exports = {
  schoolsData,
  setSchoolsConfig,
  isRealtimeMode: () => isRealtimeMode,
  startShiftCycling,
  stopShiftCycling,
  cycleToNextShift,
  getCurrentShift: () => allShifts[currentShiftIndex],
  isShiftCyclingActive: () => shiftCycleInterval !== null,
  cleanOldTodayData,
  saveToMongoDB
};