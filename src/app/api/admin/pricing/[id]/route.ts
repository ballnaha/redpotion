import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET /api/admin/pricing/[id] - ดึงข้อมูล pricing plan ตาม ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pricingPlan = await (prisma as any).pricingPlan.findUnique({
      where: { id: params.id }
    });

    if (!pricingPlan) {
      return NextResponse.json({ error: 'ไม่พบแผนราคา' }, { status: 404 });
    }

    return NextResponse.json(pricingPlan);
  } catch (error) {
    console.error('Error fetching pricing plan:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลแผนราคา' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/pricing/[id] - แก้ไข pricing plan
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const pricingPlan = await (prisma as any).pricingPlan.update({
      where: { id: params.id },
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
        updatedBy: session.user.id
      }
    });

    return NextResponse.json(pricingPlan);
  } catch (error) {
    console.error('Error updating pricing plan:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการแก้ไขแผนราคา' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/pricing/[id] - ลบ pricing plan
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await (prisma as any).pricingPlan.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'ลบแผนราคาเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Error deleting pricing plan:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบแผนราคา' },
      { status: 500 }
    );
  }
} 