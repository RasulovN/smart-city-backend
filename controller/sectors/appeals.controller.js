const Appeal = require('../../models/appeals');
const { validationResult } = require('express-validator');
const notificationService = require('../../services/appeals/notification.service');
const analyticsService = require('../../services/appeals/analytics.service');
const logger = require('../../utils/logger');

class AppealsController {
    
    // Helper method to format sector names (static)
    static formatSectorName(sector) {
        const sectorNames = {
            'infrastructure': 'Infrastruktura',
            'environment': 'Atrof-muhit',
            'ecology': 'Ekologiya',
            'transport': 'Transport',
            'health': 'Sog\'liqni saqlash',
            'education': 'Ta\'lim',
            'social': 'Ijtimoiy',
            'economic': 'Iqtisodiy',
            'other': 'Boshqa'
        };
        return sectorNames[sector] || sector.charAt(0).toUpperCase() + sector.slice(1);
    }
    
    // Helper method to validate sector access (static)
    static async validateSectorAccess(userRole, userSector, requestedSector) {
        // Super admin and admin can access all sectors
        if (['super_admin', 'admin'].includes(userRole)) {
            return { allowed: true, reason: 'full_access' };
        }
        
        // Sector admin can only access their own sector
        if (userRole === 'sector_admin') {
            if (userSector === requestedSector) {
                return { allowed: true, reason: 'own_sector' };
            } else {
                return { 
                    allowed: false, 
                    reason: 'sector_mismatch',
                    message: `Siz faqat ${AppealsController.formatSectorName(userSector)} sektoridagi murojaatlarni ko'rishingiz mumkin`
                };
            }
        }
        
        // Other roles cannot access sector appeals
        return { 
            allowed: false, 
            reason: 'insufficient_role',
            message: 'Sektor murojaatlarini ko\'rish uchun admin yoki sektor admin huquqlari kerak'
        };
    }

