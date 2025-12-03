const express = require('express');
const router = express.Router();
const testController = require('../controller/test.controller');

// Test model routes (PostgreSQL)
router.get('/', testController.getAllTests);
router.get('/:id', testController.getTestById);
router.post('/', testController.createTest);
router.put('/:id', testController.updateTest);
router.delete('/:id', testController.deleteTest);

module.exports = router;
