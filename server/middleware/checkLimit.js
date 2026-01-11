const User = require('../models/User');

module.exports = async function (req, res, next) {
    try {
        const user = await User.findById(req.user.id);

        // 1. Vendor/Admin/Enterprise: Unlimited
        if (['vendor', 'admin', 'enterprise_admin', 'store_manager'].includes(user.role)) {
            // Check Vendor Activation
            if (user.role === 'vendor' && !user.isVendorActive) {
                return res.status(403).json({
                    msg: 'Vendor account inactive. Please pay activation fee.',
                    requiresPayment: true,
                    paymentType: 'vendor_activation',
                    amount: 10000
                });
            }
            return next();
        }

        // 2. Basic User Logic
        const currentMonth = new Date().toISOString().slice(0, 7);

        // Reset count if new month
        if (user.usageLimit.month !== currentMonth) {
            user.usageLimit.month = currentMonth;
            user.usageLimit.count = 0;
            await user.save();
        }

        // Check Limit
        const FREE_LIMIT = 2;

        if (user.usageLimit.count < FREE_LIMIT) {
            // Allowed via Free Tier
            // We increment in the controller or here? 
            // Better here, but only if operation succeeds.
            // Actually, usually easier to check here, and increment in Controller or "finish" middleware.
            // For simplicity, let's attach a method to request to increment?
            req.incrementUsage = async () => {
                const u = await User.findById(req.user.id); // refetch to be safe
                u.usageLimit.count += 1;
                await u.save();
            };
            return next();
        } else if (user.credits > 0) {
            // Allowed via Credits
            req.incrementUsage = async () => {
                const u = await User.findById(req.user.id);
                u.credits -= 1;
                await u.save();
            };
            return next();
        } else {
            // Limit Reached
            return res.status(402).json({
                msg: 'Monthly limit reached. Pay to proceed.',
                requiresPayment: true,
                paymentType: 'device_overage',
                amount: 1000
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error in Usage Check');
    }
};
