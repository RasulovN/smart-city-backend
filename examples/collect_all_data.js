const EnhancedSchoolsWebSocket = require('../getServer/ws/enhancedSchools');

async function collectAllData() {
  console.log("🚀 Starting ALL DATA collection...");
  
  const collector = new EnhancedSchoolsWebSocket();
  
  // Connect and collect all data with 25-second intervals
  collector.connect();
  collector.collectAllData(25);
  
  // Keep running for demonstration (in real usage, you'd manage this differently)
  console.log("⏰ Collecting data... Press Ctrl+C to stop");
  
  process.on('SIGINT', () => {
    console.log("\n🛑 Stopping data collection...");
    collector.disconnect();
    process.exit(0);
  });
  
  // Keep the process alive
  setInterval(() => {
    const status = collector.getStatus();
    console.log(`📊 Status: ${status.connected ? 'Connected' : 'Disconnected'} | Buffer: ${status.bufferedMessages}`);
  }, 30000);
}

collectAllData().catch(console.error);