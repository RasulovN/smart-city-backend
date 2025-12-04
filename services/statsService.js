const Stats = require('../models/Stats');

/**
 * Save or update shift statistics with incremental merging
 * @param {Object} wsData - WebSocket data containing stats
 * @returns {Promise<Object>} - Updated document
 */
async function saveOrUpdateShiftStats(wsData) {
  try {
    const { timestamp, data } = wsData;
    const { date, shift_no, viloyat_id, schools, students, teachers, tumanlarda, shaxarlarda } = data;

    // Prepare shift data structure
    const shiftData = {
      summary: {
        schools,
        students,
        teachers
      },
      districts: tumanlarda || [],
      cities: shaxarlarda || []
    };

    // Determine which shift to update
    let shiftKey;
    if (shift_no === null || shift_no === undefined) {
      shiftKey = 'all';
    } else {
      shiftKey = `shift${shift_no}`;
    }

    // Build update query for incremental merging
    const updateQuery = {
      $set: {
        date,
        region_id: viloyat_id,
        [`shifts.${shiftKey}`]: shiftData,
        updated_at: new Date()
      }
    };

    // Use findOneAndUpdate with upsert to prevent duplicates
    const options = {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    };

    const result = await Stats.findOneAndUpdate(
      { date, region_id: viloyat_id },
      updateQuery,
      options
    );

    // console.log(`✅ Stats updated successfully for ${date}, region ${viloyat_id}, shift ${shiftKey}`);
    return result;

  } catch (error) {
    console.error('❌ Error saving shift stats:', error);
    throw error;
  }
}

/**
 * Get statistics by date and region
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {number} regionId - Region ID
 * @returns {Promise<Object>} - Statistics document
 */
async function getStatsByDateAndRegion(date, regionId) {
  try {
    const stats = await Stats.findOne({ date, region_id: regionId });
    return stats;
  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    throw error;
  }
}

/**
 * Get all statistics for a specific date
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Array>} - Array of statistics documents
 */
async function getStatsByDate(date) {
  try {
    const stats = await Stats.find({ date }).sort({ region_id: 1 });
    return stats;
  } catch (error) {
    console.error('❌ Error fetching stats by date:', error);
    throw error;
  }
}

/**
 * Clean up old statistics (older than specified days)
 * @param {number} daysOld - Number of days to keep
 * @returns {Promise<Object>} - Cleanup result
 */
async function cleanupOldStats(daysOld = 365) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    const cutoffString = cutoffDate.toISOString().split('T')[0];

    const result = await Stats.deleteMany({
      date: { $lt: cutoffString }
    });

    console.log(`🧹 Cleaned up ${result.deletedCount} old statistics records`);
    return result;
  } catch (error) {
    console.error('❌ Error cleaning up old stats:', error);
    throw error;
  }
}

module.exports = {
  saveOrUpdateShiftStats,
  getStatsByDateAndRegion,
  getStatsByDate,
  cleanupOldStats
};