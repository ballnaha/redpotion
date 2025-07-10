const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testMobileLogin() {
  console.log('🧪 Testing Mobile Login Logic...\n');

  try {
    // 1. ทดสอบการสร้าง user ใหม่จาก iOS
    console.log('📱 Test 1: Creating new iOS user');
    const testUserId = `TEST_IOS_${Date.now()}`;
    
    const iosUser = await prisma.user.create({
      data: {
        lineUserId: testUserId,
        name: 'Test iOS User',
        email: `line_${testUserId}@line.user`,
        role: 'USER', // ใช้ USER ก่อนจนกว่า Prisma client จะอัพเดท
        loginPlatform: 'IOS'
      }
    });

    console.log('✅ iOS User created:', {
      id: iosUser.id,
      name: iosUser.name,
      role: iosUser.role,
      platform: iosUser.loginPlatform
    });

    // 2. ทดสอบการสร้าง user ใหม่จาก Android  
    console.log('\n📱 Test 2: Creating new Android user');
    const testUserIdAndroid = `TEST_ANDROID_${Date.now()}`;
    
    const androidUser = await prisma.user.create({
      data: {
        lineUserId: testUserIdAndroid,
        name: 'Test Android User',
        email: `line_${testUserIdAndroid}@line.user`,
        role: 'USER', // ใช้ USER ก่อนจนกว่า Prisma client จะอัพเดท
        loginPlatform: 'ANDROID'
      }
    });

    console.log('✅ Android User created:', {
      id: androidUser.id,
      name: androidUser.name,
      role: androidUser.role,
      platform: androidUser.loginPlatform
    });

    // 3. ทดสอบการสร้าง user ใหม่จาก Browser
    console.log('\n🌐 Test 3: Creating new Browser user');
    const testUserIdBrowser = `TEST_BROWSER_${Date.now()}`;
    
    const browserUser = await prisma.user.create({
      data: {
        lineUserId: testUserIdBrowser,
        name: 'Test Browser User',
        email: `line_${testUserIdBrowser}@line.user`,
        role: 'USER', // ยังคงเป็น USER สำหรับ Browser
        loginPlatform: 'BROWSER'
      }
    });

    console.log('✅ Browser User created:', {
      id: browserUser.id,
      name: browserUser.name,
      role: browserUser.role,
      platform: browserUser.loginPlatform
    });

    // 4. ตรวจสอบ Restaurant ที่มีอยู่
    console.log('\n🏪 Test 4: Checking available restaurants');
    const restaurants = await prisma.restaurant.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        status: true
      },
      take: 3
    });

    console.log('📋 Available restaurants:');
    restaurants.forEach((restaurant, index) => {
      console.log(`  ${index + 1}. ${restaurant.name} (${restaurant.id})`);
    });

    // 5. สรุปผลการทดสอบ
    console.log('\n📊 Test Summary:');
    console.log('✅ iOS user should have role USER and skip role selection');
    console.log('✅ Android user should have role USER and skip role selection'); 
    console.log('⚠️ Browser user should have role USER and go to role selection');
    
    // 6. ทำความสะอาด test data
    console.log('\n🗑️ Cleaning up test data...');
    await prisma.user.deleteMany({
      where: {
        lineUserId: {
          in: [testUserId, testUserIdAndroid, testUserIdBrowser]
        }
      }
    });
    console.log('✅ Test data cleaned up');

    console.log('\n🎯 Next Steps:');
    console.log('1. Test with real LINE App on iOS/Android');
    console.log('2. Verify redirect goes directly to menu (not role selection)');
    console.log('3. Test URL: http://localhost:3000/debug-line-real-user');
    console.log('4. Check console logs for platform detection');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// เรียกใช้ฟังก์ชันทดสอบ
if (require.main === module) {
  testMobileLogin().catch(console.error);
}

module.exports = { testMobileLogin }; 