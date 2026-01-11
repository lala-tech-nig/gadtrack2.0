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

// @route   POST /api/devices
// @desc    Register a new device
// @access  Private
router.post('/', auth, async (req, res) => {
    const { serialNumber, imei, brand, model, color, details } = req.body;

    try {
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
                action: 'registered'
            }]
        });

        const device = await newDevice.save();
        res.json(device);
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
// @access  Public (should be limited in prod)
router.get('/lookup/:query', async (req, res) => {
    try {
        const query = req.params.query;
        // Find by serial OR imei
        const device = await Device.findOne({
            $or: [{ serialNumber: query }, { imei: query }]
        }).populate('owner', 'name email').populate('history.owner', 'name');

        if (!device) {
            return res.status(404).json({ msg: 'Device not found' });
        }

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

module.exports = router;
