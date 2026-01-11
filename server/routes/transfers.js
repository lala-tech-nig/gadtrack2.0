const express = require('express');
const router = express.Router();
const Transfer = require('../models/Transfer');
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

// @route   POST /api/transfers
// @desc    Initiate a transfer
// @access  Private
router.post('/', auth, async (req, res) => {
    const { deviceId, toUserEmail } = req.body;

    try {
        const device = await Device.findById(deviceId);
        if (!device) return res.status(404).json({ msg: 'Device not found' });

        if (device.owner.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized to transfer this device' });
        }

        // Check if target user exists (optional, could transfer to non-registered email to invite)
        // For now, let's assume they must be registered, or we store just email
        const toUser = await User.findOne({ email: toUserEmail });

        const newTransfer = new Transfer({
            device: deviceId,
            fromUser: req.user.id,
            toUserEmail,
            toUser: toUser ? toUser.id : null,
            status: 'pending'
        });

        await newTransfer.save();
        res.json(newTransfer);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET /api/transfers/pending
// @desc    Get pending transfers for the logged in user
// @access  Private
router.get('/pending', auth, async (req, res) => {
    try {
        // Find transfers where toUser is current user OR toUserEmail matches current user email
        const user = await User.findById(req.user.id);
        const transfers = await Transfer.find({
            $or: [
                { toUser: req.user.id },
                { toUserEmail: user.email }
            ],
            status: 'pending'
        }).populate('device').populate('fromUser', 'name email');
        res.json(transfers);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   PUT /api/transfers/:id/accept
// @desc    Accept a transfer
// @access  Private
router.put('/:id/accept', auth, async (req, res) => {
    try {
        const transfer = await Transfer.findById(req.params.id);
        if (!transfer) return res.status(404).json({ msg: 'Transfer not found' });

        // Validate that the logged in user is the intended recipient
        const user = await User.findById(req.user.id);
        if (transfer.toUserEmail !== user.email && (!transfer.toUser || transfer.toUser.toString() !== req.user.id)) {
            return res.status(401).json({ msg: 'Not authorized to accept this transfer' });
        }

        // Update transfer status
        transfer.status = 'completed';
        transfer.completedAt = Date.now();
        transfer.toUser = req.user.id; // Ensure linked
        await transfer.save();

        // Update Device Ownership
        const device = await Device.findById(transfer.device);
        device.owner = req.user.id;
        device.status = 'transferred'; // or 'active'
        device.history.push({
            owner: req.user.id,
            action: 'transferred_from_' + transfer.fromUser,
            date: Date.now()
        });
        // Reset status to active for new owner ?? Or keep 'transferred' until they verify?
        // Let's set to active for simplicity but note history
        device.status = 'active';

        await device.save();

        res.json({ msg: 'Transfer successful', device });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
