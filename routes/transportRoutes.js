const express = require('express');
const router = express.Router();
const { getTransportData, getBusById } = require('../controller/transportController');
const { verifyToken, restrictToOwnSector } = require('../middleware/auth.middleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     TransportData:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "64a1b2c3d4e5f6789abcdef"
 *         vehicleId:
 *           type: string
 *           example: "BUS001"
 *         route:
 *           type: object
 *           properties:
 *             number:
 *               type: string
 *               example: "101"
 *             name:
 *               type: string
 *               example: "Central Circle"
 *             startPoint:
 *               type: string
 *               example: "Chilanzar"
 *             endPoint:
 *               type: string
 *               example: "City Center"
 *         vehicleInfo:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *               enum: [bus, taxi, metro, tram]
 *               example: bus
 *             capacity:
 *               type: integer
 *               example: 45
 *             currentOccupancy:
 *               type: integer
 *               example: 32
 *             condition:
 *               type: string
 *               enum: [excellent, good, fair, poor]
 *               example: good
 *         location:
 *           type: object
 *           properties:
 *             coordinates:
 *               type: object
 *               properties:
 *                 latitude:
 *                   type: number
 *                   example: 41.2995
 *                 longitude:
 *                   type: number
 *                   example: 69.2401
 *             nextStop:
 *               type: string
 *               example: "Main Station"
 *             estimatedArrival:
 *               type: integer
 *               example: 5
 *         status:
 *           type: object
 *           properties:
 *             operational:
 *               type: boolean
 *               example: true
 *             onTime:
 *               type: boolean
 *               example: true
 *             delay:
 *               type: integer
 *               example: 0
 *             issues:
 *               type: array
 *               items:
 *                 type: string
 *                 example: ["minor_delay"]
 *         timestamp:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * tags:
 *   name: Transport
 *   description: Public transport data for security sector
 */

/**
 * @swagger
 * /transport:
 *   get:
 *     tags: [Transport]
 *     summary: Get transport data
 *     description: Retrieve public transport data (Security sector access required)
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
 *         name: route
 *         schema:
 *           type: string
 *         description: Filter by route number or name
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [bus, taxi, metro, tram]
 *         description: Filter by transport type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [operational, delayed, maintenance, out_of_service]
 *         description: Filter by operational status
 *       - in: query
 *         name: district
 *         schema:
 *           type: string
 *         description: Filter by district
 *     responses:
 *       200:
 *         description: Transport data retrieved successfully
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
 *                     $ref: '#/components/schemas/TransportData'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationResponse/properties/pagination'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Sector access restricted
 *       500:
 *         description: Internal server error
 */

// Routes for transport module (Security sector)
// Only accessible by: super_admin, admin, and sector_admin with security sector
router.get('/', verifyToken, restrictToOwnSector, getTransportData);

/**
 * @swagger
 * /transport/{id}:
 *   get:
 *     tags: [Transport]
 *     summary: Get bus by ID
 *     description: Retrieve specific transport vehicle data (Security sector access required)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transport vehicle ID
 *     responses:
 *       200:
 *         description: Transport data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/TransportData'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Sector access restricted
 *       404:
 *         description: Transport vehicle not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', verifyToken, restrictToOwnSector, getBusById);

module.exports = router;
