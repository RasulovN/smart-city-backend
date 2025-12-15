// routes/education.js
const express = require('express');
const router = express.Router();
const schoolsSocket = require('../../getServer/ws/schools');
const realtimeController = require('../../controller/realtime.controller');
const educationController = require('../../controller/sectors/education.controller');

router.get('/schools', realtimeController.getRealTime);

// Get all schools data
router.get('/all-statistika', educationController.getSchoolsData);

// Get education statistics with time period filters
router.get('/stats', educationController.getEducationStats);

// Get school face ID specific data
router.get('/face-id', educationController.getSchoolFaceIdData);

module.exports = router;