const Company = require('../models/company');
const slugify = require('slugify');
const mongoose = require('mongoose');

// company controller
class CompanyController {
    // Create new company/organization
    async createCompany(req, res, next) {
        try {
            const {
                name,
                description,
                sector,
                email,
                phone,
                inn,
                type,
                address,
                isActive = true
            } = req.body;

            // Validation
            if (!name || !description || !sector) {
                return res.status(400).json({
                    success: false,
                    message: 'Name, description, and sector are required fields'
                });
            }

            // Validate sector
            const validSectors = ['infrastructure', 'environment', 'transport', 'health', 'education', 'social', 'economic', 'other', "ecology", "appeals", "utilities"];
            if (!validSectors.includes(sector)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid sector. Must be one of: ' + validSectors.join(', ')
                });
            }

            // Validate type
            const validTypes = ['government', 'nongovernment', 'other'];
            if (type && !validTypes.includes(type)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid type. Must be one of: ' + validTypes.join(', ')
                });
            }

            // Generate unique slug
            let baseSlug = slugify(name, { lower: true, strict: true });
            let slug = baseSlug;
            let counter = 1;

            // Check if slug exists and generate unique one
            while (await Company.findOne({ slug })) {
                slug = `${baseSlug}-${counter}`;
                counter++;
            }

            // Create company
            const company = new Company({
                name,
                slug,
                description,
                sector,
                email,
                phone,
                inn,
                type,
                address,
                isActive
            });

            await company.save();

            res.status(201).json({
                success: true,
                message: 'Organization created successfully',
                data: company
            });

        } catch (error) {
            if (error.code === 11000) {
                return res.status(409).json({
                    success: false,
                    message: 'Organization with this name or slug already exists'
                });
            }
            next(error);
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

            // Build filter object
            const filter = {};

            // Apply filters
            if (sector) {
                filter.sector = sector;
            }

            if (type) {
                filter.type = type;
            }

            if (isActive !== undefined) {
                filter.isActive = isActive === 'true';
            }

            // Search functionality
            if (search) {
                filter.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                    { inn: { $regex: search, $options: 'i' } }
                ];
            }

            // Calculate pagination
            const skip = (parseInt(page) - 1) * parseInt(limit);

            // Build sort object
            const sort = {};
            sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

            // Execute query
            const companies = await Company.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit));

            // Get total count for pagination
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

    // Get company by ID
    async getCompanyById(req, res, next) {
        try {
            const { id } = req.params;

            // Validate MongoDB ObjectId
            if (!mongoose.isValidObjectId(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid organization ID format'
                });
            }

            const company = await Company.findById(id);

            if (!company) {
                return res.status(404).json({
                    success: false,
                    message: 'Organization not found'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Organization retrieved successfully',
                data: company
            });

        } catch (error) {
            next(error);
        }
    }

    // Get company by slug
    async getCompanyBySlug(req, res, next) {
        try {
            const { slug } = req.params;

            const company = await Company.findOne({ slug });

            if (!company) {
                return res.status(404).json({
                    success: false,
                    message: 'Organization not found'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Organization retrieved successfully',
                data: company
            });

        } catch (error) {
            next(error);
        }
    }

    // Edit company by ID
    async editCompany(req, res, next) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            // Validate MongoDB ObjectId
            if (!mongoose.isValidObjectId(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid organization ID format'
                });
            }

            // Remove fields that shouldn't be updated directly
            delete updateData._id;
            delete updateData.createdAt;
            delete updateData.slug; // Keep slug stable for URLs

            // Validate sector if provided
            if (updateData.sector) {
                const validSectors = ['infrastructure', 'environment', 'transport', 'health', 'education', 'social', 'economic', 'other', "ecology", "utilities"];
                if (!validSectors.includes(updateData.sector)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid sector'
                    });
                }
            }

            // Validate type if provided
            if (updateData.type) {
                const validTypes = ['government', 'nongovernment', 'other'];
                if (!validTypes.includes(updateData.type)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid type'
                    });
                }
            }

            // Check if company exists
            const existingCompany = await Company.findById(id);
            if (!existingCompany) {
                return res.status(404).json({
                    success: false,
                    message: 'Organization not found'
                });
            }

            // Update the company
            const updatedCompany = await Company.findByIdAndUpdate(
                id,
                { 
                    ...updateData,
                    updatedAt: new Date()
                },
                { new: true, runValidators: true }
            );

            res.status(200).json({
                success: true,
                message: 'Organization updated successfully',
                data: updatedCompany
            });

        } catch (error) {
            next(error);
        }
    }

    // Delete company (soft delete by setting isActive to false)
    async deleteCompany(req, res, next) {
        try {
            const { id } = req.params;

            // Validate MongoDB ObjectId
            if (!mongoose.isValidObjectId(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid organization ID format'
                });
            }

            const company = await Company.findById(id);

            if (!company) {
                return res.status(404).json({
                    success: false,
                    message: 'Organization not found'
                });
            }

            // Soft delete - set isActive to false
            company.isActive = false;
            company.updatedAt = new Date();
            await company.save();

            res.status(200).json({
                success: true,
                message: 'Organization deactivated successfully'
            });

        } catch (error) {
            next(error);
        }
    }

    // Hard delete company (permanent deletion)
    async hardDeleteCompany(req, res, next) {
        try {
            const { id } = req.params;

            // Validate MongoDB ObjectId
            if (!mongoose.isValidObjectId(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid organization ID format'
                });
            }

            const company = await Company.findByIdAndDelete(id);

            if (!company) {
                return res.status(404).json({
                    success: false,
                    message: 'Organization not found'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Organization deleted permanently'
            });

        } catch (error) {
            next(error);
        }
    }

    // Toggle company active status
    async toggleCompanyStatus(req, res, next) {
        try {
            const { id } = req.params;

            // Validate MongoDB ObjectId
            if (!mongoose.isValidObjectId(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid organization ID format'
                });
            }

            const company = await Company.findById(id);

            if (!company) {
                return res.status(404).json({
                    success: false,
                    message: 'Organization not found'
                });
            }

            company.isActive = !company.isActive;
            company.updatedAt = new Date();
            await company.save();

            res.status(200).json({
                success: true,
                message: `Organization ${company.isActive ? 'activated' : 'deactivated'} successfully`,
                data: {
                    id: company._id,
                    name: company.name,
                    isActive: company.isActive
                }
            });

        } catch (error) {
            next(error);
        }
    }

    // Get companies statistics
    async getCompanyStatistics(req, res, next) {
        try {
            const stats = await Company.aggregate([
                {
                    $group: {
                        _id: null,
                        totalCompanies: { $sum: 1 },
                        activeCompanies: {
                            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
                        },
                        inactiveCompanies: {
                            $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] }
                        },
                        governmentCompanies: {
                            $sum: { $cond: [{ $eq: ['$type', 'government'] }, 1, 0] }
                        },
                        nongovernmentCompanies: {
                            $sum: { $cond: [{ $eq: ['$type', 'nongovernment'] }, 1, 0] }
                        }
                    }
                }
            ]);

            const sectorStats = await Company.aggregate([
                {
                    $group: {
                        _id: '$sector',
                        count: { $sum: 1 },
                        activeCount: {
                            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
                        }
                    }
                },
                {
                    $sort: { count: -1 }
                }
            ]);

            res.status(200).json({
                success: true,
                message: 'Statistics retrieved successfully',
                data: {
                    overview: stats[0] || {
                        totalCompanies: 0,
                        activeCompanies: 0,
                        inactiveCompanies: 0,
                        governmentCompanies: 0,
                        nongovernmentCompanies: 0
                    },
                    sectors: sectorStats
                }
            });

        } catch (error) {
            next(error);
        }
    }

    // Get companies by sector
    async getCompaniesBySector(req, res, next) {
        try {
            const { sector } = req.params;
            const { page = 1, limit = 10, isActive = true } = req.query;

            const validSectors = ['infrastructure', 'environment', 'transport', 'health', 'education', 'social', 'economic', 'other', "ecology", "utilities"];
            if (!validSectors.includes(sector)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid sector'
                });
            }

            const skip = (parseInt(page) - 1) * parseInt(limit);

            const companies = await Company.find({ 
                sector, 
                isActive: isActive === 'true' 
            })
                .sort({ name: 1 })
                .skip(skip)
                .limit(parseInt(limit));

            const total = await Company.countDocuments({ 
                sector, 
                isActive: isActive === 'true' 
            });

            res.status(200).json({
                success: true,
                message: `Organizations in ${sector} sector retrieved successfully`,
                data: {
                    companies,
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(total / parseInt(limit)),
                        totalItems: total,
                        itemsPerPage: parseInt(limit)
                    }
                }
            });

        } catch (error) {
            next(error);
        }
    }

    // Get companies by type (government/non-government)
    async getCompaniesByType(req, res, next) {
        try {
            const { type } = req.params;
            const { page = 1, limit = 10, isActive = true } = req.query;

            const validTypes = ['government', 'nongovernment', 'other'];
            if (!validTypes.includes(type)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid type. Must be: government, nongovernment, or other'
                });
            }

            const skip = (parseInt(page) - 1) * parseInt(limit);

            const companies = await Company.find({ 
                type, 
                isActive: isActive === 'true' 
            })
                .sort({ name: 1 })
                .skip(skip)
                .limit(parseInt(limit));

            const total = await Company.countDocuments({ 
                type, 
                isActive: isActive === 'true' 
            });

            res.status(200).json({
                success: true,
                message: `${type} organizations retrieved successfully`,
                data: {
                    companies,
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(total / parseInt(limit)),
                        totalItems: total,
                        itemsPerPage: parseInt(limit)
                    }
                }
            });

        } catch (error) {
            next(error);
        }
    }
}

module.exports = new CompanyController();