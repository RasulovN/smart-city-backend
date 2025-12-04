const router = require("express").Router();

// Auth routes (public and protected)
router.use("/auth", require("./auth.route.js"));

// Admin routes (protected - super admin only)
router.use("/admin", require("./admin.route.js"));

// User routes
router.use("/users", require("./user.routes.js"));


// Sector routes
router.use("/sectors", require("./sector.route.js"));
// UI routes
router.use("/ui", require("./sectors/ui.route"));

// UI routes
router.use("/schools", require("./ws/realtime.route"));

// Test routes (PostgreSQL)
router.use("/test", require("./test.route"));






module.exports = router;
