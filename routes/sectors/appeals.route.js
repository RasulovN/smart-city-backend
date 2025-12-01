const express = require('express');
const { body, param, query } = require('express-validator');
const appealsController = require('../../controller/sectors/appeals.controller');
const { verifyToken, checkRole } = require('../../middleware/auth.middleware');
const logger = require('../../middleware/logger');
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     AppealCreate:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - title
 *         - message
 *         - type
 *         - sector
 *       properties:
 *         firstName:
 *           type: string
 *           minLength: 2
 *           maxLength: 50
 *           example: John
 *         lastName:
 *           type: string
 *           minLength: 2
 *           maxLength: 50
 *           example: Doe
 *         email:
 *           type: string
 *           format: email
 *           example: john.doe@example.com
 *         phone:
 *           type: string
 *           pattern: '^[\+]?[0-9\s\-\(\)]{10,}$'
 *           example: +998901234567
 *         title:
 *           type: string
 *           minLength: 5
 *           maxLength: 200
 *           example: Street lighting issue
 *         message:
 *           type: string
 *           minLength: 10
 *           maxLength: 2000
 *           example: The street lights on Main Street are not working properly, causing safety concerns for pedestrians at night.
 *         type:
 *           type: string
 *           enum: [complaint, suggestion, question, request, appreciation, other]
 *           example: complaint
 *         sector:
 *           type: string
 *           enum: [infrastructure, environment, ecology, transport, health, education, social, economic, other]
 *           example: infrastructure
 *         priority:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *           default: medium
 *           example: medium
 *         location:
 *           type: object
 *           properties:
 *             district:
 *               type: string
 *               maxLength: 100
 *               example: Chilanzar
 *             address:
 *               type: string
 *               maxLength: 500
 *               example: Main Street 123
 *     AppealStatusUpdate:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [open, in_progress, waiting_response, closed, rejected]
 *           example: in_progress
 *         adminResponse:
 *           type: string
 *           maxLength: 1000
 *           example: Thank you for your appeal. We are investigating this issue and will respond within 24 hours.
 *         followUpRequired:
 *           type: boolean
 *           example: true
 *         followUpDate:
 *           type: string
 *           format: date
 *           example: 2023-12-15
 *     AppealRating:
 *       type: object
 *       required:
 *         - score
 *       properties:
 *         score:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           example: 4
 *         feedback:
 *           type: string
 *           maxLength: 500
 *           example: The issue was resolved quickly and efficiently.
 *     BulkStatusUpdate:
 *       type: object
 *       required:
 *         - appealIds
 *         - status
 *       properties:
 *         appealIds:
 *           type: array
 *           items:
 *             type: string
 *           example: ["64a1b2c3d4e5f6789abcdef", "64a1b2c3d4e5f6789abcdefg"]
 *         status:
 *           type: string
 *           enum: [open, in_progress, waiting_response, closed, rejected]
 *           example: in_progress
 *         adminResponse:
 *           type: string
 *           maxLength: 1000
 *           example: Bulk update applied to selected appeals.
 */

