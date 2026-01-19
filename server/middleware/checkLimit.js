const User = require('../models/User');

// Action Types: 'lookups', 'transfers', 'acceptances'
module.exports = function (actionType) {
    return async function (req, res, next) {
        try {
            // Assume Auth Middleware run before this, so req.user exists
            if (!req.user) return res.status(401).json({ msg: 'Unauthorized' });

            const user = await User.findById(req.user.id);
            if (!user) return res.status(404).json({ msg: 'User not found' });

            // 1. Reset Usage if new month
            const currentMonth = new Date().toISOString().slice(0, 7);
            if (!user.usage || user.usage.month !== currentMonth) {
                user.usage = {
                    month: currentMonth,
                    lookups: 0,
                    transfers: 0,
                    acceptances: 0
                };
                await user.save();
            }

            // 2. Define Limits based on Role
            let limit = 0;
            let unlimited = false;

            // Global Unlimited Roles
            if (['admin', 'enterprise_admin', 'store_manager'].includes(user.role)) {
                unlimited = true;
            }

            // Role Specifics
            if (user.role === 'basic') {
                // Limit is 3 for everything
                limit = 3;
            } else if (user.role === 'vendor') {
                // Unlimited Lookups
                if (actionType === 'lookups') unlimited = true;
                else limit = 200; // Transfers/Acceptances

                // Check Subscription
                if (!user.isSubscriptionActive()) {
                    return res.status(402).json({
                        msg: 'Subscription expired. Please pay 10,000 NGN to renew.',
                        code: 'SUBSCRIPTION_EXPIRED',
                        amount: 10000,
                        type: 'vendor_subscription'
                    });
                }
            } else if (user.role === 'technician') {
                // Unlimited Lookups
                if (actionType === 'lookups') unlimited = true;
                else limit = 100; // Transfers/Acceptances

                if (!user.isSubscriptionActive()) {
                    return res.status(402).json({
                        msg: 'Subscription expired. Please pay 5,000 NGN to renew.',
                        code: 'SUBSCRIPTION_EXPIRED',
                        amount: 5000,
                        type: 'technician_subscription'
                    });
                }
            }

            // 3. Check specific limit
            if (!unlimited) {
                const currentUsage = user.usage[actionType] || 0;
                if (currentUsage >= limit) {
                    // Logic for Basic User Overage
                    if (user.role === 'basic') {
                        return res.status(402).json({
                            msg: `Monthly ${actionType} limit reached. Pay 1,000 NGN to proceed.`,
                            code: 'LIMIT_REACHED',
                            amount: 1000,
                            type: 'device_overage'
                        });
                    } else {
                        return res.status(402).json({ msg: `Monthly ${actionType} limit reached.`, code: 'LIMIT_REACHED' });
                    }
                }
            }

            // 4. Attach incrementer
            req.incrementUsage = async () => {
                // Re-fetch to avoid race conditions (simple version)
                // In high volume, use $inc.
                await User.findByIdAndUpdate(req.user.id, { $inc: { [`usage.${actionType}`]: 1 } });
            };

            next();

        } catch (err) {
            console.error(err);
            res.status(500).send('Server Error in Usage Check');
        }
    };
};
