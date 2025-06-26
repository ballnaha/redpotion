import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const {
      name,
      email,
      password,
      restaurantName,
      restaurantAddress,
      restaurantPhone
    } = await request.json()

    // Validate input
    if (!name || !email || !password || !restaurantName || !restaurantAddress || !restaurantPhone) {
      return NextResponse.json(
        { message: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'อีเมลนี้ถูกใช้แล้ว' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user and restaurant in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Create user
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'RESTAURANT_OWNER'
        }
      })

      // Create restaurant
      const restaurant = await tx.restaurant.create({
        data: {
          name: restaurantName,
          address: restaurantAddress,
          phone: restaurantPhone,
          ownerId: user.id,
          status: 'PENDING' // ต้องรอการอนุมัติ
        }
      })

      return { user, restaurant }
    })

    return NextResponse.json(
      { 
        message: 'สมัครสมาชิกสำเร็จ',
        userId: result.user.id,
        restaurantId: result.restaurant.id
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการสมัครสมาชิก' },
      { status: 500 }
    )
  }
} 