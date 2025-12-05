const Appeal = require('../../models/appeals');
const logger = {
    info: (message, data) => console.log(`[INFO] ${message}`, data || ''),
    error: (message, error) => console.error(`[ERROR] ${message}`, error || ''),
    warn: (message, data) => console.warn(`[WARN] ${message}`, data || '')
};

class AnalyticsService {
    constructor() {
        this.reportTypes = {
            DAILY: 'daily',
            WEEKLY: 'weekly',
            MONTHLY: 'monthly',
            YEARLY: 'yearly',
            CUSTOM: 'custom'
        };
    }

    // Get comprehensive dashboard statistics
    async getDashboardStats(period = '30', userRole = 'admin') {
        try {
            const daysAgo = new Date();
            daysAgo.setDate(daysAgo.getDate() - parseInt(period));

            const [
                totalAppeals,
                statusBreakdown,
                typeBreakdown,
                sectorBreakdown,
                priorityBreakdown,
                recentAppeals,
                trendData,
                responseTimeStats,
                userSatisfaction
            ] = await Promise.all([
                this.getTotalAppeals(daysAgo),
                this.getStatusBreakdown(daysAgo),
                this.getTypeBreakdown(daysAgo),
                this.getCategoryBreakdown(daysAgo),
                this.getPriorityBreakdown(daysAgo),
                this.getRecentAppeals(10),
                this.getTrendData(daysAgo),
                this.getResponseTimeStats(daysAgo),
                this.getUserSatisfaction(daysAgo)
            ]);

            return {
                overview: {
                    totalAppeals,
                    period: `${period} days`,
                    growth: await this.calculateGrowth(daysAgo)
                },
                breakdowns: {
                    status: statusBreakdown,
                    type: typeBreakdown,
                    sector: sectorBreakdown,
                    priority: priorityBreakdown
                },
                trends: trendData,
                performance: {
                    responseTime: responseTimeStats,
                    satisfaction: userSatisfaction
                },
                recentActivity: recentAppeals
            };

        } catch (error) {
            logger.error('Error getting dashboard stats:', error);
            throw error;
        }
    }

    // Generate detailed analytics report
    async generateAnalyticsReport(type, startDate, endDate, filters = {}) {
        try {
            const report = {
                reportType: type,
                dateRange: { start: startDate, end: endDate },
                generatedAt: new Date(),
                data: {}
            };

            switch (type) {
                case this.reportTypes.DAILY:
                    report.data = await this.generateDailyReport(startDate, endDate, filters);
                    break;
                case this.reportTypes.WEEKLY:
                    report.data = await this.generateWeeklyReport(startDate, endDate, filters);
                    break;
                case this.reportTypes.MONTHLY:
                    report.data = await this.generateMonthlyReport(startDate, endDate, filters);
                    break;
                case this.reportTypes.YEARLY:
                    report.data = await this.generateYearlyReport(startDate, endDate, filters);
                    break;
                default:
                    throw new Error('Unsupported report type');
            }

            logger.info(`Analytics report generated: ${type}`, {
                startDate,
                endDate,
                filters
            });

            return report;

        } catch (error) {
            logger.error('Error generating analytics report:', error);
            throw error;
        }
    }

    // Get appeals by location for mapping
    async getLocationAnalytics(days = 30) {
        try {
            const daysAgo = new Date();
            daysAgo.setDate(daysAgo.getDate() - parseInt(days));

            const locationData = await Appeal.aggregate([
                { $match: { createdAt: { $gte: daysAgo }, 'location.coordinates': { $exists: true } } },
                {
                    $group: {
                        _id: '$location.district',
                        count: { $sum: 1 },
                        coordinates: { $first: '$location.coordinates' },
                        sectors: { $addToSet: '$sector' },
                        avgPriority: { $avg: { $cond: [{ $eq: ['$priority', 'urgent'] }, 4, { $cond: [{ $eq: ['$priority', 'high'] }, 3, { $cond: [{ $eq: ['$priority', 'medium'] }, 2, 1] }] }] } }
                    }
                },
                { $sort: { count: -1 } }
            ]);

            return {
                totalLocations: locationData.length,
                locations: locationData,
                heatmap: locationData.map(loc => ({
                    district: loc._id || 'Unknown',
                    intensity: loc.count,
                    coordinates: loc.coordinates,
                    avgPriority: Math.round(loc.avgPriority * 100) / 100
                }))
            };

        } catch (error) {
            logger.error('Error getting location analytics:', error);
            throw error;
        }
    }

    // Get performance metrics
    async getPerformanceMetrics(days = 30) {
        try {
            const daysAgo = new Date();
            daysAgo.setDate(daysAgo.getDate() - parseInt(days));

            const [
                resolutionTime,
                responseTime,
                backlogStats,
                slaCompliance
            ] = await Promise.all([
                this.calculateResolutionTime(daysAgo),
                this.calculateResponseTime(daysAgo),
                this.getBacklogStats(daysAgo),
                this.getSLACompliance(daysAgo)
            ]);

            return {
                resolutionTime,
                responseTime,
                backlog: backlogStats,
                sla: slaCompliance,
                lastUpdated: new Date()
            };

        } catch (error) {
            logger.error('Error getting performance metrics:', error);
            throw error;
        }
    }