    // Create new appeal
    async createApeals(req, res, next) {
        try {
            // Check validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Ma\'lumotlarni to\'g\'ri kiriting',
                    errors: errors.array()
                });
            }

            const appealData = {
                ...req.body,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            };

            const appeal = new Appeal(appealData);
            await appeal.save();

            // Process notifications asynchronously
            setImmediate(() => {
                notificationService.processNewAppeal(appeal).catch(error => {
                    logger.error('Error processing notifications for new appeal:', error);
                });
            });

            console.log(`New appeal created: ${appeal._id}`, {
                appealId: appeal._id,
                type: appeal.type,
                sector: appeal.sector,
                company: appeal.company,
                userEmail: appeal.email
            });

            res.status(201).json({
                success: true,
                message: 'Murojaatingiz muvaffaqiyatli yuborildi',
                data: {
                    id: appeal._id,
                    referenceNumber: appeal._id,
                    status: appeal.status,
                    createdAt: appeal.createdAt
                }
            });

        } catch (error) {
            console.error('Error creating appeal:', error);
            res.status(500).json({
                success: false,
                message: 'Server xatosi yuz berdi',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    // Get all appeals (with filters and pagination)
    async getApeals(req, res, next) {
        try {
            const {
                page = 1,
                limit = 10,
                status,
                type,
                sector,
                priority,
                search,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = req.query;

            // Build filter object
            const filter = {};
            
            if (status) filter.status = status;
            if (type) filter.type = type;
            if (sector) filter.sector = sector;
            if (priority) filter.priority = priority;
            
            // Search functionality
            if (search) {
                filter.$or = [
                    { title: { $regex: search, $options: 'i' } },
                    { message: { $regex: search, $options: 'i' } },
                    { fullName: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ];
            }

            // Calculate pagination
            const skip = (parseInt(page) - 1) * parseInt(limit);
            const sortOptions = {};
            sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

            // Get total count for pagination
            const totalCount = await Appeal.countDocuments(filter);
            const totalPages = Math.ceil(totalCount / parseInt(limit));

            // Get appeals with pagination
            const appeals = await Appeal.find(filter)
                .populate('adminResponse.respondedBy', 'fullName email')
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit))
                .lean();

            res.json({
                success: true,
                data: appeals,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalCount,
                    hasNextPage: parseInt(page) < totalPages,
                    hasPrevPage: parseInt(page) > 1
                }
            });

        } catch (error) {
            logger.error('Error fetching appeals:', error);
            res.status(500).json({
                success: false,
                message: 'Murojaatlarni olishda xato yuz berdi',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    // Get available sectors with appeal counts
    async getAvailableSectors(req, res, next) {
        try {
            const userRole = req.user?.role;
            const userSector = req.user?.sector;

            // Get appeal counts by sector
            const sectorCounts = await Appeal.aggregate([
                {
                    $group: {
                        _id: '$sector',
                        totalAppeals: { $sum: 1 },
                        openAppeals: {
                            $sum: {
                                $cond: [{ $eq: ['$status', 'open'] }, 1, 0]
                            }
                        },
                        inProgressAppeals: {
                            $sum: {
                                $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0]
                            }
                        },
                        closedAppeals: {
                            $sum: {
                                $cond: [{ $eq: ['$status', 'closed'] }, 1, 0]
                            }
                        }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            // Format sector data
            const sectorsData = sectorCounts.map(item => ({
                sector: item._id,
                sectorName: AppealsController.formatSectorName(item._id),
                counts: {
                    total: item.totalAppeals,
                    open: item.openAppeals,
                    inProgress: item.inProgressAppeals,
                    closed: item.closedAppeals
                },
                percentage: {
                    open: item.totalAppeals > 0 ? ((item.openAppeals / item.totalAppeals) * 100).toFixed(1) : 0,
                    inProgress: item.totalAppeals > 0 ? ((item.inProgressAppeals / item.totalAppeals) * 100).toFixed(1) : 0,
                    closed: item.totalAppeals > 0 ? ((item.closedAppeals / item.totalAppeals) * 100).toFixed(1) : 0
                }
            }));

            // Filter sectors based on user role
            let availableSectors = sectorsData;
            if (userRole === 'sector_admin' && userSector) {
                availableSectors = sectorsData.filter(s => s.sector === userSector);
            }

            res.json({
                success: true,
                message: 'Mavjud sektorlar va ularning statistikalari',
                data: {
                    sectors: availableSectors,
                    userAccess: {
                        role: userRole,
                        sector: userSector,
                        canAccessAll: ['super_admin', 'admin'].includes(userRole),
                        sectorRestricted: userRole === 'sector_admin'
                    },
                    totalSectors: availableSectors.length,
                    totalAppeals: availableSectors.reduce((sum, s) => sum + s.counts.total, 0)
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error('Error fetching available sectors:', error);
            res.status(500).json({
                success: false,
                message: 'Sektorlar ro\'yxatini olishda xato yuz berdi',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    // Get only sector admin appeals (filtered by sector)
    async getSectorAdminAppeals(req, res, next) {
        try {
            const { sector } = req.params;
            const {
                page = 1,
                limit = 10,
                status,
                type,
                priority,
                search,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = req.query;

            // Validate sector parameter
            const validSectors = ['infrastructure', 'environment', 'ecology', 'transport', 'health', 'education', 'social', 'economic', 'other'];
            if (!validSectors.includes(sector)) {
                return res.status(400).json({
                    success: false,
                    message: `Noto'g'ri sektor. Ruxsat berilgan sektorlar: ${validSectors.join(', ')}`
                });
            }

            // Check user permissions for sector access
            const userRole = req.user?.role;
            const userSector = req.user?.sector;

            const accessCheck = await AppealsController.validateSectorAccess(userRole, userSector, sector);
            if (!accessCheck.allowed) {
                return res.status(403).json({
                    success: false,
                    message: accessCheck.message || 'Sektor murojaatlariga kirish huquqi yo\'q'
                });
            }

            // Build filter object
            const filter = { sector: sector };
            
            if (status) filter.status = status;
            if (type) filter.type = type;
            if (priority) filter.priority = priority;
            
            // Search functionality
            if (search) {
                filter.$or = [
                    { title: { $regex: search, $options: 'i' } },
                    { message: { $regex: search, $options: 'i' } },
                    { fullName: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ];
            }

            // Calculate pagination
            const skip = (parseInt(page) - 1) * parseInt(limit);
            const sortOptions = {};
            sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

            // Get total count for pagination
            const totalCount = await Appeal.countDocuments(filter);
            const totalPages = Math.ceil(totalCount / parseInt(limit));

            // Get appeals with pagination
            const appeals = await Appeal.find(filter)
                .populate('adminResponse.respondedBy', 'fullName email')
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit))
                .lean();

            // Get sector-specific statistics
            const sectorStats = await Appeal.aggregate([
                { $match: { sector } },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ]);

            // Get additional sector information
            const sectorInfo = {
                sector,
                sectorName: AppealsController.formatSectorName(sector),
                totalAppeals: totalCount,
                accessLevel: accessCheck.reason,
                availableFilters: {
                    statuses: ['open', 'in_progress', 'waiting_response', 'closed', 'rejected'],
                    types: ['complaint', 'suggestion', 'question', 'request', 'appreciation', 'other'],
                    priorities: ['low', 'medium', 'high', 'urgent']
                }
            };

            res.json({
                success: true,
                message: `${sectorInfo.sectorName} sektoridagi murojaatlar muvaffaqiyatli olindi`,
                data: {
                    appeals,
                    sector: sectorInfo,
                    statistics: {
                        totalAppeals: totalCount,
                        byStatus: sectorStats,
                        byType: await Appeal.aggregate([
                            { $match: { sector } },
                            { $group: { _id: '$type', count: { $sum: 1 } } }
                        ]),
                        byPriority: await Appeal.aggregate([
                            { $match: { sector } },
                            { $group: { _id: '$priority', count: { $sum: 1 } } }
                        ])
                    }
                },
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalCount,
                    hasNextPage: parseInt(page) < totalPages,
                    hasPrevPage: parseInt(page) > 1,
                    limit: parseInt(limit),
                    nextPage: parseInt(page) < totalPages ? parseInt(page) + 1 : null,
                    prevPage: parseInt(page) > 1 ? parseInt(page) - 1 : null
                },
                filters: {
                    sector,
                    status: status || 'all',
                    type: type || 'all',
                    priority: priority || 'all',
                    search: search || '',
                    sortBy,
                    sortOrder
                },
                metadata: {
                    timestamp: new Date().toISOString(),
                    responseTime: Date.now(),
                    userRole,
                    accessLevel: accessCheck.reason
                }
            });

        } catch (error) {
            logger.error('Error fetching sector admin appeals:', error);
            res.status(500).json({
                success: false,
                message: 'Sektor murojaatlarini olishda xato yuz berdi',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
    



    // Get single appeal by ID
    async getApealById(req, res, next) {
        try {
            const { id } = req.params;
            
            const appeal = await Appeal.findById(id)
                .populate('adminResponse.respondedBy', 'fullName email');

            if (!appeal) {
                return res.status(404).json({
                    success: false,
                    message: 'Murojaat topilmadi'
                });
            }

            // Increment view count
            appeal.viewCount += 1;
            await appeal.save();

            res.json({
                success: true,
                data: appeal
            });

        } catch (error) {
            logger.error('Error fetching appeal by ID:', error);
            res.status(500).json({
                success: false,
                message: 'Murojaatni olishda xato yuz berdi',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    // Update appeal status (Admin only)
    async updateApealStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status, adminResponse, followUpRequired, followUpDate } = req.body;

            const appeal = await Appeal.findById(id);
            if (!appeal) {
                return res.status(404).json({
                    success: false,
                    message: 'Murojaat topilmadi'
                });
            }

            const oldStatus = appeal.status;

            // Update status
            if (status) {
                appeal.status = status;
            }

            // Add admin response
            if (adminResponse && req.user) {
                await appeal.addResponse(adminResponse, req.user._id);
            }

            // Update follow-up info
            if (followUpRequired !== undefined) {
                appeal.followUpRequired = followUpRequired;
            }
            if (followUpDate) {
                appeal.followUpDate = new Date(followUpDate);
            }

            await appeal.save();

            // Process notifications asynchronously
            if (status && status !== oldStatus) {
                setImmediate(() => {
                    notificationService.processStatusUpdate(appeal, oldStatus).catch(error => {
                        logger.error('Error processing status update notifications:', error);
                    });
                });
            }

            logger.info(`Appeal status updated: ${appeal._id}`, {
                appealId: appeal._id,
                oldStatus: oldStatus,
                newStatus: status,
                updatedBy: req.user?._id
            });

            res.json({
                success: true,
                message: 'Murojaat holati yangilandi',
                data: appeal
            });

        } catch (error) {
            logger.error('Error updating appeal status:', error);
            res.status(500).json({
                success: false,
                message: 'Murojaat holatini yangilashda xato yuz berdi',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    // Delete appeal (Admin only)
    async deleteApeals(req, res, next) {
        try {
            const { id } = req.params;
            
            const appeal = await Appeal.findById(id);
            if (!appeal) {
                return res.status(404).json({
                    success: false,
                    message: 'Murojaat topilmadi'
                });
            }

            await Appeal.findByIdAndDelete(id);

            logger.info(`Appeal deleted: ${appeal._id}`, {
                appealId: appeal._id,
                deletedBy: req.user?._id,
                appealTitle: appeal.title
            });

            res.json({
                success: true,
                message: 'Murojaat o\'chirildi'
            });

        } catch (error) {
            logger.error('Error deleting appeal:', error);
            res.status(500).json({
                success: false,
                message: 'Murojaatni o\'chirishda xato yuz berdi',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    // Add rating to appeal (Public)
    async rateAppeal(req, res, next) {
        try {
            const { id } = req.params;
            const { score, feedback } = req.body;

            if (!score || score < 1 || score > 5) {
                return res.status(400).json({
                    success: false,
                    message: 'Baholar 1 dan 5 gacha bo\'lishi kerak'
                });
            }

            const appeal = await Appeal.findById(id);
            if (!appeal) {
                return res.status(404).json({
                    success: false,
                    message: 'Murojaat topilmadi'
                });
            }

            if (appeal.status !== 'closed') {
                return res.status(400).json({
                    success: false,
                    message: 'Faqat yopilgan murojaatlarni baholashingiz mumkin'
                });
            }

            await appeal.addRating(score, feedback);

            res.json({
                success: true,
                message: 'Baholash qo\'shildi',
                data: appeal.rating
            });

        } catch (error) {
            logger.error('Error adding rating:', error);
            res.status(500).json({
                success: false,
                message: 'Baholash qo\'shishda xato yuz berdi',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    // Get appeals statistics (Admin only)
    async getStatistics(req, res, next) {
        try {
            const { period = '30' } = req.query;
            const daysAgo = new Date();
            daysAgo.setDate(daysAgo.getDate() - parseInt(period));

            const [
                totalAppeals,
                statusStats,
                typeStats,
                sectorStats,
                priorityStats,
                recentAppeals,
                averageRating
            ] = await Promise.all([
                Appeal.countDocuments({ createdAt: { $gte: daysAgo } }),
                Appeal.aggregate([
                    { $match: { createdAt: { $gte: daysAgo } } },
                    { $group: { _id: '$status', count: { $sum: 1 } } }
                ]),
                Appeal.aggregate([
                    { $match: { createdAt: { $gte: daysAgo } } },
                    { $group: { _id: '$type', count: { $sum: 1 } } }
                ]),
                Appeal.aggregate([
                    { $match: { createdAt: { $gte: daysAgo } } },
                    { $group: { _id: '$sector', count: { $sum: 1 } } }
                ]),
                Appeal.aggregate([
                    { $match: { createdAt: { $gte: daysAgo }, status: { $nin: ['closed', 'rejected'] } } },
                    { $group: { _id: '$priority', count: { $sum: 1 } } }
                ]),
                Appeal.find({ createdAt: { $gte: daysAgo } })
                    .sort({ createdAt: -1 })
                    .limit(10)
                    .select('title type status createdAt'),
                Appeal.aggregate([
                    { $match: { 'rating.score': { $exists: true } } },
                    { $group: { _id: null, avgRating: { $avg: '$rating.score' }, totalRatings: { $sum: 1 } } }
                ])
            ]);

            res.json({
                success: true,
                data: {
                    overview: {
                        totalAppeals,
                        averageRating: averageRating[0]?.avgRating || 0,
                        totalRatings: averageRating[0]?.totalRatings || 0
                    },
                    statistics: {
                        byStatus: statusStats,
                        byType: typeStats,
                        bySector: sectorStats,
                        byPriority: priorityStats
                    },
                    recentAppeals
                }
            });

        } catch (error) {
            logger.error('Error fetching statistics:', error);
            res.status(500).json({
                success: false,
                message: 'Statistikalarni olishda xato yuz berdi',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    // Get user's own appeals
    async getMyAppeals(req, res, next) {
        try {
            const { email } = req.query;
            const userEmail = email || req.user?.email;

            if (!userEmail) {
                return res.status(400).json({
                    success: false,
                    message: 'Email manzili kerak'
                });
            }

            const appeals = await Appeal.find({ email: userEmail })
                .sort({ createdAt: -1 })
                .populate('adminResponse.respondedBy', 'fullName');

            res.json({
                success: true,
                data: appeals
            });

        } catch (error) {
            logger.error('Error fetching user appeals:', error);
            res.status(500).json({
                success: false,
                message: 'Murojaatlarni olishda xato yuz berdi',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    // Export appeals to CSV (Admin only)
    async exportAppeals(req, res, next) {
        try {
            const { format = 'csv', ...filters } = req.query;
            
            // Build filter similar to getApeals
            const filter = {};
            if (filters.status) filter.status = filters.status;
            if (filters.type) filter.type = filters.type;
            if (filters.sector) filter.sector = filters.sector;
            
            const appeals = await Appeal.find(filter)
                .populate('adminResponse.respondedBy', 'fullName')
                .sort({ createdAt: -1 })
                .lean();

            // Convert to CSV format
            const csvHeaders = [
                'ID', 'Full Name', 'Email', 'Phone', 
                'Title', 'Type', 'Sector', 'Priority', 'Status', 
                'Created At', 'Updated At', 'Response', 'Responder'
            ];

            const csvData = appeals.map(appeal => [
                appeal._id,
                appeal.fullName,
                appeal.email,
                appeal.phone || '',
                appeal.title,
                appeal.type,
                appeal.sector,
                appeal.priority,
                appeal.status,
                appeal.createdAt,
                appeal.updatedAt,
                appeal.adminResponse?.message || '',
                appeal.adminResponse?.respondedBy ? 
                    ` ${appeal.adminResponse.respondedBy.fullName}` : ''
            ]);

            // Create CSV content
            const csvContent = [csvHeaders, ...csvData]
                .map(row => row.map(field => `"${field}"`).join(','))
                .join('\n');

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="appeals-${Date.now()}.csv"`);
            res.send(csvContent);

        } catch (error) {
            logger.error('Error exporting appeals:', error);
            res.status(500).json({
                success: false,
                message: 'Murojaatlarni eksport qilishda xato yuz berdi',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    // Get comprehensive dashboard analytics (Admin only)
    async getDashboardAnalytics(req, res, next) {
        try {
            const { period = '30', userRole } = req.query;
            
            const dashboardData = await analyticsService.getDashboardStats(period, userRole);
            
            res.json({
                success: true,
                data: dashboardData
            });

        } catch (error) {
            logger.error('Error getting dashboard analytics:', error);
            res.status(500).json({
                success: false,
                message: 'Dashboard ma\'lumotlarini olishda xato yuz berdi',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    // Get location-based analytics (Admin only)
    async getLocationAnalytics(req, res, next) {
        try {
            const { days = '30' } = req.query;
            
            const locationData = await analyticsService.getLocationAnalytics(days);
            
            res.json({
                success: true,
                data: locationData
            });

        } catch (error) {
            logger.error('Error getting location analytics:', error);
            res.status(500).json({
                success: false,
                message: 'Joylashuv ma\'lumotlarini olishda xato yuz berdi',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    // Get performance metrics (Admin only)
    async getPerformanceMetrics(req, res, next) {
        try {
            const { days = '30' } = req.query;
            
            const performanceData = await analyticsService.getPerformanceMetrics(days);
            
            res.json({
                success: true,
                data: performanceData
            });

        } catch (error) {
            logger.error('Error getting performance metrics:', error);
            res.status(500).json({
                success: false,
                message: 'Performans metrikalarini olishda xato yuz berdi',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    // Get user engagement metrics (Admin only)
    async getUserEngagement(req, res, next) {
        try {
            const { days = '30' } = req.query;
            
            const engagementData = await analyticsService.getUserEngagement(days);
            
            res.json({
                success: true,
                data: engagementData
            });

        } catch (error) {
            logger.error('Error getting user engagement metrics:', error);
            res.status(500).json({
                success: false,
                message: 'Foydalanuvchi faollik metrikalarini olishda xato yuz berdi',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    // Generate detailed analytics report (Admin only)
    async generateReport(req, res, next) {
        try {
            const { type, startDate, endDate } = req.query;
            
            if (!type || !startDate || !endDate) {
                return res.status(400).json({
                    success: false,
                    message: 'Hisobot turi, boshlang\'ich va oxirgi sana kerak'
                });
            }

            const report = await analyticsService.generateAnalyticsReport(type, new Date(startDate), new Date(endDate), req.query);
            
            res.json({
                success: true,
                data: report
            });

        } catch (error) {
            logger.error('Error generating analytics report:', error);
            res.status(500).json({
                success: false,
                message: 'Hisobot yaratishda xato yuz berdi',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    // Notification service health check (Admin only)
    async getNotificationHealth(req, res, next) {
        try {
            const health = await notificationService.healthCheck();
            
            res.json({
                success: true,
                data: health
            });

        } catch (error) {
            logger.error('Error checking notification health:', error);
            res.status(500).json({
                success: false,
                message: 'Xabarnoma xizmati holatini tekshirishda xato yuz berdi',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    // Get appeals requiring follow-up (Admin only)
    async getFollowUpAppeals(req, res, next) {
        try {
            const { priority, daysOverdue = '7' } = req.query;
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - parseInt(daysOverdue));

            const filter = {
                followUpRequired: true,
                followUpDate: { $lte: cutoffDate },
                status: { $in: ['open', 'in_progress', 'waiting_response'] }
            };

            if (priority) {
                filter.priority = priority;
            }

            const appeals = await Appeal.find(filter)
                .populate('adminResponse.respondedBy', 'fullName email')
                .sort({ followUpDate: 1, priority: -1 })
                .lean();

            res.json({
                success: true,
                data: appeals,
                count: appeals.length
            });

        } catch (error) {
            logger.error('Error getting follow-up appeals:', error);
            res.status(500).json({
                success: false,
                message: 'Kuzatib borish kerak bo\'lgan murojaatlarni olishda xato yuz berdi',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    // Bulk update appeals status (Admin only)
    async bulkUpdateStatus(req, res, next) {
        try {
            const { appealIds, status, adminResponse } = req.body;

            if (!appealIds || !Array.isArray(appealIds) || appealIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Murojaat IDlar ro\'yxati kerak'
                });
            }

            if (!status) {
                return res.status(400).json({
                    success: false,
                    message: 'Yangi holat kerak'
                });
            }

            const updateData = { status };
            
            if (adminResponse && req.user) {
                updateData.adminResponse = {
                    message: adminResponse,
                    respondedBy: req.user._id,
                    respondedAt: new Date()
                };
            }

            const result = await Appeal.updateMany(
                { _id: { $in: appealIds } },
                updateData
            );

            logger.info(`Bulk updated ${result.modifiedCount} appeals status`, {
                updatedBy: req.user?._id,
                appealIds,
                newStatus: status
            });

            res.json({
                success: true,
                message: `${result.modifiedCount} murojaat holati yangilandi`,
                data: {
                    modifiedCount: result.modifiedCount,
                    matchedCount: result.matchedCount
                }
            });

        } catch (error) {
            logger.error('Error bulk updating appeals status:', error);
            res.status(500).json({
                success: false,
                message: 'Murojaatlarni to\'g\'ridan-to\'g\'ri yangilashda xato yuz berdi',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
}

module.exports = new AppealsController();
