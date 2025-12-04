// getServer/education.js
const schoolsSocket = require("./ws/schools");

function startEducationSockets() {
  console.log("Education WebSocket manager ishga tushdi...");

  // Faqat bitta ulanish! Boshqa hech narsa kerak emas
  // Default: bugun, barcha smenalar, 25s
  schoolsSocket.setSchoolsConfig({ interval: 25, shift_no: null });
}

module.exports = { startEducationSockets, schoolsSocket };
