const express = require('express');
const router = express.Router();
const { getTrafficData, getTrafficById } = require('../controller/trafficController');
const { verifyToken, restrictToOwnSector } = require('../middleware/auth.middleware');

// Routes for traffic module (Security sector)
// Only accessible by: super_admin, admin, and sector_admin with security sector
router.get('/', verifyToken, restrictToOwnSector, getTrafficData);
router.get('/:id', verifyToken, restrictToOwnSector, getTrafficById);

module.exports = router;
