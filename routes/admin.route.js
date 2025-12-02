const express = require('express');
const router = express.Router();
const adminController = require('../controller/admin.controller');
const { verifyToken, isSuperAdmin, isAdmin } = require('../middleware/auth.middleware');
const sectorController = require('../controller/sector.controller');

/**
 * @swagger
 * components:
 *   schemas:
 *     Sector:
 *       type: object
 *       required:
 *         - name
 *         - slug
 *         - description
 *       properties:
 *         id:
 *           type: string
 *           example: "692d748412de33a371c16635"
 *         name:
 *           type: string
 *           example: "Technology"
 *         slug:
 *           type: string
 *           example: "technology"
 *         description:
 *           type: string
 *           example: "Information Technology and Digital Services sector"
 *         isActive:
 *           type: boolean
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     SectorCreate:
 *       type: object
 *       required:
 *         - name
 *         - slug
 *         - description
 *       properties:
 *         name:
 *           type: string
 *           example: "Technology"
 *         slug:
 *           type: string
 *           example: "technology"
 *         description:
 *           type: string
 *           example: "Information Technology and Digital Services sector"
 *         isActive:
 *           type: boolean
 *           example: true
 *     SectorUpdate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: "Updated Technology"
 *         slug:
 *           type: string
 *           example: "updated-technology"
 *         description:
 *           type: string
 *           example: "Updated description"
 *         isActive:
 *           type: boolean
 *           example: false
 *     SectorList:
 *       type: object
 *       properties:
 *         sectors:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Sector'
 *         pagination:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *               example: 5
 *             page:
 *               type: integer
 *               example: 1
 *             limit:
 *               type: integer
 *               example: 10
 *             pages:
 *               type: integer
 *               example: 1
 *     UserRegistration:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - email
 *         - password
 *         - role
 *       properties:
 *         firstName:
 *           type: string
 *           example: John
 *         lastName:
 *           type: string
 *           example: Doe
 *         email:
 *           type: string
 *           format: email
 *           example: john.doe@example.com
 *         password:
 *           type: string
 *           format: password
 *           example: password123
 *         role:
 *           type: string
 *           enum: [super_admin, admin, sector_admin, user]
 *           example: admin
 *         sector:
 *           type: string
 *           enum: [ecology, security, infrastructure, health, education, social, economic, other]
 *           example: ecology
 *     UserUpdate:
 *       type: object
 *       properties:
 *         firstName:
 *           type: string
 *           example: John
 *         lastName:
 *           type: string
 *           example: Doe
 *         email:
 *           type: string
 *           format: email
 *           example: john.doe@example.com
 *         role:
 *           type: string
 *           enum: [super_admin, admin, sector_admin, user]
 *           example: admin
 *         sector:
 *           type: string
 *           enum: [ecology, security, infrastructure, health, education, social, economic, other]
 *           example: ecology
 *         isActive:
 *           type: boolean
 *           example: true
 */

/**
 * @swagger
 * /admin/register:
 *   post:
 *     tags: [Admin]
 *     summary: Register new user
 *     description: Register a new user in the system (public endpoint)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRegistration'
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid input data
 *       409:
 *         description: User already exists
 *       500:
 *         description: Internal server error
 */
// Public registration route (no authentication required)
router.post('/register', adminController.register);

