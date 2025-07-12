const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testAdminLogin() {
  try {
    console.log('🧪 Testing admin login functionality...');

    const testCredentials = {
      email: 'admin@redpotion.com',
      password: 'Admin123!'
    };

    console.log(`📧 Testing login for: ${testCredentials.email}`);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: testCredentials.email },
      include: { restaurant: true }
    });

    if (!user) {
      console.log('❌ User not found');
      return false;
    }

    console.log(`👤 User found: ${user.name} (${user.role})`);

    // Check if user has password (not LINE user)
    if (!user.password) {
      console.log('❌ User has no password (LINE user)');
      return false;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(testCredentials.password, user.password);
    
    if (!isPasswordValid) {
      console.log('❌ Invalid password');
      return false;
    }

    console.log('✅ Password is valid');

    // Check role (should be ADMIN)
    if (user.role !== 'ADMIN') {
      console.log(`❌ Invalid role: ${user.role} (expected: ADMIN)`);
      return false;
    }

    console.log('✅ Role is ADMIN');

    console.log('\n📋 User Details:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Login Platform: ${user.loginPlatform}`);
    console.log(`   Created: ${user.createdAt}`);
    console.log(`   Has Restaurant: ${user.restaurant ? 'Yes' : 'No'}`);

    console.log('\n✅ Admin login test PASSED!');
    console.log('\n🚀 Ready to login:');
    console.log('   1. Go to: /auth/signin');
    console.log(`   2. Email: ${testCredentials.email}`);
    console.log(`   3. Password: ${testCredentials.password}`);
    console.log('   4. Will redirect to: /admin');

    return true;

  } catch (error) {
    console.error('❌ Error testing admin login:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// ตรวจสอบว่า admin user มีอยู่ในระบบ
async function checkAdminUsers() {
  try {
    console.log('\n📊 Checking all admin users in system...');

    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        loginPlatform: true
      }
    });

    if (adminUsers.length === 0) {
      console.log('⚠️  No admin users found in system');
      return;
    }

    console.log(`✅ Found ${adminUsers.length} admin user(s):`);
    adminUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email}) - ${user.loginPlatform || 'N/A'}`);
    });

  } catch (error) {
    console.error('❌ Error checking admin users:', error);
    throw error;
  }
}

// รันทดสอบ
if (require.main === module) {
  Promise.all([
    testAdminLogin(),
    checkAdminUsers()
  ])
    .then(() => {
      console.log('\n🎉 All tests completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testAdminLogin, checkAdminUsers }; 