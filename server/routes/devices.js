const express = require('express');
const router = express.Router();
const Device = require('../models/Device');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Middleware to verify token
const auth = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

const checkLimit = require('../middleware/checkLimit');

// @route   POST /api/devices
// @desc    Register a new device
// @access  Private
// @route   POST /api/devices
// @desc    Register a new device
// @access  Private (Unlimited for all roles)
router.post('/', auth, async (req, res) => {
    const { serialNumber, imei, brand, model, color, details } = req.body;

    try {
        let device = await Device.findOne({ serialNumber });
        if (device) return res.status(400).json({ msg: 'Device with this Serial Number already exists' });

        if (imei) {
            device = await Device.findOne({ imei });
            if (device) return res.status(400).json({ msg: 'Device with this IMEI already exists' });
        }

        const newDevice = new Device({
            serialNumber,
            imei,
            brand,
            model,
            color,
            details,
            owner: req.user.id,
            history: [{
                owner: req.user.id,
                action: 'registered',
                date: Date.now()
            }]
        });

        await newDevice.save();
        res.json(newDevice);
    } catch (err) {
        console.error(err.message);
        if (err.code === 11000) {
            return res.status(400).json({ msg: 'Device with this Serial/IMEI already exists' });
        }
        res.status(500).send('Server error');
    }
});

// @route   GET /api/devices/my-devices
// @desc    Get all devices for logged in user
// @access  Private
router.get('/my-devices', auth, async (req, res) => {
    try {
        const devices = await Device.find({ owner: req.user.id }).sort({ date: -1 });
        res.json(devices);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET /api/devices/lookup/:query
// @desc    Lookup device by serial or IMEI
// @access  Public (Blurred) / Private (Full + Limits)
router.get('/lookup/:query', async (req, res) => {
    try {
        const query = req.params.query;
        // Find by serial OR imei
        const device = await Device.findOne({
            $or: [{ serialNumber: query }, { imei: query }]
        })
            .populate('owner', 'name email nin')
            .populate({
                path: 'history.owner',
                select: 'name email nin'
            });

        if (!device) {
            return res.status(404).json({ msg: 'Device not found' });
        }

        // Soft Auth Check
        const token = req.header('x-auth-token');
        let user = null;
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
                user = await User.findById(decoded.user.id);
            } catch (e) {
                // Invalid token, treat as guest
            }
        }

        if (!user) {
            // Unauthenticated: Return Blurred/Restricted Info
            return res.json({
                brand: device.brand,
                model: device.model,
                color: device.color,
                status: device.status,
                isBlurred: true,
                msg: "Login to view full ownership details."
            });
        }

        // Authenticated: Run CheckLimit Logic manually for 'lookups'
        // Logic duplicated from checkLimits but simplified here as we are inline
        const actionType = 'lookups';

        // Reset Month if needed
        const currentMonth = new Date().toISOString().slice(0, 7);
        if (!user.usage || user.usage.month !== currentMonth) {
            user.usage = { month: currentMonth, lookups: 0, transfers: 0, acceptances: 0 };
            await user.save();
        }

        let limit = 0;
        let unlimited = false;

        if (['admin', 'enterprise_admin', 'store_manager', 'vendor', 'technician'].includes(user.role)) {
            unlimited = true; // Vendors/Techs have unlimited lookups
        } else {
            limit = 3; // Basic
        }

        if (!unlimited && (user.usage.lookups || 0) >= limit) {
            return res.status(402).json({
                msg: 'Monthly lookup limit reached. Pay 1,000 NGN to view details.',
                code: 'LIMIT_REACHED',
                amount: 1000,
                type: 'device_overage',
                brand: device.brand,
                model: device.model,
                status: device.status,
                isBlurred: true // Show blurred even if logged in if limit reached
            });
        }

        // Increment Usage
        await User.findByIdAndUpdate(user.id, { $inc: { 'usage.lookups': 1 } });

        res.json(device);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   PUT /api/devices/:id/status
// @desc    Update device status (Stolen/Lost/Active)
// @access  Private
router.put('/:id/status', auth, async (req, res) => {
    const { status } = req.body;
    try {
        let device = await Device.findById(req.params.id);

        if (!device) return res.status(404).json({ msg: 'Device not found' });

        // Make sure user owns device
        if (device.owner.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        device.status = status;
        device.history.push({
            owner: req.user.id,
            action: `status_change_to_${status}`
        });

        await device.save();
        res.json(device);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST /api/devices/panic
// @desc    Trigger panic alert
// @access  Public
router.post('/panic', async (req, res) => {
    const { deviceId, reporterInfo } = req.body;
    // Logic to notify admin dashboard
    console.log(`[PANIC] Device ${deviceId} flagged by ${JSON.stringify(reporterInfo)}`);
    // In real app: Push notification / Email to admins
    res.json({ msg: 'Panic alert received. Admin notified.' });
});

// @route   POST /api/devices/:id/comments
// @desc    Add a comment to a device
// @access  Private (Owner only)
router.post('/:id/comments', auth, async (req, res) => {
    const { text } = req.body;
    try {
        const device = await Device.findById(req.params.id);
        if (!device) return res.status(404).json({ msg: 'Device not found' });

        if (device.owner.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        const newComment = {
            user: req.user.id,
            text,
            date: Date.now()
        };

        device.comments.unshift(newComment);

        // Also add to history for completeness?
        device.history.push({
            owner: req.user.id,
            action: 'commented',
            details: text.substring(0, 50) + (text.length > 50 ? '...' : '')
        });

        await device.save();
        res.json(device.comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
