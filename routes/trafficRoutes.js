const express = require('express');
const router = express.Router();
const { getTrafficData, getTrafficById } = require('../controller/trafficController');
const { verifyToken, restrictToOwnSector } = require('../middleware/auth.middleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     TrafficData:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "64a1b2c3d4e5f6789abcdef"
 *         cameraId:
 *           type: string
 *           example: "TRF001"
 *         location:
 *           type: object
 *           properties:
 *             district:
 *               type: string
 *               example: "Chilanzar"
 *             address:
 *               type: string
 *               example: "Main Street 123"
 *             coordinates:
 *               type: object
 *               properties:
 *                 latitude:
 *                   type: number
 *                   example: 41.2995
 *                 longitude:
 *                   type: number
 *                   example: 69.2401
 *         trafficInfo:
 *           type: object
 *           properties:
 *             vehicleCount:
 *               type: integer
 *               example: 145
 *             averageSpeed:
 *               type: number
 *               example: 35.5
 *             congestionLevel:
 *               type: string
 *               enum: [low, medium, high, severe]
 *               example: medium
 *             violations:
 *               type: integer
 *               example: 3
 *         incident:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *               enum: [accident, breakdown, construction, weather, other]
 *               example: accident
 *             severity:
 *               type: string
 *               enum: [low, medium, high, critical]
 *               example: high
 *             description:
 *               type: string
 *               example: "Multi-vehicle collision on intersection"
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
 *   name: Traffic
 *   description: Traffic management data for security sector
 */

/**
 * @swagger
 * /traffic:
 *   get:
 *     tags: [Traffic]
 *     summary: Get traffic data
 *     description: Retrieve traffic monitoring data (Security sector access required)
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
 *         name: congestionLevel
 *         schema:
 *           type: string
 *           enum: [low, medium, high, severe]
 *         description: Filter by congestion level
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
 *         description: Traffic data retrieved successfully
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
 *                     $ref: '#/components/schemas/TrafficData'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationResponse/properties/pagination'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Sector access restricted
 *       500:
 *         description: Internal server error
 */

// Routes for traffic module (Security sector)
// Only accessible by: super_admin, admin, and sector_admin with security sector
router.get('/', verifyToken, restrictToOwnSector, getTrafficData);

/**
 * @swagger
 * /traffic/{id}:
 *   get:
 *     tags: [Traffic]
 *     summary: Get traffic data by ID
 *     description: Retrieve specific traffic monitoring data (Security sector access required)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Traffic monitoring ID
 *     responses:
 *       200:
 *         description: Traffic data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/TrafficData'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Sector access restricted
 *       404:
 *         description: Traffic data not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', verifyToken, restrictToOwnSector, getTrafficById);

module.exports = router;
