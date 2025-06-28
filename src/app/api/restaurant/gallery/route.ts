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

    const restaurant = await prisma.restaurant.findUnique({
      where: {
        ownerId: session.user.id
      },
      select: {
        id: true
      }
    })

    if (!restaurant) {
      return NextResponse.json(
        { message: 'ไม่พบข้อมูลร้านอาหาร' },
        { status: 404 }
      )
    }

    const galleries = await (prisma as any).gallery.findMany({
      where: {
        restaurantId: restaurant.id
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(galleries)

  } catch (error) {
    console.error('Error fetching galleries:', error)
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการดึงข้อมูลแกลเลอรี่' },
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

    const restaurant = await prisma.restaurant.findUnique({
      where: {
        ownerId: session.user.id
      },
      select: {
        id: true
      }
    })

    if (!restaurant) {
      return NextResponse.json(
        { message: 'ไม่พบข้อมูลร้านอาหาร' },
        { status: 404 }
      )
    }

    const data = await request.json()
    const { title, description, imageUrl, isActive = true, sortOrder = 0 } = data

    // Validation
    if (!imageUrl?.trim()) {
      return NextResponse.json(
        { message: 'กรุณาระบุรูปภาพ' },
        { status: 400 }
      )
    }

    const gallery = await (prisma as any).gallery.create({
      data: {
        title: title?.trim() || null,
        description: description?.trim() || null,
        imageUrl: imageUrl.trim(),
        isActive,
        sortOrder,
        restaurantId: restaurant.id
      }
    })

    return NextResponse.json(gallery)

  } catch (error) {
    console.error('Error creating gallery:', error)
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการสร้างแกลเลอรี่' },
      { status: 500 }
    )
  }
} 