const express = require('express');
const router = express.Router();
const adminController = require('../controller/admin.controller');
const { verifyToken, checkRole } = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management operations (Admin and Super Admin only)
 */

// All user routes require authentication
router.use(verifyToken);

/**
 * @swagger
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: Get all users
 *     description: Retrieve all users with pagination (Admin and Super Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [super_admin, admin, sector_admin, user]
 *         description: Filter by role
 *       - in: query
 *         name: sector
 *         schema:
 *           type: string
 *           enum: [ecology, security, infrastructure, health, education, social, economic, other]
 *         description: Filter by sector
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
// Get all users (Admin and Super Admin only)
router.get('/', checkRole(['admin', 'super_admin']), adminController.getAllUsers);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID
 *     description: Retrieve user details by ID (Admin and Super Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
// Get user by ID
router.get('/:id', checkRole(['admin', 'super_admin']), adminController.getUserById);

/**
 * @swagger
 * /users:
 *   post:
 *     tags: [Users]
 *     summary: Create new user
 *     description: Create a new user (Admin and Super Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRegistration'
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       409:
 *         description: User already exists
 *       500:
 *         description: Internal server error
 */
// Create new user (Admin and Super Admin only)
router.post('/', checkRole(['admin', 'super_admin']), adminController.createUser);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     tags: [Users]
 *     summary: Update user
 *     description: Update user information (Admin and Super Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserUpdate'
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
// Update user
router.put('/:id', checkRole(['admin', 'super_admin']), adminController.updateUser);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Delete user
 *     description: Delete user permanently (Admin and Super Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
// Delete user (Admin and Super Admin only)
router.delete('/:id', checkRole(['admin', 'super_admin']), adminController.deleteUser);

/**
 * @swagger
 * /users/{id}/deactivate:
 *   put:
 *     tags: [Users]
 *     summary: Deactivate user
 *     description: Deactivate user account (Admin and Super Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deactivated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
// Deactivate user
router.put('/:id/deactivate', checkRole(['admin', 'super_admin']), adminController.deactivateUser);

/**
 * @swagger
 * /users/{id}/activate:
 *   put:
 *     tags: [Users]
 *     summary: Activate user
 *     description: Activate user account (Admin and Super Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User activated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
// Activate user
router.put('/:id/activate', checkRole(['admin', 'super_admin']), adminController.activateUser);

/**
 * @swagger
 * /users/{id}/reset-password:
 *   put:
 *     tags: [Users]
 *     summary: Reset user password
 *     description: Reset user password (Admin and Super Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
// Reset user password (Admin and Super Admin only)
router.put('/:id/reset-password', checkRole(['admin', 'super_admin']), adminController.resetUserPassword);

/**
 * @swagger
 * /users/sector/{sector}:
 *   get:
 *     tags: [Users]
 *     summary: Get users by sector
 *     description: Retrieve users filtered by sector (Admin and Super Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sector
 *         required: true
 *         schema:
 *           type: string
 *           enum: [ecology, security, infrastructure, health, education, social, economic, other]
 *         description: Sector name
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
// Get users by sector
router.get('/sector/:sector', checkRole(['admin', 'super_admin']), adminController.getUsersBySector);

module.exports = router;