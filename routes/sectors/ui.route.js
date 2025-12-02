// User interface routes
const express = require('express');
const router = express.Router();

const uiController = require('../../controller/sectors/ui.controller');


router.get('/sectors', uiController.getAllSectors);

router.get('/statistika', uiController.getAllSectors);


module.exports = router;
