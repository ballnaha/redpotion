import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const { status } = await request.json();
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต' },
        { status: 401 }
      );
    }

    // ตรวจสอบว่า status ที่ส่งมาถูกต้อง
    const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'สถานะไม่ถูกต้อง' },
        { status: 400 }
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

    // ตรวจสอบว่า order นี้เป็นของร้านนี้หรือไม่
    const existingOrder = await prisma.order.findFirst({
      where: {
        id: orderId,
        restaurantId: restaurant.id
      }
    });

    if (!existingOrder) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบออเดอร์' },
        { status: 404 }
      );
    }

    // อัปเดตสถานะและเวลาที่เกี่ยวข้อง
    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    // เพิ่มเวลาที่เกี่ยวข้องตามสถานะ
    const now = new Date();
    switch (status) {
      case 'CONFIRMED':
        updateData.confirmedAt = now;
        break;
      case 'READY':
        updateData.readyAt = now;
        break;
      case 'DELIVERED':
        updateData.deliveredAt = now;
        break;
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
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
      }
    });

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: 'อัปเดตสถานะเรียบร้อย'
    });

  } catch (error) {
    console.error('❌ Update order status error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'เกิดข้อผิดพลาดในการอัปเดตสถานะ',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 