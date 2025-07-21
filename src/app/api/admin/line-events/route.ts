import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

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
    const limit = parseInt(searchParams.get('limit') || '25');
    const offset = parseInt(searchParams.get('offset') || '0');
    const eventType = searchParams.get('eventType');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // สร้าง filter conditions
    const where: any = {};
    
    if (eventType) {
      where.eventType = eventType;
    }

    if (status === 'processed') {
      where.isProcessed = true;
      where.errorMessage = null;
    } else if (status === 'error') {
      where.errorMessage = { not: null };
    }

    if (dateFrom || dateTo) {
      where.timestamp = {};
      if (dateFrom) {
        where.timestamp.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.timestamp.lte = new Date(dateTo);
      }
    }

    // ดึงข้อมูล events พร้อม user profile
    const [events, total] = await Promise.all([
      prisma.lineWebhookEvent.findMany({
        where,
        include: {
          lineUserProfile: {
            select: {
              displayName: true,
              pictureUrl: true,
              isFollowing: true,
              user: {
                select: {
                  name: true,
                  email: true,
                  role: true,
                },
              },
              restaurant: {
                select: {
                  name: true,
                  status: true,
                },
              },
            },
          },
        },
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.lineWebhookEvent.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: events,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching LINE events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: ลบ events เก่า (admin อาจต้องการทำความสะอาดข้อมูล)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { daysBefore = 30 } = await request.json();
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBefore);

    const deletedCount = await prisma.lineWebhookEvent.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
        isProcessed: true,
        errorMessage: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: `ลบ events ${deletedCount.count} รายการ ที่เก่ากว่า ${daysBefore} วัน`,
      deletedCount: deletedCount.count,
    });
  } catch (error) {
    console.error('Error deleting old events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 