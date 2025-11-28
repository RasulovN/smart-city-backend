const emailService = require('./email.service');
const logger = {
    info: (message, data) => console.log(`[INFO] ${message}`, data || ''),
    error: (message, error) => console.error(`[ERROR] ${message}`, error || ''),
    warn: (message, data) => console.warn(`[WARN] ${message}`, data || '')
};
const Appeal = require('../../models/appeals');
const { sectorAdmins, appealsAdmin } = require('../../config/sectorAdmins');

class NotificationService {
    constructor() {
        this.followUpIntervals = {
            daily: 24 * 60 * 60 * 1000, // 24 hours
            weekly: 7 * 24 * 60 * 60 * 1000, // 7 days
            custom: null
        };
    }

    // Process new appeal notifications
    async processNewAppeal(appeal) {
        try {
            // Send confirmation to user
            if (appeal.email) {
                await emailService.sendAppealConfirmation(appeal);
            }

            // Send notification to sector-specific admin
            const sectorAdminEmail = sectorAdmins[appeal.sector];
            if (sectorAdminEmail) {
                await emailService.sendSectorAdminNotification(appeal, sectorAdminEmail, appeal.sector);
                logger.info(`Sector admin notification sent to: ${sectorAdminEmail} for appeal: ${appeal._id}`);
            }

            // Send notification to appeals admin (main admin)
            await emailService.sendAppealsAdminNotification(appeal, appealsAdmin);

            logger.info(`New appeal notifications sent for: ${appeal._id}`, {
                sector: appeal.sector,
                sectorAdmin: sectorAdminEmail,
                appealsAdmin: appealsAdmin
            });

        } catch (error) {
            logger.error('Error processing new appeal notifications:', error);
        }
    }

    // Process status update notifications
    async processStatusUpdate(appeal, oldStatus) {
        try {
            // Send status update notification to user
            await emailService.sendStatusUpdateNotification(appeal, oldStatus);

            // Check if follow-up is needed
            if (appeal.status === 'closed' && !appeal.rating) {
                // Could trigger rating request here
                logger.info(`Appeal ${appeal._id} closed, rating pending`);
            }

            logger.info(`Status update notifications sent for: ${appeal._id}`);

        } catch (error) {
            logger.error('Error processing status update notifications:', error);
        }
    }

