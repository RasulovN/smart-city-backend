const cron = require('node-cron');
const Notification = require('../models/notification');

const startCleanupJob = () => {
    // Run cleanup job daily at 2:00 AM
    cron.schedule('0 2 * * *', async () => {
        try {
            console.log('🧹 Running notification cleanup job...');

            const result = await Notification.deleteMany({
                created_at: { 
                    $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
                }
            });

            console.log(`✅ Cleanup completed. Deleted ${result.deletedCount} expired notifications.`);
        } catch (error) {
            console.error('❌ Error during notification cleanup:', error);
        }
    });

    // Also log MongoDB TTL index status every hour
    cron.schedule('0 * * * *', async () => {
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
                        oldest: { $min: '$created_at' },
                        newest: { $max: '$created_at' }
                    }
                }
            ]);
            
            if (stats[0]) {
                console.log(`📊 Notification stats - Total: ${stats[0].total}, New: ${stats[0].new}, Success: ${stats[0].success}`);
            }
        } catch (error) {
            console.error('Error getting notification stats:', error);
        }
    });

    console.log('📅 Notification cleanup job scheduled (daily at 2:00 AM)');
    console.log('📈 Notification stats job scheduled (hourly)');
};

module.exports = { startCleanupJob };