// Validation middleware
const validateAppeal = [
    body('firstName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Ism 2-50 ta belgidan iborat bo\'lishi kerak'),
    body('lastName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Familiya 2-50 ta belgidan iborat bo\'lishi kerak'),
    body('email')
        .optional()
        .isEmail()
        .withMessage('To\'g\'ri email manzili kiriting')
        .normalizeEmail(),
    body('phone')
        .optional()
        .matches(/^[\+]?[0-9\s\-\(\)]{10,}$/)
        .withMessage('To\'g\'ri telefon raqami kiriting'),
    body('title')
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('Sarlavha 5-200 ta belgidan iborat bo\'lishi kerak'),
    body('message')
        .trim()
        .isLength({ min: 10, max: 2000 })
        .withMessage('Xabar 10-2000 ta belgidan iborat bo\'lishi kerak'),
    body('type')
        .isIn(['complaint', 'suggestion', 'question', 'request', 'appreciation', 'other'])
        .withMessage('Noto\'g\'ri murojaat turi'),
    body('sector')
        .isIn(['infrastructure', 'environment', 'ecology', 'transport', 'health', 'education', 'social', 'economic', 'other'])
        .withMessage('Noto\'g\'ri sektor'),
    body('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'urgent'])
        .withMessage('Noto\'g\'ri ustuvorlik darajasi'),
    body('location.district')
        .optional()
        .trim()
        .isLength({ max: 100 }),
    body('location.address')
        .optional()
        .trim()
        .isLength({ max: 500 })
];

const validateStatusUpdate = [
    body('status')
        .isIn(['open', 'in_progress', 'waiting_response', 'closed', 'rejected'])
        .withMessage('Noto\'g\'ri holat'),
    body('adminResponse')
        .optional()
        .trim()
        .isLength({ min: 1, max: 1000 })
        .withMessage('Admin javobi 1-1000 ta belgidan iborat bo\'lishi kerak'),
    body('followUpRequired')
        .optional()
        .isBoolean(),
    body('followUpDate')
        .optional()
        .isISO8601()
        .withMessage('To\'g\'ri sana formati kiriting (YYYY-MM-DD)')
];

const validateRating = [
    body('score')
        .isInt({ min: 1, max: 5 })
        .withMessage('Baholar 1 dan 5 gacha bo\'lishi kerak'),
    body('feedback')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Fikr-mulohaza 500 ta belgidan oshmasligi kerak')
];

const validateId = [
    param('id').isMongoId().withMessage('Noto\'g\'ri ID format')
];

const validateQuery = [
    query('page').optional().isInt({ min: 1 }).withMessage('Sahifa raqami 1 dan katta bo\'lishi kerak'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit 1-100 oralig\'ida bo\'lishi kerak'),
    query('status').optional().isIn(['open', 'in_progress', 'waiting_response', 'closed', 'rejected']),
    query('type').optional().isIn(['complaint', 'suggestion', 'question', 'request', 'appreciation', 'other']),
    query('sector').optional().isIn(['infrastructure', 'environment', 'ecology', 'transport', 'health', 'education', 'social', 'economic', 'other']),
    query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'title', 'status', 'priority']),
    query('sortOrder').optional().isIn(['asc', 'desc'])
];

/**
 * @swagger
 * tags:
 *   name: Appeals
 *   description: Citizen appeals and complaints management
 */

// Public routes (no authentication required)

/**
 * @swagger
 * /sectors/appeals:
 *   post:
 *     tags: [Appeals]
 *     summary: Create new appeal
 *     description: Submit a new citizen appeal or complaint
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AppealCreate'
 *     responses:
 *       201:
 *         description: Appeal created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Appeal created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Appeal'
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Internal server error
 */
// Create new appeal
router.post('/',
    logger,
    validateAppeal,
    appealsController.createApeals
);

/**
 * @swagger
 * /sectors/appeals:
 *   get:
 *     tags: [Appeals]
 *     summary: Get all appeals
 *     description: Retrieve all appeals with filters and pagination (public read access)
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
 *         description: Filter by appeal type
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
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, title, status, priority]
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Appeals retrieved successfully
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
 *                     $ref: '#/components/schemas/Appeal'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationResponse/properties/pagination'
 *       500:
 *         description: Internal server error
 */
// Get all appeals with filters and pagination (public read access)
router.get('/',
    logger,
    validateQuery,
    appealsController.getApeals
);

/**
 * @swagger
 * /sectors/appeals/my:
 *   get:
 *     tags: [Appeals]
 *     summary: Get user's own appeals
 *     description: Retrieve appeals submitted by the current user
 *     parameters:
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *           format: email
 *         description: User email to filter appeals (optional, uses requester email if not provided)
 *     responses:
 *       200:
 *         description: User appeals retrieved successfully
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
 *                     $ref: '#/components/schemas/Appeal'
 *       500:
 *         description: Internal server error
 */
// Get user's own appeals
router.get('/my',
    logger,
    query('email').optional().isEmail(),
    appealsController.getMyAppeals
);

/**
 * @swagger
 * /sectors/appeals/{id}:
 *   get:
 *     tags: [Appeals]
 *     summary: Get appeal by ID
 *     description: Retrieve a specific appeal by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Appeal ID
 *     responses:
 *       200:
 *         description: Appeal retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Appeal'
 *       404:
 *         description: Appeal not found
 *       500:
 *         description: Internal server error
 */
// Get single appeal by ID
router.get('/:id',
    logger,
    validateId,
    appealsController.getApealById
);

