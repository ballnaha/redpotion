import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET /api/restaurant/pricing - ดึงข้อมูลราคาการต่ออายุสำหรับร้านอาหาร
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'RESTAURANT_OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ดึงข้อมูลแผนราคาที่เปิดใช้งาน
    const pricingPlans = await (prisma as any).pricingPlan.findMany({
      where: { 
        isActive: true,
        planType: {
          in: ['MONTHLY', 'YEARLY'] // แสดงเฉพาะแผนรายเดือนและรายปี
        }
      },
      orderBy: [
        { planType: 'asc' },
        { sortOrder: 'asc' },
        { duration: 'asc' }
      ]
    });

    // จัดกลุ่มตาม planType
    const groupedPlans = {
      MONTHLY: pricingPlans.filter((plan: any) => plan.planType === 'MONTHLY'),
      YEARLY: pricingPlans.filter((plan: any) => plan.planType === 'YEARLY')
    };

    // ดึงข้อมูลร้านอาหารปัจจุบัน
    const restaurant = await (prisma as any).restaurant.findUnique({
      where: { ownerId: session.user.id },
      select: {
        id: true,
        name: true,
        subscriptionType: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
        liffExpiresAt: true,
        isLiffActive: true
      }
    });

    if (!restaurant) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลร้านอาหาร' }, { status: 404 });
    }

    // คำนวณวันที่หมดอายุ
    const now = new Date();
    const expiresAt = restaurant.subscriptionEndDate || restaurant.liffExpiresAt;
    const daysUntilExpiry = expiresAt ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

    return NextResponse.json({
      pricingPlans: groupedPlans,
      restaurant: {
        ...restaurant,
        daysUntilExpiry,
        isExpired: daysUntilExpiry !== null && daysUntilExpiry < 0,
        isNearExpiry: daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry >= 0
      }
    });
  } catch (error) {
    console.error('Error fetching pricing plans for restaurant:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลราคา' },
      { status: 500 }
    );
  }
} 