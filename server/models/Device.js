const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({
    serialNumber: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    imei: {
        type: String,
        unique: true,
        sparse: true, // Allow null/undefined but unique if present
        index: true
    },
    brand: {
        type: String,
        required: true
    },
    model: {
        type: String,
        required: true
    },
    color: {
        type: String
    },
    status: {
        type: String,
        enum: ['active', 'stolen', 'lost', 'missing', 'transferred'],
        default: 'active'
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // The Truth Trail
    history: [{
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        date: {
            type: Date,
            default: Date.now
        },
        action: {
            type: String,
            enum: ['registered', 'transferred_out', 'transferred_in', 'reported_stolen', 'reported_lost', 'recovered', 'repaired', 'commented']
        },
        details: String // Optional extra info, e.g. "Sold to John Doe"
    }],
    // Community Watch
    comments: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        text: {
            type: String,
            required: true
        },
        date: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Device', DeviceSchema);
