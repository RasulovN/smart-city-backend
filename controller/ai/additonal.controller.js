const Appeal = require('../../models/appeals'); // to'g'ri yo'lni o'zgartiring
const Company = require('../../models/company');
const Sector = require('../../models/sector');
const Notification = require('../../models/notification');
const OptimizedAttendance = require('../../models/OptimizedAttendance');
const Stats = require('../../models/Stats');

class AdditionalController {
    // Umumiy getter funksiya - barcha modellar uchun ma'lumot oladi
    async getterAll(req, res) {
        try {
            const { model, page = 1, limit = 20, ...filters } = req.query;

            if (!model) {
                return res.status(400).json({
                    success: false,
                    message: "Iltimos, 'model' parametrini kiriting (masalan: ?model=appeals)"
                });
            }

            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const skip = (pageNum - 1) * limitNum;

            let data;
            let total = 0;

            switch (model.toLowerCase()) {
                case 'appeals':
                case 'appeal':
                    data = await Appeal.find(filters)
                        .populate('adminResponse.respondedBy', 'fullName email')
                        .sort({ createdAt: -1 })
                        .skip(skip)
                        .limit(limitNum);

                    total = await Appeal.countDocuments(filters);
                    break;

                case 'companies':
                case 'company':
                    data = await Company.find(filters)
                        .sort({ name: 1 })
                        .skip(skip)
                        .limit(limitNum);

                    total = await Company.countDocuments(filters);
                    break;

                case 'sectors':
                case 'sector':
                    data = await Sector.find(filters)
                        .sort({ name: 1 })
                        .skip(skip)
                        .limit(limitNum);

                    total = await Sector.countDocuments(filters);
                    break;

                case 'notifications':
                case 'notification':
                    data = await Notification.find(filters)
                        .populate('user_ids', 'fullName email')
                        .sort({ created_at: -1 })
                        .skip(skip)
                        .limit(limitNum);

                    total = await Notification.countDocuments(filters);
                    break;

                case 'attendance':
                case 'optimizedattendance':
                    // OptimizedAttendance uchun maxsus filterlar
                    const attendanceQuery = { type: 'realtime' };
                    if (filters.date) attendanceQuery.date = filters.date;
                    if (filters.shift_no !== undefined) attendanceQuery.shift_no = filters.shift_no ? parseInt(filters.shift_no) : null;
                    if (filters.viloyat_id) attendanceQuery['viloyat.id'] = parseInt(filters.viloyat_id);

                    data = await OptimizedAttendance.find(attendanceQuery)
                        .sort({ timestamp: -1 })
                        .skip(skip)
                        .limit(limitNum);

                    total = await OptimizedAttendance.countDocuments(attendanceQuery);
                    break;

                case 'stats':
                    data = await Stats.find(filters)
                        .sort({ date: -1, region_id: 1 })
                        .skip(skip)
                        .limit(limitNum);

                    total = await Stats.countDocuments(filters);
                    break;

                default:
                    return res.status(400).json({
                        success: false,
                        message: `Noma'lum model: ${model}. Mavjud modellar: appeals, companies, sectors, notifications, attendance, stats`
                    });
            }

            return res.status(200).json({
                success: true,
                data,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(total / limitNum),
                    totalItems: total,
                    itemsPerPage: limitNum
                }
            });

        } catch (error) {
            console.error('GetterAll xatosi:', error);
            return res.status(500).json({
                success: false,
                message: 'Server xatosi',
                error: error.message
            });
        }
    }







    // Additional 

    // 1. Appeals ma'lumotlarini olish
    async getAppeals(req, res) {
        try {
            const { page = 1, limit = 20, ...filters } = req.query;
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const skip = (pageNum - 1) * limitNum;

            const data = await Appeal.find(filters)
                .populate('adminResponse.respondedBy', 'fullName email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum);

            const total = await Appeal.countDocuments(filters);

            return res.status(200).json({
                success: true,
                data,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(total / limitNum),
                    totalItems: total,
                    itemsPerPage: limitNum
                }
            });
        } catch (error) {
            console.error('getAppeals xatosi:', error);
            return res.status(500).json({ success: false, message: 'Server xatosi', error: error.message });
        }
    }

    // 2. Companies ma'lumotlarini olish
    async getCompanies(req, res) {
        try {
            const { page = 1, limit = 20, ...filters } = req.query;
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const skip = (pageNum - 1) * limitNum;

            const data = await Company.find(filters)
                .sort({ name: 1 })
                .skip(skip)
                .limit(limitNum);

            const total = await Company.countDocuments(filters);

            return res.status(200).json({
                success: true,
                data,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(total / limitNum),
                    totalItems: total,
                    itemsPerPage: limitNum
                }
            });
        } catch (error) {
            console.error('getCompanies xatosi:', error);
            return res.status(500).json({ success: false, message: 'Server xatosi', error: error.message });
        }
    }

    // 3. Sectors ma'lumotlarini olish
    async getSectors(req, res) {
        try {
            const { page = 1, limit = 20, ...filters } = req.query;
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const skip = (pageNum - 1) * limitNum;

            const data = await Sector.find(filters)
                .sort({ name: 1 })
                .skip(skip)
                .limit(limitNum);

            const total = await Sector.countDocuments(filters);

            return res.status(200).json({
                success: true,
                data,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(total / limitNum),
                    totalItems: total,
                    itemsPerPage: limitNum
                }
            });
        } catch (error) {
            console.error('getSectors xatosi:', error);
            return res.status(500).json({ success: false, message: 'Server xatosi', error: error.message });
        }
    }

    // 4. Notifications ma'lumotlarini olish
    async getNotifications(req, res) {
        try {
            const { page = 1, limit = 20, ...filters } = req.query;
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const skip = (pageNum - 1) * limitNum;

            const data = await Notification.find(filters)
                .populate('user_ids', 'fullName email')
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limitNum);

            const total = await Notification.countDocuments(filters);

            return res.status(200).json({
                success: true,
                data,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(total / limitNum),
                    totalItems: total,
                    itemsPerPage: limitNum
                }
            });
        } catch (error) {
            console.error('getNotifications xatosi:', error);
            return res.status(500).json({ success: false, message: 'Server xatosi', error: error.message });
        }
    }

    // 5. OptimizedAttendance (davomat) ma'lumotlarini olish
    async getAttendance(req, res) {
        try {
            const { page = 1, limit = 20, date, shift_no, viloyat_id } = req.query;
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const skip = (pageNum - 1) * limitNum;

            const query = { type: 'realtime' };
            if (date) query.date = date;
            if (shift_no !== undefined) {
                query.shift_no = shift_no === '' || shift_no === 'null' ? null : parseInt(shift_no);
            }
            if (viloyat_id) query['viloyat.id'] = parseInt(viloyat_id);

            const data = await OptimizedAttendance.find(query)
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limitNum);

            const total = await OptimizedAttendance.countDocuments(query);

            return res.status(200).json({
                success: true,
                data,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(total / limitNum),
                    totalItems: total,
                    itemsPerPage: limitNum
                }
            });
        } catch (error) {
            console.error('getAttendance xatosi:', error);
            return res.status(500).json({ success: false, message: 'Server xatosi', error: error.message });
        }
    }

    // 6. Stats ma'lumotlarini olish
    async getStats(req, res) {
        try {
            const { page = 1, limit = 20, ...filters } = req.query;
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const skip = (pageNum - 1) * limitNum;

            const data = await Stats.find(filters)
                .sort({ date: -1, region_id: 1 })
                .skip(skip)
                .limit(limitNum);

            const total = await Stats.countDocuments(filters);

            return res.status(200).json({
                success: true,
                data,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(total / limitNum),
                    totalItems: total,
                    itemsPerPage: limitNum
                }
            });
        } catch (error) {
            console.error('getStats xatosi:', error);
            return res.status(500).json({ success: false, message: 'Server xatosi', error: error.message });
        }
    }
}

module.exports  = AdditionalController;