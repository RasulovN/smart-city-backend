require('dotenv').config();
const express = require("express");
const cors = require("cors");
const os = require('os');
const proccess = require("process");

const router = require("./routes/index.route");
const swaggerSetup = require("./utils/swagger");
const connectDB = require("./db/mongo");
const { prisma, connectPostgres } = require("./db/postgres");

const app = express();



connectDB();
// Ports
const PORT = proccess.env.PORT || 4000;

// Get real server IP
let serverIP = 'api.smart-city-qarshi.uz';

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


swaggerSetup(app);

// Middlewares
// app.options("*", cors());

const allowedOrigins = [
  "https://control.smart-city-qarshi.uz",
  "https://api.smart-city-qarshi.uz",
  "https://smart-city-qarshi.uz",
  "http://localhost:5173"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));


// app.use(cors({
//   origin: ["*", "https://smart-city-qarshi.uz", "https://api.smart-city-qarshi.uz", "http://localhost:5173", 
//     "http://127.0.0.1:5173", "https://control.smart-city-qarshi.uz", "https://control.smart-city-qarshi.uz/*"],
//   methods: ["GET","POST","PUT","DELETE"],
//   allowedHeaders: ["Content-Type","Authorization"],
//   credentials: true
// }));



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
// app.listen(PORT, "0.0.0.0", () => {
//   console.log(`🚀 Server running on: http://${serverIP}:${PORT}`);
//   console.log(`🚀 Server running on: http://${serverIP}:${PORT}/api-docs`);
//   console.log(`🚀 API running on: https://api.smart-city-qarshi.uz/api-docs`);
// });


async function start() {
  try {
    // Connect MongoDB
    // await connectDB();
    // console.log('MongoDB connected');
    
    // Connect PostgreSQL (Prisma)
    // await connectPostgres();


    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on: http://${serverIP}:${PORT}`);
      console.log(`🚀 Server running on: http://${serverIP}:${PORT}/api-docs`);
      console.log(`🚀 API running on: https://api.smart-city-qarshi.uz/api-docs`);
    });
    // app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    } catch (err) {
    console.error('Failed to start', err);
    process.exit(1);
    }
  }


start();
