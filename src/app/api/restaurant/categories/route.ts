import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    if (session.user.role !== 'RESTAURANT_OWNER') {
      return NextResponse.json({ message: 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้' }, { status: 403 });
    }

    // Get restaurant for this owner
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        ownerId: session.user.id
      }
    });

    if (!restaurant) {
      return NextResponse.json({ message: 'ไม่พบข้อมูลร้าน' }, { status: 404 });
    }

    // Get categories with menu item count
    const categories = await prisma.category.findMany({
      where: {
        restaurantId: restaurant.id
      },
      include: {
        _count: {
          select: {
            menuItems: true
          }
        }
      },
      orderBy: {
        sortOrder: 'asc'
      }
    });

    return NextResponse.json(categories);

  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    if (session.user.role !== 'RESTAURANT_OWNER') {
      return NextResponse.json({ message: 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้' }, { status: 403 });
    }

    const { name, description } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json({ message: 'กรุณาระบุชื่อหมวดหมู่' }, { status: 400 });
    }

    // Get restaurant for this owner
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        ownerId: session.user.id
      }
    });

    if (!restaurant) {
      return NextResponse.json({ message: 'ไม่พบข้อมูลร้าน' }, { status: 404 });
    }

    // Check if category name already exists
    const existingCategory = await prisma.category.findFirst({
      where: {
        restaurantId: restaurant.id,
        name: name.trim()
      }
    });

    if (existingCategory) {
      return NextResponse.json({ message: 'ชื่อหมวดหมู่นี้มีอยู่แล้ว' }, { status: 400 });
    }

    // Get next sort order
    const lastCategory = await prisma.category.findFirst({
      where: {
        restaurantId: restaurant.id
      },
      orderBy: {
        sortOrder: 'desc'
      }
    });

    const nextSortOrder = (lastCategory?.sortOrder || 0) + 1;

    // Create new category
    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        restaurantId: restaurant.id,
        sortOrder: nextSortOrder,
        isActive: true
      },
      include: {
        _count: {
          select: {
            menuItems: true
          }
        }
      }
    });

    return NextResponse.json(category, { status: 201 });

  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการสร้างหมวดหมู่' },
      { status: 500 }
    );
  }
} 