// routes/education.js
const express = require('express');
const router = express.Router();
const schoolsSocket = require('../../getServer/ws/schools');
const realtimeController = require('../../controller/realtime.controller');

router.get('/schools', realtimeController.getRealTime);


module.exports = router;