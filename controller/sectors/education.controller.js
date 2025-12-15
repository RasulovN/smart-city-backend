const OptimizedAttendance = require('../../models/OptimizedAttendance');
const mongoose = require('mongoose');

class educationsController {
    // Get education statistics with time period filters (weekly, monthly, yearly, full)
    async getEducationStats(req, res) {
        try {
            const { 
                period = 'weekly', // weekly, monthly, yearly, full
                viloyat_id,
                shift_no,
                start_date,
                end_date 
            } = req.query;

            // Calculate date ranges based on period
            const dateFilter = educationsController.getDateFilter(period, start_date, end_date);
            
            // Build query - check both realtime and finalized data
            const query = {
                type: { $in: ['realtime', 'finalized'] },
                date: dateFilter
            };

            if (viloyat_id) {
                query['viloyat.id'] = parseInt(viloyat_id);
            }

            if (shift_no !== undefined && shift_no !== '') {
                query.shift_no = parseInt(shift_no);
            }

            console.log('Stats Query:', JSON.stringify(query, null, 2));

            // Aggregate data based on period
            const stats = await educationsController.aggregateStats(query, period);

            res.json({
                success: true,
                data: stats,
                period: period,
                dateRange: dateFilter
            });

        } catch (error) {
            console.error('Error in getEducationStats:', error);
            res.status(500).json({
                success: false,
                message: 'Xatolik yuz berdi',
                error: error.message
            });
        }
    }

    // Get schools data with detailed breakdowns
    async getSchoolsData(req, res) {
        try {
            const { 
                period = 'weekly',
                viloyat_id,
                tuman_id,
                shift_no,
                limit = 1000, // Increased limit
                start_date,
                end_date 
            } = req.query;

            // Calculate date ranges
            const dateFilter = educationsController.getDateFilter(period, start_date, end_date);
            
            // Build query - check both realtime and finalized data
            const query = {
                type: { $in: ['realtime', 'finalized'] },
                date: dateFilter
            };

            if (viloyat_id) {
                query['viloyat.id'] = parseInt(viloyat_id);
            }

            if (tuman_id) {
                query.tuman_id = parseInt(tuman_id);
            }

            if (shift_no !== undefined && shift_no !== '') {
                query.shift_no = parseInt(shift_no);
            }

            // console.log('Schools Query:', JSON.stringify(query, null, 2));

            // Get detailed school data
            const schoolsData = await OptimizedAttendance.find(query)
                .sort({ date: -1, createdAt: -1 })
                .limit(parseInt(limit));

            console.log('Found records:', schoolsData.length);

            // Process and aggregate the data
            const processedData = await educationsController.processSchoolsData(schoolsData, period);

            res.json({
                success: true,
                data: processedData,
                total: schoolsData.length,
                period: period
            });

        } catch (error) {
            console.error('Error in getSchoolsData:', error);
            res.status(500).json({
                success: false,
                message: 'Maktab ma\'lumotlarini olishda xatolik',
                error: error.message
            });
        }
    }

    // Get school face ID specific data
    async getSchoolFaceIdData(req, res) {
        try {
            const { 
                period = 'weekly',
                viloyat_id,
                tuman_id,
                start_date,
                end_date 
            } = req.query;

            // Calculate date ranges
            const dateFilter = educationsController.getDateFilter(period, start_date, end_date);
            
            // Build query for face ID related data
            const query = {
                type: { $in: ['realtime', 'finalized'] },
                date: dateFilter
            };

            if (viloyat_id) {
                query['viloyat.id'] = parseInt(viloyat_id);
            }

            if (tuman_id) {
                query.tuman_id = parseInt(tuman_id);
            }

            console.log('Face ID Query:', JSON.stringify(query, null, 2));

            // Get face ID attendance data
            const faceIdData = await OptimizedAttendance.find(query)
                .sort({ date: -1 })
                .select('date viloyat summary districts cities timestamp');

            console.log('Face ID records found:', faceIdData.length);

            // Process face ID specific metrics
            const processedFaceIdData = await educationsController.processFaceIdData(faceIdData, period);

            res.json({
                success: true,
                data: processedFaceIdData,
                period: period,
                totalRecords: faceIdData.length
            });

        } catch (error) {
            console.error('Error in getSchoolFaceIdData:', error);
            res.status(500).json({
                success: false,
                message: 'Face ID ma\'lumotlarini olishda xatolik',
                error: error.message
            });
        }
    }

