const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const appealsSchema = new Schema({
     
    fullName: {
        type: String,
        required: true,
        maxlength:80
    },
    email: {
        type: String,
        required: false,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Iltimos to\'g\'ri email manzilini kiriting']
    },
    phone: {
        type: String,
        required: false,
        trim: true,
        match: [/^[\+]?[0-9\s\-\(\)]{10,}$/, 'Iltimos to\'g\'ri telefon raqamini kiriting']
    },


    message: {
        type: String,
        required: true, 
        maxlength: 2000
    },
    
    // Classification murojaat turi
    type: {
        type: String,
        required: false,
        enum: {
            values: ['complaint', 'suggestion', 'question', 'request', 'appreciation',  'other'],
            message: 'Noto\'g\'ri murojaat turi'
        }
    },
    sector: {
        type: String,
        required: true,
        enum: {
            values: ['infrastructure', 'environment', 'transport', 'health', 'education', 'social', 'economic', 'utilities', 'other', "ecology"],
            message: 'Noto\'g\'ri sektor'
        }
    },
    company: {
        type: String,
        required: true, 
    },
    // priority: {
    //     type: String,
    //     enum: ['low', 'medium', 'high', 'urgent'],
    //     default: 'medium'
    // },
    
    // Status and Tracking
    status: {
        type: String,
        enum: ['open', 'in_progress', 'waiting_response', 'closed', 'rejected'], //"ochiq", "davom etyapti", "javobni_kutish", "yopiq", "rad etilgan"
        default: 'open'
    },
    
    // Admin Response System
    adminResponse: {
        message: {
            type: String,
            maxlength: 1000
        },
        respondedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        respondedAt: {
            type: Date
        }
    },
    
    // Additional Features
    location: {
        district: String,
        address: String,
        coordinates: {
            latitude: Number,
            longitude: Number
        }
    },
    
    attachments: [{
        filename: String,
        originalName: String,
        mimetype: String,
        size: Number,
        uploadDate: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Follow-up tracking
    followUpRequired: {
        type: Boolean,
        default: false
    },
    followUpDate: Date,
    
    // Metadata
    ipAddress: String,
    userAgent: String,
    
    // Statistics
    viewCount: {
        type: Number,
        default: 0
    },
    
    // Rating system
    rating: {
        score: {
            type: Number,
            min: 1,
            max: 5
        },
        feedback: String,
        ratedAt: Date
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance
appealsSchema.index({ status: 1, createdAt: -1 });
appealsSchema.index({ type: 1, sector: 1 });
appealsSchema.index({ email: 1 });

// Virtual fields - fullName is already a real field in the schema

appealsSchema.virtual('isOverdue').get(function() {
    if (!this.followUpDate) return false;
    return new Date() > this.followUpDate;
});

// Middleware
appealsSchema.pre('save', function(next) {
    if (this.isModified('status') && this.status === 'closed') {
        this.respondedAt = new Date();
    }
    next();
});

// Static methods
appealsSchema.statics.getStatistics = function() {
    return this.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);
};

// Instance methods
appealsSchema.methods.addResponse = function(message, adminId) {
    this.adminResponse = {
        message,
        respondedBy: adminId,
        respondedAt: new Date()
    };
    return this.save();
};

appealsSchema.methods.updateStatus = function(newStatus) {
    this.status = newStatus;
    return this.save();
};

appealsSchema.methods.addRating = function(score, feedback) {
    this.rating = {
        score,
        feedback,
        ratedAt: new Date()
    };
    return this.save();
};

module.exports = mongoose.model('Appeal', appealsSchema);