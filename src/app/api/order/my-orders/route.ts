import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

interface LineSessionData {
  userId: string;
  lineUserId: string;
  name: string;
  email: string;
  role: string;
  image?: string;
  restaurantId?: string;
  iat?: number;
  exp?: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');

    // วิธีที่ 1: ใช้ Session เป็นหลัก (Professional approach)
    const sessionToken = request.cookies.get('line-session-token')?.value;
    let currentUser: LineSessionData | null = null;

    if (sessionToken) {
      try {
        const jwtSecret = process.env.NEXTAUTH_SECRET;
        if (jwtSecret) {
          currentUser = jwt.verify(sessionToken, jwtSecret) as LineSessionData;
        }
      } catch (jwtError) {
        console.error('❌ JWT verification failed:', jwtError);
      }
    }

    // วิธีที่ 2: Fallback สำหรับ query parameters (สำหรับ backward compatibility)
    const lineUserId = searchParams.get('lineUserId');
    const customerPhone = searchParams.get('phone');

    // ตรวจสอบว่ามี user identifier อย่างใดอย่างหนึ่ง
    if (!currentUser && !lineUserId && !customerPhone) {
      return NextResponse.json(
        { success: false, error: 'กรุณาเข้าสู่ระบบเพื่อดูประวัติการสั่งซื้อ' },
        { status: 401 }
      );
    }

    const whereClause: any = {};

    // ให้ความสำคัญกับ session ก่อน (Professional)
    if (currentUser) {
      whereClause.lineUserId = currentUser.lineUserId;
      console.log('✅ Using session-based authentication for user:', currentUser.name);
    } else if (lineUserId) {
      whereClause.lineUserId = lineUserId;
      console.log('⚠️ Using lineUserId parameter (fallback)');
    } else if (customerPhone) {
      whereClause.customerPhone = customerPhone;
      console.log('⚠️ Using customerPhone parameter (legacy fallback)');
    }

    if (restaurantId) {
      whereClause.restaurantId = restaurantId;
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            address: true,
            phone: true
          }
        },
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
        },
        paymentSlips: {
          select: {
            id: true,
            slipImageUrl: true,
            transferAmount: true,
            transferDate: true,
            transferReference: true,
            accountName: true,
            status: true,
            submittedAt: true,
            approvedAt: true,
            rejectedAt: true,
            adminNotes: true
          },
          orderBy: {
            submittedAt: 'desc'
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
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูลออเดอร์',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 