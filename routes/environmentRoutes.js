const express = require('express');
const router = express.Router();
const { getEnvironmentData, getSensorById } = require('../controller/environmentController');
const { verifyToken, restrictToOwnSector } = require('../middleware/auth.middleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     EnvironmentData:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "64a1b2c3d4e5f6789abcdef"
 *         sensorId:
 *           type: string
 *           example: "ENV001"
 *         location:
 *           type: object
 *           properties:
 *             district:
 *               type: string
 *               example: "Chilanzar"
 *             address:
 *               type: string
 *               example: "Main Street 123"
 *         readings:
 *           type: object
 *           properties:
 *             temperature:
 *               type: number
 *               example: 25.5
 *             humidity:
 *               type: number
 *               example: 65.2
 *             airQuality:
 *               type: number
 *               example: 85.5
 *             pm25:
 *               type: number
 *               example: 12.3
 *             pm10:
 *               type: number
 *               example: 18.7
 *         timestamp:
 *           type: string
 *           format: date-time
 *         isActive:
 *           type: boolean
 *           example: true
 */

/**
 * @swagger
 * tags:
 *   name: Environment
 *   description: Environmental monitoring data for ecology sector
 */

/**
 * @swagger
 * /environment:
 *   get:
 *     tags: [Environment]
 *     summary: Get environmental data
 *     description: Retrieve environmental monitoring data (Ecology sector access required)
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
 *         name: district
 *         schema:
 *           type: string
 *         description: Filter by district
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Environmental data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/EnvironmentData'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationResponse/properties/pagination'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Sector access restricted
 *       500:
 *         description: Internal server error
 */

// Routes for environment module (Ecology sector)
// Only accessible by: super_admin, admin, and sector_admin with ecology sector
router.get('/', verifyToken, restrictToOwnSector, getEnvironmentData);

/**
 * @swagger
 * /environment/{id}:
 *   get:
 *     tags: [Environment]
 *     summary: Get sensor by ID
 *     description: Retrieve specific environmental sensor data (Ecology sector access required)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sensor ID
 *     responses:
 *       200:
 *         description: Sensor data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/EnvironmentData'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Sector access restricted
 *       404:
 *         description: Sensor not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', verifyToken, restrictToOwnSector, getSensorById);

module.exports = router;
