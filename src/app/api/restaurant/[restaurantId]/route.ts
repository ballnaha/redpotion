import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const { restaurantId } = await params

    // ดึงข้อมูลร้านอาหารพร้อม categories และ menu items
    const restaurant = await prisma.restaurant.findUnique({
      where: {
        id: restaurantId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        address: true,
        phone: true,
        email: true,
        imageUrl: true,
        status: true,
        isOpen: true,
        minOrderAmount: true,
        deliveryFee: true,
        deliveryRadius: true,
        openTime: true,
        closeTime: true,
        locationName: true,
        categories: {
          where: {
            isActive: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
          select: {
            id: true,
            name: true,
            description: true,
            imageUrl: true,
            sortOrder: true,
            isActive: true,
            menuItems: {
              where: {
                isAvailable: true,
              },
              orderBy: {
                sortOrder: 'asc',
              },
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
                originalPrice: true,
                imageUrl: true,
                isAvailable: true,
                sortOrder: true,
                calories: true,
                // @ts-ignore - Prisma client not yet regenerated after migration
                tags: true,
              },
            },
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!restaurant) {
      return NextResponse.json(
        { message: 'ไม่พบร้านอาหารนี้' },
        { status: 404 }
      )
    }

    // ตรวจสอบสถานะร้าน
    if (restaurant.status !== 'ACTIVE') {
      let message = 'ร้านอาหารปิดปรับปรุงชั่วคราว';
      let statusCode = 403;
      
      switch (restaurant.status) {
        case 'PENDING':
          message = 'ร้านอาหารของคุณอยู่ในระหว่างการตรวจสอบ กำลังรอการอนุมัติจาก admin';
          statusCode = 202; // Accepted but still processing
          break;
        case 'REJECTED':
          message = 'ร้านอาหารของคุณไม่ได้รับการอนุมัติ กรุณาติดต่อผู้ดูแลระบบ';
          statusCode = 403;
          break;
        case 'SUSPENDED':
          message = 'ร้านอาหารของคุณถูกระงับการใช้งานชั่วคราว';
          statusCode = 403;
          break;
        case 'CLOSED':
          message = 'ร้านอาหารปิดปรับปรุงชั่วคราว';
          statusCode = 403;
          break;
        default:
          message = `ร้านอาหารมีสถานะ: ${restaurant.status}`;
          statusCode = 403;
      }
      
      return NextResponse.json(
        { 
          message,
          status: restaurant.status,
          restaurantName: restaurant.name,
          isPending: restaurant.status === 'PENDING'
        },
        { status: statusCode }
      )
    }

    return NextResponse.json(restaurant)

  } catch (error) {
    console.error('Error fetching restaurant:', error)
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการดึงข้อมูลร้านอาหาร' },
      { status: 500 }
    )
  }
} 