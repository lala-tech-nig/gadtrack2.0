const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    nin: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['basic', 'vendor', 'enterprise_admin', 'store_manager', 'admin'],
        default: 'basic'
    },
    usageLimit: {
        count: { type: Number, default: 0 },
        month: { type: String, default: () => new Date().toISOString().slice(0, 7) } // YYYY-MM
    },
    isVendorActive: {
        type: Boolean,
        default: false
    },
    enterpriseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Enterprise' // Will point to User (Enterprise Admin) or Store? Let's use Store logic or just grouping
    },
    isAccountSuspended: {
        type: Boolean,
        default: false
    },
    // subscriptions
    subscriptionStatus: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'inactive'
    },
    credits: {
        type: Number,
        default: 0 // Extra paid slots. Base limit is 2/month logic-based.
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', UserSchema);
