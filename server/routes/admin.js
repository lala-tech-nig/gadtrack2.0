const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Device = require('../models/Device');
const Transaction = require('../models/Transaction');
const jwt = require('jsonwebtoken');

// Admin Middleware
const adminAuth = async (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        const user = await User.findById(decoded.user.id);
        if (user.role !== 'admin') return res.status(403).json({ msg: 'Admin Access Only' });
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

// @route   GET /api/admin/stats
// @desc    Get Platform Stats
router.get('/stats', adminAuth, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalDevices = await Device.countDocuments();
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todaysRevenue = await Transaction.aggregate([
            { $match: { createdAt: { $gte: todayStart }, status: 'success' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const flaggedDevices = await Device.countDocuments({ status: { $in: ['stolen', 'lost'] } });

        res.json({
            totalUsers,
            totalDevices,
            revenueToday: todaysRevenue[0]?.total || 0,
            flaggedDevices,
            activeVendors: await User.countDocuments({ role: 'vendor', isVendorActive: true })
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/admin/users/:id/suspend
// @desc    Suspend/Unsuspend User
router.put('/users/:id/suspend', adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        user.isAccountSuspended = !user.isAccountSuspended;
        await user.save();
        res.json({ msg: `User ${user.isAccountSuspended ? 'Suspended' : 'Unsuspended'}`, user });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
