const express = require('express');
const { body, param, query } = require('express-validator');
const appealsController = require('../../controller/sectors/appeals.controller');
const { verifyToken, checkRole } = require('../../middleware/auth.middleware');
const logger = require('../../middleware/logger');
const router = express.Router();
 
// Validation middleware
const validateAppeal = [
    body('fullName')
        .trim()
        .isLength({ min: 2, max: 80 })
        .withMessage('To\'liq ism 2-80 ta belgidan iborat bo\'lishi kerak'),
    body('email')
        .optional()
        .isEmail()
        .withMessage('To\'g\'ri email manzili kiriting')
        .normalizeEmail(),
    body('phone')
        .optional()
        .matches(/^[\+]?[0-9\s\-\(\)]{10,}$/)
        .withMessage('To\'g\'ri telefon raqami kiriting'),
    // body('title')
    //     .trim()
    //     .isLength({ min: 5, max: 200 })
    //     .withMessage('Sarlavha 5-200 ta belgidan iborat bo\'lishi kerak'),
    body('message')
        .trim()
        .isLength({ min: 4, max: 2000 })
        .withMessage('Xabar 10-2000 ta belgidan iborat bo\'lishi kerak'),
    body('type')
        .isIn(['complaint', 'suggestion', 'question', 'request', 'appreciation', 'other'])
        .withMessage('Noto\'g\'ri murojaat turi'),
    body('sector')
        .isIn(['infrastructure', 'environment', 'ecology', 'transport', 'health', 'education', 'social', 'economic', 'other'])
        .withMessage('Noto\'g\'ri sektor'),
    // body('priority')
    //     .optional()
    //     .isIn(['low', 'medium', 'high', 'urgent'])
    //     .withMessage('Noto\'g\'ri ustuvorlik darajasi'),
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

const validateSectorParam = [
    param('sector').isIn(['infrastructure', 'environment', 'ecology', 'transport', 'health', 'education', 'social', 'economic', 'other', "appeals", "utilities"])
        .withMessage('Noto\'g\'ri sektor. Ruxsat berilgan sektorlar: infrastructure, environment, ecology, transport, health, education, social, economic, other')
];

// Public routes (no authentication required)

// Create Admin new appeal
router.post('/admin',
    logger,
    validateAppeal,
    appealsController.createAppealsAdmin
);

// Create new appeal
router.post('/',
    logger,
    validateAppeal,
    appealsController.createAppeals
);



// Get all appeals with filters and pagination (public read access)
router.get('/',
    logger,
    validateQuery,
    appealsController.getAppeals
);

router.get('/channel',
    logger,
    validateQuery,
    appealsController.getAppealsChannel
);


// Get available sectors with appeal counts
router.get('/sectors',
    logger,
    verifyToken, 
    checkRole('admin', 'super_admin', 'sector_admin'),
    appealsController.getAvailableSectors
);


// Get only sector admin appeals (Admin and sector admins only)
router.get('/sector-appeals/:sector',
    logger,
    verifyToken, 
    checkRole('admin', 'super_admin', 'sector_admin'),
    validateSectorParam,
    validateQuery,
    appealsController.getSectorAdminAppeals
);





 
// Get user's own appeals
router.get('/my',
    logger,
    query('email').optional().isEmail(),
    appealsController.getMyAppeals
);
 
// Get single appeal by ID
router.get('/:id',
    logger,
    validateId,
    appealsController.getApealById
);

 
// Rate an appeal (public, only for closed appeals)
router.post('/:id/rate',
    logger,
    validateId,
    validateRating,
    appealsController.rateAppeal
);

// Admin routes (authentication required)

 
// Update appeal status
router.put('/:id/status',
    logger,
    verifyToken,
    checkRole('admin', 'super_admin'),
    validateId,
    validateStatusUpdate,
    appealsController.updateApealStatus
);

 // Delete appeal
router.delete('/:id',
    logger,
    verifyToken,
    checkRole('admin', 'super_admin'),
    validateId,
    appealsController.deleteApeals
);

 // Get statistics (admin only)
router.get('/admin/statistics',
    logger,
    verifyToken,
    checkRole('admin', 'super_admin'),
    query('period').optional().isInt({ min: 1, max: 365 }),
    appealsController.getStatistics
);

// Export appeals (admin only)
router.get('/admin/export',
    logger,
    verifyToken,
    checkRole('admin', 'super_admin'),
    validateQuery,
    appealsController.exportAppeals
);

// Analytics routes (admin only)

 
router.get('/admin/dashboard',
    logger,
    verifyToken,
    checkRole('admin', 'super_admin'),
    query('period').optional().isInt({ min: 1, max: 365 }),
    appealsController.getDashboardAnalytics
);


router.get('/admin/location',
    logger,
    verifyToken,
    checkRole('admin', 'super_admin'),
    query('days').optional().isInt({ min: 1, max: 365 }),
    appealsController.getLocationAnalytics
);

 
router.get('/admin/performance',
    logger,
    verifyToken,
    checkRole('admin', 'super_admin'),
    query('days').optional().isInt({ min: 1, max: 365 }),
    appealsController.getPerformanceMetrics
);
 
router.get('/admin/engagement',
    logger,
    verifyToken,
    checkRole('admin', 'super_admin'),
    query('days').optional().isInt({ min: 1, max: 365 }),
    appealsController.getUserEngagement
);
 
 
router.get('/admin/report',
    logger,
    verifyToken,
    checkRole('admin', 'super_admin'),
    query('type').isIn(['daily', 'weekly', 'monthly', 'yearly']).withMessage('Noto\'g\'ri hisobot turi'),
    query('startDate').isISO8601().withMessage('Boshlang\'ich sana noto\'g\'ri'),
    query('endDate').isISO8601().withMessage('Oxirgi sana noto\'g\'ri'),
    appealsController.generateReport
);

 
router.get('/admin/follow-up',
    logger,
    verifyToken,
    checkRole('admin', 'super_admin'),
    query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    query('daysOverdue').optional().isInt({ min: 1 }),
    appealsController.getFollowUpAppeals
);

 router.get('/admin/notification-health',
    logger,
    verifyToken,
    checkRole('admin', 'super_admin'),
    appealsController.getNotificationHealth
);

// Bulk operations (admin only)
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
