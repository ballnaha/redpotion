#!/usr/bin/env node

/**
 * Create Default Restaurant for Production
 * 
 * This script creates a default restaurant and owner account
 * for production environment to fix authentication issues.
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

async function main() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🚀 Creating Default Restaurant for Production...\n')
    
    // Check if default restaurant already exists
    const existingRestaurant = await prisma.restaurant.findFirst({
      where: { status: 'ACTIVE' }
    })
    
    if (existingRestaurant) {
      console.log(`✅ Default restaurant already exists: ${existingRestaurant.name} (ID: ${existingRestaurant.id})`)
      return
    }
    
    // Check if owner user exists
    let owner = await prisma.user.findUnique({
      where: { email: 'owner@redpotion.com' }
    })
    
    if (!owner) {
      console.log('👤 Creating default owner account...')
      const hashedPassword = await bcrypt.hash('password123', 12)
      
      owner = await prisma.user.create({
        data: {
          email: 'owner@redpotion.com',
          password: hashedPassword,
          name: 'Restaurant Owner',
          role: 'RESTAURANT_OWNER',
          emailVerified: new Date()
        }
      })
      console.log(`✅ Owner created: ${owner.email}`)
    } else {
      console.log(`✅ Owner already exists: ${owner.email}`)
    }
    
    // Create default restaurant with all required fields
    console.log('🏪 Creating default restaurant...')
    const restaurant = await prisma.restaurant.create({
      data: {
        name: 'Red Potion Restaurant',
        description: 'ร้านอาหารเริ่มต้นของระบบ Red Potion',
        phone: '02-123-4567',
        address: 'Bangkok, Thailand',
        status: 'ACTIVE',
        liffId: '2007609360-3Z0L8Ekg', // Default LIFF ID
        ownerId: owner.id,
        // Default operating hours
        openTime: '09:00',
        closeTime: '22:00',
        isOpen: true,
        // Order settings
        minOrderAmount: 100,
        deliveryFee: 25,
        deliveryRadius: 5,
        // Payment settings - รองรับทั้งเงินสดและ PromptPay
        acceptCash: true,
        acceptTransfer: true,
        promptpayId: '0862061354', // เบอร์โทรศัพท์ตัวอย่าง
        promptpayType: 'PHONE_NUMBER',
        promptpayName: 'Red Potion Restaurant',
        // Location (Bangkok coordinates)
        latitude: 13.7563,
        longitude: 100.5018,
        locationName: 'กรุงเทพมหานคร',
        // Business information
        businessType: 'ร้านอาหาร',
        email: 'info@redpotion.com'
      }
    })
    
    console.log(`✅ Restaurant created: ${restaurant.name} (ID: ${restaurant.id})`)
    
    // Create sample menu categories
    console.log('📋 Creating sample menu categories...')
    const categories = await Promise.all([
      prisma.category.create({
        data: {
          name: 'เมนูแนะนำ',
          description: 'เมนูยอดนิยมที่ลูกค้าต้องลอง',
          restaurantId: restaurant.id,
          sortOrder: 1,
          isActive: true
        }
      }),
      prisma.category.create({
        data: {
          name: 'ข้าวผัด',
          description: 'ข้าวผัดหลากหลายรสชาติ',
          restaurantId: restaurant.id,
          sortOrder: 2,
          isActive: true
        }
      }),
      prisma.category.create({
        data: {
          name: 'เครื่องดื่ม',
          description: 'เครื่องดื่มสดใหม่',
          restaurantId: restaurant.id,
          sortOrder: 3,
          isActive: true
        }
      })
    ])
    
    console.log(`✅ Created ${categories.length} categories`)
    
    // Create sample menu items
    console.log('🍽️ Creating sample menu items...')
    const menuItems = await Promise.all([
      // เมนูแนะนำ
      prisma.menuItem.create({
        data: {
          name: 'ข้าวผัดกุ้ง',
          description: 'ข้าวผัดกุ้งสดใส่ไข่ หอมหวานอร่อย',
          price: 120,
          originalPrice: 150,
          categoryId: categories[0].id,
          restaurantId: restaurant.id,
          isAvailable: true,
          sortOrder: 1,
          calories: 450,
          tags: ['แนะนำ', 'กุ้ง', 'ข้าวผัด']
        }
      }),
      prisma.menuItem.create({
        data: {
          name: 'ผัดไทยกุ้งสด',
          description: 'ผัดไทยแท้รสชาติต้นตำรับ ใส่กุ้งสดขนาดใหญ่',
          price: 150,
          categoryId: categories[0].id,
          restaurantId: restaurant.id,
          isAvailable: true,
          sortOrder: 2,
          calories: 380,
          tags: ['แนะนำ', 'ผัดไทย', 'กุ้ง']
        }
      }),
      // ข้าวผัด
      prisma.menuItem.create({
        data: {
          name: 'ข้าวผัดหมู',
          description: 'ข้าวผัดหมูสับหอมกรุ่น ใส่ไข่ดาว',
          price: 90,
          categoryId: categories[1].id,
          restaurantId: restaurant.id,
          isAvailable: true,
          sortOrder: 1,
          calories: 420,
          tags: ['หมู', 'ข้าวผัด']
        }
      }),
      prisma.menuItem.create({
        data: {
          name: 'ข้าวผัดไก่',
          description: 'ข้าวผัดไก่นุ่ม ใส่ผักสดกรอบ',
          price: 85,
          categoryId: categories[1].id,
          restaurantId: restaurant.id,
          isAvailable: true,
          sortOrder: 2,
          calories: 390,
          tags: ['ไก่', 'ข้าวผัด']
        }
      }),
      // เครื่องดื่ม
      prisma.menuItem.create({
        data: {
          name: 'ชาไทยเย็น',
          description: 'ชาไทยแท้หวานมัน เข้มข้น',
          price: 35,
          categoryId: categories[2].id,
          restaurantId: restaurant.id,
          isAvailable: true,
          sortOrder: 1,
          calories: 180,
          tags: ['เครื่องดื่ม', 'ชา', 'เย็น']
        }
      }),
      prisma.menuItem.create({
        data: {
          name: 'น้ำส้มคั้นสด',
          description: 'น้ำส้มสดคั้นใหม่ ไม่ใส่น้ำตาล',
          price: 45,
          categoryId: categories[2].id,
          restaurantId: restaurant.id,
          isAvailable: true,
          sortOrder: 2,
          calories: 120,
          tags: ['เครื่องดื่ม', 'ส้ม', 'สด']
        }
      })
    ])
    
    console.log(`✅ Created ${menuItems.length} menu items`)
    
    // Create sample addons for some menu items
    console.log('🎯 Creating sample addons...')
    const addons = await Promise.all([
      // Addons สำหรับข้าวผัดกุ้ง
      prisma.addon.create({
        data: {
          name: 'เพิ่มกุ้ง',
          price: 30,
          menuItemId: menuItems[0].id,
          isAvailable: true,
          sortOrder: 1
        }
      }),
      prisma.addon.create({
        data: {
          name: 'เพิ่มไข่ดาว',
          price: 15,
          menuItemId: menuItems[0].id,
          isAvailable: true,
          sortOrder: 2
        }
      }),
      // Addons สำหรับเครื่องดื่ม
      prisma.addon.create({
        data: {
          name: 'น้ำแข็งพิเศษ',
          price: 5,
          menuItemId: menuItems[4].id,
          isAvailable: true,
          sortOrder: 1
        }
      }),
      prisma.addon.create({
        data: {
          name: 'หวานน้อย',
          price: 0,
          menuItemId: menuItems[4].id,
          isAvailable: true,
          sortOrder: 2
        }
      })
    ])
    
    console.log(`✅ Created ${addons.length} addons`)
    
    console.log('\n🎉 Default restaurant setup completed!')
    console.log('\n📋 Summary:')
    console.log(`   Restaurant: ${restaurant.name}`)
    console.log(`   Owner: ${owner.email}`)
    console.log(`   Password: password123`)
    console.log(`   LIFF ID: ${restaurant.liffId}`)
    console.log(`   Status: ${restaurant.status}`)
    console.log(`   Categories: ${categories.length}`)
    console.log(`   Menu Items: ${menuItems.length}`)
    console.log(`   Addons: ${addons.length}`)
    
    console.log('\n💳 Payment Settings:')
    console.log(`   Cash: ${restaurant.acceptCash ? 'รับ' : 'ไม่รับ'}`)
    console.log(`   Transfer: ${restaurant.acceptTransfer ? 'รับ' : 'ไม่รับ'}`)
    console.log(`   PromptPay: ${restaurant.promptpayId} (${restaurant.promptpayType})`)
    console.log(`   Account Name: ${restaurant.promptpayName}`)
    
    console.log('\n🚀 Operation Settings:')
    console.log(`   Min Order: ฿${restaurant.minOrderAmount}`)
    console.log(`   Delivery Fee: ฿${restaurant.deliveryFee}`)
    console.log(`   Delivery Radius: ${restaurant.deliveryRadius} km`)
    console.log(`   Operating Hours: ${restaurant.openTime} - ${restaurant.closeTime}`)
    
    console.log('\n💡 Next steps:')
    console.log('   1. Deploy this to production')
    console.log('   2. Test login at: https://red.theredpotion.com/auth/signin')
    console.log('   3. Check restaurant management at: https://red.theredpotion.com/restaurant')
    console.log('   4. Test menu at: https://red.theredpotion.com/menu/' + restaurant.id)
    console.log('   5. Test LIFF at: https://red.theredpotion.com/liff?restaurant=' + restaurant.id)
    
  } catch (error) {
    console.error('❌ Error creating default restaurant:', error)
    if (error.code === 'P2002') {
      console.error('   This might be a unique constraint violation.')
      console.error('   Try running the script again or check existing data.')
    }
  } finally {
    await prisma.$disconnect()
  }
}

main()