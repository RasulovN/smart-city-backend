const EnhancedSchoolsWebSocket = require('../getServer/ws/enhancedSchools');

async function collectShift3Data() {
  console.log("🚀 Starting SHIFT 3 data collection...");
  
  const collector = new EnhancedSchoolsWebSocket();
  
  collector.connect();
  collector.collectShiftData(3, 25);
  
  console.log("⏰ Collecting Shift 3 data... Press Ctrl+C to stop");
  
  process.on('SIGINT', () => {
    console.log("\n🛑 Stopping Shift 3 data collection...");
    collector.disconnect();
    process.exit(0);
  });
}

collectShift3Data().catch(console.error);