const EnhancedSchoolsWebSocket = require('../getServer/ws/enhancedSchools');

async function collectDateFilterData() {
  console.log("🚀 Starting DATE FILTER data collection...");
  
  const collector = new EnhancedSchoolsWebSocket();
  
  // Collect data for specific date
  const targetDate = '2025-12-04';
  collector.connect();
  collector.collectDateData(targetDate, 25);
  
  console.log(`⏰ Collecting data for ${targetDate}... Press Ctrl+C to stop`);
  
  process.on('SIGINT', () => {
    console.log("\n🛑 Stopping date filter data collection...");
    collector.disconnect();
    process.exit(0);
  });
}

collectDateFilterData().catch(console.error);