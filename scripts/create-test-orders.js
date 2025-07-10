const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestOrders() {
  try {
    console.log('🛒 Creating test orders...\n');

    // หา restaurant และ menu items
    const restaurant = await prisma.restaurant.findFirst({
      where: { status: 'ACTIVE' },
      include: {
        categories: {
          include: {
            menuItems: {
              where: { isAvailable: true },
              take: 3
            }
          }
        }
      }
    });

    if (!restaurant) {
      console.error('❌ No active restaurant found');
      return;
    }

    console.log(`🏪 Found restaurant: ${restaurant.name} (${restaurant.id})`);

    const menuItems = restaurant.categories.flatMap(cat => cat.menuItems);
    if (menuItems.length === 0) {
      console.error('❌ No menu items found');
      return;
    }

    console.log(`🍽️ Found ${menuItems.length} menu items`);

    // สร้าง test orders
    const testOrders = [
      {
        customerName: 'คุณสมชาย ใจดี',
        customerPhone: '0811234567',
        customerEmail: 'somchai@email.com',
        deliveryAddress: '123 ถนนสุขุมวิท แขวงคลองตัน เขตวัฒนา กรุงเทพฯ 10110',
        paymentMethod: 'cash',
        status: 'PENDING',
        items: [
          { menuItem: menuItems[0], quantity: 2 },
          { menuItem: menuItems[1], quantity: 1 }
        ]
      },
      {
        customerName: 'คุณสมหญิง รักสะอาด',
        customerPhone: '0822345678',
        customerEmail: 'somying@email.com',
        deliveryAddress: '456 ถนนพหลโยธิน แขวงสามเสนใน เขตพญาไท กรุงเทพฯ 10400',
        paymentMethod: 'transfer',
        status: 'CONFIRMED',
        items: [
          { menuItem: menuItems[0], quantity: 1 },
          { menuItem: menuItems[2] || menuItems[0], quantity: 3 }
        ]
      },
      {
        customerName: 'คุณประยุทธ์ มีสุข',
        customerPhone: '0833456789',
        deliveryAddress: '789 ถนนรัชดาภิเษก แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพฯ 10310',
        paymentMethod: 'promptpay',
        status: 'PREPARING',
        items: [
          { menuItem: menuItems[1], quantity: 2 }
        ]
      },
      {
        customerName: 'คุณอาทิตย์ สุขใจ',
        customerPhone: '0844567890',
        customerEmail: 'arthit@email.com',
        deliveryAddress: '321 ถนนเพชรบุรี แขวงราชเทวี เขตราชเทวี กรุงเทพฯ 10400',
        paymentMethod: 'cash',
        status: 'READY',
        items: [
          { menuItem: menuItems[0], quantity: 1 },
          { menuItem: menuItems[1], quantity: 1 },
          { menuItem: menuItems[2] || menuItems[0], quantity: 2 }
        ]
      },
      {
        customerName: 'คุณวันเพ็ญ สดใส',
        customerPhone: '0855678901',
        deliveryAddress: '654 ถนนบางนา แขวงบางนา เขตบางนา กรุงเทพฯ 10260',
        paymentMethod: 'transfer',
        status: 'DELIVERED',
        isPaid: true,
        items: [
          { menuItem: menuItems[2] || menuItems[0], quantity: 1 }
        ]
      }
    ];

    for (let i = 0; i < testOrders.length; i++) {
      const orderData = testOrders[i];
      
      // คำนวณราคา
      let subtotal = 0;
      const orderItems = [];
      
      for (const item of orderData.items) {
        const itemTotal = item.menuItem.price * item.quantity;
        subtotal += itemTotal;
        orderItems.push({
          quantity: item.quantity,
          price: item.menuItem.price,
          notes: '',
          menuItemId: item.menuItem.id
        });
      }
      
      const deliveryFee = 25;
      const total = subtotal + deliveryFee;
      
      // สร้าง order number
      const orderNumber = `ORD${Date.now() + i}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      
      // เวลาต่างๆ ตามสถานะ
      const now = new Date();
      const createdAt = new Date(now.getTime() - (i * 1000 * 60 * 30)); // แต่ละออเดอร์ห่างกัน 30 นาที
      let confirmedAt = null;
      let readyAt = null;
      let deliveredAt = null;
      
      if (['CONFIRMED', 'PREPARING', 'READY', 'DELIVERED'].includes(orderData.status)) {
        confirmedAt = new Date(createdAt.getTime() + 1000 * 60 * 5); // ยืนยันหลัง 5 นาที
      }
      if (['READY', 'DELIVERED'].includes(orderData.status)) {
        readyAt = new Date(createdAt.getTime() + 1000 * 60 * 25); // พร้อมหลัง 25 นาที
      }
      if (orderData.status === 'DELIVERED') {
        deliveredAt = new Date(createdAt.getTime() + 1000 * 60 * 35); // ส่งหลัง 35 นาที
      }

      try {
        const order = await prisma.order.create({
          data: {
            orderNumber,
            status: orderData.status,
            customerName: orderData.customerName,
            customerPhone: orderData.customerPhone,
            customerEmail: orderData.customerEmail || '',
            deliveryAddress: orderData.deliveryAddress,
            deliveryNotes: '',
            subtotal,
            deliveryFee,
            tax: 0,
            total,
            paymentMethod: orderData.paymentMethod,
            isPaid: orderData.isPaid || false,
            paidAt: orderData.isPaid ? deliveredAt : null,
            confirmedAt,
            readyAt,
            deliveredAt,
            restaurantId: restaurant.id,
            createdAt,
            items: {
              create: orderItems
            }
          },
          include: {
            items: {
              include: {
                menuItem: true
              }
            }
          }
        });

        console.log(`✅ Created order ${order.orderNumber} (${order.status}) - ${order.customerName}`);
        console.log(`   Items: ${order.items.map(item => `${item.menuItem.name} x${item.quantity}`).join(', ')}`);
        console.log(`   Total: ฿${order.total.toLocaleString()}\n`);

      } catch (error) {
        console.error(`❌ Error creating order for ${orderData.customerName}:`, error);
      }
    }

    console.log('🎉 Test orders created successfully!');

  } catch (error) {
    console.error('❌ Error creating test orders:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// รัน script ถ้าเรียกโดยตรง
if (require.main === module) {
  createTestOrders();
}

module.exports = { createTestOrders }; 