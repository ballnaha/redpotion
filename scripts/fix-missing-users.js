const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkMissingUsers() {
  try {
    console.log('🔍 ตรวจสอบ LINE users ที่อาจมีปัญหา...\n');

    // ตรวจสอบ users ทั้งหมดที่มี lineUserId
    const lineUsers = await prisma.user.findMany({
      where: {
        lineUserId: {
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        lineUserId: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    console.log(`📊 พบ LINE users ทั้งหมด: ${lineUsers.length} คน\n`);

    // แสดงรายการ users
    lineUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name || 'ไม่มีชื่อ'}`);
      console.log(`   - ID: ${user.id}`);
      console.log(`   - LINE User ID: ${user.lineUserId}`);
      console.log(`   - Email: ${user.email}`);
      console.log(`   - Role: ${user.role}`);
      console.log(`   - Created: ${user.createdAt}`);
      console.log(`   - Updated: ${user.updatedAt}`);
      console.log('');
    });

    // ตรวจสอบ users ที่อาจมีปัญหา
    const problemUsers = lineUsers.filter(user => 
      !user.name || 
      !user.email || 
      user.email.includes('line_') === false
    );

    if (problemUsers.length > 0) {
      console.log(`⚠️  พบ users ที่อาจมีปัญหา: ${problemUsers.length} คน`);
      problemUsers.forEach(user => {
        console.log(`   - ${user.lineUserId}: ${user.name || 'ไม่มีชื่อ'}`);
      });
    } else {
      console.log('✅ ไม่พบปัญหาใน users');
    }

    console.log('\n📋 สถิติ:');
    console.log(`   - Total LINE users: ${lineUsers.length}`);
    console.log(`   - Users with problems: ${problemUsers.length}`);
    console.log(`   - CUSTOMER role: ${lineUsers.filter(u => u.role === 'CUSTOMER').length}`);
    console.log(`   - USER role: ${lineUsers.filter(u => u.role === 'USER').length}`);
    console.log(`   - RESTAURANT_OWNER role: ${lineUsers.filter(u => u.role === 'RESTAURANT_OWNER').length}`);

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function recreateUser(lineUserId, userData = {}) {
  try {
    console.log(`🔧 กำลังสร้างผู้ใช้ใหม่สำหรับ LINE ID: ${lineUserId}`);

    const newUser = await prisma.user.create({
      data: {
        lineUserId: lineUserId,
        name: userData.name || `LINE User ${lineUserId.slice(-6)}`,
        email: userData.email || `line_${lineUserId}@line.user`,
        role: userData.role || 'USER',
        image: userData.image || null,
        loginPlatform: userData.loginPlatform || 'BROWSER'
      }
    });

    console.log('✅ สร้างผู้ใช้ใหม่สำเร็จ:', newUser);
    return newUser;

  } catch (error) {
    console.error('❌ ไม่สามารถสร้างผู้ใช้ใหม่ได้:', error);
    return null;
  }
}

async function cleanupOrphanedSessions() {
  try {
    console.log('🧹 ทำความสะอาด orphaned sessions...');
    
    // Note: เราไม่สามารถลบ HTTP-only cookies จากฝั่ง server ได้โดยตรง
    // แต่เราสามารถแสดงคำแนะนำให้ user ได้
    
    console.log(`
📝 คำแนะนำในการทำความสะอาด cookies:

1. เปิด browser developer tools (F12)
2. ไปที่ tab Application/Storage
3. ลบ cookies ที่เกี่ยวข้อง:
   - line-session-token
   - line-session-backup
   - line-session
   - LIFF_STORE:*

หรือใช้ JavaScript command ใน console:
document.cookie.split(';').forEach(cookie => {
  const name = cookie.split('=')[0].trim();
  if (name.includes('line-session') || name.includes('LIFF_STORE')) {
    document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
  }
});
    `);

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการทำความสะอาด:', error);
  }
}

// เรียกใช้ functions
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'check':
      await checkMissingUsers();
      break;
    case 'recreate':
      const lineUserId = args[1];
      if (!lineUserId) {
        console.log('❌ กรุณาระบุ LINE User ID');
        console.log('Usage: node scripts/fix-missing-users.js recreate <LINE_USER_ID>');
        return;
      }
      await recreateUser(lineUserId);
      break;
    case 'cleanup':
      await cleanupOrphanedSessions();
      break;
    default:
      console.log(`
🛠️  LINE User Management Script

Commands:
  check     - ตรวจสอบ LINE users ในฐานข้อมูล
  recreate  - สร้าง user ใหม่สำหรับ LINE User ID ที่ระบุ
  cleanup   - แสดงวิธีการทำความสะอาด cookies

Usage:
  node scripts/fix-missing-users.js check
  node scripts/fix-missing-users.js recreate <LINE_USER_ID>
  node scripts/fix-missing-users.js cleanup
      `);
  }
}

main(); 