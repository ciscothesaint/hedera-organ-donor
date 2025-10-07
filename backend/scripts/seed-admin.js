const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../src/db/models/User');

async function seedAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Check if admin exists
        const existingAdmin = await User.findOne({ email: 'admin@organregistry.com' });

        if (existingAdmin) {
            console.log('⚠️  Admin user already exists!');
            console.log('\n📧 Email: admin@organregistry.com');
            console.log('🔑 Password: admin123');
            process.exit(0);
        }

        // Create admin user
        const adminUser = new User({
            username: 'admin',
            email: 'admin@organregistry.com',
            password: 'admin123',
            role: 'ADMIN',
            profile: {
                firstName: 'System',
                lastName: 'Administrator'
            }
        });

        adminUser.setRolePermissions();
        await adminUser.save();

        console.log('✅ Admin user created successfully!\n');
        console.log('═══════════════════════════════════════');
        console.log('📧 Email: admin@organregistry.com');
        console.log('🔑 Password: admin123');
        console.log('👤 Role: ADMIN');
        console.log('═══════════════════════════════════════\n');
        console.log('⚠️  Please change the password after first login!\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding admin:', error);
        process.exit(1);
    }
}

seedAdmin();
