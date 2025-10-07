const mongoose = require('mongoose');
require('dotenv').config({ path: '../backend/.env' });
const User = require('../backend/src/db/models/User');
const { connectDB, disconnectDB } = require('../backend/src/db/connection');

async function createAdminUser() {
    try {
        console.log('\n🔧 Setting up admin user...\n');

        await connectDB();

        // Check if admin already exists
        const existingAdmin = await User.findOne({ role: 'ADMIN' });

        if (existingAdmin) {
            console.log('⚠️  Admin user already exists:');
            console.log(`   Email: ${existingAdmin.email}`);
            console.log(`   Username: ${existingAdmin.username}\n`);
            return;
        }

        // Create admin user
        const admin = new User({
            username: 'admin',
            email: 'admin@organwaitlist.com',
            password: 'admin123', // Change this in production!
            role: 'ADMIN',
        });

        admin.setRolePermissions();
        await admin.save();

        console.log('✅ Admin user created successfully!\n');
        console.log('='.repeat(60));
        console.log('Admin Credentials:');
        console.log('='.repeat(60));
        console.log('Email:    admin@organwaitlist.com');
        console.log('Password: admin123');
        console.log('='.repeat(60));
        console.log('\n⚠️  IMPORTANT: Change the admin password in production!\n');

    } catch (error) {
        console.error('❌ Error creating admin user:', error);
    } finally {
        await disconnectDB();
        process.exit(0);
    }
}

createAdminUser();