    // Check for follow-up reminders
    async checkFollowUpReminders() {
        try {
            const now = new Date();
            const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);

            // Find appeals that need follow-up
            const appealsNeedingFollowUp = await Appeal.find({
                followUpRequired: true,
                followUpDate: { $lte: now },
                status: { $in: ['open', 'in_progress', 'waiting_response'] },
                $or: [
                    { followUpDate: { $lt: twentyFourHoursAgo } },
                    { followUpDate: { $exists: false } }
                ]
            });

            for (const appeal of appealsNeedingFollowUp) {
                await emailService.sendFollowUpReminder(appeal);
                
                // Update follow-up date to prevent spam
                appeal.followUpDate = new Date(now + 24 * 60 * 60 * 1000); // Next day
                await appeal.save();
            }

            logger.info(`Processed ${appealsNeedingFollowUp.length} follow-up reminders`);

        } catch (error) {
            logger.error('Error checking follow-up reminders:', error);
        }
    }

    // Send daily summary to admin
    async sendDailySummary() {
        try {
            const today = new Date();
            const startOfDay = new Date(today.setHours(0, 0, 0, 0));
            const endOfDay = new Date(today.setHours(23, 59, 59, 999));

            const todayAppeals = await Appeal.find({
                createdAt: { $gte: startOfDay, $lte: endOfDay }
            }).lean();

            const dateString = startOfDay.toLocaleDateString('uz-UZ');
            await emailService.sendDailySummary(todayAppeals, dateString);

            logger.info(`Daily summary sent with ${todayAppeals.length} appeals`);

        } catch (error) {
            logger.error('Error sending daily summary:', error);
        }
    }

    // Send bulk notifications for urgent appeals
    async processUrgentAppeals() {
        try {
            const urgentAppeals = await Appeal.find({
                priority: 'urgent',
                status: { $nin: ['closed', 'rejected'] },
                createdAt: { 
                    $gte: new Date(Date.now() - 2 * 60 * 60 * 1000) // Within last 2 hours
                }
            });

            for (const appeal of urgentAppeals) {
                // Could send SMS or push notifications here
                logger.info(`Urgent appeal reminder: ${appeal._id} - ${appeal.title}`);
            }

        } catch (error) {
            logger.error('Error processing urgent appeals:', error);
        }
    }

    // Notify about appeals approaching SLA
    async checkSLAAlerts() {
        try {
            // Example SLA: 7 days for medium priority, 3 days for high priority, 1 day for urgent
            const slaLimits = {
                'low': 14 * 24 * 60 * 60 * 1000, // 14 days
                'medium': 7 * 24 * 60 * 60 * 1000, // 7 days
                'high': 3 * 24 * 60 * 60 * 1000, // 3 days
                'urgent': 24 * 60 * 60 * 1000 // 1 day
            };

            const now = new Date();

            for (const [priority, limit] of Object.entries(slaLimits)) {
                const appealsExpiringSoon = await Appeal.find({
                    priority,
                    status: { $nin: ['closed', 'rejected'] },
                    createdAt: { 
                        $lte: new Date(now - (limit - 24 * 60 * 60 * 1000)), // 24 hours before SLA
                        $gte: new Date(now - limit - 60 * 60 * 1000) // Exclude very old appeals
                    }
                });

                for (const appeal of appealsExpiringSoon) {
                    logger.warn(`SLA Alert: Appeal ${appeal._id} (${priority} priority) is approaching SLA`);
                    
                    // Could send immediate notification to admin here
                    // await emailService.sendSLAAlert(appeal, limit);
                }
            }

        } catch (error) {
            logger.error('Error checking SLA alerts:', error);
        }
    }

    // Generate notification summary
    async generateNotificationSummary(days = 7) {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const [
                totalNotifications,
                emailNotifications,
                smsNotifications,
                pushNotifications,
                notificationStats
            ] = await Promise.all([
                this.getTotalNotifications(startDate),
                this.getEmailNotifications(startDate),
                this.getSMSNotifications(startDate),
                this.getPushNotifications(startDate),
                this.getNotificationStatistics(startDate)
            ]);

            return {
                period: `${days} days`,
                total: totalNotifications,
                breakdown: {
                    email: emailNotifications,
                    sms: smsNotifications,
                    push: pushNotifications
                },
                statistics: notificationStats
            };

        } catch (error) {
            logger.error('Error generating notification summary:', error);
            return null;
        }
    }

    // Helper methods for statistics (placeholder implementations)
    async getTotalNotifications(startDate) {
        // This would integrate with your notification logging system
        return Math.floor(Math.random() * 100) + 50; // Mock data
    }

    async getEmailNotifications(startDate) {
        return Math.floor(Math.random() * 80) + 40; // Mock data
    }

    async getSMSNotifications(startDate) {
        return Math.floor(Math.random() * 20) + 10; // Mock data
    }

    async getPushNotifications(startDate) {
        return Math.floor(Math.random() * 15) + 5; // Mock data
    }

    async getNotificationStatistics(startDate) {
        return {
            successful: Math.floor(Math.random() * 90) + 80,
            failed: Math.floor(Math.random() * 10) + 5,
            pending: Math.floor(Math.random() * 5) + 1
        };
    }

    // Setup scheduled tasks
    setupScheduledTasks() {
        // Check follow-up reminders every hour
        setInterval(() => {
            this.checkFollowUpReminders();
        }, 60 * 60 * 1000); // Every hour

        // Send daily summary every day at 8 AM
        setInterval(() => {
            const now = new Date();
            if (now.getHours() === 8) {
                this.sendDailySummary();
            }
        }, 60 * 60 * 1000); // Check every hour

        // Check urgent appeals every 30 minutes
        setInterval(() => {
            this.processUrgentAppeals();
        }, 30 * 60 * 1000); // Every 30 minutes

        // Check SLA alerts every 4 hours
        setInterval(() => {
            this.checkSLAAlerts();
        }, 4 * 60 * 60 * 1000); // Every 4 hours

        logger.info('Scheduled notification tasks initialized');
    }

    // Health check for notification service
    async healthCheck() {
        try {
            const emailTest = await emailService.testConnection();
            
            return {
                service: 'Notification Service',
                status: 'healthy',
                email: emailTest ? 'connected' : 'disconnected',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Notification service health check failed:', error);
            return {
                service: 'Notification Service',
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    // Cleanup old notification logs (implement based on your logging strategy)
    async cleanupOldNotifications(retentionDays = 90) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

            // This would depend on your notification logging implementation
            logger.info(`Cleaning up notifications older than ${retentionDays} days`);

            // Implement cleanup logic based on your notification storage
            // await NotificationLog.deleteMany({ createdAt: { $lt: cutoffDate } });

        } catch (error) {
            logger.error('Error cleaning up old notifications:', error);
        }
    }
}

module.exports = new NotificationService();