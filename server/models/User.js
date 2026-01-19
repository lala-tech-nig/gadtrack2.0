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
        enum: ['basic', 'vendor', 'technician', 'enterprise_admin', 'store_manager', 'admin'],
        default: 'basic'
    },
    // Detailed Usage Limits for Basic Users (reset monthly)
    usage: {
        month: { type: String, default: () => new Date().toISOString().slice(0, 7) }, // YYYY-MM
        lookups: { type: Number, default: 0 },
        transfers: { type: Number, default: 0 },
        acceptances: { type: Number, default: 0 }
    },
    // Subscription DNA for Vendors, Technicians, Enterprise
    subscription: {
        status: { 
            type: String, 
            enum: ['active', 'inactive', 'grace_period'], 
            default: 'inactive' 
        },
        plan: { 
            type: String, 
            enum: ['basic', 'vendor', 'technician', 'enterprise'], 
            default: 'basic'
        },
        startDate: Date,
        expiryDate: Date,
        lastPaymentDate: Date,
        autoRenew: { type: Boolean, default: false }
    },
    isVendorActive: {
        type: Boolean,
        default: false
    },
    enterpriseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // For store managers pointing to their Enterprise Admin
    },
    isAccountSuspended: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Helper to check if subscription is valid
UserSchema.methods.isSubscriptionActive = function() {
    if (this.role === 'basic') return true; // Basic doesn't need a sub, they pay per overage
    if (this.role === 'admin') return true;
    return this.subscription.status === 'active' && this.subscription.expiryDate > new Date();
};

module.exports = mongoose.model('User', UserSchema);
