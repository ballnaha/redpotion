const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createPricingPlans() {
  try {
    console.log('🚀 Creating pricing plans...');

    // แผนราคารายเดือน
    const monthlyPlans = [
      {
        name: 'แผนพื้นฐาน 1 เดือน',
        description: 'แผนพื้นฐานสำหรับร้านขนาดเล็ก',
        planType: 'MONTHLY',
        duration: 1,
        originalPrice: 299,
        discountPercent: 0,
        finalPrice: 299,
        features: [
          'เมนูไม่จำกัด',
          'รับออเดอร์ผ่าน LINE',
          'รายงานยอดขายพื้นฐาน',
          'ระบบจัดการคำสั่งซื้อ'
        ],
        sortOrder: 1,
        isActive: true
      },
      {
        name: 'แผนประหยัด 3 เดือน',
        description: 'แผนประหยัดสำหรับร้านที่ต้องการใช้งานระยะกลาง',
        planType: 'MONTHLY',
        duration: 3,
        originalPrice: 897, // 299 * 3
        discountPercent: 10,
        finalPrice: 807.30,
        features: [
          'เมนูไม่จำกัด',
          'รับออเดอร์ผ่าน LINE',
          'รายงานยอดขายพื้นฐาน',
          'ระบบจัดการคำสั่งซื้อ',
          'ประหยัด 10%'
        ],
        sortOrder: 2,
        isActive: true
      },
      {
        name: 'แผนคุ้มค่า 6 เดือน',
        description: 'แผนคุ้มค่าสำหรับร้านที่ต้องการใช้งานระยะยาว',
        planType: 'MONTHLY',
        duration: 6,
        originalPrice: 1794, // 299 * 6
        discountPercent: 15,
        finalPrice: 1524.90,
        features: [
          'เมนูไม่จำกัด',
          'รับออเดอร์ผ่าน LINE',
          'รายงานยอดขายพื้นฐาน',
          'ระบบจัดการคำสั่งซื้อ',
          'ประหยัด 15%'
        ],
        sortOrder: 3,
        isActive: true
      },
      {
        name: 'แผนสุดคุ้ม 12 เดือน',
        description: 'แผนสุดคุ้มสำหรับร้านที่ต้องการใช้งานตลอดปี',
        planType: 'MONTHLY',
        duration: 12,
        originalPrice: 3588, // 299 * 12
        discountPercent: 20,
        finalPrice: 2870.40,
        features: [
          'เมนูไม่จำกัด',
          'รับออเดอร์ผ่าน LINE',
          'รายงานยอดขายพื้นฐาน',
          'ระบบจัดการคำสั่งซื้อ',
          'ประหยัด 20%'
        ],
        sortOrder: 4,
        isActive: true
      }
    ];

    // แผนราคารายปี
    const yearlyPlans = [
      {
        name: 'แผนรายปี 1 ปี',
        description: 'แผนรายปีสำหรับร้านที่ต้องการความคุ้มค่าสูงสุด',
        planType: 'YEARLY',
        duration: 1,
        originalPrice: 2990, // ประมาณ 249 ต่อเดือน
        discountPercent: 25,
        finalPrice: 2242.50,
        features: [
          'เมนูไม่จำกัด',
          'รับออเดอร์ผ่าน LINE',
          'รายงานยอดขายขั้นสูง',
          'ระบบจัดการคำสั่งซื้อ',
          'ประหยัด 25%',
          'การสนับสนุนลูกค้าพิเศษ'
        ],
        sortOrder: 1,
        isActive: true
      },
      {
        name: 'แผนรายปี 2 ปี',
        description: 'แผนรายปีสำหรับร้านที่ต้องการความมั่นคงระยะยาว',
        planType: 'YEARLY',
        duration: 2,
        originalPrice: 5980, // 2990 * 2
        discountPercent: 30,
        finalPrice: 4186.00,
        features: [
          'เมนูไม่จำกัด',
          'รับออเดอร์ผ่าน LINE',
          'รายงานยอดขายขั้นสูง',
          'ระบบจัดการคำสั่งซื้อ',
          'ประหยัด 30%',
          'การสนับสนุนลูกค้าพิเศษ',
          'ฟีเจอร์ใหม่ล่าสุด'
        ],
        sortOrder: 2,
        isActive: true
      },
      {
        name: 'แผนรายปี 3 ปี',
        description: 'แผนรายปีสำหรับร้านที่ต้องการความคุ้มค่าสูงสุด',
        planType: 'YEARLY',
        duration: 3,
        originalPrice: 8970, // 2990 * 3
        discountPercent: 35,
        finalPrice: 5830.50,
        features: [
          'เมนูไม่จำกัด',
          'รับออเดอร์ผ่าน LINE',
          'รายงานยอดขายขั้นสูง',
          'ระบบจัดการคำสั่งซื้อ',
          'ประหยัด 35%',
          'การสนับสนุนลูกค้าพิเศษ',
          'ฟีเจอร์ใหม่ล่าสุด',
          'การปรับแต่งเพิ่มเติม'
        ],
        sortOrder: 3,
        isActive: true
      }
    ];

    // สร้างแผนราคารายเดือน
    for (const plan of monthlyPlans) {
      await prisma.pricingPlan.create({
        data: plan
      });
      console.log(`✅ Created monthly plan: ${plan.name}`);
    }

    // สร้างแผนราคารายปี
    for (const plan of yearlyPlans) {
      await prisma.pricingPlan.create({
        data: plan
      });
      console.log(`✅ Created yearly plan: ${plan.name}`);
    }

    console.log('🎉 All pricing plans created successfully!');
    
    // แสดงสถิติ
    const totalPlans = await prisma.pricingPlan.count();
    const monthlyCount = await prisma.pricingPlan.count({
      where: { planType: 'MONTHLY' }
    });
    const yearlyCount = await prisma.pricingPlan.count({
      where: { planType: 'YEARLY' }
    });

    console.log(`📊 Summary:`);
    console.log(`   Total plans: ${totalPlans}`);
    console.log(`   Monthly plans: ${monthlyCount}`);
    console.log(`   Yearly plans: ${yearlyCount}`);

  } catch (error) {
    console.error('❌ Error creating pricing plans:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createPricingPlans(); 