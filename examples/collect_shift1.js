const EnhancedSchoolsWebSocket = require('../getServer/ws/enhancedSchools');

async function collectShift1Data() {
  console.log("🚀 Starting SHIFT 1 data collection...");
  
  const collector = new EnhancedSchoolsWebSocket();
  
  // Connect and collect only 1st shift data
  collector.connect();
  collector.collectShiftData(1, 25);
  
  console.log("⏰ Collecting Shift 1 data... Press Ctrl+C to stop");
  
  process.on('SIGINT', () => {
    console.log("\n🛑 Stopping Shift 1 data collection...");
    collector.disconnect();
    process.exit(0);
  });
}

collectShift1Data().catch(console.error);