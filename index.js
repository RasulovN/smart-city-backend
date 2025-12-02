require('dotenv').config();
const express = require("express");
const cors = require("cors");
const os = require('os');
const proccess = require("process");

const router = require("./routes/index.route");
const swaggerSetup = require("./utils/swagger");
const connectDB = require("./db/mongo");

const app = express();

// Ports
const PORT = proccess.env.PORT || 4000;

// Get real server IP
let serverIP = '45.138.158.158';

// let serverIP = 'localhost';
const interfaces = os.networkInterfaces();
for (const iface of Object.values(interfaces)) {
  for (const alias of iface) {
    if (alias.family === 'IPv4' && !alias.internal) {
      serverIP = alias.address;
      break;
    }
  }
}

// Connect DB
connectDB();
swaggerSetup(app);

// Middlewares
app.use(cors({
  origin: "*",
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api", router);

// Health check
app.get("/", (req, res) => {
  res.json({
    status: "running",
    url: `http://${serverIP}:${PORT}`
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
});

// Start Server (no HTTPS here!)
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on: http://${serverIP}:${PORT}`);
  console.log(`🚀 Server running on: http://${serverIP}:${PORT}/api-docs`);
  console.log(`🚀 API running on: https://api.smart-city-qarshi.uz/api-docs`);
});
