import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { restaurantId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'คุณไม่มีสิทธิ์แก้ไขข้อมูลนี้' },
        { status: 403 }
      )
    }

    const { restaurantId } = params
    const updateData = await request.json()

    // Validate required fields
    if (!updateData.name || !updateData.address || !updateData.phone) {
      return NextResponse.json(
        { message: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' },
        { status: 400 }
      )
    }

    // Check if restaurant exists
    const existingRestaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId }
    })

    if (!existingRestaurant) {
      return NextResponse.json(
        { message: 'ไม่พบร้านอาหารที่ต้องการแก้ไข' },
        { status: 404 }
      )
    }

    // Update restaurant
    const updatedRestaurant = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        name: updateData.name,
        description: updateData.description || null,
        address: updateData.address,
        phone: updateData.phone,
        email: updateData.email || null,
        businessType: updateData.businessType || null,
        taxId: updateData.taxId || null,
        bankAccount: updateData.bankAccount || null,
        bankName: updateData.bankName || null,
        minOrderAmount: updateData.minOrderAmount || 0,
        deliveryFee: updateData.deliveryFee || 0,
        deliveryRadius: updateData.deliveryRadius || 5,
        acceptCash: updateData.acceptCash ?? true,
        acceptTransfer: updateData.acceptTransfer ?? false,
        promptpayId: updateData.promptpayId || null,
        promptpayType: updateData.promptpayType || null,
        promptpayName: updateData.promptpayName || null,
        status: updateData.status,
        updatedAt: new Date()
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            menuItems: true,
            orders: true,
            categories: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'อัปเดตข้อมูลร้านอาหารสำเร็จ',
      restaurant: updatedRestaurant
    })

  } catch (error) {
    console.error('Error updating restaurant:', error)
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { restaurantId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้' },
        { status: 403 }
      )
    }

    const { restaurantId } = params

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        documents: {
          select: {
            id: true,
            fileUrl: true,
            fileName: true,
            mimeType: true,
            documentType: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            menuItems: true,
            orders: true,
            categories: true
          }
        }
      }
    })

    if (!restaurant) {
      return NextResponse.json(
        { message: 'ไม่พบร้านอาหาร' },
        { status: 404 }
      )
    }

    return NextResponse.json(restaurant)

  } catch (error) {
    console.error('Error fetching restaurant:', error)
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    )
  }
} 