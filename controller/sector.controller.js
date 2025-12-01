const Sector = require('../models/sector');

class SectorController {
    // Create new sector (Admin & Super Admin only)
    async createSector(req, res) {
        try {
            const { name, slug, description, isActive = true } = req.body;

            // Validate required fields
            if (!name || !slug || !description) {
                return res.status(400).json({
                    success: false,
                    message: 'Name, slug, and description are required.'
                });
            }

            // Validate slug format
            const slugRegex = /^[a-z0-9-]+$/;
            if (!slugRegex.test(slug)) {
                return res.status(400).json({
                    success: false,
                    message: 'Slug must contain only lowercase letters, numbers, and hyphens.'
                });
            }

            // Check if sector with this slug already exists
            const existingSector = await Sector.findOne({ 
                $or: [
                    { slug: slug.toLowerCase() },
                    { name: name.trim() }
                ]
            });

            if (existingSector) {
                return res.status(409).json({
                    success: false,
                    message: 'Sector with this name or slug already exists.'
                });
            }

            // Create new sector
            const newSector = new Sector({
                name: name.trim(),
                slug: slug.toLowerCase(),
                description: description.trim(),
                isActive
            });

            await newSector.save();

            res.status(201).json({
                success: true,
                message: 'Sector created successfully.',
                data: {
                    id: newSector._id,
                    name: newSector.name,
                    slug: newSector.slug,
                    description: newSector.description,
                    isActive: newSector.isActive,
                    createdAt: newSector.createdAt,
                    updatedAt: newSector.updatedAt
                }
            });
        } catch (error) {
            console.error('Create sector error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error.',
                error: error.message
            });
        }
    }

    // Get all sectors (Public access)
    async getAllSectors(req, res) {
        try {
            const { page = 1, limit = 10, isActive } = req.query;

            // Build filter
            const filter = {};
            if (isActive !== undefined) {
                filter.isActive = isActive === 'true';
            }

            const skip = (parseInt(page) - 1) * parseInt(limit);

            const sectors = await Sector.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit));

            const total = await Sector.countDocuments(filter);

            res.status(200).json({
                success: true,
                data: {
                    sectors,
                    pagination: {
                        total,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        pages: Math.ceil(total / parseInt(limit))
                    }
                }
            });
        } catch (error) {
            console.error('Get all sectors error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error.',
                error: error.message
            });
        }
    }

    // Get sector by ID (Public access)
    async getSectorById(req, res) {
        try {
            const { id } = req.params;

            const sector = await Sector.findById(id);

            if (!sector) {
                return res.status(404).json({
                    success: false,
                    message: 'Sector not found.'
                });
            }

            res.status(200).json({
                success: true,
                data: sector
            });
        } catch (error) {
            console.error('Get sector by ID error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error.',
                error: error.message
            });
        }
    }

    // Get sector by slug (Public access)
    async getSectorBySlug(req, res) {
        try {
            const { slug } = req.params;

            const sector = await Sector.findOne({ slug: slug.toLowerCase() });

            if (!sector) {
                return res.status(404).json({
                    success: false,
                    message: 'Sector not found.'
                });
            }

            res.status(200).json({
                success: true,
                data: sector
            });
        } catch (error) {
            console.error('Get sector by slug error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error.',
                error: error.message
            });
        }
    }

    // Update sector (Admin & Super Admin only)
    async updateSector(req, res) {
        try {
            const { id } = req.params;
            const { name, slug, description, isActive } = req.body;

            const sector = await Sector.findById(id);

            if (!sector) {
                return res.status(404).json({
                    success: false,
                    message: 'Sector not found.'
                });
            }

            // Build update object
            const updateData = {};
            if (name && name.trim()) updateData.name = name.trim();
            if (slug) {
                // Validate slug format
                const slugRegex = /^[a-z0-9-]+$/;
                if (!slugRegex.test(slug)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Slug must contain only lowercase letters, numbers, and hyphens.'
                    });
                }
                updateData.slug = slug.toLowerCase();
            }
            if (description && description.trim()) updateData.description = description.trim();
            if (isActive !== undefined) updateData.isActive = isActive;

            // Check for duplicate name/slug (excluding current sector)
            if (name || slug) {
                const existingSector = await Sector.findOne({
                    _id: { $ne: id },
                    $or: [
                        ...(name ? [{ name: name.trim() }] : []),
                        ...(slug ? [{ slug: slug.toLowerCase() }] : [])
                    ]
                });

                if (existingSector) {
                    return res.status(409).json({
                        success: false,
                        message: 'Sector with this name or slug already exists.'
                    });
                }
            }

            // Update sector
            Object.assign(sector, updateData);
            await sector.save();

            res.status(200).json({
                success: true,
                message: 'Sector updated successfully.',
                data: {
                    id: sector._id,
                    name: sector.name,
                    slug: sector.slug,
                    description: sector.description,
                    isActive: sector.isActive,
                    createdAt: sector.createdAt,
                    updatedAt: sector.updatedAt
                }
            });
        } catch (error) {
            console.error('Update sector error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error.',
                error: error.message
            });
        }
    }

    // Delete sector (Admin & Super Admin only)
    async deleteSector(req, res) {
        try {
            const { id } = req.params;

            const sector = await Sector.findById(id);

            if (!sector) {
                return res.status(404).json({
                    success: false,
                    message: 'Sector not found.'
                });
            }

            await Sector.findByIdAndDelete(id);

            res.status(200).json({
                success: true,
                message: 'Sector deleted successfully.'
            });
        } catch (error) {
            console.error('Delete sector error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error.',
                error: error.message
            });
        }
    }

    // Deactivate sector (Admin & Super Admin only)
    async deactivateSector(req, res) {
        try {
            const { id } = req.params;

            const sector = await Sector.findById(id);

            if (!sector) {
                return res.status(404).json({
                    success: false,
                    message: 'Sector not found.'
                });
            }

            sector.isActive = false;
            await sector.save();

            res.status(200).json({
                success: true,
                message: 'Sector deactivated successfully.'
            });
        } catch (error) {
            console.error('Deactivate sector error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error.',
                error: error.message
            });
        }
    }

    // Activate sector (Admin & Super Admin only)
    async activateSector(req, res) {
        try {
            const { id } = req.params;

            const sector = await Sector.findById(id);

            if (!sector) {
                return res.status(404).json({
                    success: false,
                    message: 'Sector not found.'
                });
            }

            sector.isActive = true;
            await sector.save();

            res.status(200).json({
                success: true,
                message: 'Sector activated successfully.'
            });
        } catch (error) {
            console.error('Activate sector error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error.',
                error: error.message
            });
        }
    }
}

module.exports = new SectorController();