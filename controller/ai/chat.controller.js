const Appeal = require('../../models/appeals'); // to'g'ri yo'lni o'zgartiring
const Company = require('../../models/company');
const Sector = require('../../models/sector');
const Notification = require('../../models/notification');
const OptimizedAttendance = require('../../models/OptimizedAttendance');
const Stats = require('../../models/Stats');
const { spawn } = require('child_process');
const AdditionalController = require('./additonal.controller');

class AiChatController {
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

    // AI Chat method
    async chat(req, res) {
        try {
            const { message } = req.body;

            if (!message) {
                return res.status(400).json({
                    success: false,
                    message: "Iltimos, xabar yuboring"
                });
            }

            // AI orqali foydalanuvchi xabarini tahlil qilish
            const aiResponse = await AiChatController.analyzeWithAIStatic(message);
            
            if (!aiResponse.shouldFetchData) {
                return res.status(200).json({
                    success: true,
                    message: aiResponse.response,
                    data: null
                });
            }

            // Ma'lumotlarni olish
            const additionalController = new AdditionalController();
            const data = await AiChatController.fetchDataByTypeStatic(aiResponse.dataType, additionalController);

            return res.status(200).json({
                success: true,
                message: aiResponse.response,
                data: data.data,
                totalItems: data.total
            });

        } catch (error) {
            console.error('Chat xatosi:', error);
            return res.status(500).json({
                success: false,
                message: 'Server xatosi',
                error: error.message
            });
        }
    }

    // AI bilan xabarni tahlil qilish (simple rule-based version)
    static analyzeWithAIStatic(message) {
        const lowerMessage = message.toLowerCase();
        
        // Simple keyword matching for testing
        if (lowerMessage.includes('appeal') || lowerMessage.includes('murojaat')) {
            return {
                shouldFetchData: true,
                dataType: 'appeals',
                response: "Oxirgi murojaatlar ro'yxati tayyorlandi."
            };
        } else if (lowerMessage.includes('company') || lowerMessage.includes('kompaniya')) {
            return {
                shouldFetchData: true,
                dataType: 'companies',
                response: "Kompaniyalar ro'yxati tayyorlandi."
            };
        } else if (lowerMessage.includes('sector') || lowerMessage.includes('sektor')) {
            return {
                shouldFetchData: true,
                dataType: 'sectors',
                response: "Sektorlar ro'yxati tayyorlandi."
            };
        } else if (lowerMessage.includes('notification') || lowerMessage.includes('bildirishnoma')) {
            return {
                shouldFetchData: true,
                dataType: 'notifications',
                response: "Bildirishnomalar ro'yxati tayyorlandi."
            };
        } else if (lowerMessage.includes('attendance') || lowerMessage.includes('davomat')) {
            return {
                shouldFetchData: true,
                dataType: 'attendance',
                response: "Davomat ma'lumotlari tayyorlandi."
            };
        } else if (lowerMessage.includes('stats') || lowerMessage.includes('statistika')) {
            return {
                shouldFetchData: true,
                dataType: 'stats',
                response: "Statistika ma'lumotlari tayyorlandi."
            };
        } else {
            return {
                shouldFetchData: false,
                dataType: null,
                response: "Kechirasiz, sizning so'rovingizni tushunmadim. Iltimos, aniq ma'lumot turini so'rang (murojaatlar, kompaniyalar, sektorlar, bildirishnomalar, davomat, statistika)."
            };
        }
    }

    // Ma'lumot turi bo'yicha data olish
    static async fetchDataByTypeStatic(dataType, additionalController) {
        try {
            const mockReq = { query: { limit: 10 } }; // Oxirgi 10 ta yozuv
            const mockRes = {
                status: (code) => ({
                    json: (data) => {
                        if (code === 200) {
                            return { data: data.data, total: data.pagination.totalItems };
                        }
                        throw new Error(data.message || 'Ma\'lumot olishda xatolik');
                    }
                })
            };

            switch (dataType) {
                case 'appeals':
                    return await AiChatController.callControllerMethod(additionalController, 'getAppeals', mockReq, mockRes);
                case 'companies':
                    return await AiChatController.callControllerMethod(additionalController, 'getCompanies', mockReq, mockRes);
                case 'sectors':
                    return await AiChatController.callControllerMethod(additionalController, 'getSectors', mockReq, mockRes);
                case 'notifications':
                    return await AiChatController.callControllerMethod(additionalController, 'getNotifications', mockReq, mockRes);
                case 'attendance':
                    return await AiChatController.callControllerMethod(additionalController, 'getAttendance', mockReq, mockRes);
                case 'stats':
                    return await AiChatController.callControllerMethod(additionalController, 'getStats', mockReq, mockRes);
                default:
                    throw new Error('Noma\'lum ma\'lumot turi');
            }
        } catch (error) {
            console.error('Data fetch error:', error);
            throw error;
        }
    }

    // Helper method to call controller methods
    static async callControllerMethod(controller, methodName, req, res) {
        return new Promise((resolve, reject) => {
            try {
                const method = controller[methodName];
                if (typeof method !== 'function') {
                    throw new Error(`Method ${methodName} not found`);
                }
                
                // Call the method
                const result = method.call(controller, req, res);
                
                // If it returns a promise, wait for it
                if (result && typeof result.then === 'function') {
                    result.then(resolve).catch(reject);
                } else {
                    resolve(result);
                }
            } catch (error) {
                reject(error);
            }
        });
    }
}

module.exports = AiChatController;