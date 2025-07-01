#!/usr/bin/env node

/**
 * Check Production Database Status
 * 
 * This script checks the current state of the production database
 * to help debug authentication and restaurant issues.
 */

const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Checking Production Database Status...\n')
    
    // Check total users
    const userCount = await prisma.user.count()
    console.log(`👥 Total Users: ${userCount}`)
    
    if (userCount > 0) {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          role: true,
          name: true,
          accounts: {
            select: {
              provider: true,
              providerAccountId: true
            }
          }
        },
        take: 5
      })
      
      console.log('\n📋 Recent Users:')
      users.forEach(user => {
        const hasLineAccount = user.accounts.some(acc => acc.provider === 'line')
        console.log(`  - ${user.email} (${user.role}) ${hasLineAccount ? '🟢 LINE Connected' : '🔴 No LINE'}`)
      })
    }
    
    // Check total restaurants
    const restaurantCount = await prisma.restaurant.count()
    console.log(`\n🏪 Total Restaurants: ${restaurantCount}`)
    
    if (restaurantCount > 0) {
      const restaurants = await prisma.restaurant.findMany({
        select: {
          id: true,
          name: true,
          status: true,
          liffId: true,
          owner: {
            select: {
              email: true
            }
          }
        }
      })
      
      console.log('\n📋 Restaurants:')
      restaurants.forEach(restaurant => {
        console.log(`  - ${restaurant.name} (${restaurant.status}) - Owner: ${restaurant.owner?.email || 'No owner'}`)
        if (restaurant.liffId) {
          console.log(`    LIFF ID: ${restaurant.liffId}`)
        }
      })
      
      // Check default restaurant
      const defaultRestaurant = await prisma.restaurant.findFirst({
        where: { status: 'ACTIVE' },
        select: {
          id: true,
          name: true,
          status: true,
          liffId: true
        }
      })
      
      if (defaultRestaurant) {
        console.log(`\n✅ Default Restaurant Found: ${defaultRestaurant.name} (ID: ${defaultRestaurant.id})`)
      } else {
        console.log('\n❌ No ACTIVE restaurant found for default!')
      }
    } else {
      console.log('\n❌ No restaurants found in database!')
      console.log('\n💡 Suggestion: Run the seed script to create default restaurant:')
      console.log('   npx tsx scripts/create-default-restaurant.js')
    }
    
    // Check line accounts
    const lineAccountCount = await prisma.account.count({
      where: { provider: 'line' }
    })
    console.log(`\n📱 Total LINE Accounts: ${lineAccountCount}`)
    
    console.log('\n✅ Database check completed!')
    
  } catch (error) {
    console.error('❌ Error checking database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main() 