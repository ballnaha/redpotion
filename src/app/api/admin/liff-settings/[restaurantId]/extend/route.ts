import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { restaurantId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { months, subscriptionType } = await request.json();
    
    if (months < 0) {
      return NextResponse.json(
        { error: 'Invalid months parameter' },
        { status: 400 }
      );
    }

    const { restaurantId } = params;

    // ดึงข้อมูลร้านอาหารปัจจุบัน
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId }
    }) as any;

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    // คำนวณวันหมดอายุใหม่
    const now = new Date();
    let newEndDate: Date;
    let finalSubscriptionType = subscriptionType || 'MONTHLY';

    if (subscriptionType === 'TRIAL') {
      // ทดลอง 30 วัน
      newEndDate = new Date(now);
      newEndDate.setDate(newEndDate.getDate() + 30);
      finalSubscriptionType = 'TRIAL';
    } else if (subscriptionType === 'MONTHLY' || months === 1) {
      // รายเดือน
      if (restaurant.subscriptionEndDate) {
        const currentEndDate = new Date(restaurant.subscriptionEndDate);
        if (currentEndDate > now) {
          // ถ้ายังไม่หมดอายุ ต่อจากวันหมดอายุเดิม
          newEndDate = new Date(currentEndDate);
        } else {
          // ถ้าหมดอายุแล้ว ต่อจากวันปัจจุบัน
          newEndDate = new Date(now);
        }
      } else {
        // ถ้าไม่มีวันหมดอายุ ให้เริ่มจากวันปัจจุบัน
        newEndDate = new Date(now);
      }
      newEndDate.setMonth(newEndDate.getMonth() + 1);
      finalSubscriptionType = 'MONTHLY';
    } else if (subscriptionType === 'YEARLY' || months === 12) {
      // รายปี
      if (restaurant.subscriptionEndDate) {
        const currentEndDate = new Date(restaurant.subscriptionEndDate);
        if (currentEndDate > now) {
          // ถ้ายังไม่หมดอายุ ต่อจากวันหมดอายุเดิม
          newEndDate = new Date(currentEndDate);
        } else {
          // ถ้าหมดอายุแล้ว ต่อจากวันปัจจุบัน
          newEndDate = new Date(now);
        }
      } else {
        // ถ้าไม่มีวันหมดอายุ ให้เริ่มจากวันปัจจุบัน
        newEndDate = new Date(now);
      }
      newEndDate.setFullYear(newEndDate.getFullYear() + 1);
      finalSubscriptionType = 'YEARLY';
    } else {
      // กรณีอื่น ๆ ใช้ months parameter
      if (restaurant.subscriptionEndDate) {
        const currentEndDate = new Date(restaurant.subscriptionEndDate);
        if (currentEndDate > now) {
          // ถ้ายังไม่หมดอายุ ต่อจากวันหมดอายุเดิม
          newEndDate = new Date(currentEndDate);
        } else {
          // ถ้าหมดอายุแล้ว ต่อจากวันปัจจุบัน
          newEndDate = new Date(now);
        }
      } else {
        // ถ้าไม่มีวันหมดอายุ ให้เริ่มจากวันปัจจุบัน
        newEndDate = new Date(now);
      }
      
      // เพิ่มจำนวนเดือน
      newEndDate.setMonth(newEndDate.getMonth() + months);
      
      // กำหนดประเภทสมาชิกตามจำนวนเดือน
      if (months === 1) {
        finalSubscriptionType = 'MONTHLY';
      } else if (months === 12) {
        finalSubscriptionType = 'YEARLY';
      } else {
        finalSubscriptionType = 'MONTHLY'; // default
      }
    }

    // คำนวณจำนวนเดือน/ปีที่ต่อ
    let extensionAmount: number;
    if (subscriptionType === 'TRIAL') {
      extensionAmount = 1; // 30 วัน = 1 เดือน
    } else if (subscriptionType === 'YEARLY') {
      extensionAmount = 1; // 1 ปี
    } else {
      extensionAmount = months; // จำนวนเดือน
    }

    // อัปเดตข้อมูลในฐานข้อมูล
    const updatedRestaurant = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        subscriptionType: finalSubscriptionType,
        subscriptionEndDate: newEndDate,
        subscriptionStartDate: restaurant.subscriptionStartDate || now,
        isLiffActive: true,
        liffExpiresAt: newEndDate,
        // บันทึกข้อมูลการต่ออายุครั้งล่าสุด
        lastExtensionDate: now,
        lastExtensionType: finalSubscriptionType,
        lastExtensionAmount: extensionAmount,
        lastExtensionBy: session.user.name || session.user.email,
        updatedAt: now
      } as any
    }) as any;

    return NextResponse.json({
      success: true,
      message: `Extended subscription with ${finalSubscriptionType}`,
      restaurant: {
        id: updatedRestaurant.id,
        name: updatedRestaurant.name,
        subscriptionType: updatedRestaurant.subscriptionType,
        subscriptionEndDate: updatedRestaurant.subscriptionEndDate,
        isLiffActive: updatedRestaurant.isLiffActive
      }
    });

  } catch (error) {
    console.error('Error extending subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 