const sector = require('../../models/sector');
const Company = require('../../models/company');
const Appeal = require('../../models/appeals');

class UiController {

    // Get sectors list (faqat active sektorlar, faqat name va slug)
    async getAllSectors(req, res) {
        try {
            const sectors = await sector.find({ 
                isActive: true 
            })
            .select('name slug')  // faqat name va slug maydonlarini olamiz
            .sort({ name: 1 })    // alifbo bo'yicha tartiblash (ixtiyoriy)
            .lean();              // tezlik uchun (mongoose document emas, oddiy object qaytaradi)

            return res.status(200).json({
                success: true,
                data: {
                    sectors,
                    total: sectors.length
                },
                message: 'Faol sektorlar roʻyxati muvaffaqiyatli olindi'
            });

        } catch (error) {
            console.error('Error in getAvailableSectors:', error);
            return res.status(500).json({
                success: false,
                message: 'Sektorlar roʻyxatini olishda xatolik yuz berdi',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

  // Get all companies with filtering, pagination, and search
            async getAllCompanies(req, res, next) {
                try {
                    const {
                        page = 1,
                        limit = 10,
                        sector,
                        type,
                        isActive,
                        search,
                        sortBy = 'createdAt',
                        sortOrder = 'desc'
                    } = req.query;

                    const filter = {};

                    if (sector) filter.sector = sector;
                    if (type) filter.type = type;
                    if (isActive !== undefined) {
                        filter.isActive = isActive === 'true';
                    }

                    if (search) {
                        filter.$or = [
                            { name: { $regex: search, $options: 'i' } },
                            { description: { $regex: search, $options: 'i' } },
                            { inn: { $regex: search, $options: 'i' } }
                        ];
                    }

                    const skip = (parseInt(page) - 1) * parseInt(limit);
                    const sort = {};
                    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

                    // SELECT faqat kerakli fieldlar
                    const companies = await Company.find(filter)
                        .select("name slug description sector")   // 👈 faqat shu fieldlar qaytadi
                        .sort(sort)
                        .skip(skip)
                        .limit(parseInt(limit));

                    const total = await Company.countDocuments(filter);
                    const totalPages = Math.ceil(total / parseInt(limit));

                    res.status(200).json({
                        success: true,
                        message: 'Organizations retrieved successfully',
                        data: {
                            companies,
                            pagination: {
                                currentPage: parseInt(page),
                                totalPages,
                                totalItems: total,
                                itemsPerPage: parseInt(limit),
                                hasNextPage: parseInt(page) < totalPages,
                                hasPrevPage: parseInt(page) > 1
                            }
                        }
                    });

                } catch (error) {
                    next(error);
                }
            }


    // Appeals statistics for UI
    async getAppealsStatistics(req, res) {
        try {
            const stats = await Appeal.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ]);

            const total = stats.reduce((sum, item) => sum + item.count, 0);
            const viewed = stats.find(s => s._id === 'waiting_response')?.count || 0;
            const inProgress = stats.find(s => s._id === 'in_progress')?.count || 0;
            const rejected = stats.find(s => s._id === 'rejected')?.count || 0;

            return res.status(200).json({
                success: true,
                data: {
                    total,
                    viewed,
                    in_progress: inProgress,
                    rejected
                },
                message: 'Appeals statistics retrieved successfully'
            });
        } catch (error) {
            console.error('Error in getAppealsStatistics:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve appeals statistics',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // get notifications for UI
    


   
}

module.exports = new UiController();