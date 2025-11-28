const express = require('express');
const router = express.Router();
const { getEnvironmentData, getSensorById } = require('../controller/environmentController');
const { verifyToken, restrictToOwnSector } = require('../middleware/auth.middleware');

// Routes for environment module (Ecology sector)
// Only accessible by: super_admin, admin, and sector_admin with ecology sector
router.get('/', verifyToken, restrictToOwnSector, getEnvironmentData);
router.get('/:id', verifyToken, restrictToOwnSector, getSensorById);

module.exports = router;
