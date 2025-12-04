const WebSocket = require("ws");
const OptimizedAttendance = require("../../models/OptimizedAttendance");

class EnhancedSchoolsWebSocket {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000;
    this.currentConfig = null;
    this.dataBuffer = [];
    
    this.URL = "wss://partner.tty0x-api-app.cloud/api/v1/partner/dashboard/ws";
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.ws = new WebSocket(this.URL);

    this.ws.on("open", () => {
      console.log("✅ WebSocket connected to attendance service");
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Send current config if available
      if (this.currentConfig) {
        this.sendConfig(this.currentConfig);
      }
    });

    this.ws.on("message", async (raw) => {
      try {
        const message = JSON.parse(raw.toString());
        if (message.type !== "stats") return;

        await this.handleStatsMessage(message);
      } catch (error) {
        console.error("❌ Error processing message:", error.message);
      }
    });

    this.ws.on("close", () => {
      console.log("❌ WebSocket connection closed");
      this.isConnected = false;
      this.handleReconnect();
    });

    this.ws.on("error", (error) => {
      console.error("❌ WebSocket error:", error.message);
      this.isConnected = false;
    });
  }

  async handleStatsMessage(message) {
    try {
      const { data, timestamp } = message;
      const config = this.currentConfig || {};
      
      // Save data using enhanced handler
      const result = await OptimizedAttendance.saveWebSocketData(data, {
        date: data.date,
        shift_no: data.shift_no,
        tuman_id: config.tuman_id
      });

      const shiftName = data.shift_no === null || data.shift_no === undefined ? 'Barcha' : `${data.shift_no}-smena`;
      const tumanInfo = config.tuman_id ? ` | Tuman: ${config.tuman_id}` : '';
      const operation = result.operation === 'updated' ? '🔄' : '✅';
      
      console.log(`${operation} ${data.date} | ${shiftName}${tumanInfo} | Davomat: ${data.students?.attendance_rate || 0}%`);
      
    } catch (error) {
      console.error("❌ Error saving WebSocket data:", error.message);
    }
  }

  sendConfig(config) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.log("⏳ WebSocket not connected, queuing config");
      this.dataBuffer.push(config);
      return;
    }

    const message = OptimizedAttendance.buildConfigMessage(config);
    this.ws.send(JSON.stringify(message));
    this.currentConfig = config;
    
    console.log("📤 Config sent:", message);
  }

  handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log("❌ Max reconnection attempts reached");
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    // console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  // Public methods for different data collection scenarios
  
  collectAllData(interval = 25) {
    this.sendConfig({ interval });
    // console.log("📊 Collecting all attendance data");
  }

  collectShiftData(shift_no, interval = 25) {
    this.sendConfig({ interval, shift_no });
    // console.log(`📊 Collecting ${shift_no}-smena data`);
  }

  collectDateData(date, interval = 25) {
    this.sendConfig({ interval, date });
    // console.log(`📊 Collecting data for ${date}`);
  }

  collectDateShiftData(date, shift_no, interval = 25) {
    this.sendConfig({ interval, date, shift_no });
    // console.log(`📊 Collecting ${shift_no}-smena data for ${date}`);
  }

  collectTumanData(tuman_id, interval = 25) {
    this.sendConfig({ interval, tuman_id });
    // console.log(`📊 Collecting data for tuman ${tuman_id}`);
  }

  collectTumanShiftData(tuman_id, shift_no, interval = 25) {
    this.sendConfig({ interval, tuman_id, shift_no });
    // console.log(`📊 Collecting ${shift_no}-smena data for tuman ${tuman_id}`);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  getStatus() {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      currentConfig: this.currentConfig,
      bufferedMessages: this.dataBuffer.length
    };
  }
}

module.exports = EnhancedSchoolsWebSocket;