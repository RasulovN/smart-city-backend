// server.js
require('dotenv').config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const router = require("./routes/index.route");
const config = require("./config");
const connectDB = require('./db/mongo');

const app = express();
const PORT = config.port;

// Connect to MongoDB
connectDB();
// mongoose.connect(config.mongoUrl)
//   .then(() => console.log("✅ MongoDB connected successfully"))
//   .catch(err => {
//     console.error("❌ MongoDB connection error:", err);
//     process.exit(1);
//   });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on: http://localhost:${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
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
