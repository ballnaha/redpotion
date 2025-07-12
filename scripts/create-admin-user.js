const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('🔧 Starting admin user creation...');

    // Admin user data
    const adminData = {
      name: 'Admin User',
      email: 'admin@redpotion.com',
      password: 'Admin123!', // เปลี่ยนรหัสผ่านตามต้องการ
      role: 'ADMIN'
    };

    console.log(`📧 Creating admin user with email: ${adminData.email}`);

    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminData.email }
    });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists with this email');
      
      // Update existing user to admin role if not already
      if (existingAdmin.role !== 'ADMIN') {
        const updatedUser = await prisma.user.update({
          where: { email: adminData.email },
          data: { role: 'ADMIN' }
        });
        console.log(`✅ Updated existing user ${updatedUser.email} to ADMIN role`);
      } else {
        console.log('✅ User is already an ADMIN');
      }
      return existingAdmin;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminData.password, 12);
    console.log('🔐 Password hashed successfully');

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        name: adminData.name,
        email: adminData.email,
        password: hashedPassword,
        role: adminData.role,
        loginPlatform: 'BROWSER'
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log('📋 Admin User Details:');
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   Name: ${adminUser.name}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   Created: ${adminUser.createdAt}`);
    
    console.log('\n🔑 Login Credentials:');
    console.log(`   Email: ${adminData.email}`);
    console.log(`   Password: ${adminData.password}`);
    console.log('\n📍 Admin Panel: /admin');
    console.log('📍 Login Page: /auth/signin');

    return adminUser;

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// เรียกใช้ฟังก์ชันถ้าไฟล์นี้ถูกรันโดยตรง
if (require.main === module) {
  createAdminUser()
    .then(() => {
      console.log('\n🎉 Admin user creation completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Admin user creation failed:', error);
      process.exit(1);
    });
}

module.exports = { createAdminUser }; 