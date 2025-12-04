const Notification = require('../models/notification');

// Create/send notification (Admin only)
exports.createNotification = async (req, res) => {
    try {
        const { title, message, user_ids } = req.body;

        if (!title || !message) {
            return res.status(400).json({
                success: false,
                message: 'Title and message are required'
            });
        }

        const notification = new Notification({
            title: title.trim(),
            message: message.trim(),
            user_ids: user_ids || null // null means send to all users
        });

        await notification.save();

        res.status(201).json({
            success: true,
            data: notification,
            message: 'Notification created and sent successfully'
        });
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create notification',
            error: error.message
        });
    }
};

// Get notifications for user (only status="new") - Do NOT change status
exports.getNotifications = async (req, res) => {
    try {
        const { user_id } = req.query;

        // Base query for new notifications
        let query = { status: 'new' };

        // Keep notifications "new" for 30 days from creation
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        query.created_at = { $gte: thirtyDaysAgo };

        if (user_id) {
            // If user_id provided, get notifications for all users + user-specific ones
            query.$or = [
                { user_ids: null }, // notifications for all users
                { user_ids: user_id } // user-specific notifications
            ];
        } else {
            // If no user_id, get notifications for all users only
            query.user_ids = null;
        }

        const notifications = await Notification.find(query)
            .sort({ created_at: -1 })
            .select('-__v');

        // DO NOT change status - keep notifications available for 30 days
        // Notifications will expire after 30 days due to TTL index

        res.json({
            success: true,
            data: notifications,
            count: notifications.length
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications',
            error: error.message
        });
    }
};

// Simple mobile app notifications - returns all new notifications (no user_id required)
exports.getMobileNotifications = async (req, res) => {
    try {
        // Simple query for all new notifications meant for everyone
        let query = { 
            status: 'new',
            user_ids: null // Only notifications meant for all users
        };

        // Keep notifications "new" for 30 days from creation
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        query.created_at = { $gte: thirtyDaysAgo };

        const notifications = await Notification.find(query)
            .sort({ created_at: -1 })
            .select('-__v');

        // DO NOT change status - keep notifications available

        res.json({
            success: true,
            data: notifications,
            count: notifications.length
        });
    } catch (error) {
        console.error('Error fetching mobile notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications',
            error: error.message
        });
    }
};

// Update notification status to success (manual endpoint)
exports.updateNotificationStatus = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Notification ID is required'
            });
        }

        const notification = await Notification.findByIdAndUpdate(
            id,
            { status: 'success', updated_at: new Date() },
            { new: true }
        ).select('-__v');

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.json({
            success: true,
            data: notification,
            message: 'Notification status updated successfully'
        });
    } catch (error) {
        console.error('Error updating notification status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update notification status',
            error: error.message
        });
    }
};

// Get all notifications (Admin only - for management)
exports.getAllNotifications = async (req, res) => {
    try {
        const { status, page = 1, limit = 50 } = req.query;
        
        let query = {};
        if (status) {
            query.status = status;
        }

        const skip = (page - 1) * limit;

        const notifications = await Notification.find(query)
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .select('-__v');

        const total = await Notification.countDocuments(query);

        res.json({
            success: true,
            data: notifications,
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(total / limit),
                total,
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching all notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications',
            error: error.message
        });
    }
};