/**
 * @swagger
 * /sectors/appeals/{id}/rate:
 *   post:
 *     tags: [Appeals]
 *     summary: Rate an appeal
 *     description: Submit a rating for a closed appeal
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Appeal ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AppealRating'
 *     responses:
 *       200:
 *         description: Appeal rated successfully
 *       400:
 *         description: Invalid input data or appeal not eligible for rating
 *       404:
 *         description: Appeal not found
 *       500:
 *         description: Internal server error
 */
// Rate an appeal (public, only for closed appeals)
router.post('/:id/rate',
    logger,
    validateId,
    validateRating,
    appealsController.rateAppeal
);

// Admin routes (authentication required)

/**
 * @swagger
 * /sectors/appeals/{id}/status:
 *   put:
 *     tags: [Appeals]
 *     summary: Update appeal status
 *     description: Update the status of an appeal (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Appeal ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AppealStatusUpdate'
 *     responses:
 *       200:
 *         description: Appeal status updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Appeal not found
 *       500:
 *         description: Internal server error
 */
// Update appeal status
router.put('/:id/status',
    logger,
    verifyToken,
    checkRole('admin', 'super_admin'),
    validateId,
    validateStatusUpdate,
    appealsController.updateApealStatus
);

/**
 * @swagger
 * /sectors/appeals/{id}:
 *   delete:
 *     tags: [Appeals]
 *     summary: Delete appeal
 *     description: Delete an appeal permanently (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Appeal ID
 *     responses:
 *       200:
 *         description: Appeal deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Appeal not found
 *       500:
 *         description: Internal server error
 */
// Delete appeal
router.delete('/:id',
    logger,
    verifyToken,
    checkRole('admin', 'super_admin'),
    validateId,
    appealsController.deleteApeals
);

