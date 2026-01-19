const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const jwt = require('jsonwebtoken');
const Flutterwave = require('flutterwave-node-v3');

// Initialize Flutterwave
// Keys should be in .env, falling back if not (but they should be there now)
const flw = new Flutterwave(
    process.env.FLW_PUBLIC_KEY || 'FLWPUBK_TEST-6c7c3767322cb54b7bcf51feeae9f6db-X',
    process.env.FLW_SECRET_KEY || 'FLWSECK_TEST-0e45ea52fa3e35d51f8392325fd44eb4-X'
);


// Auth Middleware
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
// @desc    Verify Payment using Flutterwave API
// @access  Private
router.post('/verify', authMiddleware, async (req, res) => {
    const { transaction_id, type } = req.body;
    // transaction_id comes from Frontend (response.transaction_id)
    // type: 'vendor_activation', 'technician_subscription', 'device_overage'

    if (!transaction_id || !type) {
        return res.status(400).json({ msg: 'Missing transaction_id or type' });
    }

    try {
        // 1. Verify with Flutterwave
        const response = await flw.Transaction.verify({ id: transaction_id });

        if (response.data.status === "successful"
            // && response.data.amount >= EXPECTED_AMOUNT // (Optional strict check)
        ) {
            const amount = response.data.amount;
            const txRef = response.data.tx_ref;

            // Check if transaction already processed
            const existingTx = await Transaction.findOne({ reference: txRef });
            if (existingTx) {
                return res.json({ msg: 'Transaction already processed', user: await User.findById(req.user.id) });
            }

            // 2. Record Transaction
            const transaction = new Transaction({
                user: req.user.id,
                amount: amount,
                type: type,
                status: 'success',
                reference: txRef,
                description: `Payment for ${type}`
            });
            await transaction.save();

            // 3. Grant Value
            const user = await User.findById(req.user.id);
            const now = new Date();

            if (type === 'vendor_activation' || type === 'vendor_subscription') {
                // 10,000 NGN
                if (amount < 10000) return res.status(400).json({ msg: 'Insufficient amount for Vendor Subscription' });

                user.role = 'vendor';
                user.isVendorActive = true;
                user.subscription.status = 'active';
                user.subscription.plan = 'vendor';
                user.subscription.lastPaymentDate = now;

                // Set Expiry to 1 month from now
                const expiry = new Date(now);
                expiry.setMonth(expiry.getMonth() + 1);
                user.subscription.expiryDate = expiry;

            } else if (type === 'technician_subscription') {
                // 5,000 NGN
                if (amount < 5000) return res.status(400).json({ msg: 'Insufficient amount for Technician Subscription' });

                user.role = 'technician';
                user.subscription.status = 'active';
                user.subscription.plan = 'technician';
                user.subscription.lastPaymentDate = now;

                const expiry = new Date(now);
                expiry.setMonth(expiry.getMonth() + 1);
                user.subscription.expiryDate = expiry;

            } else if (type === 'device_overage') {
                // 1,000 NGN -> Unlock specific action?
                // Actually usage limits reset, or we give "Credits"?
                // The prompt says "asked to pay 1,000 function ... until next month start" ?
                // "if user exceed... asked to pay 1,000 ... until next month start"
                // This implies paying 1,000 unlocks unlimited/more for the REST OF THE MONTH?
                // OR pay 1,000 per extra action?
                // "pay 1,000 ... until next month start" sounds like an UNLOCK for the month.

                // Let's implement as "Granting 5 extra slots" or "Unlocking for month"?
                // Let's assume it unlocks "Unlimited for Month" for Basic User? 
                // That seems generous for 1000 vs 10000 for Vendor.
                // Maybe it just allows ONE action?
                // "pay 1,000 function" -> "pay 1,000 [per] function"?
                // Let's assume it adds to limits.

                user.usage.transfers = Math.max(0, (user.usage.transfers || 0) - 1); // Reduce usage count by 1 to allow 1 more?
                // Or increase limit?
                // Let's just say we don't block them for *this* request if they show proof of payment?
                // Simpler: Add 'credits' or decrement usage.

                // Prompt: "asked to pay 1,000 function ... until next month start"
                // This phrasing is ambiguous. "pay 1,000 [for the] function"?
                // Let's assume pay 1,000 per extra usage.
                // So we decrement usage count by 1.
                // Wait, if usage count is 3, and limit is 3. Payment -> usage becomes 2? Then they can do 1 more.
                // Correct.

                // BUT we need to know WHICH usage to decrement.
                // The 'type' passed from frontend should specifying 'device_overage_transfer' etc?
                // Let's just decrement all by 1 for simplicity or assume 'transfers' is the main one.
                // Or better: Add a 'credit' field to User model (which I removed in Step 37, oops).
                // I removed 'credits' in Step 37 because new plan didn't mention it.
                // I will just decrement `usage.transfers`, `usage.acceptances`, `usage.lookups` by 1.
                // This gives 1 extra slot for EACH type. Good deal for 1000 Naira.

                const dec = -1;
                // user.usage.lookups += dec; 
                // user.usage.transfers += dec;
                // user.usage.acceptances += dec;
                // But they can't go below 0? Actually they can if we just want to allow *more* than limit.
                // e.g. Usage = 3. Limit = 3. 3 >= 3 (Blocked).
                // Payment -> Usage = 2. 2 < 3 (Allowed).
                // Works.

                if (user.usage.lookups > 0) user.usage.lookups--;
                if (user.usage.transfers > 0) user.usage.transfers--;
                if (user.usage.acceptances > 0) user.usage.acceptances--;
            }

            await user.save();
            res.json({ msg: 'Payment Successful', user });

        } else {
            res.status(400).json({ msg: 'Payment Failed or Invalid' });
        }

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
