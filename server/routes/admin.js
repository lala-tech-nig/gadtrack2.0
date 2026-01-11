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
        // User Statistics
        const totalUsers = await User.countDocuments();
        const newUsersToday = await User.countDocuments({
            createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        });
        const newUsersThisWeek = await User.countDocuments({
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        });
        const newUsersThisMonth = await User.countDocuments({
            createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
        });

        // Device Statistics
        const totalDevices = await Device.countDocuments();
        const newDevicesToday = await Device.countDocuments({
            createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        });
        const newDevicesThisWeek = await Device.countDocuments({
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        });
        const newDevicesThisMonth = await Device.countDocuments({
            createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
        });

        // Flagged Devices
        const flaggedDevices = await Device.countDocuments({
            status: { $in: ['stolen', 'lost', 'missing'] }
        });
        const stolenDevices = await Device.countDocuments({ status: 'stolen' });
        const lostDevices = await Device.countDocuments({ status: 'lost' });

        // Revenue Statistics
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todaysRevenue = await Transaction.aggregate([
            { $match: { createdAt: { $gte: todayStart }, status: 'success' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const thisWeekRevenue = await Transaction.aggregate([
            {
                $match: {
                    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
                    status: 'success'
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const allTimeRevenue = await Transaction.aggregate([
            { $match: { status: 'success' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        // User Role Breakdown
        const basicUsers = await User.countDocuments({ role: 'basic' });
        const vendorUsers = await User.countDocuments({ role: 'vendor' });
        const activeVendors = await User.countDocuments({ role: 'vendor', isVendorActive: true });
        const enterpriseUsers = await User.countDocuments({ role: 'enterprise_admin' });
        const suspendedUsers = await User.countDocuments({ isAccountSuspended: true });

        res.json({
            users: {
                total: totalUsers,
                newToday: newUsersToday,
                newThisWeek: newUsersThisWeek,
                newThisMonth: newUsersThisMonth,
                basic: basicUsers,
                vendors: vendorUsers,
                activeVendors,
                enterprise: enterpriseUsers,
                suspended: suspendedUsers
            },
            devices: {
                total: totalDevices,
                newToday: newDevicesToday,
                newThisWeek: newDevicesThisWeek,
                newThisMonth: newDevicesThisMonth,
                flagged: flaggedDevices,
                stolen: stolenDevices,
                lost: lostDevices
            },
            revenue: {
                today: todaysRevenue[0]?.total || 0,
                thisWeek: thisWeekRevenue[0]?.total || 0,
                allTime: allTimeRevenue[0]?.total || 0
            }
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
