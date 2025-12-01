// server.js
require('dotenv').config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const router = require("./routes/index.route");
const config = require("./config");
const connectDB = require('./db/mongo');
const os = require('os');
const swaggerSetup = require("./utils/swagger")
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 4000; // Force port 4000 for testing

// Get VPS public IP
// let serverIP = '127.0.0.1';
let serverIP = 'localhost';
const networkInterfaces = os.networkInterfaces();
for (const iface of Object.values(networkInterfaces)) {
  for (const alias of iface) {
    if (alias.family === 'IPv4' && !alias.internal) {
      serverIP = alias.address;
      break;
    }
  }
}

// Connect to MongoDB
connectDB();
swaggerSetup(app);

// Middleware
// app.use(cors({
//   origin: process.env.CORS_ORIGIN
// }));
app.use(cors({
  origin: "*",
  // origin: ['http://localhost:5173', 'http://45.138.158.158:5173'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use("/api", router);

 

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Smart City API is running",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      admin: "/api/admin",
      environment: "/api/environment",
      traffic: "/api/traffic",
      transport: "/api/transport"
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found"
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error"
  });
});


// HTTPS uchun self-signed sertifikat
const httpsOptions = {
  // key: fs.readFileSync('./server.key'),
  // cert: fs.readFileSync('./server.cert')
};

// Start server on all interfaces (0.0.0.0)
const server = app.listen(PORT, httpsOptions, '0.0.0.0', () => {
  console.log(`🚀 Server running on: http://${serverIP}:${PORT}`);
  console.log(`📚 API Documentation: http://${serverIP}:${PORT}/api/doc`);
  console.log(`\n💡 To create super admin, run: node seed.js`);
  
  // Initialize notification service
  try {
    const notificationService = require('./services/appeals/notification.service');
    notificationService.setupScheduledTasks();
    console.log('✅ Notification service initialized');
  } catch (error) {
    console.error('❌ Error initializing notification service:', error.message);
  }
});