    // Get user engagement metrics
    async getUserEngagement(days = 30) {
        try {
            const daysAgo = new Date();
            daysAgo.setDate(daysAgo.getDate() - parseInt(days));

            const [
                uniqueUsers,
                repeatUsers,
                ratingStats,
                resolutionSatisfaction
            ] = await Promise.all([
                this.getUniqueUsers(daysAgo),
                this.getRepeatUsers(daysAgo),
                this.getRatingStats(daysAgo),
                this.getResolutionSatisfaction(daysAgo)
            ]);

            return {
                userMetrics: {
                    uniqueUsers,
                    repeatUsers,
                    repeatRate: repeatUsers.length / uniqueUsers.length * 100
                },
                satisfaction: {
                    averageRating: ratingStats.average,
                    totalRatings: ratingStats.count,
                    distribution: ratingStats.distribution,
                    resolutionSatisfaction
                },
                period: `${days} days`
            };

        } catch (error) {
            logger.error('Error getting user engagement metrics:', error);
            throw error;
        }
    }

    // Private helper methods

    async getTotalAppeals(startDate) {
        return Appeal.countDocuments({ createdAt: { $gte: startDate } });
    }

    async getStatusBreakdown(startDate) {
        const result = await Appeal.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        
        return result.map(item => ({
            status: item._id,
            count: item.count,
            percentage: 0 // Will be calculated
        }));
    }