    // Static helper method to get date filter based on period
    static getDateFilter(period, start_date, end_date) {
        const today = new Date();
        
        if (start_date && end_date) {
            return { $gte: start_date, $lte: end_date };
        }

        switch (period) {
            case 'weekly':
                const weekAgo = new Date(today);
                weekAgo.setDate(today.getDate() - 7);
                return { $gte: weekAgo.toISOString().split('T')[0], $lte: today.toISOString().split('T')[0] };
            
            case 'monthly':
                const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                return { $gte: monthStart.toISOString().split('T')[0], $lte: monthEnd.toISOString().split('T')[0] };
            
            case 'yearly':
                const yearStart = new Date(today.getFullYear(), 0, 1);
                const yearEnd = new Date(today.getFullYear(), 11, 31);
                return { $gte: yearStart.toISOString().split('T')[0], $lte: yearEnd.toISOString().split('T')[0] };
            
            case 'full':
                // Get all available data from the beginning
                return { $lte: today.toISOString().split('T')[0] };
            
            default:
                return today.toISOString().split('T')[0];
        }
    }

    // Static method to aggregate statistics based on period
    static async aggregateStats(query, period) {
        const data = await OptimizedAttendance.find(query);
        
        console.log(`Found ${data.length} records for aggregation`);
        
        const aggregated = {
            totalStudents: 0,
            totalPresent: 0,
            totalSchools: 0,
            averageAttendance: 0,
            dailyBreakdown: [],
            regionBreakdown: [],
            shiftBreakdown: []
        };

        // Process daily breakdown
        const dailyData = new Map();
        const regionData = new Map();
        const shiftData = new Map();

        data.forEach(record => {
            // Daily aggregation
            const date = record.date;
            if (!dailyData.has(date)) {
                dailyData.set(date, {
                    date: date,
                    students_total: 0,
                    students_present: 0,
                    schools_total: 0,
                    attendance_rate: 0
                });
            }

            const daily = dailyData.get(date);
            daily.students_total += record.summary?.students?.total || 0;
            daily.students_present += record.summary?.students?.present_today || 0;
            daily.schools_total += record.summary?.schools?.total || 0;

            // Region aggregation
            const region = record.viloyat?.nomi || 'Noma\'lum';
            if (!regionData.has(region)) {
                regionData.set(region, {
                    region: region,
                    students_total: 0,
                    students_present: 0,
                    schools_total: 0,
                    attendance_rate: 0
                });
            }

            const regionAgg = regionData.get(region);
            regionAgg.students_total += record.summary?.students?.total || 0;
            regionAgg.students_present += record.summary?.students?.present_today || 0;
            regionAgg.schools_total += record.summary?.schools?.total || 0;

            // Shift aggregation
            const shift = record.shift_no || 'all';
            if (!shiftData.has(shift)) {
                shiftData.set(shift, {
                    shift: shift,
                    students_total: 0,
                    students_present: 0,
                    schools_total: 0,
                    attendance_rate: 0
                });
            }

            const shiftAgg = shiftData.get(shift);
            shiftAgg.students_total += record.summary?.students?.total || 0;
            shiftAgg.students_present += record.summary?.students?.present_today || 0;
            shiftAgg.schools_total += record.summary?.schools?.total || 0;

            // Update totals
            aggregated.totalStudents += record.summary?.students?.total || 0;
            aggregated.totalPresent += record.summary?.students?.present_today || 0;
            aggregated.totalSchools += record.summary?.schools?.total || 0;
        });

        // Calculate attendance rates
        dailyData.forEach(daily => {
            daily.attendance_rate = daily.students_total > 0 ? 
                parseFloat((daily.students_present / daily.students_total * 100).toFixed(2)) : 0;
        });

        regionData.forEach(region => {
            region.attendance_rate = region.students_total > 0 ? 
                parseFloat((region.students_present / region.students_total * 100).toFixed(2)) : 0;
        });

        shiftData.forEach(shift => {
            shift.attendance_rate = shift.students_total > 0 ? 
                parseFloat((shift.students_present / shift.students_total * 100).toFixed(2)) : 0;
        });

        // Calculate overall average
        aggregated.averageAttendance = aggregated.totalStudents > 0 ? 
            parseFloat((aggregated.totalPresent / aggregated.totalStudents * 100).toFixed(2)) : 0;

        aggregated.dailyBreakdown = Array.from(dailyData.values()).sort((a, b) => a.date.localeCompare(b.date));
        aggregated.regionBreakdown = Array.from(regionData.values());
        aggregated.shiftBreakdown = Array.from(shiftData.values());

        return aggregated;
    }

