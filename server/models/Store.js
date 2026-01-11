const mongoose = require('mongoose');

const StoreSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    location: {
        type: String
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // The Enterprise Admin
        required: true
    },
    managers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Store Managers
    }],
    devices: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Device'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Store', StoreSchema);
