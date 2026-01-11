const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const createAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/traceit');
        console.log('MongoDB Connected...');

        // Admin details - CHANGE THESE!
        const adminData = {
            name: 'Super Admin',
            email: 'admin@traceit.com',
            password: 'admin123', // Change this to a secure password
            nin: '00000000000', // Change this
            role: 'admin'
        };

        // Check if admin already exists
        let admin = await User.findOne({ email: adminData.email });
        if (admin) {
            console.log('Admin user already exists!');
            process.exit(0);
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminData.password, salt);

        // Create admin user
        admin = new User({
            ...adminData,
            password: hashedPassword
        });

        await admin.save();
        console.log('✅ Admin user created successfully!');
        console.log(`Email: ${adminData.email}`);
        console.log(`Password: ${adminData.password}`);
        console.log('\n⚠️  IMPORTANT: Change the password after first login!');

        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
};

createAdmin();
