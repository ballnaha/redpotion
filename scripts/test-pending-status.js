#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')

async function testPendingStatus() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔄 Setting restaurant status to PENDING for testing...')
    
    const restaurant = await prisma.restaurant.update({
      where: { id: 'cmckil8250001j3205w99e5ti' },
      data: { status: 'PENDING' },
      select: {
        id: true,
        name: true,
        status: true,
        owner: {
          select: {
            email: true,
            name: true
          }
        }
      }
    })
    
    console.log('✅ Restaurant status updated for testing:')
    console.log(`   Restaurant: ${restaurant.name}`)
    console.log(`   Status: ${restaurant.status}`)
    console.log(`   Owner: ${restaurant.owner.email}`)
    console.log('\n📝 To test:')
    console.log('   1. Go to http://localhost:3000/auth/signin')
    console.log('   2. Login with: owner@redpotion.com / password123')
    console.log('   3. Should redirect to /restaurant and show PENDING message')
    console.log('\n🔄 To revert after testing:')
    console.log('   node scripts/revert-to-active.js')
    
  } catch (error) {
    console.error('❌ Error updating restaurant status:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testPendingStatus() 