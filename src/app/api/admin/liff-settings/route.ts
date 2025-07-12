import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'ALL';
    
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { owner: { name: { contains: search, mode: 'insensitive' } } },
        { owner: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }

    // Handle status filter based on existing fields
    if (status !== 'ALL') {
      switch (status) {
        case 'WITH_LIFF':
          where.liffId = { not: null };
          break;
        case 'WITHOUT_LIFF':
          where.liffId = null;
          break;
        case 'ACTIVE':
          where.status = 'ACTIVE';
          break;
      }
    }

    // Get restaurants with pagination
    const [restaurants, totalCount] = await Promise.all([
      prisma.restaurant.findMany({
        where,
        skip,
        take: limit,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          _count: {
            select: {
              orders: true,
              menuItems: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.restaurant.count({ where })
    ]);

    // Calculate stats
    const totalStats = await prisma.restaurant.count();
    const withLiffCount = await prisma.restaurant.count({
      where: { liffId: { not: null } }
    });
    const withoutLiffCount = await prisma.restaurant.count({
      where: { liffId: null }
    });
    const activeCount = await prisma.restaurant.count({
      where: { status: 'ACTIVE' }
    });

    // Calculate subscription stats (placeholder values until schema is updated)
    const expiredCount = 0;
    const expiringSoonCount = 0;

    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      hasNextPage: page < Math.ceil(totalCount / limit),
      hasPrevPage: page > 1
    };

    return NextResponse.json({
      restaurants,
      pagination,
      stats: {
        total: totalStats,
        withLiff: withLiffCount,
        withoutLiff: withoutLiffCount,
        active: activeCount,
        expired: expiredCount,
        expiringSoon: expiringSoonCount
      }
    });

  } catch (error) {
    console.error('Error fetching LIFF settings:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 