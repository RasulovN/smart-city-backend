require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/user');
const config = require('./config');



// sada
// Seed super admin user
const seedSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongoUrl);
    console.log('✅ Connected to MongoDB');

    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ role: 'super_admin' });

    if (existingSuperAdmin) {
      console.log('⚠️  Super admin already exists:');
      console.log('   Email:', existingSuperAdmin.email);
      console.log('   Username:', existingSuperAdmin.username);
      console.log('\n💡 If you need to reset the password, delete the user from database first.');
      process.exit(0);
    }

    // Create super admin
    const superAdmin = new User({
      username: process.env.SUPER_ADMIN_USERNAME || 'superadmin',
      email: process.env.SUPER_ADMIN_EMAIL || 'superadmin@smartcity.uz',
      password: process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@2024',
      role: 'super_admin',
      sector: 'all',
      isActive: true
    });

    await superAdmin.save();

    console.log('\n✅ Super Admin created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', superAdmin.email);
    console.log('👤 Username:', superAdmin.username);
    console.log('🔑 Password:', process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@2024');
    console.log('🎭 Role:', superAdmin.role);
    console.log('🏢 Sector:', superAdmin.sector);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');
    console.log('💡 Use these credentials to login and create other admins.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding super admin:', error.message);
    process.exit(1);
  }
};

// Run the seed function
seedSuperAdmin();
