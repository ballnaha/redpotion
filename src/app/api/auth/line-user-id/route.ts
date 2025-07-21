import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../[...nextauth]/route'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface LineUserIdRequest {
  accessToken: string
}

export async function POST(req: NextRequest) {
  try {
    console.log('🔍 LINE User ID API called');
    
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
        hasAccessToken: !!requestBody.accessToken,
        accessTokenLength: requestBody.accessToken?.length || 0,
        userId: session.user.id
      });
    } catch (jsonError) {
      console.error('❌ Failed to parse JSON body:', jsonError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { accessToken } = requestBody;

    if (!accessToken) {
      console.error('❌ No access token provided');
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 400 }
      )
    }

    // เรียก LINE API เพื่อดึง profile
    console.log('🔍 Fetching LINE profile...');
    const lineResponse = await fetch('https://api.line.me/v2/profile', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!lineResponse.ok) {
      console.error('❌ LINE API call failed:', lineResponse.status, lineResponse.statusText);
      return NextResponse.json(
        { error: 'Failed to get LINE profile' },
        { status: 401 }
      )
    }

    const lineProfile = await lineResponse.json()
    console.log('📋 LINE Profile received:', {
      userId: lineProfile.userId,
      displayName: lineProfile.displayName
    })

    // อัปเดต LINE User ID ในฐานข้อมูล (เฉพาะ lineUserId เท่านั้น)
    console.log('💾 Updating LINE User ID in database...');
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        lineUserId: lineProfile.userId,
        updatedAt: new Date()
      }
    })

    console.log('✅ LINE User ID updated successfully:', {
      userId: updatedUser.id,
      lineUserId: updatedUser.lineUserId
    });

    return NextResponse.json({
      success: true,
      lineUserId: updatedUser.lineUserId,
      message: 'LINE User ID updated successfully'
    })

  } catch (error) {
    console.error('❌ LINE User ID API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
} 