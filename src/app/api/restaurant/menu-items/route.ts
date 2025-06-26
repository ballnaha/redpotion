import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'RESTAURANT_OWNER') {
      return NextResponse.json(
        { message: 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้' },
        { status: 403 }
      )
    }

    // ดึงร้านของ owner
    const restaurant = await prisma.restaurant.findUnique({
      where: {
        ownerId: session.user.id
      }
    })

    if (!restaurant) {
      return NextResponse.json(
        { message: 'ไม่พบข้อมูลร้านอาหาร' },
        { status: 404 }
      )
    }

    const url = new URL(request.url)
    const categoryId = url.searchParams.get('categoryId')

    // ดึง menu items
    const menuItems = await prisma.menuItem.findMany({
      where: {
        restaurantId: restaurant.id,
        ...(categoryId && { categoryId })
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(menuItems)

  } catch (error) {
    console.error('Error fetching menu items:', error)
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'RESTAURANT_OWNER') {
      return NextResponse.json(
        { message: 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้' },
        { status: 403 }
      )
    }

    // ดึงร้านของ owner
    const restaurant = await prisma.restaurant.findUnique({
      where: {
        ownerId: session.user.id
      }
    })

    if (!restaurant) {
      return NextResponse.json(
        { message: 'ไม่พบข้อมูลร้านอาหาร' },
        { status: 404 }
      )
    }

    const data = await request.json()
    const { 
      name, 
      description, 
      price, 
      categoryId, 
      imageUrl,
      calories,
      isVegetarian,
      isSpicy
    } = data

    // Validation
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { message: 'กรุณาระบุชื่อเมนู' },
        { status: 400 }
      )
    }

    if (!price || price <= 0) {
      return NextResponse.json(
        { message: 'กรุณาระบุราคาที่ถูกต้อง' },
        { status: 400 }
      )
    }

    if (!categoryId) {
      return NextResponse.json(
        { message: 'กรุณาเลือกหมวดหมู่' },
        { status: 400 }
      )
    }

    // ตรวจสอบว่าหมวดหมู่อยู่ในร้านนี้หรือไม่
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        restaurantId: restaurant.id
      }
    })

    if (!category) {
      return NextResponse.json(
        { message: 'ไม่พบหมวดหมู่ที่เลือก' },
        { status: 400 }
      )
    }

    // หา sortOrder ถัดไป
    const lastMenuItem = await prisma.menuItem.findFirst({
      where: {
        categoryId: categoryId
      },
      orderBy: {
        sortOrder: 'desc'
      }
    })

    const sortOrder = (lastMenuItem?.sortOrder || 0) + 1

    // สร้างเมนูใหม่
    const menuItem = await prisma.menuItem.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        price: parseFloat(price),
        imageUrl: imageUrl || null,
        calories: calories ? parseInt(calories) : null,
        isVegetarian: Boolean(isVegetarian),
        isSpicy: Boolean(isSpicy),
        sortOrder,
        restaurantId: restaurant.id,
        categoryId: categoryId
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json(menuItem, { status: 201 })

  } catch (error) {
    console.error('Error creating menu item:', error)
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการสร้างเมนู' },
      { status: 500 }
    )
  }
} 