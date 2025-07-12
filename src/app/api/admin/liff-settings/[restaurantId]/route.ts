import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { restaurantId } = await params;
    const { liffId, subscriptionType, subscriptionEndDate } = await request.json();

    // ตรวจสอบว่าร้านอาหารมีอยู่จริง
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId }
    });

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    // เตรียมข้อมูลสำหรับอัปเดต
    const updateData: any = {
      liffId: liffId || null
    };

    // อัปเดตข้อมูล subscription ถ้ามีการส่งมา
    if (subscriptionType) {
      updateData.subscriptionType = subscriptionType;
      updateData.isLiffActive = !!liffId;
      
      if (subscriptionEndDate) {
        updateData.subscriptionEndDate = new Date(subscriptionEndDate);
        updateData.liffExpiresAt = new Date(subscriptionEndDate);
        updateData.subscriptionStartDate = new Date();
        
        // บันทึกข้อมูลการต่ออายุครั้งล่าสุด
        updateData.lastExtensionDate = new Date();
        updateData.lastExtensionType = subscriptionType;
        updateData.lastExtensionBy = session.user.name || session.user.email;
        
        // คำนวณจำนวนเดือน/ปีที่ต่อ
        if (subscriptionType === 'TRIAL') {
          updateData.lastExtensionAmount = 1; // 30 วัน = 1 เดือน
        } else if (subscriptionType === 'MONTHLY') {
          const now = new Date();
          const endDate = new Date(subscriptionEndDate);
          const diffTime = endDate.getTime() - now.getTime();
          const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
          updateData.lastExtensionAmount = diffMonths;
        } else if (subscriptionType === 'YEARLY') {
          const now = new Date();
          const endDate = new Date(subscriptionEndDate);
          const diffTime = endDate.getTime() - now.getTime();
          const diffYears = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 365));
          updateData.lastExtensionAmount = diffYears;
        }
      } else if (subscriptionType === 'LIFETIME') {
        updateData.subscriptionEndDate = null;
        updateData.liffExpiresAt = null;
        updateData.lastExtensionDate = new Date();
        updateData.lastExtensionType = subscriptionType;
        updateData.lastExtensionBy = session.user.name || session.user.email;
        updateData.lastExtensionAmount = null; // ตลอดชีพไม่มีจำนวน
      } else if (subscriptionType === 'FREE') {
        updateData.subscriptionEndDate = null;
        updateData.liffExpiresAt = null;
        updateData.subscriptionStartDate = null;
      }
    }

    // อัปเดตการตั้งค่า LIFF
    const updatedRestaurant = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      restaurant: updatedRestaurant,
      message: 'อัปเดตการตั้งค่า LIFF เรียบร้อยแล้ว'
    });

  } catch (error) {
    console.error('Error updating LIFF settings:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 