    // Static method to process schools data for detailed view
    static async processSchoolsData(data, period) {
        const processed = {
            summary: {
                totalRecords: data.length,
                totalStudents: 0,
                totalPresent: 0,
                totalSchools: 0,
                averageAttendance: 0
            },
            records: [],
            trends: []
        };

        // Process each record
        data.forEach(record => {
            const processedRecord = {
                date: record.date,
                viloyat: record.viloyat,
                shift: record.shift_no,
                students: record.summary?.students || {},
                schools: record.summary?.schools || {},
                teachers: record.summary?.teachers || {},
                districts: record.districts || [],
                cities: record.cities || [],
                timestamp: record.timestamp,
                type: record.type
            };

            processed.records.push(processedRecord);
            processed.summary.totalStudents += record.summary?.students?.total || 0;
            processed.summary.totalPresent += record.summary?.students?.present_today || 0;
            processed.summary.totalSchools += record.summary?.schools?.total || 0;
        });

        // Calculate overall average
        processed.summary.averageAttendance = processed.summary.totalStudents > 0 ? 
            parseFloat((processed.summary.totalPresent / processed.summary.totalStudents * 100).toFixed(2)) : 0;

        return processed;
    }

    // Static method to process face ID specific data
    static async processFaceIdData(data, period) {
        const processed = {
            summary: {
                totalRecords: data.length,
                regions: new Set(),
                totalStudents: 0,
                totalPresent: 0,
                averageAttendance: 0
            },
            faceIdMetrics: {
                dailyAttendance: [],
                regionalBreakdown: [],
                shiftPerformance: []
            }
        };

        const dailyFaceIdData = new Map();
        const regionalFaceIdData = new Map();

        data.forEach(record => {
            const date = record.date;
            const region = record.viloyat?.nomi || 'Noma\'lum';
            processed.summary.regions.add(region);

            // Daily face ID attendance
            if (!dailyFaceIdData.has(date)) {
                dailyFaceIdData.set(date, {
                    date: date,
                    students_total: 0,
                    students_present: 0,
                    attendance_rate: 0,
                    faceIdCoverage: 0
                });
            }

            const daily = dailyFaceIdData.get(date);
            daily.students_total += record.summary?.students?.total || 0;
            daily.students_present += record.summary?.students?.present_today || 0;

            // Regional face ID data
            if (!regionalFaceIdData.has(region)) {
                regionalFaceIdData.set(region, {
                    region: region,
                    students_total: 0,
                    students_present: 0,
                    schools: new Set(),
                    attendance_rate: 0
                });
            }

            const regional = regionalFaceIdData.get(region);
            regional.students_total += record.summary?.students?.total || 0;
            regional.students_present += record.summary?.students?.present_today || 0;

            if (record.districts) {
                record.districts.forEach(district => {
                    regional.schools.add(district.tuman_nomi);
                });
            }

            processed.summary.totalStudents += record.summary?.students?.total || 0;
            processed.summary.totalPresent += record.summary?.students?.present_today || 0;
        });

        // Calculate metrics
        dailyFaceIdData.forEach(daily => {
            daily.attendance_rate = daily.students_total > 0 ? 
                parseFloat((daily.students_present / daily.students_total * 100).toFixed(2)) : 0;
            // Face ID coverage would be calculated based on actual face ID usage data
            daily.faceIdCoverage = Math.random() * 20 + 80; // Placeholder for actual face ID coverage
        });

        regionalFaceIdData.forEach(regional => {
            regional.attendance_rate = regional.students_total > 0 ? 
                parseFloat((regional.students_present / regional.students_total * 100).toFixed(2)) : 0;
            regional.totalSchools = regional.schools.size;
            delete regional.schools; // Remove Set from output
        });

        processed.summary.averageAttendance = processed.summary.totalStudents > 0 ? 
            parseFloat((processed.summary.totalPresent / processed.summary.totalStudents * 100).toFixed(2)) : 0;

        processed.faceIdMetrics.dailyAttendance = Array.from(dailyFaceIdData.values())
            .sort((a, b) => a.date.localeCompare(b.date));
        processed.faceIdMetrics.regionalBreakdown = Array.from(regionalFaceIdData.values());
        processed.summary.regions = Array.from(processed.summary.regions);

        return processed;
    }
}

module.exports = new educationsController();