const router = require("express").Router();

// Auth routes (public and protected)
router.use("/auth", require("./auth.route.js"));

// Admin routes (protected - super admin only)
router.use("/admin", require("./admin.route.js"));

// User routes
router.use("/users", require("./user.routes.js"));


// Sector routes
router.use("/sectors", require("./sector.route.js"));







// Sector-specific routes (protected with role-based access)
// Environment routes - Ecology sector
router.use("/environment", require("./environmentRoutes.js"));

// Traffic routes - Security sector
router.use("/traffic", require("./trafficRoutes"));

// Transport routes - Security sector
router.use("/transport", require("./transportRoutes"));

module.exports = router;
