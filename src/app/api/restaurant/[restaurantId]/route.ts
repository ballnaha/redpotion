import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const resolvedParams = await params
    const { restaurantId } = resolvedParams

    const restaurant = await prisma.restaurant.findUnique({
      where: {
        id: restaurantId
      },
      include: {
        categories: {
          where: {
            isActive: true
          },
          orderBy: {
            sortOrder: 'asc'
          },
          include: {
            menuItems: {
              where: {
                isAvailable: true
              },
              orderBy: {
                sortOrder: 'asc'
              }
            }
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

    // ตรวจสอบสถานะร้าน
    if (restaurant.status !== 'ACTIVE') {
      return NextResponse.json(
        { 
          message: 'ร้านอาหารปิดปรับปรุงชั่วคราว',
          status: restaurant.status 
        },
        { status: 403 }
      )
    }

    return NextResponse.json(restaurant)

  } catch (error) {
    console.error('Error fetching restaurant:', error)
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการดึงข้อมูลร้าน' },
      { status: 500 }
    )
  }
} 