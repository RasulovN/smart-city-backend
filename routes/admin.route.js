const express = require('express');
const router = express.Router();
const adminController = require('../controller/admin.controller');
const { verifyToken, isSuperAdmin, isAdmin } = require('../middleware/auth.middleware');

// Public registration route (no authentication required)
router.post('/register', adminController.register);

// All other routes require authentication and admin privileges

// Super Admin only - Create new admin or sector admin
router.post('/users', verifyToken, isSuperAdmin, adminController.createUser);

// Admin and Super Admin - View users
router.get('/users', verifyToken, isAdmin, adminController.getAllUsers);
router.get('/users/:id', verifyToken, isAdmin, adminController.getUserById);
router.get('/users/sector/:sector', verifyToken, isAdmin, adminController.getUsersBySector);

// Super Admin only - Modify users
router.put('/users/:id', verifyToken, isSuperAdmin, adminController.updateUser);
router.delete('/users/:id', verifyToken, isSuperAdmin, adminController.deleteUser);
router.patch('/users/:id/deactivate', verifyToken, isSuperAdmin, adminController.deactivateUser);
router.patch('/users/:id/activate', verifyToken, isSuperAdmin, adminController.activateUser);
router.post('/users/:id/reset-password', verifyToken, isSuperAdmin, adminController.resetUserPassword);

module.exports = router;
