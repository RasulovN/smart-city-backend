const express = require('express');
const router = express.Router();
const authController = require('../controller/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');


// Public routes
router.post('/login', authController.login);


// Protected routes (require authentication)
router.post('/logout', verifyToken, authController.logout);


router.get('/profile', verifyToken, authController.getProfile);


router.post('/change-password', verifyToken, authController.changePassword);


router.post('/refresh-token', verifyToken, authController.refreshToken);

module.exports = router;
