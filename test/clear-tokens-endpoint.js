// Temporary endpoint to clear all refresh tokens
// This can be added to auth.controller.js temporarily

const User = require('../models/user');

/**
 * Clear all refresh tokens from database
 * POST /api/auth/clear-all-tokens
 */
async function clearAllTokens(req, res) {
  try {
    // Only allow in development mode
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'This endpoint is only available in development mode.'
      });
    }

    console.log('🧹 Clearing all refresh tokens...');
    
    const result = await User.updateMany(
      { 'refreshTokens.0': { $exists: true } },
      { $set: { refreshTokens: [] } }
    );

    console.log(`✅ Cleared refresh tokens for ${result.modifiedCount} users`);

    res.status(200).json({
      success: true,
      message: `Cleared refresh tokens for ${result.modifiedCount} users`,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('❌ Error clearing tokens:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing tokens',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

module.exports = { clearAllTokens };