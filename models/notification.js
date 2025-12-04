const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 255
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    user_ids: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    status: {
        type: String,
        enum: ['new', 'success'],
        default: 'new',
        index: true
    },
    created_at: {
        type: Date,
        default: Date.now,
        index: true
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

// TTL index for automatic deletion after 30 days (2592000 seconds)
notificationSchema.index({ created_at: 1 }, { expireAfterSeconds: 2592000 });

// Update updated_at before saving
notificationSchema.pre('save', function(next) {
    this.updated_at = new Date();
    next();
});

module.exports = mongoose.model('Notification', notificationSchema);
