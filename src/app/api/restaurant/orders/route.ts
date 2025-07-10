import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต' },
        { status: 401 }
      );
    }

    // หาผู้ใช้และร้านค้าของเขา
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบผู้ใช้' },
        { status: 404 }
      );
    }

    // หาร้านค้าที่ผู้ใช้เป็นเจ้าของ
    const restaurant = await prisma.restaurant.findFirst({
      where: { 
        ownerId: user.id,
        status: 'ACTIVE'
      },
      select: { id: true }
    });

    if (!restaurant) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบร้านค้า' },
        { status: 404 }
      );
    }

    const restaurantId = restaurant.id;

    // ดึงรายการ orders ของร้าน
    const orders = await prisma.order.findMany({
      where: { restaurantId },
      include: {
        items: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                price: true
              }
            },
            addons: {
              include: {
                addon: {
                  select: {
                    id: true,
                    name: true,
                    price: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      orders
    });

  } catch (error) {
    console.error('❌ Get orders error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูล',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// อัปเดตสถานะออเดอร์
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, status, restaurantId } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { success: false, error: 'ต้องระบุ Order ID และ Status' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่าออเดอร์นี้เป็นของร้านนี้หรือไม่
    const existingOrder = await prisma.order.findFirst({
      where: {
        id: orderId,
        restaurantId: restaurantId
      }
    });

    if (!existingOrder) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบออเดอร์ หรือไม่มีสิทธิ์เข้าถึง' },
        { status: 404 }
      );
    }

    const updateData: any = {
      status
    };

    // อัปเดต timestamp ตามสถานะ
    if (status === 'CONFIRMED') {
      updateData.confirmedAt = new Date();
    } else if (status === 'READY') {
      updateData.readyAt = new Date();
    } else if (status === 'DELIVERED') {
      updateData.deliveredAt = new Date();
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        items: {
          include: {
            menuItem: true,
            addons: {
              include: {
                addon: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: `อัปเดตสถานะออเดอร์เป็น ${status} เรียบร้อย`
    });

  } catch (error) {
    console.error('❌ Update order status error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'เกิดข้อผิดพลาดในการอัปเดตสถานะออเดอร์',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 