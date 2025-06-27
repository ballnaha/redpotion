import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { RestaurantStatus } from '@prisma/client'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
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

    const resolvedParams = await params
    const { restaurantId } = resolvedParams

    // Check if restaurant exists and is pending
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        owner: {
          select: {
            name: true,
            email: true
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

    if (restaurant.status !== 'PENDING') {
      return NextResponse.json(
        { message: 'ร้านอาหารนี้ไม่ได้อยู่ในสถานะรออนุมัติ' },
        { status: 400 }
      )
    }

    // Update restaurant status to REJECTED
    const updatedRestaurant = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        status: 'REJECTED' as RestaurantStatus
      }
    })

    // TODO: Send email notification to restaurant owner
    console.log(`Restaurant ${restaurant.name} rejected for owner ${restaurant.owner.email}`)

    return NextResponse.json({
      message: 'ปฏิเสธร้านอาหารเรียบร้อยแล้ว',
      restaurant: updatedRestaurant
    })

  } catch (error) {
    console.error('Error rejecting restaurant:', error)
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการปฏิเสธร้านอาหาร' },
      { status: 500 }
    )
  }
} 