/**
 * @swagger
 * /admin/users:
 *   post:
 *     tags: [Admin]
 *     summary: Create new user
 *     description: Create a new user (Admin and Super Admin)
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
 *         description: Forbidden - Super Admin access required
 *       409:
 *         description: User already exists
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: Get all users
 *     description: Retrieve all users with pagination (Admin and Super Admin)
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
// All other routes require authentication and admin privileges

// Admin and Super Admin - Create new admin or sector admin
router.post('/users', verifyToken, isAdmin, adminController.createUser);

// Admin and Super Admin - View users
router.get('/users', verifyToken, isAdmin, adminController.getAllUsers);

/**
 * @swagger
 * /admin/users/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: Get user by ID
 *     description: Retrieve user details by ID (Admin and Super Admin)
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
router.get('/users/:id', verifyToken, isAdmin, adminController.getUserById);

/**
 * @swagger
 * /admin/users/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Update user
 *     description: Update user information (Admin and Super Admin)
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
 *         description: Forbidden - Super Admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /admin/users/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Delete user
 *     description: Delete user permanently (Admin and Super Admin)
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
 *         description: Forbidden - Super Admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
// Admin and Super Admin - Modify users
router.put('/users/:id', verifyToken, isAdmin, adminController.updateUser);
router.delete('/users/:id', verifyToken, isAdmin, adminController.deleteUser);

/**
 * @swagger
 * /admin/users/{id}/deactivate:
 *   patch:
 *     tags: [Admin]
 *     summary: Deactivate user
 *     description: Deactivate user account (Admin and Super Admin)
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
 *         description: Forbidden - Super Admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /admin/users/{id}/activate:
 *   patch:
 *     tags: [Admin]
 *     summary: Activate user
 *     description: Activate user account (Admin and Super Admin)
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
 *         description: Forbidden - Super Admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /admin/users/{id}/reset-password:
 *   post:
 *     tags: [Admin]
 *     summary: Reset user password
 *     description: Reset user password (Admin and Super Admin)
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
 *         description: Forbidden - Super Admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.patch('/users/:id/deactivate', verifyToken, isAdmin, adminController.deactivateUser);
router.patch('/users/:id/activate', verifyToken, isAdmin, adminController.activateUser);
router.post('/users/:id/reset-password', verifyToken, isAdmin, adminController.resetUserPassword);







/**
 * @swagger
 * /admin/users/sector/{sector}:
 *   get:
 *     tags: [Admin]
 *     summary: Get users by sector
 *     description: Retrieve users filtered by sector (Admin and Super Admin)
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
router.get('/users/sector/:sector', verifyToken, isAdmin, adminController.getUsersBySector);

/**
 * @swagger
 * /admin/sectors:
 *   post:
 *     tags: [Admin]
 *     summary: Create new sector
 *     description: Create a new sector (Admin and Super Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SectorCreate'
 *     responses:
 *       201:
 *         description: Sector created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       409:
 *         description: Sector with this name or slug already exists
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /admin/sectors:
 *   get:
 *     tags: [Admin]
 *     summary: Get all sectors
 *     description: Retrieve all sectors with pagination (Public access)
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
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Sectors retrieved successfully
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /admin/sectors/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: Get sector by ID
 *     description: Retrieve sector details by ID (Public access)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sector ID
 *     responses:
 *       200:
 *         description: Sector retrieved successfully
 *       404:
 *         description: Sector not found
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /admin/sectors/slug/{slug}:
 *   get:
 *     tags: [Admin]
 *     summary: Get sector by slug
 *     description: Retrieve sector details by slug (Public access)
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Sector slug
 *     responses:
 *       200:
 *         description: Sector retrieved successfully
 *       404:
 *         description: Sector not found
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /admin/sectors/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Update sector
 *     description: Update sector information (Admin and Super Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sector ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SectorUpdate'
 *     responses:
 *       200:
 *         description: Sector updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Sector not found
 *       409:
 *         description: Sector with this name or slug already exists
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /admin/sectors/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Delete sector
 *     description: Delete sector permanently (Admin and Super Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sector ID
 *     responses:
 *       200:
 *         description: Sector deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Sector not found
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /admin/sectors/{id}/deactivate:
 *   patch:
 *     tags: [Admin]
 *     summary: Deactivate sector
 *     description: Deactivate sector (Admin and Super Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sector ID
 *     responses:
 *       200:
 *         description: Sector deactivated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Sector not found
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /admin/sectors/{id}/activate:
 *   patch:
 *     tags: [Admin]
 *     summary: Activate sector
 *     description: Activate sector (Admin and Super Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sector ID
 *     responses:
 *       200:
 *         description: Sector activated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Sector not found
 *       500:
 *         description: Internal server error
 */
// Sector Routes - Admin & Super Admin access
// Create sector (Admin & Super Admin)
router.post('/sectors', verifyToken, isAdmin, sectorController.createSector);

// Get all sectors (Public access)
router.get('/sectors', sectorController.getAllSectors);

// Get sector by ID (Public access)
router.get('/sectors/:id', sectorController.getSectorById);

// Get sector by slug (Public access)
router.get('/sectors/slug/:slug', sectorController.getSectorBySlug);

// Update sector (Admin & Super Admin)
router.put('/sectors/:id', verifyToken, isAdmin, sectorController.updateSector);

// Delete sector (Admin & Super Admin)
router.delete('/sectors/:id', verifyToken, isAdmin, sectorController.deleteSector);

// Deactivate sector (Admin & Super Admin)
router.patch('/sectors/:id/deactivate', verifyToken, isAdmin, sectorController.deactivateSector);

// Activate sector (Admin & Super Admin)
router.patch('/sectors/:id/activate', verifyToken, isAdmin, sectorController.activateSector);




module.exports = router;
