const Notification = require('../models/notification');

class NotificationService {
    constructor() {
        // Internal notification system only - no external integrations
        console.log('🔔 Internal Notification Service initialized');
    }

    /**
     * Create and save notification
     * @param {Object} notificationData - { title, message, user_ids }
     * @returns {Promise<Object>} Created notification
     */
    async createNotification(notificationData) {
        try {
            const { title, message, user_ids } = notificationData;

            if (!title || !message) {
                throw new Error('Title and message are required');
            }

            const notification = new Notification({
                title: title.trim(),
                message: message.trim(),
                user_ids: user_ids || null // null = send to all users
            });

            await notification.save();
            return notification;
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    }

    /**
     * Get notifications for specific user (only status="new")
     * @param {string} userId - User ID
     * @returns {Promise<Array>} Array of new notifications
     */
    async getNotificationsForUser(userId) {
        try {
            const query = { 
                status: 'new',
                $or: [
                    { user_ids: null }, // notifications for all users
                    { user_ids: userId }
                ]
            };

            const notifications = await Notification.find(query)
                .sort({ created_at: -1 })
                .select('-__v');

            // Update status to 'success' after retrieving
            if (notifications.length > 0) {
                const notificationIds = notifications.map(n => n._id);
                await Notification.updateMany(
                    { _id: { $in: notificationIds } },
                    { status: 'success', updated_at: new Date() }
                );
            }

            return notifications;
        } catch (error) {
            console.error('Error fetching notifications for user:', error);
            throw error;
        }
    }

    /**
     * Mark notification as read/success
     * @param {string} notificationId - Notification ID
     * @returns {Promise<Object>} Updated notification
     */
    async markAsRead(notificationId) {
        try {
            const notification = await Notification.findByIdAndUpdate(
                notificationId,
                { status: 'success', updated_at: new Date() },
                { new: true }
            ).select('-__v');

            if (!notification) {
                throw new Error('Notification not found');
            }

            return notification;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    }

    /**
     * Get all notifications with filters (Admin only)
     * @param {Object} filters - Query filters
     * @returns {Promise<Object>} Paginated notifications
     */
    async getAllNotifications(filters = {}) {
        try {
            const { status, page = 1, limit = 50 } = filters;
            
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

            return {
                notifications,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / limit),
                    total,
                    limit: parseInt(limit)
                }
            };
        } catch (error) {
            console.error('Error fetching all notifications:', error);
            throw error;
        }
    }

    /**
     * Get notification statistics
     * @returns {Promise<Object>} Statistics object
     */
    async getStatistics() {
        try {
            const stats = await Notification.aggregate([
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        new: { 
                            $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] }
                        },
                        success: { 
                            $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
                        },
                        today: {
                            $sum: {
                                $cond: [
                                    { $gte: ['$created_at', new Date(new Date().setHours(0, 0, 0, 0))] },
                                    1,
                                    0
                                ]
                            }
                        },
                        thisWeek: {
                            $sum: {
                                $cond: [
                                    { $gte: ['$created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)] },
                                    1,
                                    0
                                ]
                            }
                        }
                    }
                }
            ]);

            return stats[0] || {
                total: 0,
                new: 0,
                success: 0,
                today: 0,
                thisWeek: 0
            };
        } catch (error) {
            console.error('Error getting notification statistics:', error);
            throw error;
        }
    }

    /**
     * Delete expired notifications manually (backup to TTL)
     * @returns {Promise<Object>} Deletion result
     */
    async deleteExpired() {
        try {
            const cutoffDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000); // 60 days ago

            const result = await Notification.deleteMany({
                created_at: { $lt: cutoffDate }
            });

            return {
                deletedCount: result.deletedCount,
                cutoffDate
            };
        } catch (error) {
            console.error('Error deleting expired notifications:', error);
            throw error;
        }
    }

    /**
     * Send bulk notifications
     * @param {Array} notifications - Array of notification data
     * @returns {Promise<Array>} Created notifications
     */
    async createBulkNotifications(notifications) {
        try {
            if (!Array.isArray(notifications) || notifications.length === 0) {
                throw new Error('Notifications array is required');
            }

            const createdNotifications = [];
            
            for (const notificationData of notifications) {
                const notification = await this.createNotification(notificationData);
                createdNotifications.push(notification);
            }

            return createdNotifications;
        } catch (error) {
            console.error('Error creating bulk notifications:', error);
            throw error;
        }
    }

    /**
     * Get notifications by date range
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @returns {Promise<Array>} Notifications in range
     */
    async getNotificationsByDateRange(startDate, endDate) {
        try {
            const query = {
                created_at: {
                    $gte: startDate,
                    $lte: endDate
                }
            };

            return await Notification.find(query)
                .sort({ created_at: -1 })
                .select('-__v');
        } catch (error) {
            console.error('Error fetching notifications by date range:', error);
            throw error;
        }
    }
}

module.exports = new NotificationService();
