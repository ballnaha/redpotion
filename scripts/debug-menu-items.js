const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugMenuItems() {
  try {
    console.log('🔍 Debugging Menu Items and Foreign Key Issues...\n');

    // 1. ตรวจสอบจำนวน restaurants, menu items และ orders
    const restaurantCount = await prisma.restaurant.count();
    const menuItemCount = await prisma.menuItem.count();
    const orderCount = await prisma.order.count();
    const orderItemCount = await prisma.orderItem.count();

    console.log('📊 Database Summary:');
    console.log(`- Restaurants: ${restaurantCount}`);
    console.log(`- Menu Items: ${menuItemCount}`);
    console.log(`- Orders: ${orderCount}`);
    console.log(`- Order Items: ${orderItemCount}\n`);

    // 2. ตรวจสอบ menu items ที่มีปัญหา
    const menuItems = await prisma.menuItem.findMany({
      select: {
        id: true,
        name: true,
        restaurantId: true,
        isAvailable: true,
        restaurant: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    console.log('🍽️ Recent Menu Items:');
    menuItems.forEach((item, index) => {
      console.log(`${index + 1}. ${item.name} (ID: ${item.id})`);
      console.log(`   Restaurant: ${item.restaurant.name} (${item.restaurant.status})`);
      console.log(`   Available: ${item.isAvailable}\n`);
    });

    // 3. ตรวจสอบ order items ที่มี foreign key issues (หา menuItemId ที่ไม่มีใน table)
    const allOrderItems = await prisma.orderItem.findMany({
      select: {
        id: true,
        menuItemId: true,
        quantity: true,
        price: true,
        order: {
          select: {
            id: true,
            orderNumber: true,
            restaurantId: true
          }
        }
      }
    });

    // หา menu item IDs ทั้งหมดที่มีอยู่
    const allMenuItemIds = menuItems.map(item => item.id);
    const orderItemsWithIssues = allOrderItems.filter(orderItem => 
      !allMenuItemIds.includes(orderItem.menuItemId)
    );

    if (orderItemsWithIssues.length > 0) {
      console.log('❌ Order Items with Missing Menu Items:');
      orderItemsWithIssues.forEach((item, index) => {
        console.log(`${index + 1}. Order Item ID: ${item.id}`);
        console.log(`   Menu Item ID: ${item.menuItemId} (NOT FOUND)`);
        console.log(`   Order: ${item.order.orderNumber} (Restaurant: ${item.order.restaurantId})\n`);
      });
    } else {
      console.log('✅ No Order Items with Missing Menu Items found\n');
    }

    console.log(`📊 Order Items Analysis:`);
    console.log(`- Total Order Items: ${allOrderItems.length}`);
    console.log(`- Order Items with Missing Menu Items: ${orderItemsWithIssues.length}\n`);

    // 4. ตรวจสอบ recent orders และ items
    const recentOrders = await prisma.order.findMany({
      include: {
        items: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                isAvailable: true
              }
            }
          }
        },
        restaurant: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    console.log('📋 Recent Orders:');
    recentOrders.forEach((order, index) => {
      console.log(`${index + 1}. Order: ${order.orderNumber} (${order.status})`);
      console.log(`   Restaurant: ${order.restaurant.name} (${order.restaurant.status})`);
      console.log(`   Items: ${order.items.length}`);
      
      order.items.forEach((item, itemIndex) => {
        if (item.menuItem) {
          console.log(`     ${itemIndex + 1}. ${item.menuItem.name} x${item.quantity} (Available: ${item.menuItem.isAvailable})`);
        } else {
          console.log(`     ${itemIndex + 1}. ❌ MISSING MENU ITEM (ID: ${item.menuItemId}) x${item.quantity}`);
        }
      });
      console.log('');
    });

    // 5. ตรวจสอบ addons
    const addonCount = await prisma.addon.count();
    const orderItemAddonCount = await prisma.orderItemAddon.count();
    
    console.log('🍟 Addon Summary:');
    console.log(`- Total Addons: ${addonCount}`);
    console.log(`- Order Item Addons: ${orderItemAddonCount}\n`);

    // 6. ตรวจสอบ orphaned order item addons
    const allOrderItemAddons = await prisma.orderItemAddon.findMany({
      select: {
        id: true,
        addonId: true,
        quantity: true,
        price: true
      }
    });

    const allAddons = await prisma.addon.findMany({
      select: { id: true, name: true }
    });

    const allAddonIds = allAddons.map(addon => addon.id);
    const orphanedAddons = allOrderItemAddons.filter(orderAddon => 
      !allAddonIds.includes(orderAddon.addonId)
    );

    if (orphanedAddons.length > 0) {
      console.log('❌ Orphaned Order Item Addons:');
      orphanedAddons.forEach((addon, index) => {
        console.log(`${index + 1}. Order Item Addon ID: ${addon.id}`);
        console.log(`   Addon ID: ${addon.addonId} (NOT FOUND)\n`);
      });
    } else {
      console.log('✅ No Orphaned Order Item Addons found\n');
    }

  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// รัน script ถ้าเรียกโดยตรง
if (require.main === module) {
  debugMenuItems();
}

module.exports = { debugMenuItems }; 