/**
 * @swagger
 * /sectors/appeals/admin/statistics:
 *   get:
 *     tags: [Appeals]
 *     summary: Get appeals statistics
 *     description: Retrieve comprehensive statistics about appeals (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *         description: Period in days for statistics calculation
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
// Get statistics (admin only)
router.get('/admin/statistics',
    logger,
    verifyToken,
    checkRole('admin', 'super_admin'),
    query('period').optional().isInt({ min: 1, max: 365 }),
    appealsController.getStatistics
);

/**
 * @swagger
 * /sectors/appeals/admin/export:
 *   get:
 *     tags: [Appeals]
 *     summary: Export appeals data
 *     description: Export appeals data to CSV format (Admin only)
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
 *           maximum: 1000
 *           default: 100
 *         description: Number of items to export
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, in_progress, waiting_response, closed, rejected]
 *         description: Filter by status
 *       - in: query
 *         name: sector
 *         schema:
 *           type: string
 *           enum: [infrastructure, environment, ecology, transport, health, education, social, economic, other]
 *         description: Filter by sector
 *     responses:
 *       200:
 *         description: Appeals exported successfully
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
// Export appeals (admin only)
router.get('/admin/export',
    logger,
    verifyToken,
    checkRole('admin', 'super_admin'),
    validateQuery,
    appealsController.exportAppeals
);

// Analytics routes (admin only)

/**
 * @swagger
 * /sectors/appeals/admin/dashboard:
 *   get:
 *     tags: [Appeals]
 *     summary: Get dashboard analytics
 *     description: Retrieve dashboard analytics data (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *         description: Period in days for analytics
 *     responses:
 *       200:
 *         description: Dashboard analytics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
router.get('/admin/dashboard',
    logger,
    verifyToken,
    checkRole('admin', 'super_admin'),
    query('period').optional().isInt({ min: 1, max: 365 }),
    appealsController.getDashboardAnalytics
);

/**
 * @swagger
 * /sectors/appeals/admin/location:
 *   get:
 *     tags: [Appeals]
 *     summary: Get location analytics
 *     description: Retrieve appeals analytics by location (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *         description: Period in days for analysis
 *     responses:
 *       200:
 *         description: Location analytics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
router.get('/admin/location',
    logger,
    verifyToken,
    checkRole('admin', 'super_admin'),
    query('days').optional().isInt({ min: 1, max: 365 }),
    appealsController.getLocationAnalytics
);

/**
 * @swagger
 * /sectors/appeals/admin/performance:
 *   get:
 *     tags: [Appeals]
 *     summary: Get performance metrics
 *     description: Retrieve performance metrics for appeal resolution (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *         description: Period in days for metrics
 *     responses:
 *       200:
 *         description: Performance metrics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
router.get('/admin/performance',
    logger,
    verifyToken,
    checkRole('admin', 'super_admin'),
    query('days').optional().isInt({ min: 1, max: 365 }),
    appealsController.getPerformanceMetrics
);

/**
 * @swagger
 * /sectors/appeals/admin/engagement:
 *   get:
 *     tags: [Appeals]
 *     summary: Get user engagement metrics
 *     description: Retrieve user engagement analytics (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *         description: Period in days for engagement analysis
 *     responses:
 *       200:
 *         description: User engagement metrics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
router.get('/admin/engagement',
    logger,
    verifyToken,
    checkRole('admin', 'super_admin'),
    query('days').optional().isInt({ min: 1, max: 365 }),
    appealsController.getUserEngagement
);

/**
 * @swagger
 * /sectors/appeals/admin/report:
 *   get:
 *     tags: [Appeals]
 *     summary: Generate comprehensive report
 *     description: Generate comprehensive appeal report (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly]
 *         description: Report type
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Report start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Report end date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Report generated successfully
 *       400:
 *         description: Invalid report parameters
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
router.get('/admin/report',
    logger,
    verifyToken,
    checkRole('admin', 'super_admin'),
    query('type').isIn(['daily', 'weekly', 'monthly', 'yearly']).withMessage('Noto\'g\'ri hisobot turi'),
    query('startDate').isISO8601().withMessage('Boshlang\'ich sana noto\'g\'ri'),
    query('endDate').isISO8601().withMessage('Oxirgi sana noto\'g\'ri'),
    appealsController.generateReport
);

/**
 * @swagger
 * /sectors/appeals/admin/follow-up:
 *   get:
 *     tags: [Appeals]
 *     summary: Get follow-up appeals
 *     description: Retrieve appeals requiring follow-up (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         description: Filter by priority
 *       - in: query
 *         name: daysOverdue
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Filter by days overdue
 *     responses:
 *       200:
 *         description: Follow-up appeals retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
router.get('/admin/follow-up',
    logger,
    verifyToken,
    checkRole('admin', 'super_admin'),
    query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    query('daysOverdue').optional().isInt({ min: 1 }),
    appealsController.getFollowUpAppeals
);

/**
 * @swagger
 * /sectors/appeals/admin/notification-health:
 *   get:
 *     tags: [Appeals]
 *     summary: Get notification health status
 *     description: Retrieve notification system health metrics (Admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification health status retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
router.get('/admin/notification-health',
    logger,
    verifyToken,
    checkRole('admin', 'super_admin'),
    appealsController.getNotificationHealth
);

// Bulk operations (admin only)

/**
 * @swagger
 * /sectors/appeals/admin/bulk-status:
 *   patch:
 *     tags: [Appeals]
 *     summary: Bulk update appeals status
 *     description: Update status for multiple appeals at once (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BulkStatusUpdate'
 *     responses:
 *       200:
 *         description: Appeals status updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
router.patch('/admin/bulk-status',
    logger,
    verifyToken,
    checkRole('admin', 'super_admin'),
    [
        body('appealIds').isArray({ min: 1 }).withMessage('Murojaat IDlar ro\'yxati kerak'),
        body('appealIds.*').isMongoId().withMessage('Noto\'g\'ri ID format'),
        body('status').isIn(['open', 'in_progress', 'waiting_response', 'closed', 'rejected']).withMessage('Noto\'g\'ri holat'),
        body('adminResponse').optional().trim().isLength({ min: 1, max: 1000 }).withMessage('Admin javobi 1-1000 ta belgidan iborat bo\'lishi kerak')
    ],
    appealsController.bulkUpdateStatus
);

/**
 * @swagger
 * /sectors/appeals/health:
 *   get:
 *     tags: [Appeals]
 *     summary: Health check
 *     description: Check if the appeals service is running
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Appeals service is running
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Server uptime in seconds
 */
// Health check route
router.get('/health',
    logger,
    (req, res) => {
        res.json({
            success: true,
            message: 'Appeals service is running',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    }
);

// Error handling middleware
router.use((error, req, res, next) => {
    console.error('Route error:', error);
    res.status(500).json({
        success: false,
        message: 'Server xatosi yuz berdi'
    });
});

module.exports = router;
