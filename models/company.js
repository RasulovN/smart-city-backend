// company model
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const companySchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 50
    },
    slug: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true
    },
    description: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 500
    },
    sector: {
        type: String,
        required: true, // Add this line
        enum: ['infrastructure', 'environment', 'transport', 'health', 'education', 'social', 'economic', 'other', "ecology", "utilities"], // Add this line    
    },
    email: {
        type: String,
        required: false,
        trim: true,
        lowercase: true,
    },
    phone: {
        type: Number,
        required: false, 
    },
    inn: {
        type: String,
        required: false,
        trim: true,
    },
    type: {
        type: String,
        required: false,
        enum: ["government", "nongovernment", 'other'],
    },
    address: {
        fullAddress: {  type: String, required: false, trim: true,  },
            long: { type: Number,  required: false,  },
            lat: { type: Number,  required: false,  },
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Company', companySchema);