    async getTypeBreakdown(startDate) {
        return Appeal.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            { $group: { _id: '$type', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
    }

    async getCategoryBreakdown(startDate) {
        return Appeal.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            { $group: { _id: '$sector', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
    }

    async getPriorityBreakdown(startDate) {
        return Appeal.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            { $group: { _id: '$priority', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
    }

    async getRecentAppeals(limit = 10) {
        return Appeal.find()
            .sort({ createdAt: -1 })
            .limit(limit)
            .select('title type status priority createdAt fullName')
            .lean();
    }

    async getTrendData(startDate) {
        const days = Math.ceil((new Date() - startDate) / (1000 * 60 * 60 * 24));
        const trends = [];

        for (let i = 0; i < days; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);

            const count = await Appeal.countDocuments({
                createdAt: { $gte: date, $lt: nextDate }
            });

            trends.push({
                date: date.toISOString().split('T')[0],
                count
            });
        }

        return trends;
    }

    async calculateGrowth(startDate) {
        const currentPeriod = await Appeal.countDocuments({ createdAt: { $gte: startDate } });
        const previousStart = new Date(startDate);
        previousStart.setDate(previousStart.getDate() - (new Date() - startDate) / (1000 * 60 * 60 * 24));
        const previousPeriod = await Appeal.countDocuments({
            createdAt: { $gte: previousStart, $lt: startDate }
        });

        if (previousPeriod === 0) return 100;
        return ((currentPeriod - previousPeriod) / previousPeriod * 100).toFixed(2);
    }

    async getResponseTimeStats(startDate) {
        const stats = await Appeal.aggregate([
            { $match: { createdAt: { $gte: startDate }, 'adminResponse.respondedAt': { $exists: true } } },
            {
                $project: {
                    responseTime: {
                        $divide: [
                            { $subtract: ['$adminResponse.respondedAt', '$createdAt'] },
                            1000 * 60 * 60 // Convert to hours
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    avgResponseTime: { $avg: '$responseTime' },
                    minResponseTime: { $min: '$responseTime' },
                    maxResponseTime: { $max: '$responseTime' }
                }
            }
        ]);

        return stats[0] || { avgResponseTime: 0, minResponseTime: 0, maxResponseTime: 0 };
    }

    async getUserSatisfaction(startDate) {
        const ratings = await Appeal.aggregate([
            { $match: { createdAt: { $gte: startDate }, 'rating.score': { $exists: true } } },
            {
                $group: {
                    _id: '$rating.score',
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: -1 } }
        ]);

        const totalRatings = ratings.reduce((sum, item) => sum + item.count, 0);
        const averageRating = ratings.reduce((sum, item) => sum + (item._id * item.count), 0) / totalRatings;

        return {
            average: Math.round(averageRating * 100) / 100,
            totalRatings,
            distribution: ratings
        };
    }

    async generateDailyReport(startDate, endDate, filters) {
        // Implementation for daily reports
        return await this.generateTimeBasedReport('daily', startDate, endDate, filters);
    }

    async generateWeeklyReport(startDate, endDate, filters) {
        return await this.generateTimeBasedReport('weekly', startDate, endDate, filters);
    }

    async generateMonthlyReport(startDate, endDate, filters) {
        return await this.generateTimeBasedReport('monthly', startDate, endDate, filters);
    }

    async generateYearlyReport(startDate, endDate, filters) {
        return await this.generateTimeBasedReport('yearly', startDate, endDate, filters);
    }

    async generateTimeBasedReport(period, startDate, endDate, filters) {
        const groupBy = this.getGroupByPeriod(period);
        const matchStage = { createdAt: { $gte: startDate, $lte: endDate } };
        
        // Apply filters
        if (filters.status) matchStage.status = filters.status;
        if (filters.type) matchStage.type = filters.type;
        if (filters.sector) matchStage.sector = filters.sector;

        return Appeal.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: groupBy,
                    count: { $sum: 1 },
                    avgResponseTime: {
                        $avg: {
                            $cond: [
                                { $ifNull: ['$adminResponse.respondedAt', false] },
                                {
                                    $divide: [
                                        { $subtract: ['$adminResponse.respondedAt', '$createdAt'] },
                                        1000 * 60 * 60
                                    ]
                                },
                                null
                            ]
                        }
                    },
                    statusBreakdown: { $push: '$status' }
                }
            },
            { $sort: { _id: 1 } }
        ]);
    }

    getGroupByPeriod(period) {
        switch (period) {
            case 'daily':
                return { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
            case 'weekly':
                return { $dateToString: { format: '%Y-W%V', date: '$createdAt' } };
            case 'monthly':
                return { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
            case 'yearly':
                return { $dateToString: { format: '%Y', date: '$createdAt' } };
            default:
                return '$createdAt';
        }
    }

    // Additional helper methods for performance metrics
    async calculateResolutionTime(startDate) {
        const resolved = await Appeal.aggregate([
            { $match: { createdAt: { $gte: startDate }, status: 'closed' } },
            {
                $project: {
                    resolutionTime: {
                        $divide: [
                            { $subtract: ['$updatedAt', '$createdAt'] },
                            1000 * 60 * 60 // Hours
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    avg: { $avg: '$resolutionTime' },
                    min: { $min: '$resolutionTime' },
                    max: { $max: '$resolutionTime' }
                }
            }
        ]);
        return resolved[0] || { avg: 0, min: 0, max: 0 };
    }

    async calculateResponseTime(startDate) {
        return await this.getResponseTimeStats(startDate);
    }

    async getBacklogStats(startDate) {
        const openAppeals = await Appeal.countDocuments({
            createdAt: { $gte: startDate },
            status: { $in: ['open', 'in_progress'] }
        });

        const avgAge = await Appeal.aggregate([
            { $match: { createdAt: { $gte: startDate }, status: { $in: ['open', 'in_progress'] } } },
            {
                $project: {
                    age: {
                        $divide: [
                            { $subtract: [new Date(), '$createdAt'] },
                            1000 * 60 * 60 * 24 // Days
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    avgAge: { $avg: '$age' }
                }
            }
        ]);

        return {
            openAppeals,
            avgAge: avgAge[0]?.avgAge || 0
        };
    }

    async getSLACompliance(startDate) {
        const total = await Appeal.countDocuments({ createdAt: { $gte: startDate } });
        const withinSLA = await Appeal.countDocuments({
            createdAt: { $gte: startDate },
            $or: [
                { status: 'closed', updatedAt: { $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } },
                { status: 'in_progress' }
            ]
        });

        return {
            total,
            withinSLA,
            compliance: total > 0 ? (withinSLA / total * 100).toFixed(2) : 0
        };
    }

    async getUniqueUsers(startDate) {
        const users = await Appeal.distinct('email', {
            createdAt: { $gte: startDate },
            email: { $exists: true, $ne: null }
        });
        return users.filter(email => email !== '');
    }

    async getRepeatUsers(startDate) {
        const pipeline = [
            { $match: { createdAt: { $gte: startDate }, email: { $exists: true, $ne: null } } },
            { $group: { _id: '$email', count: { $sum: 1 } } },
            { $match: { count: { $gt: 1 } } },
            { $project: { email: '$_id', appealCount: '$count' } }
        ];
        return await Appeal.aggregate(pipeline);
    }

    async getRatingStats(startDate) {
        const ratings = await Appeal.aggregate([
            { $match: { createdAt: { $gte: startDate }, 'rating.score': { $exists: true } } },
            { $group: { _id: '$rating.score', count: { $sum: 1 } } }
        ]);

        const total = ratings.reduce((sum, item) => sum + item.count, 0);
        const average = ratings.reduce((sum, item) => sum + (item._id * item.count), 0) / total;

        return {
            average: Math.round(average * 100) / 100,
            count: total,
            distribution: ratings.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {})
        };
    }

    async getResolutionSatisfaction(startDate) {
        return Appeal.aggregate([
            { $match: { createdAt: { $gte: startDate }, status: 'closed', 'rating.score': { $exists: true } } },
            {
                $group: {
                    _id: null,
                    avgRating: { $avg: '$rating.score' },
                    totalRated: { $sum: 1 }
                }
            }
        ]);
    }
}

module.exports = new AnalyticsService();