const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabaseTables() {
  try {
    console.log('🔍 Checking database tables and structure...');
    
    // ตรวจสอบ User table
    try {
      const userCount = await prisma.user.count();
      console.log('✅ User table exists -', userCount, 'records');
    } catch (error) {
      console.error('❌ User table error:', error.message);
    }
    
    // ตรวจสอบ CustomerProfile table
    try {
      const profileCount = await prisma.customerProfile.count();
      console.log('✅ CustomerProfile table exists -', profileCount, 'records');
    } catch (error) {
      console.error('❌ CustomerProfile table error:', error.message);
    }
    
    // ตรวจสอบ DeliveryAddress table
    try {
      const addressCount = await prisma.deliveryAddress.count();
      console.log('✅ DeliveryAddress table exists -', addressCount, 'records');
    } catch (error) {
      console.error('❌ DeliveryAddress table error:', error.message);
    }
    
    // ตรวจสอบ Restaurant table
    try {
      const restaurantCount = await prisma.restaurant.count();
      console.log('✅ Restaurant table exists -', restaurantCount, 'records');
    } catch (error) {
      console.error('❌ Restaurant table error:', error.message);
    }
    
    // ตรวจสอบการเชื่อมต่อฐานข้อมูล
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ Database connection successful');
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
    }
    
    // ตรวจสอบ environment variables
    console.log('\n📊 Environment check:');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    console.log('- NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'Set' : 'Not set');
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseTables(); 