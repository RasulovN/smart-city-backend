const sector = require('../../models/sector');

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
}

module.exports = new UiController();