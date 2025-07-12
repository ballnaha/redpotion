import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    const { role } = await request.json();

    // Validate role - เอา USER ออกแล้วเพราะไม่ใช้แล้ว
    if (!role || !['RESTAURANT_OWNER', 'CUSTOMER'].includes(role)) {
      return NextResponse.json(
        { message: 'ประเภทผู้ใช้ไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { role: role }
    });

    console.log(`✅ Updated user ${session.user.id} role to ${role}`);

    return NextResponse.json({
      message: 'อัปเดตประเภทผู้ใช้สำเร็จ',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role
      }
    });

  } catch (error) {
    console.error('❌ Error updating user role:', error);
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการอัปเดตประเภทผู้ใช้' },
      { status: 500 }
    );
  }
} 