const EnhancedSchoolsWebSocket = require('../getServer/ws/enhancedSchools');

async function collectShift2Data() {
  console.log("🚀 Starting SHIFT 2 data collection...");
  
  const collector = new EnhancedSchoolsWebSocket();
  
  collector.connect();
  collector.collectShiftData(2, 25);
  
  console.log("⏰ Collecting Shift 2 data... Press Ctrl+C to stop");
  
  process.on('SIGINT', () => {
    console.log("\n🛑 Stopping Shift 2 data collection...");
    collector.disconnect();
    process.exit(0);
  });
}

collectShift2Data().catch(console.error);