import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// ฟังก์ชันสำหรับดึง LINE User Profile จาก LINE API
async function fetchLineUserProfile(userId: string) {
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  
  if (!accessToken) {
    throw new Error('LINE_CHANNEL_ACCESS_TOKEN not found');
  }

  try {
    const response = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('User not found or not following the bot');
      }
      throw new Error(`Failed to get user profile: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching LINE user profile:', error);
    throw error;
  }
}

// GET: ดึงข้อมูล LINE User Profile จากฐานข้อมูล
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const lineUserId = searchParams.get('lineUserId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (lineUserId) {
      // ดึงข้อมูลเฉพาะ user คนเดียว
      const userProfile = await prisma.lineUserProfile.findUnique({
        where: { lineUserId },
        include: {
          webhookEvents: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          restaurant: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
        },
      });

      return NextResponse.json({ 
        success: true, 
        data: userProfile 
      });
    } else {
      // ดึงข้อมูลทั้งหมด
      const [profiles, total] = await Promise.all([
        prisma.lineUserProfile.findMany({
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
            restaurant: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
            _count: {
              select: {
                webhookEvents: true,
              },
            },
          },
          orderBy: { lastActiveAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.lineUserProfile.count(),
      ]);

      return NextResponse.json({
        success: true,
        data: profiles,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      });
    }
  } catch (error) {
    console.error('Error fetching LINE user profiles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: ดึงข้อมูล LINE User Profile จาก LINE API และบันทึกลงฐานข้อมูล
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { lineUserId, force = false } = await request.json();

    if (!lineUserId) {
      return NextResponse.json(
        { error: 'LINE User ID is required' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่ามีข้อมูลอยู่แล้วหรือไม่
    const existingProfile = await prisma.lineUserProfile.findUnique({
      where: { lineUserId },
    });

    if (existingProfile && !force) {
      return NextResponse.json({
        success: true,
        data: existingProfile,
        message: 'Profile already exists',
      });
    }

    // ดึงข้อมูลจาก LINE API
    const lineProfile = await fetchLineUserProfile(lineUserId);

    // บันทึกหรืออัพเดทข้อมูล
    const savedProfile = await prisma.lineUserProfile.upsert({
      where: { lineUserId },
      update: {
        displayName: lineProfile.displayName,
        pictureUrl: lineProfile.pictureUrl,
        statusMessage: lineProfile.statusMessage,
        language: lineProfile.language,
        lastActiveAt: new Date(),
      },
      create: {
        lineUserId,
        displayName: lineProfile.displayName,
        pictureUrl: lineProfile.pictureUrl,
        statusMessage: lineProfile.statusMessage,
        language: lineProfile.language,
        isFollowing: true,
        followedAt: new Date(),
        lastActiveAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        restaurant: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: savedProfile,
      message: existingProfile ? 'Profile updated' : 'Profile created',
    });
  } catch (error) {
    console.error('Error creating/updating LINE user profile:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch user profile',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}

// PUT: อัพเดทข้อมูล LINE User Profile (เชื่อมกับ restaurant หรือ user)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { lineUserId, restaurantId, userId, metadata } = await request.json();

    if (!lineUserId) {
      return NextResponse.json(
        { error: 'LINE User ID is required' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่ามี profile อยู่หรือไม่
    const existingProfile = await prisma.lineUserProfile.findUnique({
      where: { lineUserId },
    });

    if (!existingProfile) {
      return NextResponse.json(
        { error: 'LINE User Profile not found' },
        { status: 404 }
      );
    }

    // อัพเดทข้อมูล
    const updatedProfile = await prisma.lineUserProfile.update({
      where: { lineUserId },
      data: {
        ...(restaurantId !== undefined && { restaurantId }),
        ...(userId !== undefined && { userId }),
        ...(metadata !== undefined && { metadata }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        restaurant: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedProfile,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Error updating LINE user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 