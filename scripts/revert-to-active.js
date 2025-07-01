#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')

async function revertToActive() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔄 Reverting restaurant status to ACTIVE...')
    
    const restaurant = await prisma.restaurant.update({
      where: { id: 'cmckil8250001j3205w99e5ti' },
      data: { status: 'ACTIVE' },
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
    
    console.log('✅ Restaurant status reverted:')
    console.log(`   Restaurant: ${restaurant.name}`)
    console.log(`   Status: ${restaurant.status}`)
    console.log(`   Owner: ${restaurant.owner.email}`)
    
  } catch (error) {
    console.error('❌ Error reverting restaurant status:', error)
  } finally {
    await prisma.$disconnect()
  }
}

revertToActive() 