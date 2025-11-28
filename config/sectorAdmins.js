// Sector admin email configuration
// This can be moved to environment variables or database in production

const sectorAdmins = {
    'infrastructure': process.env.INFRASTRUCTURE_ADMIN_EMAIL || 'infrastructure@smartcity.uz',
    'environment': process.env.ENVIRONMENT_ADMIN_EMAIL || 'environment@smartcity.uz',
    'ecology': process.env.ECOLOGY_ADMIN_EMAIL || 'ecology@smartcity.uz',
    'transport': process.env.TRANSPORT_ADMIN_EMAIL || 'transport@smartcity.uz',
    'health': process.env.HEALTH_ADMIN_EMAIL || 'health@smartcity.uz',
    'education': process.env.EDUCATION_ADMIN_EMAIL || 'education@smartcity.uz',
    'social': process.env.SOCIAL_ADMIN_EMAIL || 'social@smartcity.uz',
    'economic': process.env.ECONOMIC_ADMIN_EMAIL || 'economic@smartcity.uz',
    'other': process.env.OTHER_ADMIN_EMAIL || 'other@smartcity.uz'
};

// Appeals admin (main admin)
const appealsAdmin = process.env.APPEALS_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'nurbekrasulov71@gmail.com';

module.exports = {
    sectorAdmins,
    appealsAdmin
};