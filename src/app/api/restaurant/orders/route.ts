import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const status = searchParams.get('status');

    if (!restaurantId) {
      return NextResponse.json(
        { success: false, error: 'ต้องระบุ Restaurant ID' },
        { status: 400 }
      );
    }

    const whereClause: any = {
      restaurantId: restaurantId
    };

    if (status) {
      whereClause.status = status;
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
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
    console.error('❌ Get restaurant orders error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูลออเดอร์',
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