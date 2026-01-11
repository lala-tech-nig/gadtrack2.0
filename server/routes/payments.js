const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const jwt = require('jsonwebtoken');

const auth = require('../middleware/checkLimit'); // Just want auth part?? No, checkLimit includes auth logic? 
// Wait, checkLimit calls next() or payload? checkLimit assumes req.user is populated by PREVIOUS auth middleware?
// My checkLimit implementation DOES NOT verify token. It assumes used AFTER auth middleware.
// Let's import the standard auth middleware for this file.

const authMiddleware = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

// @route   POST /api/payments/verify
// @desc    Verify Payment (Mock)
router.post('/verify', authMiddleware, async (req, res) => {
    const { reference, type, amount } = req.body; // type: 'vendor_activation' | 'device_overage'

    try {
        // 1. Record Transaction
        const transaction = new Transaction({
            user: req.user.id,
            amount,
            type,
            status: 'success', // Mocking success
            reference,
            description: `Payment for ${type}`
        });
        await transaction.save();

        // 2. Grant Value
        const user = await User.findById(req.user.id);

        if (type === 'vendor_activation') {
            user.isVendorActive = true;
            user.role = 'vendor'; // Confirm role
        } else if (type === 'device_overage') {
            // Add credits
            // Amount 1000 = 1 credit?
            const creditsToAdd = Math.floor(amount / 1000);
            user.credits = (user.credits || 0) + creditsToAdd;
        }

        await user.save();
        res.json({ msg: 'Payment Successful', user });

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
