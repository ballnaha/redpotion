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
    
    // Create default restaurant
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
        operatingHours: {
          monday: { open: '09:00', close: '22:00', isOpen: true },
          tuesday: { open: '09:00', close: '22:00', isOpen: true },
          wednesday: { open: '09:00', close: '22:00', isOpen: true },
          thursday: { open: '09:00', close: '22:00', isOpen: true },
          friday: { open: '09:00', close: '22:00', isOpen: true },
          saturday: { open: '09:00', close: '22:00', isOpen: true },
          sunday: { open: '09:00', close: '22:00', isOpen: true }
        }
      }
    })
    
    console.log(`✅ Restaurant created: ${restaurant.name} (ID: ${restaurant.id})`)
    
    // Create a sample menu category
    console.log('📋 Creating sample menu category...')
    const category = await prisma.menuCategory.create({
      data: {
        name: 'เมนูแนะนำ',
        restaurantId: restaurant.id,
        order: 1
      }
    })
    
    // Create a sample menu item
    console.log('🍽️ Creating sample menu item...')
    await prisma.menuItem.create({
      data: {
        name: 'ข้าวผัดกุ้ง',
        description: 'ข้าวผัดกุ้งสดใส่ไข่ หอมหวานอร่อย',
        price: 120,
        categoryId: category.id,
        restaurantId: restaurant.id,
        isAvailable: true
      }
    })
    
    console.log('\n🎉 Default restaurant setup completed!')
    console.log('\n📋 Summary:')
    console.log(`   Restaurant: ${restaurant.name}`)
    console.log(`   Owner: ${owner.email}`)
    console.log(`   Password: password123`)
    console.log(`   LIFF ID: ${restaurant.liffId}`)
    console.log(`   Status: ${restaurant.status}`)
    
    console.log('\n💡 Next steps:')
    console.log('   1. Deploy this to production')
    console.log('   2. Test login at: https://theredpotion.com/auth/signin')
    console.log('   3. Check restaurant management at: https://theredpotion.com/restaurant')
    
  } catch (error) {
    console.error('❌ Error creating default restaurant:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main() 