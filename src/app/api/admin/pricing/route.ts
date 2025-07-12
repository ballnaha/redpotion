import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET /api/admin/pricing - ดึงข้อมูล pricing plans ทั้งหมด
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pricingPlans = await (prisma as any).pricingPlan.findMany({
      orderBy: [
        { planType: 'asc' },
        { sortOrder: 'asc' },
        { duration: 'asc' }
      ]
    });

    // สถิติพื้นฐาน
    const stats = {
      total: pricingPlans.length,
      active: pricingPlans.filter((p: any) => p.isActive).length,
      inactive: pricingPlans.filter((p: any) => !p.isActive).length,
      monthly: pricingPlans.filter((p: any) => p.planType === 'MONTHLY').length,
      yearly: pricingPlans.filter((p: any) => p.planType === 'YEARLY').length
    };

    return NextResponse.json({
      pricingPlans,
      stats
    });
  } catch (error) {
    console.error('Error fetching pricing plans:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลแผนราคา' },
      { status: 500 }
    );
  }
}

// POST /api/admin/pricing - สร้าง pricing plan ใหม่
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      planType,
      duration,
      originalPrice,
      discountPercent,
      features,
      isActive,
      sortOrder
    } = body;

    // Validation
    if (!name || !planType || !duration || !originalPrice) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลที่จำเป็น' },
        { status: 400 }
      );
    }

    const validPlanTypes = ['FREE', 'MONTHLY', 'YEARLY', 'LIFETIME', 'TRIAL'];
    if (!validPlanTypes.includes(planType)) {
      return NextResponse.json(
        { error: 'ประเภทแผนไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // คำนวณราคาหลังส่วนลด
    const discountAmount = (originalPrice * (discountPercent || 0)) / 100;
    const finalPrice = originalPrice - discountAmount;

    const pricingPlan = await (prisma as any).pricingPlan.create({
      data: {
        name,
        description,
        planType,
        duration: parseInt(duration),
        originalPrice: parseFloat(originalPrice),
        discountPercent: parseFloat(discountPercent || 0),
        finalPrice,
        features: features || [],
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: parseInt(sortOrder || 0),
        createdBy: session.user.id,
        updatedBy: session.user.id
      }
    });

    return NextResponse.json(pricingPlan, { status: 201 });
  } catch (error) {
    console.error('Error creating pricing plan:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้างแผนราคา' },
      { status: 500 }
    );
  }
} 