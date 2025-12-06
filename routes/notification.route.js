const express = require('express');
const router = express.Router();
const notificationController = require('../controller/notificationController');
// const authMiddleware = require('../middleware/auth.middleware'); // Uncomment when auth is ready

// Apply auth middleware to admin routes (uncomment when auth is ready)
// router.use('/admin', authMiddleware, (req, res, next) => {
//     if (req.user.role !== 'admin') {
//         return res.status(403).json({ success: false, message: 'Admin access required' });
//     }
//     next();
// });

// Required API endpoints
// POST /notifications - Create/send notification (Admin)
router.post('/', /*authMiddleware,*/ notificationController.createNotification);

// GET /notifications - Get notifications for user (only status="new")
router.get('/', /*authMiddleware,*/ notificationController.getNotifications);

// read notifications
// GET /notifications/read - Get read notifications for user (status="read")
// router.get('/read', /*authMiddleware,*/ notificationController.getReadNotifications);

// GET /notifications/mobile - Simple notifications for mobile apps (no user_id required)
router.get('/mobile', /*authMiddleware,*/ notificationController.getMobileNotifications);

// PATCH /notifications/:id - Update notification status to success (manual)
router.patch('/:id', /*authMiddleware,*/ notificationController.updateNotificationStatus);

// Additional admin endpoints for management
// GET /notifications/admin/all - Get all notifications (Admin)
router.get('/admin/all', /*authMiddleware,*/ notificationController.getAllNotifications);

module.exports = router;
