const express = require('express');
const router = express.Router();
const adminController = require('../controller/admin.controller');
const { verifyToken, isSuperAdmin, isAdmin } = require('../middleware/auth.middleware');
const sectorController = require('../controller/sector.controller');
const companyController = require('../controller/company.controller');

// =============================================================================
// USER MANAGEMENT ROUTES
// =============================================================================

// Public registration route (no authentication required)
router.post('/register', adminController.register);

// All other routes require authentication and admin privileges

// Admin and Super Admin - Create new admin or sector admin
router.post('/users', verifyToken, isAdmin, adminController.createUser);

// Admin and Super Admin - View users
router.get('/users', verifyToken, isAdmin, adminController.getAllUsers);

// Admin and Super Admin - Get user by ID
router.get('/users/:id', verifyToken, isAdmin, adminController.getUserById);

// Admin and Super Admin - Modify users
router.put('/users/:id', verifyToken, isAdmin, adminController.updateUser);
router.delete('/users/:id', verifyToken, isAdmin, adminController.deleteUser);

// Admin and Super Admin - User status management
router.patch('/users/:id/deactivate', verifyToken, isAdmin, adminController.deactivateUser);
router.patch('/users/:id/activate', verifyToken, isAdmin, adminController.activateUser);
router.post('/users/:id/reset-password', verifyToken, isAdmin, adminController.resetUserPassword);

// Admin and Super Admin - Get users by sector
router.get('/users/sector/:sector', verifyToken, isAdmin, adminController.getUsersBySector);

// =============================================================================
// SECTOR MANAGEMENT ROUTES
// =============================================================================

// Create sector (Admin & Super Admin)
router.post('/sectors', verifyToken, isAdmin, sectorController.createSector);

// Get all sectors (Public access)
router.get('/sectors', sectorController.getAllSectors);

// Get sector by ID (Public access)
router.get('/sectors/:id', sectorController.getSectorById);

// Get sector by slug (Public access)
router.get('/sectors/slug/:slug', sectorController.getSectorBySlug);

// Update sector (Admin & Super Admin)
router.put('/sectors/:id', verifyToken, isAdmin, sectorController.updateSector);

// Delete sector (Admin & Super Admin)
router.delete('/sectors/:id', verifyToken, isAdmin, sectorController.deleteSector);

// Deactivate sector (Admin & Super Admin)
router.patch('/sectors/:id/deactivate', verifyToken, isAdmin, sectorController.deactivateSector);

// Activate sector (Admin & Super Admin)
router.patch('/sectors/:id/activate', verifyToken, isAdmin, sectorController.activateSector);

// =============================================================================
// COMPANY/ORGANIZATION MANAGEMENT ROUTES
// =============================================================================

// Create new company/organization (Admin & Super Admin)
router.post('/companies', verifyToken, isAdmin, companyController.createCompany);

// Get all companies/organizations (Admin & Super Admin)
router.get('/companies', verifyToken, isAdmin, companyController.getAllCompanies);

// Get company by ID (Admin & Super Admin)
router.get('/companies/:id', verifyToken, isAdmin, companyController.getCompanyById);

// Get company by slug (Admin & Super Admin)
router.get('/companies/slug/:slug', verifyToken, isAdmin, companyController.getCompanyBySlug);

// Update company/organization (Admin & Super Admin)
router.put('/companies/:id', verifyToken, isAdmin, companyController.editCompany);

// Soft delete company/organization (Admin & Super Admin)
router.delete('/companies/:id', verifyToken, isAdmin, companyController.deleteCompany);

// Hard delete company/organization (Admin & Super Admin only)
router.delete('/companies/:id/hard', verifyToken, isSuperAdmin, companyController.hardDeleteCompany);

// Toggle company status (Admin & Super Admin)
router.patch('/companies/:id/toggle-status', verifyToken, isAdmin, companyController.toggleCompanyStatus);

// Get company statistics (Admin & Super Admin)
router.get('/companies/statistics', verifyToken, isAdmin, companyController.getCompanyStatistics);

// Get companies by sector (Admin & Super Admin)
router.get('/companies/sector/:sector', verifyToken, isAdmin, companyController.getCompaniesBySector);

// Get companies by type (government/non-government) (Admin & Super Admin)
router.get('/companies/type/:type', verifyToken, isAdmin, companyController.getCompaniesByType);

module.exports = router;
