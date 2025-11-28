const express = require('express');
const router = express.Router();
const { getTransportData, getBusById } = require('../controller/transportController');
const { verifyToken, restrictToOwnSector } = require('../middleware/auth.middleware');

// Routes for transport module (Security sector)
// Only accessible by: super_admin, admin, and sector_admin with security sector
router.get('/', verifyToken, restrictToOwnSector, getTransportData);
router.get('/:id', verifyToken, restrictToOwnSector, getBusById);

module.exports = router;
