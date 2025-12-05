const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: { title: "Smart City API", description: "Swagger Autogen" },
  host: "172.31.192.1:4000",
  basePath: "/api",
};

const outputFile = "./swagger.json"; // 👉 Bu fayl keyin avtomatik yaratiladi
const routes = ["./routes/*.js"];    // qaysi route fayllardan swagger generatsiya qilinsin

swaggerAutogen(outputFile, routes, doc).then(() => {
  require("./index.js"); // serverni ishga tushuradi
});
