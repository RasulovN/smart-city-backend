const express = require('express');
const router = express.Router();
const adminController = require('../controller/admin.controller');
const { verifyToken, checkRole } = require('../middleware/auth.middleware');

// All user routes require authentication
router.use(verifyToken);

// Get all users (Admin and Super Admin only)
router.get('/', checkRole(['admin', 'super_admin']), adminController.getAllUsers);

// Get user by ID
router.get('/:id', checkRole(['admin', 'super_admin']), adminController.getUserById);

// Create new user (Admin and Super Admin only)
router.post('/', checkRole(['admin', 'super_admin']), adminController.createUser);

// Update user
router.put('/:id', checkRole(['admin', 'super_admin']), adminController.updateUser);

// Delete user (Admin and Super Admin only)
router.delete('/:id', checkRole(['admin', 'super_admin']), adminController.deleteUser);

// Deactivate user
router.put('/:id/deactivate', checkRole(['admin', 'super_admin']), adminController.deactivateUser);

// Activate user
router.put('/:id/activate', checkRole(['admin', 'super_admin']), adminController.activateUser);

// Reset user password (Admin and Super Admin only)
router.put('/:id/reset-password', checkRole(['admin', 'super_admin']), adminController.resetUserPassword);

// Get users by sector
router.get('/sector/:sector', checkRole(['admin', 'super_admin']), adminController.getUsersBySector);

module.exports = router;