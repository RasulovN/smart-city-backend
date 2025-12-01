// server.js
require('dotenv').config();
const express = require("express");
const cors = require("cors");
const os = require('os');
const fs = require('fs');
const https = require("https");
const http = require("http");
const proccess = require("process");


const router = require("./routes/index.route");
const swaggerSetup = require("./utils/swagger");
const connectDB = require("./db/mongo");

const app = express();

// Ports
const HTTP_PORT = proccess.env.HTTP || 4000;
const HTTPS_PORT = proccess.env.HTTPS || 4443; // HTTPS uchun boshqa port tavsiya qilinadi

// Get real server IP
let serverIP = 'localhost';
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
    http: `http://${serverIP}:${HTTP_PORT}`,
    https: `https://${serverIP}:${HTTPS_PORT}`
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
});

// Create HTTPS certificates
const httpsOptions = {
  key: fs.readFileSync('./server.key'),
  cert: fs.readFileSync('./server.cert')
};

// Start HTTP Server
http.createServer(app).listen(HTTP_PORT, "0.0.0.0", () => {
  console.log(`🌐 HTTP running on: http://${serverIP}:${HTTP_PORT}`);
});

// Start HTTPS Server
https.createServer(httpsOptions, app).listen(HTTPS_PORT, "0.0.0.0", () => {
  console.log(`🔐 HTTPS running on: https://${serverIP}:${HTTPS_PORT}`);
});
