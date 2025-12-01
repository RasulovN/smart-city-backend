const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Appeals
 *   description: Citizen appeals and complaints management
 */

/**
 * @swagger
 * /sectors/appeals:
 *   get:
 *     tags: [Appeals]
 *     summary: Get all appeals
 *     description: Retrieve all citizen appeals with filtering and pagination (public access)
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, in_progress, waiting_response, closed, rejected]
 *         description: Filter by status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [complaint, suggestion, question, request, appreciation, other]
 *         description: Filter by type
 *       - in: query
 *         name: sector
 *         schema:
 *           type: string
 *           enum: [infrastructure, environment, ecology, transport, health, education, social, economic, other]
 *         description: Filter by sector
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         description: Filter by priority
 *     responses:
 *       200:
 *         description: Appeals retrieved successfully
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /sectors/appeals:
 *   post:
 *     tags: [Appeals]
 *     summary: Create new appeal
 *     description: Submit a new citizen appeal or complaint (public access)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Appeal'
 *     responses:
 *       201:
 *         description: Appeal created successfully
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Internal server error
 */

router.use("/appeals", require("./sectors/appeals.route"));
router.use("/tasks", require("./sectors/appeals.route"));

module.exports = router;
