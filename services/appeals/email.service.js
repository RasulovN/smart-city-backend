const nodemailer = require('nodemailer');
const logger = {
    info: (message, data) => console.log(`[INFO] ${message}`, data || ''),
    error: (message, error) => console.error(`[ERROR] ${message}`, error || ''),
    warn: (message, data) => console.warn(`[WARN] ${message}`, data || '')
};

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        this.fromEmail = process.env.FROM_EMAIL || 'noreply@smartcity.uz';
        // this.adminEmail = process.env.ADMIN_EMAIL || 'admin@smartcity.uz';
        this.adminEmail = process.env.ADMIN_EMAIL || 'nurbekrasulov71@gmail.com';
    }

    // Send email when new appeal is created
    async sendAppealConfirmation(appeal) {
        try {
            const mailOptions = {
                from: this.fromEmail,
                to: appeal.email,
                subject: 'Murojaatingiz qabul qilindi',
                html: this.getAppealConfirmationTemplate(appeal)
            };

            await this.transporter.sendMail(mailOptions);
            logger.info(`Appeal confirmation sent to: ${appeal.email}`, { appealId: appeal._id });

        } catch (error) {
            console.error('Error sending appeal confirmation:', error);
        }
    }

    // Send email to admin about new appeal
    async sendAdminNotification(appeal) {
        try {
            const mailOptions = {
                from: this.fromEmail,
                to: this.adminEmail,
                subject: `Yangi murojaat: ${appeal.title}`,
                html: this.getAdminNotificationTemplate(appeal)
            };

            await this.transporter.sendMail(mailOptions);
            logger.info(`Admin notification sent for appeal: ${appeal._id}`);

        } catch (error) {
            logger.error('Error sending admin notification:', error);
        }
    }

    // Send email to sector-specific admin about new appeal
    async sendSectorAdminNotification(appeal, sectorAdminEmail, sector) {
        try {
            const mailOptions = {
                from: this.fromEmail,
                to: sectorAdminEmail,
                subject: `Yangi ${this.getSectorText(sector)} sektor murojaati: ${appeal.title}`,
                html: this.getSectorAdminNotificationTemplate(appeal, sector)
            };

            await this.transporter.sendMail(mailOptions);
            logger.info(`Sector admin notification sent to: ${sectorAdminEmail} for appeal: ${appeal._id}`);

        } catch (error) {
            logger.error('Error sending sector admin notification:', error);
        }
    }

    // Send email to appeals admin about new appeal
    async sendAppealsAdminNotification(appeal, appealsAdminEmail) {
        try {
            const mailOptions = {
                from: this.fromEmail,
                to: appealsAdminEmail,
                subject: `Yangi murojaat (${this.getSectorText(appeal.sector)} sektor): ${appeal.title}`,
                html: this.getAppealsAdminNotificationTemplate(appeal)
            };

            await this.transporter.sendMail(mailOptions);
            logger.info(`Appeals admin notification sent to: ${appealsAdminEmail} for appeal: ${appeal._id}`);

        } catch (error) {
            logger.error('Error sending appeals admin notification:', error);
        }
    }

    // Send email when appeal status is updated
    async sendStatusUpdateNotification(appeal, oldStatus) {
        try {
            if (!appeal.email) return; // Skip if no email provided

            const mailOptions = {
                from: this.fromEmail,
                to: appeal.email,
                subject: `Murojaatingiz holati yangilandi: ${this.getStatusText(appeal.status)}`,
                html: this.getStatusUpdateTemplate(appeal, oldStatus)
            };

            await this.transporter.sendMail(mailOptions);
            logger.info(`Status update notification sent to: ${appeal.email}`, { 
                appealId: appeal._id, 
                oldStatus, 
                newStatus: appeal.status 
            });

        } catch (error) {
            logger.error('Error sending status update notification:', error);
        }
    }

    // Send follow-up reminder email
    async sendFollowUpReminder(appeal) {
        try {
            if (!appeal.email) return;

            const mailOptions = {
                from: this.fromEmail,
                to: appeal.email,
                subject: 'Murojaatingizni kuzatib borish',
                html: this.getFollowUpTemplate(appeal)
            };

            await this.transporter.sendMail(mailOptions);
            logger.info(`Follow-up reminder sent to: ${appeal.email}`, { appealId: appeal._id });

        } catch (error) {
            logger.error('Error sending follow-up reminder:', error);
        }
    }

    // Send daily summary to admin
    async sendDailySummary(appeals, date) {
        try {
            const mailOptions = {
                from: this.fromEmail,
                to: this.adminEmail,
                subject: `Kundalik murojaatlar hisoboti - ${date}`,
                html: this.getDailySummaryTemplate(appeals, date)
            };

            await this.transporter.sendMail(mailOptions);
            logger.info(`Daily summary sent to admin for date: ${date}`);

        } catch (error) {
            logger.error('Error sending daily summary:', error);
        }
    }

    // Email templates
    getAppealConfirmationTemplate(appeal) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Murojaat Qabul Qilindi</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background-color: #f9f9f9; }
                    .footer { padding: 20px; text-align: center; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>✅ Murojaatingiz Qabul Qilindi</h1>
                    </div>
                    <div class="content">
                        <h2>Hurmatli ${appeal.firstName} ${appeal.lastName}!</h2>
                        <p>Sizning murojaatingiz muvaffaqiyatli qabul qilindi va tez orada ko'rib chiqiladi.</p>
                        
                        <h3>Murojaat tafsilotlari:</h3>
                        <ul>
                            <li><strong>Murojaat raqami:</strong> ${appeal._id}</li>
                            <li><strong>Sarlavha:</strong> ${appeal.title}</li>
                            <li><strong>Tur:</strong> ${this.getTypeText(appeal.type)}</li>
                            <li><strong>Sektor:</strong> ${this.getSectorText(appeal.sector)}</li>
                            <li><strong>Holat:</strong> ${this.getStatusText(appeal.status)}</li>
                            <li><strong>Sana:</strong> ${appeal.createdAt.toLocaleString('uz-UZ')}</li>
                        </ul>
                        
                        <p><strong>Izoh:</strong> Murojaatingizning holati o'zgarganda sizga xabar beramiz.</p>
                        
                        <p>Agar savollaringiz bo'lsa, biz bilan bog'laning.</p>
                    </div>
                    <div class="footer">
                        <p>Smart City Platform<br>
                        Bu xabar avtomatik tarzda yuborilgan.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    getAdminNotificationTemplate(appeal) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Yangi Murojaat</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #ff9800; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background-color: #f9f9f9; }
                    .priority-urgent { border-left: 5px solid #f44336; }
                    .priority-high { border-left: 5px solid #ff9800; }
                    .priority-medium { border-left: 5px solid #2196F3; }
                    .priority-low { border-left: 5px solid #4CAF50; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📋 Yangi Murojaat</h1>
                    </div>
                    <div class="content priority-${appeal.priority}">
                        <h2>${appeal.title}</h2>
                        <p><strong>Murojaat raqami:</strong> ${appeal._id}</p>
                        <p><strong>Muallif:</strong> ${appeal.firstName} ${appeal.lastName}</p>
                        <p><strong>Email:</strong> ${appeal.email || 'Ko\'rsatilmagan'}</p>
                        <p><strong>Telefon:</strong> ${appeal.phone || 'Ko\'rsatilmagan'}</p>
                        <p><strong>Tur:</strong> ${this.getTypeText(appeal.type)}</p>
                        <p><strong>Sektor:</strong> ${this.getSectorText(appeal.sector)}</p>
                        <p><strong>Ustuvorlik:</strong> ${this.getPriorityText(appeal.priority)}</p>
                        <p><strong>Sana:</strong> ${appeal.createdAt.toLocaleString('uz-UZ')}</p>
                        
                        <h3>Xabar:</h3>
                        <p>${appeal.message}</p>
                        
                        ${appeal.location ? `
                        <h3>Manzil:</h3>
                        <p>${appeal.location.address || 'Ko\'rsatilmagan'}</p>
                        ` : ''}
                        
                        <p><a href="${process.env.ADMIN_URL || 'http://localhost:3000'}/admin/appeals/${appeal._id}" 
                              style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                            Murojaatni Ko'rish
                        </a></p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    getSectorAdminNotificationTemplate(appeal, sector) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Yangi ${this.getSectorText(sector)} Sektor Murojaati</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background-color: #f9f9f9; }
                    .priority-urgent { border-left: 5px solid #f44336; }
                    .priority-high { border-left: 5px solid #ff9800; }
                    .priority-medium { border-left: 5px solid #2196F3; }
                    .priority-low { border-left: 5px solid #4CAF50; }
                    .sector-badge { background-color: #4CAF50; color: white; padding: 5px 10px; border-radius: 15px; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🏢 ${this.getSectorText(sector)} Sektor</h1>
                        <p>Yangi murojaatingiz bor</p>
                    </div>
                    <div class="content priority-${appeal.priority}">
                        <div style="text-align: center; margin-bottom: 15px;">
                            <span class="sector-badge">${this.getSectorText(sector)} sektor</span>
                        </div>
                        
                        <h2>${appeal.title}</h2>
                        <p><strong>Murojaat raqami:</strong> ${appeal._id}</p>
                        <p><strong>Muallif:</strong> ${appeal.firstName} ${appeal.lastName}</p>
                        <p><strong>Email:</strong> ${appeal.email || 'Ko\'rsatilmagan'}</p>
                        <p><strong>Telefon:</strong> ${appeal.phone || 'Ko\'rsatilmagan'}</p>
                        <p><strong>Tur:</strong> ${this.getTypeText(appeal.type)}</p>
                        <p><strong>Ustuvorlik:</strong> ${this.getPriorityText(appeal.priority)}</p>
                        <p><strong>Sana:</strong> ${appeal.createdAt.toLocaleString('uz-UZ')}</p>
                        
                        <h3>Xabar:</h3>
                        <p>${appeal.message}</p>
                        
                        ${appeal.location ? `
                        <h3>Manzil:</h3>
                        <p>${appeal.location.address || 'Ko\'rsatilmagan'}</p>
                        ` : ''}
                        
                        <p><a href="${process.env.ADMIN_URL || 'http://localhost:3000'}/admin/appeals/${appeal._id}" 
                              style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                            Murojaatni Ko'rish
                        </a></p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    getAppealsAdminNotificationTemplate(appeal) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Yangi Murojaat (${this.getSectorText(appeal.sector)} sektor)</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background-color: #f9f9f9; }
                    .priority-urgent { border-left: 5px solid #f44336; }
                    .priority-high { border-left: 5px solid #ff9800; }
                    .priority-medium { border-left: 5px solid #2196F3; }
                    .priority-low { border-left: 5px solid #4CAF50; }
                    .admin-info { background-color: #e3f2fd; padding: 10px; border-radius: 5px; margin: 10px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📊 Murojaatlar Boshqaruvi</h1>
                        <p>Yangi murojaat tizimga keldi</p>
                    </div>
                    <div class="content priority-${appeal.priority}">
                        <div class="admin-info">
                            <p><strong>🔄 Sektor Admni:</strong> ${this.getSectorText(appeal.sector)} sektor adminiga xabar yuborildi</p>
                            <p><strong>📋 Asosiy Admin:</strong> Bu murojaat sizga ham ko'rinadi</p>
                        </div>
                        
                        <h2>${appeal.title}</h2>
                        <p><strong>Murojaat raqami:</strong> ${appeal._id}</p>
                        <p><strong>Muallif:</strong> ${appeal.firstName} ${appeal.lastName}</p>
                        <p><strong>Email:</strong> ${appeal.email || 'Ko\'rsatilmagan'}</p>
                        <p><strong>Telefon:</strong> ${appeal.phone || 'Ko\'rsatilmagan'}</p>
                        <p><strong>Tur:</strong> ${this.getTypeText(appeal.type)}</p>
                        <p><strong>Sektor:</strong> ${this.getSectorText(appeal.sector)}</p>
                        <p><strong>Ustuvorlik:</strong> ${this.getPriorityText(appeal.priority)}</p>
                        <p><strong>Sana:</strong> ${appeal.createdAt.toLocaleString('uz-UZ')}</p>
                        
                        <h3>Xabar:</h3>
                        <p>${appeal.message}</p>
                        
                        ${appeal.location ? `
                        <h3>Manzil:</h3>
                        <p>${appeal.location.address || 'Ko\'rsatilmagan'}</p>
                        ` : ''}
                        
                        <p><a href="${process.env.ADMIN_URL || 'http://localhost:3000'}/admin/appeals/${appeal._id}" 
                              style="background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                            Murojaatni Ko'rish
                        </a></p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    getStatusUpdateTemplate(appeal, oldStatus) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Murojaat Holati Yangilandi</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background-color: #f9f9f9; }
                    .status-change { background-color: #e8f5e8; padding: 10px; border-radius: 5px; margin: 10px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📱 Murojaat Holati Yangilandi</h1>
                    </div>
                    <div class="content">
                        <h2>Hurmatli ${appeal.firstName} ${appeal.lastName}!</h2>
                        
                        <div class="status-change">
                            <p><strong>Holat o'zgartirildi:</strong></p>
                            <p>${this.getStatusText(oldStatus)} → ${this.getStatusText(appeal.status)}</p>
                        </div>
                        
                        ${appeal.adminResponse?.message ? `
                        <h3>Admin javobi:</h3>
                        <p>${appeal.adminResponse.message}</p>
                        <p><em>Javob berilgan sana: ${appeal.adminResponse.respondedAt?.toLocaleString('uz-UZ')}</em></p>
                        ` : ''}
                        
                        <h3>Murojaat tafsilotlari:</h3>
                        <ul>
                            <li><strong>Murojaat raqami:</strong> ${appeal._id}</li>
                            <li><strong>Sarlavha:</strong> ${appeal.title}</li>
                            <li><strong>Yangilangan sana:</strong> ${appeal.updatedAt.toLocaleString('uz-UZ')}</li>
                        </ul>
                        
                        <p>Agar qo'shimcha savollaringiz bo'lsa, biz bilan bog'laning.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    getFollowUpTemplate(appeal) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Murojaatni Kuzatib Borish</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #9C27B0; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background-color: #f9f9f9; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>⏰ Murojaatni Kuzatib Borish</h1>
                    </div>
                    <div class="content">
                        <h2>Hurmatli ${appeal.firstName} ${appeal.lastName}!</h2>
                        
                        <p>Sizning murojaatingiz hali ham ko'rib chiqilmoqda. Biz sizning murojaatingizga tez orada javob beramiz.</p>
                        
                        <h3>Murojaat holati:</h3>
                        <p><strong>Joriy holat:</strong> ${this.getStatusText(appeal.status)}</p>
                        <p><strong>Kutilayotgan sana:</strong> ${appeal.followUpDate?.toLocaleDateString('uz-UZ') || 'Belgilab olinmagan'}</p>
                        
                        <h3>Murojaat tafsilotlari:</h3>
                        <ul>
                            <li><strong>Murojaat raqami:</strong> ${appeal._id}</li>
                            <li><strong>Sarlavha:</strong> ${appeal.title}</li>
                            <li><strong>Yaratilgan sana:</strong> ${appeal.createdAt.toLocaleString('uz-UZ')}</li>
                        </ul>
                        
                        <p>Sabr qiling, tez orada natija bo'ladi!</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    getDailySummaryTemplate(appeals, date) {
        const totalCount = appeals.length;
        const byStatus = {};
        const byType = {};
        
        appeals.forEach(appeal => {
            byStatus[appeal.status] = (byStatus[appeal.status] || 0) + 1;
            byType[appeal.type] = (byType[appeal.type] || 0) + 1;
        });

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Kundalik Murojaatlar Hisoboti</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #607D8B; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background-color: #f9f9f9; }
                    .stats { background-color: white; padding: 15px; border-radius: 5px; margin: 10px 0; }
                    .stat-item { margin: 5px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📊 Kundalik Hisobot</h1>
                        <p>${date}</p>
                    </div>
                    <div class="content">
                        <div class="stats">
                            <h2>Umumiy statistika</h2>
                            <div class="stat-item"><strong>Jami murojaatlar:</strong> ${totalCount}</div>
                        </div>
                        
                        <div class="stats">
                            <h3>Holat bo'yicha:</h3>
                            ${Object.entries(byStatus).map(([status, count]) => 
                                `<div class="stat-item">${this.getStatusText(status)}: ${count}</div>`
                            ).join('')}
                        </div>
                        
                        <div class="stats">
                            <h3>Tur bo'yicha:</h3>
                            ${Object.entries(byType).map(([type, count]) => 
                                `<div class="stat-item">${this.getTypeText(type)}: ${count}</div>`
                            ).join('')}
                        </div>
                        
                        <p><a href="${process.env.ADMIN_URL || 'http://localhost:3000'}/admin/appeals" 
                              style="background-color: #607D8B; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                            Batafsil Ma'lumot
                        </a></p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    // Helper methods for text translation
    getStatusText(status) {
        const statusMap = {
            'open': 'Ochiq',
            'in_progress': 'Jarayonda',
            'waiting_response': 'Javob kutish',
            'closed': 'Yopilgan',
            'rejected': 'Rad etilgan'
        };
        return statusMap[status] || status;
    }

    getTypeText(type) {
        const typeMap = {
            'complaint': 'Shikoyat',
            'suggestion': 'Taklif',
            'question': 'Savol',
            'request': 'So\'rov',
            'appreciation': 'Minnatdorchilik',
            'other': 'Boshqa'
        };
        return typeMap[type] || type;
    }

    getSectorText(sector) {
        const sectorMap = {
            'infrastructure': 'Infratuzilma',
            'environment': 'Atrof-muhit',
            'ecology': 'Ekologiya',
            'transport': 'Transport',
            'health': 'Salomatlik',
            'education': 'Ta\'lim',
            'social': 'Ijtimoiy',
            'economic': 'Iqtisodiy',
            'other': 'Boshqa'
        };
        return sectorMap[sector] || sector;
    }

    getPriorityText(priority) {
        const priorityMap = {
            'low': 'Past',
            'medium': 'O\'rta',
            'high': 'Yuqori',
            'urgent': 'Shoshilinch'
        };
        return priorityMap[priority] || priority;
    }

    // Test email configuration
    async testConnection() {
        try {
            await this.transporter.verify();
            logger.info('Email service connection successful');
            return true;
        } catch (error) {
            logger.error('Email service connection failed:', error);
            return false;
        }
    }
}

module.exports = new EmailService();