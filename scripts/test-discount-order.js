const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestDiscountOrder() {
  try {
    console.log('🧪 สร้างออเดอร์ทดสอบที่มีส่วนลด...');

    // หาร้านอาหารแรก
    const restaurant = await prisma.restaurant.findFirst({
      where: { status: 'ACTIVE' },
      include: { 
        categories: {
          include: {
            menuItems: true
          }
        }
      }
    });

    if (!restaurant || !restaurant.categories[0]?.menuItems[0]) {
      console.error('❌ ไม่พบร้านอาหารหรือเมนูสำหรับทดสอบ');
      return;
    }

    const menuItem = restaurant.categories[0].menuItems[0];

    // หา user ที่มี lineUserId
    const user = await prisma.user.findFirst({
      where: { 
        role: { in: ['USER', 'CUSTOMER'] },
        NOT: { email: null }
      }
    });

    if (!user) {
      console.error('❌ ไม่พบ user สำหรับทดสอบ');
      return;
    }

    // สร้างออเดอร์ที่มีส่วนลด
    const orderNumber = `ORD${Date.now()}DISCOUNT`;
    
    const testOrder = await prisma.order.create({
      data: {
        orderNumber,
        status: 'PENDING',
        customerName: user.name,
        customerPhone: '0987654321',
        customerEmail: user.email,
        lineUserId: 'test-line-user-123',
        deliveryAddress: '123 ถนนทดสอบ แขวงทดสอบ เขตทดสอบ กรุงเทพฯ 10110',
        deliveryNotes: 'ทดสอบออเดอร์ที่มีส่วนลด',
        subtotal: 250,
        deliveryFee: 30,
        tax: 0,
        discount: 50,        // ส่วนลด 50 บาท
        promoCode: 'SAVE50', // โค้ดส่วนลด
        total: 230,          // 250 + 30 - 50 = 230
        paymentMethod: 'cash',
        isPaid: false,
        restaurantId: restaurant.id,
        items: {
          create: [
            {
              quantity: 2,
              price: menuItem.price,
              notes: 'ทดสอบรายการที่มีส่วนลด',
              menuItemId: menuItem.id
            },
            {
              quantity: 1,
              price: menuItem.price,
              notes: 'รายการเพิ่มเติม',
              menuItemId: menuItem.id
            }
          ]
        }
      },
      include: {
        restaurant: true,
        items: {
          include: {
            menuItem: true
          }
        }
      }
    });

    console.log('✅ สร้างออเดอร์ทดสอบสำเร็จ!');
    console.log({
      orderNumber: testOrder.orderNumber,
      restaurant: testOrder.restaurant.name,
      subtotal: testOrder.subtotal,
      discount: testOrder.discount,
      promoCode: testOrder.promoCode,
      total: testOrder.total,
      itemsCount: testOrder.items.length
    });

    // สร้างออเดอร์อีกตัวแบบไม่มีส่วนลด
    const orderNumber2 = `ORD${Date.now()}NODISCOUNT`;
    
    const normalOrder = await prisma.order.create({
      data: {
        orderNumber: orderNumber2,
        status: 'CONFIRMED',
        customerName: user.name,
        customerPhone: '0987654321',
        customerEmail: user.email,
        lineUserId: 'test-line-user-123',
        deliveryAddress: '456 ถนนปกติ แขวงปกติ เขตปกติ กรุงเทพฯ 10110',
        subtotal: 180,
        deliveryFee: 30,
        tax: 0,
        discount: 0,         // ไม่มีส่วนลด
        promoCode: null,     // ไม่มีโค้ด
        total: 210,          // 180 + 30 = 210
        paymentMethod: 'transfer',
        isPaid: true,
        restaurantId: restaurant.id,
        items: {
          create: [
            {
              quantity: 1,
              price: menuItem.price,
              notes: 'ออเดอร์ปกติไม่มีส่วนลด',
              menuItemId: menuItem.id
            }
          ]
        }
      },
      include: {
        restaurant: true,
        items: {
          include: {
            menuItem: true
          }
        }
      }
    });

    console.log('✅ สร้างออเดอร์ปกติสำเร็จ!');
    console.log({
      orderNumber: normalOrder.orderNumber,
      restaurant: normalOrder.restaurant.name,
      subtotal: normalOrder.subtotal,
      discount: normalOrder.discount,
      promoCode: normalOrder.promoCode,
      total: normalOrder.total,
      itemsCount: normalOrder.items.length
    });

    console.log('\n🎉 สร้างออเดอร์ทดสอบทั้งหมดเรียบร้อย!');
    console.log('- ออเดอร์ที่มีส่วนลด:', testOrder.orderNumber);
    console.log('- ออเดอร์ปกติ:', normalOrder.orderNumber);
    console.log('\n💡 สามารถไปดูใน /orders หรือ /debug-orders-modal');

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestDiscountOrder(); 