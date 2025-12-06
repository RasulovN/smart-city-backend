require('dotenv').config();
const express = require("express");
const cors = require("cors");
const os = require('os');
const proccess = require("process");

const router = require("./routes/index.route");
const swaggerSetup = require("./utils/swagger"); 

const connectDB = require("./db/mongo");
const { prisma, connectPostgres } = require("./db/postgres");
const { startEducationSockets } = require('./getServer/education');
const { startCleanupJob } = require('./cron/cleanup');
// const swaggerUi = require("swagger-ui-express");
// const swaggerFile = require("./utils/swagger.json"); // autogen hosil qilgan fayl


const app = express();


connectDB();


startEducationSockets();
startCleanupJob();
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
// app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));


// Middlewares


app.use(cors({
  origin: "*",
  methods: ["GET","POST","PUT","DELETE"],
  allowedHeaders: ["Content-Type","Authorization"],
  credentials: false
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
// app.use((req, res) => {
//   res.status(404).json({ message: "Endpoint not found" });
// });






// HTML ko‘rinishda chiqaruvchi route





 

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
      console.log(`🔔 Notification system ready`);
      console.log(`📅 Cleanup jobs scheduled (daily at 2:00 AM)`);
    });
    // app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    } catch (err) {
    console.error('Failed to start', err);
    process.exit(1);
    }
  }


start();
