const router = require("express").Router();

// #swagger.tags = ['Admin']
// router.post("/login", adminController.login) 

// Auth routes (public and protected)
router.use("/auth", require("./auth.route.js"));

// Admin routes (protected - super admin only)
router.use("/admin", require("./admin.route.js"));

// mobile User routes
router.use("/mobile-users", require("./mobileUser.routes.js"));


// Sector routes
router.use("/sectors", require("./sector.route.js"));
// UI routes
router.use("/ui", require("./sectors/ui.route"));

// UI routes
router.use("/schools", require("./ws/realtime.route"));

// Test routes (PostgreSQL)
router.use("/test", require("./test.route"));

    
// Notification routes
router.use("/notifications", require("./notification.route"));






module.exports = router;
