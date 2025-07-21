import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../[...nextauth]/route'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface ManualLineUserIdRequest {
  lineUserId: string
}

export async function POST(req: NextRequest) {
  try {
    console.log('🔍 Manual LINE User ID API called');
    
    // ตรวจสอบ session ก่อน
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.error('❌ No valid session found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // อ่าน request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('📦 Request body received:', {
        hasLineUserId: !!requestBody.lineUserId,
        lineUserIdLength: requestBody.lineUserId?.length || 0,
        userId: session.user.id
      });
    } catch (jsonError) {
      console.error('❌ Failed to parse JSON body:', jsonError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { lineUserId } = requestBody;

    if (!lineUserId || typeof lineUserId !== 'string') {
      console.error('❌ No LINE User ID provided');
      return NextResponse.json(
        { error: 'LINE User ID is required' },
        { status: 400 }
      )
    }

    const trimmedLineUserId = lineUserId.trim();
    
    if (trimmedLineUserId.length === 0) {
      console.error('❌ Empty LINE User ID');
      return NextResponse.json(
        { error: 'LINE User ID cannot be empty' },
        { status: 400 }
      )
    }

    // ตรวจสอบว่า LINE User ID นี้ถูกใช้โดยผู้ใช้คนอื่นหรือไม่
    const existingUser = await prisma.user.findFirst({
      where: {
        lineUserId: trimmedLineUserId,
        NOT: {
          id: session.user.id // ไม่นับตัวผู้ใช้ปัจจุบัน
        }
      }
    });

    if (existingUser) {
      console.error('❌ LINE User ID already in use by another user');
      return NextResponse.json(
        { error: 'LINE User ID นี้ถูกใช้งานโดยผู้ใช้คนอื่นแล้ว' },
        { status: 409 }
      )
    }

    // อัปเดต LINE User ID ในฐานข้อมูล
    console.log('💾 Updating LINE User ID in database (manual)...');
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        lineUserId: trimmedLineUserId,
        updatedAt: new Date()
      }
    })

    console.log('✅ LINE User ID updated successfully (manual):', {
      userId: updatedUser.id,
      lineUserId: updatedUser.lineUserId
    });

    return NextResponse.json({
      success: true,
      lineUserId: updatedUser.lineUserId,
      message: 'LINE User ID updated successfully'
    })

  } catch (error) {
    console.error('❌ Manual LINE User ID API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
} 